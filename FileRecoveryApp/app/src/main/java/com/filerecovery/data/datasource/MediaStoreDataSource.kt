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
 * MediaStore 쿼리 — 삭제된 파일만 검색
 *
 * [삭제 파일 탐지 전략 — 3단계 폴백]
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │ Android 11+ (API 30) — 3단계 폴백                              │
 * │                                                               │
 * │ 1단계: MATCH_ONLY (SQL selection 없이) + IS_TRASHED 코드 검증   │
 * │   → 삼성 One UI 우선 권장 방식                                  │
 * │   → QUERY_ARG_SQL_SELECTION 없이 단독 사용 시 Samsung OEM에서   │
 * │     가장 안정적으로 동작                                         │
 * │                                                               │
 * │ 2단계: MATCH_INCLUDE + IS_TRASHED 코드 필터                     │
 * │   → 1단계가 빈 결과일 때 시도                                    │
 * │   → MIME 필터도 코드에서 처리 (Bundle SQL selection 회피)        │
 * │                                                               │
 * │ 3단계: IS_TRASHED=1 직접 WHERE selection (Bundle 미사용)        │
 * │   → 1·2단계 모두 실패 시 최후 수단                               │
 * │   → Bundle QUERY_ARG_MATCH_TRASHED를 무시하는 OEM 대응          │
 * └───────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ Android 10 이하                                         │
 * │ DATA 컬럼으로 파일 경로 획득 후 File.exists() 확인       │
 * │ → DB 레코드 O + 실제 파일 X = 삭제된 파일               │
 * └─────────────────────────────────────────────────────────┘
 *
 * [삼성 One UI 핵심 이슈]
 * - QUERY_ARG_MATCH_TRASHED + QUERY_ARG_SQL_SELECTION 동시 사용 시
 *   삼성 OEM MediaStore에서 MATCH 플래그가 무시되는 버그 존재
 * - MATCH_ONLY가 MATCH_INCLUDE + IS_TRASHED 필터보다 삼성에서 더 안정적
 * - One UI 5+ (Android 13) 30일 휴지통도 IS_TRASHED 기반
 */
class MediaStoreDataSource(private val context: Context) {

    companion object {
        private const val TAG = "MediaStoreScan"

        // IS_TRASHED 컬럼 읽기를 위해 projection에 항상 포함
        private val TRASHED_PROJECTION = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.IS_TRASHED,
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

        // 1단계: MATCH_ONLY — SQL selection 없이 단독 사용 (삼성 One UI 최우선)
        // 핵심: Bundle에 QUERY_ARG_SQL_SELECTION을 넣지 않아야 삼성 OEM에서 정상 동작
        val s1 = queryWithBundle(
            externalUri, category, mimeTypes,
            matchMode = MediaStore.MATCH_ONLY,
            seenIds = seenIds
        )
        Log.d(TAG, "${category.name} 1단계(MATCH_ONLY): ${s1.size}개")
        if (s1.isNotEmpty()) return s1

        // 2단계: MATCH_INCLUDE + IS_TRASHED 코드 필터
        // MATCH_ONLY가 0건일 때 시도 (일부 AOSP 빌드 대응)
        val s2 = queryWithBundle(
            externalUri, category, mimeTypes,
            matchMode = MediaStore.MATCH_INCLUDE,
            seenIds = seenIds
        )
        Log.d(TAG, "${category.name} 2단계(MATCH_INCLUDE): ${s2.size}개")
        if (s2.isNotEmpty()) return s2

        // 3단계: Bundle 없이 IS_TRASHED=1 직접 WHERE 절 사용
        // Bundle QUERY_ARG를 완전히 무시하는 OEM 최후 수단
        val s3 = queryTrashedDirectSelection(externalUri, category, mimeTypes, seenIds)
        Log.d(TAG, "${category.name} 3단계(직접쿼리): ${s3.size}개")
        return s3
    }

