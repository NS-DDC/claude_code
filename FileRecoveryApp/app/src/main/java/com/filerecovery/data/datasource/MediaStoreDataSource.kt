package com.filerecovery.data.datasource

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import androidx.annotation.RequiresApi
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.util.RecoveryAnalyzer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.util.UUID
import kotlin.coroutines.coroutineContext

/**
 * MediaStore 쿼리 — 사용자가 삭제한 파일만 검색
 *
 * [v1.3.2 핵심 변경]
 * ✅ RELATIVE_PATH 기반 앱 데이터 필터링 추가
 *    → Android/data/ 경로의 앱 임시파일(카톡 이미지전송, 인스타 스토리 등) 제외
 *    → 사용자가 직접 삭제한 DCIM/Pictures/Download 파일만 결과에 포함
 *
 * [삭제 파일 탐지 전략 — 3단계 폴백]
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │ Android 11+ (API 30) — 3단계 폴백                              │
 * │                                                               │
 * │ 1단계: MATCH_ONLY — 삼성 One UI 최우선                         │
 * │ 2단계: MATCH_INCLUDE + IS_TRASHED=1 엄격 필터                  │
 * │ 3단계: WHERE IS_TRASHED=1 직접 쿼리 (최후 수단)                │
 * └───────────────────────────────────────────────────────────────┘
 *
 * [앱 임시파일 필터]
 * RELATIVE_PATH가 "Android/" 로 시작하면 스킵
 * → 카톡(com.kakao.talk), 인스타(com.instagram.android) 등
 *   앱이 내부적으로 생성·삭제하는 단발성 데이터 제외
 */
class MediaStoreDataSource(private val context: Context) {

    companion object {
        private const val TAG = "MediaStoreScan"

        /**
         * Android 11+ projection — RELATIVE_PATH 포함
         * RELATIVE_PATH: 파일의 원래 위치 (예: "DCIM/Camera/", "Android/data/com.kakao.talk/")
         * → 앱 내부 데이터 vs 사용자 미디어 판별에 사용
         */
        @RequiresApi(Build.VERSION_CODES.R)
        private val TRASHED_PROJECTION_R = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.IS_TRASHED,
            MediaStore.MediaColumns.RELATIVE_PATH,
        )

