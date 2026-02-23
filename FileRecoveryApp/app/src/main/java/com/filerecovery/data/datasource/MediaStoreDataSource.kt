package com.filerecovery.data.datasource

import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
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
 * [삭제 파일 탐지 전략 — 이중 검증]
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ Android 11+ (API 30)                                    │
 * │ 1차: MATCH_INCLUDE + IS_TRASHED 코드 필터               │
 * │ 2차: MATCH_ONLY 추가 쿼리 (일부 OEM 대응)               │
 * │ → 두 결과 합산, ID 기반 중복 제거                        │
 * └─────────────────────────────────────────────────────────┘
 * ┌─────────────────────────────────────────────────────────┐
 * │ Android 10 이하                                         │
 * │ 1차: DATA 컬럼으로 파일 경로 획득                        │
 * │ 2차: File.exists() 로 실제 파일 존재 여부 확인           │
 * │ → DB 레코드 O + 실제 파일 X = 삭제된 파일               │
 * └─────────────────────────────────────────────────────────┘
 */
class MediaStoreDataSource(private val context: Context) {

    companion object {
        private const val TAG = "MediaStoreScan"

        // 기타(OTHER) 스캔 시 제외할 MIME 접두사 (이미 다른 스캔 함수에서 처리)
        private val EXCLUDE_MIME_PREFIXES = listOf("image/", "video/", "audio/")
        private val EXCLUDE_MIME_EXACT = setOf(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain"
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

    /**
     * 기타 파일 스캔 — APK, RAR, 7z, DB, JSON 등 미디어/문서 아닌 모든 삭제 파일
     * MediaStore.Files 전체를 쿼리하되 이미 다른 카테고리로 처리한 MIME 타입 제외
     */
    suspend fun scanOthers(): List<RecoverableFile> = withContext(Dispatchers.IO) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            queryOthersTrashed()
        } else {
            queryOthersOrphaned()
        }
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

    /**
     * Android 11+ — MATCH_INCLUDE + IS_TRASHED 필터 (주 전략)
     *                + MATCH_ONLY 추가 쿼리 (OEM 보완)
     *
     * 통화 녹음 앱 등 일부 OEM에서 IS_TRASHED 컬럼을 쓰지 않고
     * MATCH_ONLY로만 삭제 파일을 노출하는 경우 커버
     */
    private suspend fun queryTrashedFiles(
        externalUri: Uri,
        category: FileCategory,
        mimeTypes: List<String>?
    ): List<RecoverableFile> {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return emptyList()

        val seenIds = mutableSetOf<Long>()
        val results = mutableListOf<RecoverableFile>()

        // 전략 1: MATCH_INCLUDE + IS_TRASHED 코드 필터
        results += queryWithMatchMode(
            externalUri, category, mimeTypes,
            matchMode = MediaStore.MATCH_INCLUDE,
            requireIsTrashed = true,
            seenIds = seenIds
        )

        // 전략 2: MATCH_ONLY (일부 삼성/MIUI 등 OEM 대응)
        results += queryWithMatchMode(
            externalUri, category, mimeTypes,
            matchMode = MediaStore.MATCH_ONLY,
            requireIsTrashed = false,  // MATCH_ONLY 자체가 삭제 파일만 반환
            seenIds = seenIds
        )

        Log.d(TAG, "${category.name} trashed total: ${results.size}개")
        return results
    }

    private suspend fun queryWithMatchMode(
        externalUri: Uri,
        category: FileCategory,
        mimeTypes: List<String>?,
        matchMode: Int,
        requireIsTrashed: Boolean,
        seenIds: MutableSet<Long>
    ): List<RecoverableFile> {
        val results = mutableListOf<RecoverableFile>()

        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.IS_TRASHED,
            MediaStore.MediaColumns.DATE_EXPIRES
        )

        val selectionParts = mutableListOf<String>()
        val selectionArgsList = mutableListOf<String>()

        if (mimeTypes != null) {
            val mimeCondition = mimeTypes.joinToString(" OR ") {
                "${MediaStore.MediaColumns.MIME_TYPE} = ?"
            }
            selectionParts += "($mimeCondition)"
            selectionArgsList += mimeTypes
        }

        val selection = selectionParts.joinToString(" AND ").ifEmpty { null }
        val selectionArgs = selectionArgsList.toTypedArray().takeIf { it.isNotEmpty() }

        val queryArgs = Bundle().apply {
            if (selection != null) {
                putString(android.content.ContentResolver.QUERY_ARG_SQL_SELECTION, selection)
                putStringArray(android.content.ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, selectionArgs)
            }
            putString(
                android.content.ContentResolver.QUERY_ARG_SQL_SORT_ORDER,
                "${MediaStore.MediaColumns.DATE_MODIFIED} DESC"
            )
            putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, matchMode)
        }