    /**
     * Bundle + MATCH_ONLY 또는 MATCH_INCLUDE 방식 쿼리
     *
     * [삼성 One UI 호환 핵심 원칙]
     * Bundle에 QUERY_ARG_SQL_SELECTION을 넣지 않음.
     * 삼성 OEM에서 QUERY_ARG_MATCH_TRASHED + QUERY_ARG_SQL_SELECTION 동시 사용 시
     * MATCH 플래그가 무시되어 휴지통 항목이 0건 반환되는 버그가 있음.
     * MIME 타입 필터는 커서 읽기 후 코드에서 처리.
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
            // ✅ QUERY_ARG_SQL_SELECTION 미포함 — 삼성 One UI OEM 버그 회피
        }

        context.contentResolver.query(externalUri, TRASHED_PROJECTION, queryArgs, null)
            ?.use { cursor ->
                val idCol      = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
                val nameCol    = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
                val sizeCol    = cursor.getColumnIndex(MediaStore.MediaColumns.SIZE)
                val dateCol    = cursor.getColumnIndex(MediaStore.MediaColumns.DATE_MODIFIED)
                val mimeCol    = cursor.getColumnIndex(MediaStore.MediaColumns.MIME_TYPE)
                val trashedCol = cursor.getColumnIndex(MediaStore.MediaColumns.IS_TRASHED)

                if (idCol < 0 || nameCol < 0) return@use

                while (cursor.moveToNext()) {
                    coroutineContext.ensureActive()

                    val id = cursor.getLong(idCol)
                    if (!seenIds.add(id)) continue  // 전략 간 중복 제거

                    // IS_TRASHED 검증: 컬럼 존재 시 반드시 1이어야 통과
                    // MATCH_ONLY여도 삼성 OEM이 비-trashed 항목을 섞어 반환할 수 있어 재확인
                    val isTrashed = if (trashedCol >= 0) cursor.getInt(trashedCol) else -1
                    if (isTrashed == 0) continue   // 명확히 삭제 안 됨 → 스킵

                    // MIME 타입 코드 필터 (문서 카테고리 전용, Bundle SQL selection 회피)
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
                        path           = "",
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
     *
     * 표준 Android에서는 기본 MediaStore 쿼리가 trashed 항목을 자동 제외하므로
     * 이 방식이 작동하지 않을 수 있지만, Bundle QUERY_ARG를 완전히 무시하는
     * 일부 삼성/OEM 빌드에서 마지막 수단으로 시도.
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
                TRASHED_PROJECTION,
                selection,
                selectionArgs,
                "${MediaStore.MediaColumns.DATE_MODIFIED} DESC"
            )?.use { cursor ->
                val idCol      = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
                val nameCol    = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
                val sizeCol    = cursor.getColumnIndex(MediaStore.MediaColumns.SIZE)
                val dateCol    = cursor.getColumnIndex(MediaStore.MediaColumns.DATE_MODIFIED)
                val trashedCol = cursor.getColumnIndex(MediaStore.MediaColumns.IS_TRASHED)

                if (idCol < 0 || nameCol < 0) return@use

                while (cursor.moveToNext()) {
                    coroutineContext.ensureActive()

                    val id = cursor.getLong(idCol)
                    if (!seenIds.add(id)) continue

                    // 이중 검증 (selection이 무시된 경우 대비)
                    val isTrashed = if (trashedCol >= 0) cursor.getInt(trashedCol) else -1
                    if (isTrashed == 0) continue

                    val name     = cursor.getString(nameCol) ?: continue
                    val size     = if (sizeCol >= 0) cursor.getLong(sizeCol) else 0L
                    val modified = if (dateCol >= 0) cursor.getLong(dateCol) * 1000L else 0L
                    val ext      = name.substringAfterLast('.', "").lowercase()
                    val itemUri  = ContentUris.withAppendedId(externalUri, id)

                    val headerIntact = size > 1024L
                    results += RecoverableFile(
                        id             = UUID.randomUUID().toString(),
                        name           = name,
                        path           = "",
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

    /**
     * Android 10 이하
     *
     * DATA 컬럼으로 실제 파일 경로를 가져온 뒤,
     * File.exists()로 실제 파일이 디스크에 있는지 확인.
     * → DB 레코드만 남고 파일은 삭제된 = 복구 대상
     */
    @Suppress("DEPRECATION")
    private suspend fun queryOrphanedFiles(
        externalUri: Uri,
        category: FileCategory,
        mimeTypes: List<String>?
    ): List<RecoverableFile> {
        val results = mutableListOf<RecoverableFile>()

        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.DATA
        )

        val selection = mimeTypes?.joinToString(" OR ") {
            "${MediaStore.MediaColumns.MIME_TYPE} = ?"
        }
        val selectionArgs = mimeTypes?.toTypedArray()

        context.contentResolver.query(
            externalUri, projection, selection, selectionArgs,
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
                // DATA가 비어있으면 판단 불가 → 스킵 (오탐 방지)
                if (filePath.isEmpty()) continue

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
}