        /** Android 10 이하 projection (IS_TRASHED/RELATIVE_PATH 없음) */
        private val LEGACY_PROJECTION = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.MediaColumns.MIME_TYPE,
            @Suppress("DEPRECATION")
            MediaStore.MediaColumns.DATA,
        )

        /**
         * 앱 내부 데이터 경로 프리픽스
         * 이 경로로 시작하는 파일은 앱이 자동 생성·삭제한 것으로 판단 → 스킵
         */
        private val APP_DATA_PATH_PREFIXES = listOf(
            "android/",     // Android/data/..., Android/media/...
        )
    }

    suspend fun scanImages(): List<RecoverableFile> = withContext(Dispatchers.IO) {
        queryDeletedFiles(
            externalUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            category = FileCategory.IMAGE
        )
    }

    suspend fun scanVideos(): List<RecoverableFile> = withContext(Dispatchers.IO) {
        queryDeletedFiles(
            externalUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
            category = FileCategory.VIDEO
        )
    }

    suspend fun scanAudios(): List<RecoverableFile> = withContext(Dispatchers.IO) {
        queryDeletedFiles(
            externalUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
            category = FileCategory.AUDIO
        )
    }

    suspend fun scanDocuments(): List<RecoverableFile> = withContext(Dispatchers.IO) {
        queryDeletedFiles(
            externalUri = MediaStore.Files.getContentUri("external"),
            category = FileCategory.DOCUMENT,
            mimeTypes = listOf(
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "text/plain"
            )
        )
    }

    private suspend fun queryDeletedFiles(
        externalUri: Uri,
        category: FileCategory,
        mimeTypes: List<String>? = null
    ): List<RecoverableFile> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            queryTrashedFiles(externalUri, category, mimeTypes)
        } else {
            queryOrphanedFiles(externalUri, category, mimeTypes)
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Android 11+: IS_TRASHED 기반 3단계 폴백
    // ─────────────────────────────────────────────────────────────────────

    @RequiresApi(Build.VERSION_CODES.R)
    private suspend fun queryTrashedFiles(
        externalUri: Uri,
        category: FileCategory,
        mimeTypes: List<String>?
    ): List<RecoverableFile> {
        val seenIds = mutableSetOf<Long>()
        val allResults = mutableListOf<RecoverableFile>()

        // 1단계: MATCH_ONLY — SQL selection 없이 (삼성 One UI 최우선)
        val s1 = queryWithBundle(
            externalUri, category, mimeTypes,
            matchMode = MediaStore.MATCH_ONLY,
            seenIds = seenIds
        )
        allResults += s1
        Log.d(TAG, "${category.name} 1단계(MATCH_ONLY): ${s1.size}개")

        // 2단계: MATCH_INCLUDE + IS_TRASHED=1 엄격 필터 (항상 실행)
        val s2 = queryWithBundle(
            externalUri, category, mimeTypes,
            matchMode = MediaStore.MATCH_INCLUDE,
            seenIds = seenIds
        )
        allResults += s2
        Log.d(TAG, "${category.name} 2단계(MATCH_INCLUDE): +${s2.size}개")

        // 3단계: Bundle 없이 IS_TRASHED=1 직접 WHERE (항상 실행)
        val s3 = queryTrashedDirectSelection(externalUri, category, mimeTypes, seenIds)
        allResults += s3
        Log.d(TAG, "${category.name} 3단계(직접쿼리): +${s3.size}개 → 총 ${allResults.size}개")

        return allResults
    }

    /**
     * Bundle + MATCH_ONLY 또는 MATCH_INCLUDE 방식 쿼리
     *
     * [IS_TRASHED 필터 전략]
     * ┌─────────────┬──────────────────────────────────────────────┐
     * │ MATCH_ONLY   │ 쿼리 자체가 trashed만 반환 → isTrashed==0   │
     * │              │ 일 때만 스킵 (OEM이 비-trashed 섞는 경우)    │
     * │ MATCH_INCLUDE│ 정상+삭제 전부 반환 → isTrashed!=1이면 스킵 │
     * └─────────────┴──────────────────────────────────────────────┘
     *
     * [앱 데이터 필터]
     * RELATIVE_PATH가 "Android/"로 시작 → 앱 내부 임시파일 → 스킵
     */
    @RequiresApi(Build.VERSION_CODES.R)
    private suspend fun queryWithBundle(
        externalUri: Uri,
        category: FileCategory,
        mimeTypes: List<String>?,
        matchMode: Int,
        seenIds: MutableSet<Long>
    ): List<RecoverableFile> {
        val results = mutableListOf<RecoverableFile>()

        val queryArgs = Bundle().apply {
            putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, matchMode)
            putString(
                ContentResolver.QUERY_ARG_SQL_SORT_ORDER,
                "${MediaStore.MediaColumns.DATE_MODIFIED} DESC"
            )
        }

        context.contentResolver.query(externalUri, TRASHED_PROJECTION_R, queryArgs, null)
            ?.use { cursor ->
                val idCol      = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
                val nameCol    = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
                val sizeCol    = cursor.getColumnIndex(MediaStore.MediaColumns.SIZE)
                val dateCol    = cursor.getColumnIndex(MediaStore.MediaColumns.DATE_MODIFIED)
                val mimeCol    = cursor.getColumnIndex(MediaStore.MediaColumns.MIME_TYPE)
                val trashedCol = cursor.getColumnIndex(MediaStore.MediaColumns.IS_TRASHED)
                val relPathCol = cursor.getColumnIndex(MediaStore.MediaColumns.RELATIVE_PATH)

                if (idCol < 0 || nameCol < 0) return@use

                while (cursor.moveToNext()) {
                    coroutineContext.ensureActive()

                    val id = cursor.getLong(idCol)
                    if (!seenIds.add(id)) continue

                    // ── IS_TRASHED 필터 (모드별) ──
                    val isTrashed = if (trashedCol >= 0) cursor.getInt(trashedCol) else -1

                    if (matchMode == MediaStore.MATCH_INCLUDE) {
                        if (isTrashed != 1) continue    // 엄격: IS_TRASHED=1만 통과
                    } else {
                        if (isTrashed == 0) continue     // 허용: 명시적 0만 스킵
                    }

                    // ── RELATIVE_PATH 필터: 앱 내부 데이터 제외 ──
                    val relativePath = if (relPathCol >= 0)
                        (cursor.getString(relPathCol) ?: "") else ""

                    if (isAppDataPath(relativePath)) {
                        Log.v(TAG, "앱 데이터 스킵: $relativePath")
                        continue
                    }

                    // ── MIME 타입 코드 필터 ──
                    if (mimeTypes != null && mimeCol >= 0) {
                        val mime = cursor.getString(mimeCol) ?: continue
                        if (mime !in mimeTypes) continue
                    }

                    val name     = cursor.getString(nameCol) ?: continue
                    val size     = if (sizeCol >= 0) cursor.getLong(sizeCol) else 0L
                    val modified = if (dateCol >= 0) cursor.getLong(dateCol) * 1000L else 0L
                    val ext      = name.substringAfterLast('.', "").lowercase()
                    val itemUri  = ContentUris.withAppendedId(externalUri, id)

                    val headerIntact = size > 1024L
                    results += RecoverableFile(
                        id             = UUID.randomUUID().toString(),
                        name           = name,
                        path           = relativePath.trimEnd('/'),
                        uri            = itemUri,
                        size           = size,
                        lastModified   = modified,
                        category       = category,
                        extension      = ext,
                        recoveryChance = RecoveryAnalyzer.calcChance(size, headerIntact),
                        headerIntact   = headerIntact
                    )
                }
            }

        return results
    }

    /**
     * 3단계 폴백: Bundle 없이 WHERE IS_TRASHED=1 직접 사용
     */
    @RequiresApi(Build.VERSION_CODES.R)
    @Suppress("DEPRECATION")
    private suspend fun queryTrashedDirectSelection(
        externalUri: Uri,
        category: FileCategory,
        mimeTypes: List<String>?,
        seenIds: MutableSet<Long>
    ): List<RecoverableFile> {
        val results = mutableListOf<RecoverableFile>()

        val isTrashedCond = "${MediaStore.MediaColumns.IS_TRASHED} = 1"
        val mimeCondition = mimeTypes?.joinToString(" OR ") {
            "${MediaStore.MediaColumns.MIME_TYPE} = ?"
        }
        val selection     = if (mimeCondition != null) "($isTrashedCond) AND ($mimeCondition)"
                            else isTrashedCond
        val selectionArgs = mimeTypes?.toTypedArray()

        try {
            context.contentResolver.query(
                externalUri,
                TRASHED_PROJECTION_R,
                selection,
                selectionArgs,
                "${MediaStore.MediaColumns.DATE_MODIFIED} DESC"
            )?.use { cursor ->
                val idCol      = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
                val nameCol    = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
                val sizeCol    = cursor.getColumnIndex(MediaStore.MediaColumns.SIZE)
                val dateCol    = cursor.getColumnIndex(MediaStore.MediaColumns.DATE_MODIFIED)
                val trashedCol = cursor.getColumnIndex(MediaStore.MediaColumns.IS_TRASHED)
                val relPathCol = cursor.getColumnIndex(MediaStore.MediaColumns.RELATIVE_PATH)

                if (idCol < 0 || nameCol < 0) return@use

                while (cursor.moveToNext()) {
                    coroutineContext.ensureActive()

                    val id = cursor.getLong(idCol)
                    if (!seenIds.add(id)) continue

                    val isTrashed = if (trashedCol >= 0) cursor.getInt(trashedCol) else -1
                    if (isTrashed == 0) continue

                    // 앱 데이터 필터
                    val relativePath = if (relPathCol >= 0)
                        (cursor.getString(relPathCol) ?: "") else ""
                    if (isAppDataPath(relativePath)) continue

                    val name     = cursor.getString(nameCol) ?: continue
                    val size     = if (sizeCol >= 0) cursor.getLong(sizeCol) else 0L
                    val modified = if (dateCol >= 0) cursor.getLong(dateCol) * 1000L else 0L
                    val ext      = name.substringAfterLast('.', "").lowercase()
                    val itemUri  = ContentUris.withAppendedId(externalUri, id)

                    val headerIntact = size > 1024L
                    results += RecoverableFile(
                        id             = UUID.randomUUID().toString(),
                        name           = name,
                        path           = relativePath.trimEnd('/'),
                        uri            = itemUri,
                        size           = size,
                        lastModified   = modified,
                        category       = category,
                        extension      = ext,
                        recoveryChance = RecoveryAnalyzer.calcChance(size, headerIntact),
                        headerIntact   = headerIntact
                    )
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "${category.name} 직접 IS_TRASHED 쿼리 실패: ${e.message}")
        }

        return results
    }

    // ─────────────────────────────────────────────────────────────────────
    // Android 10 이하: DB 레코드 + 파일 부재 = 삭제된 파일
    // ─────────────────────────────────────────────────────────────────────

    @Suppress("DEPRECATION")
    private suspend fun queryOrphanedFiles(
        externalUri: Uri,
        category: FileCategory,
        mimeTypes: List<String>?
    ): List<RecoverableFile> {
        val results = mutableListOf<RecoverableFile>()

        val selection = mimeTypes?.joinToString(" OR ") {
            "${MediaStore.MediaColumns.MIME_TYPE} = ?"
        }
        val selectionArgs = mimeTypes?.toTypedArray()

        context.contentResolver.query(
            externalUri, LEGACY_PROJECTION, selection, selectionArgs,
            "${MediaStore.MediaColumns.DATE_MODIFIED} DESC"
        )?.use { cursor ->
            val idCol   = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
            val nameCol = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
            val sizeCol = cursor.getColumnIndex(MediaStore.MediaColumns.SIZE)
            val dateCol = cursor.getColumnIndex(MediaStore.MediaColumns.DATE_MODIFIED)
            val dataCol = cursor.getColumnIndex(MediaStore.MediaColumns.DATA)

            if (idCol < 0 || nameCol < 0) return@use

            while (cursor.moveToNext()) {
                coroutineContext.ensureActive()

                val id       = cursor.getLong(idCol)
                val name     = cursor.getString(nameCol) ?: continue
                val size     = if (sizeCol >= 0) cursor.getLong(sizeCol) else 0L
                val modified = if (dateCol >= 0) cursor.getLong(dateCol) * 1000L else 0L
                val filePath = if (dataCol >= 0) (cursor.getString(dataCol) ?: "") else ""
                val ext      = name.substringAfterLast('.', "").lowercase()
                val uri      = ContentUris.withAppendedId(externalUri, id)

                // 실제 파일이 디스크에 존재하면 = 삭제 안 됨 → 스킵
                if (filePath.isNotEmpty() && java.io.File(filePath).exists()) continue
                if (filePath.isEmpty()) continue

                // 앱 데이터 경로 필터 (Android/data/... 등)
                if (filePath.contains("/Android/data/") || filePath.contains("/Android/media/")) continue

                val headerIntact = size > 1024L
                val chance       = RecoveryAnalyzer.calcChance(size, headerIntact)

                results += RecoverableFile(
                    id             = UUID.randomUUID().toString(),
                    name           = name,
                    path           = filePath,
                    uri            = uri,
                    size           = size,
                    lastModified   = modified,
                    category       = category,
                    extension      = ext,
                    recoveryChance = chance,
                    headerIntact   = headerIntact
                )
            }
        }

        Log.d(TAG, "${category.name} orphaned: ${results.size}개 발견")
        return results
    }

    // ─────────────────────────────────────────────────────────────────────
    // 유틸리티
    // ─────────────────────────────────────────────────────────────────────

    /**
     * RELATIVE_PATH가 앱 내부 데이터 경로인지 확인
     * "Android/data/com.kakao.talk/..." → true (앱 임시파일)
     * "DCIM/Camera/" → false (사용자 미디어)
     */
    private fun isAppDataPath(relativePath: String): Boolean {
        if (relativePath.isBlank()) return false
        val lower = relativePath.lowercase()
        return APP_DATA_PATH_PREFIXES.any { lower.startsWith(it) }
    }
}