        context.contentResolver.query(externalUri, projection, queryArgs, null)
            ?.use { cursor ->
                val idCol      = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
                val nameCol    = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
                val sizeCol    = cursor.getColumnIndex(MediaStore.MediaColumns.SIZE)
                val dateCol    = cursor.getColumnIndex(MediaStore.MediaColumns.DATE_MODIFIED)
                val trashedCol = cursor.getColumnIndex(MediaStore.MediaColumns.IS_TRASHED)

                if (idCol < 0 || nameCol < 0) return@use

                while (cursor.moveToNext()) {
                    coroutineContext.ensureActive()

                    val id = cursor.getLong(idCol)
                    if (!seenIds.add(id)) continue  // 중복 제거

                    if (requireIsTrashed) {
                        val isTrashed = if (trashedCol >= 0) cursor.getInt(trashedCol) else 0
                        if (isTrashed != 1) continue
                    }

                    val name     = cursor.getString(nameCol) ?: continue
                    val size     = if (sizeCol >= 0) cursor.getLong(sizeCol) else 0L
                    val modified = if (dateCol >= 0) cursor.getLong(dateCol) * 1000L else 0L
                    val ext      = name.substringAfterLast('.', "").lowercase()
                    val uri      = ContentUris.withAppendedId(externalUri, id)

                    val headerIntact = size > 1024L
                    val chance       = RecoveryAnalyzer.calcChance(size, headerIntact)

                    results += RecoverableFile(
                        id             = UUID.randomUUID().toString(),
                        name           = name,
                        path           = "",
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

        return results
    }

    /**
     * Android 10 이하 — DATA 컬럼 + File.exists() 로 삭제 여부 판단
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

                if (filePath.isNotEmpty() && java.io.File(filePath).exists()) continue
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

        Log.d(TAG, "${category.name} orphaned: ${results.size}개")
        return results
    }

    // ── 기타(OTHER) 파일 스캔 ─────────────────────────────────

    private suspend fun queryOthersTrashed(): List<RecoverableFile> {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return emptyList()

        val seenIds = mutableSetOf<Long>()
        val results = mutableListOf<RecoverableFile>()

        val externalUri = MediaStore.Files.getContentUri("external")

        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.IS_TRASHED
        )

        // 전략 1: MATCH_INCLUDE + IS_TRASHED 필터
        queryOthersWithMode(externalUri, projection, MediaStore.MATCH_INCLUDE, true, seenIds, results)
        // 전략 2: MATCH_ONLY
        queryOthersWithMode(externalUri, projection, MediaStore.MATCH_ONLY, false, seenIds, results)

        Log.d(TAG, "OTHER trashed total: ${results.size}개")
        return results
    }

    private suspend fun queryOthersWithMode(
        externalUri: Uri,
        projection: Array<String>,
        matchMode: Int,
        requireIsTrashed: Boolean,
        seenIds: MutableSet<Long>,
        results: MutableList<RecoverableFile>
    ) {
        val queryArgs = Bundle().apply {
            putString(
                android.content.ContentResolver.QUERY_ARG_SQL_SORT_ORDER,
                "${MediaStore.MediaColumns.DATE_MODIFIED} DESC"
            )
            putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, matchMode)
        }

        context.contentResolver.query(externalUri, projection, queryArgs, null)
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
                    if (!seenIds.add(id)) continue

                    if (requireIsTrashed) {
                        val isTrashed = if (trashedCol >= 0) cursor.getInt(trashedCol) else 0
                        if (isTrashed != 1) continue
                    }

                    val mimeType = if (mimeCol >= 0) cursor.getString(mimeCol) ?: "" else ""

                    // 이미 다른 스캔 함수에서 처리하는 타입 제외
                    if (EXCLUDE_MIME_PREFIXES.any { mimeType.startsWith(it) }) continue
                    if (mimeType in EXCLUDE_MIME_EXACT) continue

                    val name     = cursor.getString(nameCol) ?: continue
                    val size     = if (sizeCol >= 0) cursor.getLong(sizeCol) else 0L
                    if (size < 1024L) continue  // 1KB 미만 스킵

                    val modified = if (dateCol >= 0) cursor.getLong(dateCol) * 1000L else 0L
                    val ext      = name.substringAfterLast('.', "").lowercase()
                    val uri      = ContentUris.withAppendedId(externalUri, id)

                    // 실제 확장자로 카테고리 판단 (AUDIO가 OTHER MIME으로 저장된 경우 등)
                    val category = FileExtensions.categoryOf(ext)

                    val headerIntact = size > 1024L
                    val chance       = RecoveryAnalyzer.calcChance(size, headerIntact)

                    results += RecoverableFile(
                        id             = UUID.randomUUID().toString(),
                        name           = name,
                        path           = "",
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
    }

    @Suppress("DEPRECATION")
    private suspend fun queryOthersOrphaned(): List<RecoverableFile> {
        val results = mutableListOf<RecoverableFile>()
        val externalUri = MediaStore.Files.getContentUri("external")

        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.DATA
        )

        context.contentResolver.query(
            externalUri, projection, null, null,
            "${MediaStore.MediaColumns.DATE_MODIFIED} DESC"
        )?.use { cursor ->
            val idCol   = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
            val nameCol = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
            val sizeCol = cursor.getColumnIndex(MediaStore.MediaColumns.SIZE)
            val dateCol = cursor.getColumnIndex(MediaStore.MediaColumns.DATE_MODIFIED)
            val mimeCol = cursor.getColumnIndex(MediaStore.MediaColumns.MIME_TYPE)
            val dataCol = cursor.getColumnIndex(MediaStore.MediaColumns.DATA)

            if (idCol < 0 || nameCol < 0) return@use

            while (cursor.moveToNext()) {
                coroutineContext.ensureActive()

                val mimeType = if (mimeCol >= 0) cursor.getString(mimeCol) ?: "" else ""
                if (EXCLUDE_MIME_PREFIXES.any { mimeType.startsWith(it) }) continue
                if (mimeType in EXCLUDE_MIME_EXACT) continue

                val id       = cursor.getLong(idCol)
                val name     = cursor.getString(nameCol) ?: continue
                val size     = if (sizeCol >= 0) cursor.getLong(sizeCol) else 0L
                if (size < 1024L) continue

                val filePath = if (dataCol >= 0) (cursor.getString(dataCol) ?: "") else ""
                if (filePath.isNotEmpty() && java.io.File(filePath).exists()) continue
                if (filePath.isEmpty()) continue

                val modified = if (dateCol >= 0) cursor.getLong(dateCol) * 1000L else 0L
                val ext      = name.substringAfterLast('.', "").lowercase()
                val uri      = ContentUris.withAppendedId(externalUri, id)
                val category = FileExtensions.categoryOf(ext)

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

        Log.d(TAG, "OTHER orphaned: ${results.size}개")
        return results
    }
}
