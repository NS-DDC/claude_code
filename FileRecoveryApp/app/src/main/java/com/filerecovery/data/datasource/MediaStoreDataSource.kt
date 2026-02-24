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
 * [v1.3.3 수정]
 * ✅ RELATIVE_PATH를 별도 쿼리로 분리 (projection에 넣으면 삼성 OEM 쿼리 실패 가능)
 *    → 1차: IS_TRASHED 쿼리로 삭제 파일 목록 확보
 *    → 2차: 결과에서 앱 데이터 경로 필터링 (RELATIVE_PATH 별도 조회)
 * ✅ 쿼리 실패 시 단계별 로그 + 0건 반환 (앱 크래시 방지)
 *
 * [삭제 파일 탐지 전략 — 3단계 폴백]
 * 1단계: MATCH_ONLY (삼성 One UI 최우선)
 * 2단계: MATCH_INCLUDE + IS_TRASHED=1 엄격 필터
 * 3단계: WHERE IS_TRASHED=1 직접 쿼리 (최후 수단)
 */
class MediaStoreDataSource(private val context: Context) {

    companion object {
        private const val TAG = "MediaStoreScan"

        /**
         * 기본 projection — RELATIVE_PATH 미포함 (안정성 우선)
         * 삼성 OEM에서 RELATIVE_PATH + MATCH_TRASHED 조합 시 쿼리 실패 사례 있음
         */
        private val TRASHED_PROJECTION = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.IS_TRASHED,
        )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 공개 스캔 메서드
    // ═══════════════════════════════════════════════════════════════════

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

    // ═══════════════════════════════════════════════════════════════════
    // Android 11+: IS_TRASHED 기반 3단계 폴백
    // ═══════════════════════════════════════════════════════════════════

    @RequiresApi(Build.VERSION_CODES.R)
    private suspend fun queryTrashedFiles(
        externalUri: Uri,
        category: FileCategory,
        mimeTypes: List<String>?
    ): List<RecoverableFile> {
        val seenIds = mutableSetOf<Long>()
        val allResults = mutableListOf<RecoverableFile>()

        // 1단계: MATCH_ONLY (삼성 One UI 최우선)
        try {
            val s1 = queryWithBundle(externalUri, category, mimeTypes,
                matchMode = MediaStore.MATCH_ONLY, seenIds = seenIds)
            allResults += s1
            Log.i(TAG, "✅ ${category.name} 1단계(MATCH_ONLY): ${s1.size}개")
        } catch (e: Exception) {
            Log.e(TAG, "❌ ${category.name} 1단계 실패: ${e.message}")
        }

        // 2단계: MATCH_INCLUDE + IS_TRASHED=1 엄격 필터
        try {
            val s2 = queryWithBundle(externalUri, category, mimeTypes,
                matchMode = MediaStore.MATCH_INCLUDE, seenIds = seenIds)
            allResults += s2
            Log.i(TAG, "✅ ${category.name} 2단계(MATCH_INCLUDE): +${s2.size}개")
        } catch (e: Exception) {
            Log.e(TAG, "❌ ${category.name} 2단계 실패: ${e.message}")
        }

        // 3단계: WHERE IS_TRASHED=1 직접 쿼리
        try {
            val s3 = queryTrashedDirectSelection(externalUri, category, mimeTypes, seenIds)
            allResults += s3
            Log.i(TAG, "✅ ${category.name} 3단계(직접쿼리): +${s3.size}개")
        } catch (e: Exception) {
            Log.e(TAG, "❌ ${category.name} 3단계 실패: ${e.message}")
        }

        Log.i(TAG, "📊 ${category.name} 최종: ${allResults.size}개")
        return filterAppTempFiles(allResults, externalUri)
    }

    /**
     * Bundle + MATCH_ONLY / MATCH_INCLUDE 쿼리
     *
     * [IS_TRASHED 필터]
     * MATCH_ONLY:   쿼리 자체가 trashed만 반환 → isTrashed==0만 스킵
     * MATCH_INCLUDE: 전부 반환 → isTrashed!=1이면 스킵 (엄격)
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

        val cursor = context.contentResolver.query(
            externalUri, TRASHED_PROJECTION, queryArgs, null
        )

        if (cursor == null) {
            Log.w(TAG, "${category.name} Bundle 쿼리 cursor=null (matchMode=$matchMode)")
            return results
        }

        cursor.use { c ->
            val idCol      = c.getColumnIndex(MediaStore.MediaColumns._ID)
            val nameCol    = c.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
            val sizeCol    = c.getColumnIndex(MediaStore.MediaColumns.SIZE)
            val dateCol    = c.getColumnIndex(MediaStore.MediaColumns.DATE_MODIFIED)
            val mimeCol    = c.getColumnIndex(MediaStore.MediaColumns.MIME_TYPE)
            val trashedCol = c.getColumnIndex(MediaStore.MediaColumns.IS_TRASHED)

            if (idCol < 0 || nameCol < 0) {
                Log.w(TAG, "${category.name} 필수 컬럼 누락 (id=$idCol, name=$nameCol)")
                return results
            }

            Log.d(TAG, "${category.name} cursor.count=${c.count} (matchMode=$matchMode)")

            while (c.moveToNext()) {
                coroutineContext.ensureActive()

                val id = c.getLong(idCol)
                if (!seenIds.add(id)) continue

                // IS_TRASHED 필터
                val isTrashed = if (trashedCol >= 0) c.getInt(trashedCol) else -1

                if (matchMode == MediaStore.MATCH_INCLUDE) {
                    if (isTrashed != 1) continue
                } else {
                    if (isTrashed == 0) continue
                }

                // MIME 타입 필터
                if (mimeTypes != null && mimeCol >= 0) {
                    val mime = c.getString(mimeCol) ?: continue
                    if (mime !in mimeTypes) continue
                }

                val name     = c.getString(nameCol) ?: continue
                val size     = if (sizeCol >= 0) c.getLong(sizeCol) else 0L
                val modified = if (dateCol >= 0) c.getLong(dateCol) * 1000L else 0L
                val ext      = name.substringAfterLast('.', "").lowercase()
                val itemUri  = ContentUris.withAppendedId(externalUri, id)

                val headerIntact = size > 1024L
                results += RecoverableFile(
                    id             = UUID.randomUUID().toString(),
                    name           = name,
                    path           = "",       // MediaStore 결과는 path 없음 (URI로 접근)
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
     * 3단계: Bundle 없이 WHERE IS_TRASHED=1
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

        val cursor = try {
            context.contentResolver.query(
                externalUri, TRASHED_PROJECTION, selection, selectionArgs,
                "${MediaStore.MediaColumns.DATE_MODIFIED} DESC"
            )
        } catch (e: Exception) {
            Log.w(TAG, "${category.name} 직접 쿼리 실패: ${e.message}")
            null
        }

        cursor?.use { c ->
            val idCol      = c.getColumnIndex(MediaStore.MediaColumns._ID)
            val nameCol    = c.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
            val sizeCol    = c.getColumnIndex(MediaStore.MediaColumns.SIZE)
            val dateCol    = c.getColumnIndex(MediaStore.MediaColumns.DATE_MODIFIED)
            val trashedCol = c.getColumnIndex(MediaStore.MediaColumns.IS_TRASHED)

            if (idCol < 0 || nameCol < 0) return results

            while (c.moveToNext()) {
                coroutineContext.ensureActive()

                val id = c.getLong(idCol)
                if (!seenIds.add(id)) continue

                val isTrashed = if (trashedCol >= 0) c.getInt(trashedCol) else -1
                if (isTrashed == 0) continue

                val name     = c.getString(nameCol) ?: continue
                val size     = if (sizeCol >= 0) c.getLong(sizeCol) else 0L
                val modified = if (dateCol >= 0) c.getLong(dateCol) * 1000L else 0L
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

    // ═══════════════════════════════════════════════════════════════════
    // 앱 임시파일 필터 — 별도 RELATIVE_PATH 조회
    // ═══════════════════════════════════════════════════════════════════

    /**
     * 결과 리스트에서 앱 데이터 경로(Android/data/, Android/media/) 파일 제거
     *
     * [안전 설계]
     * RELATIVE_PATH를 메인 쿼리 projection에 넣지 않음 (삼성 OEM 호환)
     * 대신 결과의 각 URI에서 ID를 추출 → 별도 쿼리로 RELATIVE_PATH 확인
     * RELATIVE_PATH 조회 실패 시 → 필터 안 함 (결과 유지)
     */
    @RequiresApi(Build.VERSION_CODES.R)
    private fun filterAppTempFiles(
        files: List<RecoverableFile>,
        externalUri: Uri
    ): List<RecoverableFile> {
        if (files.isEmpty()) return files

        // 결과에서 MediaStore ID 추출
        val idToFile = mutableMapOf<Long, RecoverableFile>()
        files.forEach { file ->
            val fileUri = file.uri ?: return@forEach
            try {
                val id = ContentUris.parseId(fileUri)
                idToFile[id] = file
            } catch (_: Exception) { /* URI 파싱 실패 → 필터 대상에서 제외 */ }
        }

        if (idToFile.isEmpty()) return files

        // 앱 데이터 경로 ID 수집 (별도 쿼리)
        val appDataIds = mutableSetOf<Long>()
        try {
            // RELATIVE_PATH만 조회하는 경량 쿼리
            val relPathProjection = arrayOf(
                MediaStore.MediaColumns._ID,
                MediaStore.MediaColumns.RELATIVE_PATH,
            )

            // ID 리스트로 WHERE 조건 구성
            val ids = idToFile.keys.toList()
            // 대량 IN 쿼리 방지 — 500건씩 배치
            ids.chunked(500).forEach { batch ->
                val placeholders = batch.joinToString(",") { "?" }
                val selection = "${MediaStore.MediaColumns._ID} IN ($placeholders)"
                val selectionArgs = batch.map { it.toString() }.toTypedArray()

                // MATCH_INCLUDE로 trashed 항목도 포함
                val queryArgs = Bundle().apply {
                    putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_INCLUDE)
                    putString(ContentResolver.QUERY_ARG_SQL_SELECTION, selection)
                    putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, selectionArgs)
                }

                context.contentResolver.query(externalUri, relPathProjection, queryArgs, null)
                    ?.use { cursor ->
                        val idCol = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
                        val rpCol = cursor.getColumnIndex(MediaStore.MediaColumns.RELATIVE_PATH)
                        if (idCol < 0 || rpCol < 0) return@use

                        while (cursor.moveToNext()) {
                            val id = cursor.getLong(idCol)
                            val rp = (cursor.getString(rpCol) ?: "").lowercase()
                            if (rp.startsWith("android/")) {
                                appDataIds.add(id)
                            }
                        }
                    }
            }
        } catch (e: Exception) {
            // RELATIVE_PATH 조회 실패 → 필터 없이 전체 결과 반환 (안전)
            Log.w(TAG, "RELATIVE_PATH 필터 실패 (결과 유지): ${e.message}")
            return files
        }

        if (appDataIds.isNotEmpty()) {
            Log.i(TAG, "🚫 앱 임시파일 ${appDataIds.size}개 제외")
        }

        return files.filter { file ->
            val fileUri = file.uri ?: return@filter true
            val id = try { ContentUris.parseId(fileUri) } catch (_: Exception) { return@filter true }
            id !in appDataIds
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Android 10 이하: DB 레코드 + 파일 부재 = 삭제된 파일
    // ═══════════════════════════════════════════════════════════════════

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
            MediaStore.MediaColumns.DATA,
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

                // 실제 파일이 디스크에 존재 → 삭제 안 됨 → 스킵
                if (filePath.isNotEmpty() && java.io.File(filePath).exists()) continue
                if (filePath.isEmpty()) continue

                // 앱 데이터 경로 필터
                if (filePath.contains("/Android/data/") || filePath.contains("/Android/media/")) continue

                val headerIntact = size > 1024L
                results += RecoverableFile(
                    id             = UUID.randomUUID().toString(),
                    name           = name,
                    path           = filePath,
                    uri            = uri,
                    size           = size,
                    lastModified   = modified,
                    category       = category,
                    extension      = ext,
                    recoveryChance = RecoveryAnalyzer.calcChance(size, headerIntact),
                    headerIntact   = headerIntact
                )
            }
        }

        Log.d(TAG, "${category.name} orphaned: ${results.size}개")
        return results
    }
}
