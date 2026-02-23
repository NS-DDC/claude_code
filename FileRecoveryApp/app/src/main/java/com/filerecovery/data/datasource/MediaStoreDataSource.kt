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
 * [삭제 파일 탐지 전략 — 3단계 검증]
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ 전략 1: IS_TRASHED (Android 11+ only)                   │
 * │ - MATCH_INCLUDE + IS_TRASHED=1 코드 필터                │
 * │ - 갤러리/앱에서 '삭제'한 파일 (휴지통 경유)              │
 * │ - 삼성 갤러리, Google Files 등 표준 삭제                 │
 * └─────────────────────────────────────────────────────────┘
 * ┌─────────────────────────────────────────────────────────┐
 * │ 전략 2: MATCH_ONLY (Android 11+ only)                   │
 * │ - 일부 OEM에서 IS_TRASHED 없이 MATCH_ONLY만 지원        │
 * │ - 통화 녹음, MIUI 파일 관리자 등                        │
 * └─────────────────────────────────────────────────────────┘
 * ┌─────────────────────────────────────────────────────────┐
 * │ 전략 3: Orphaned File (모든 Android 버전)               │
 * │ - DATA 컬럼으로 파일 경로 확인                          │
 * │ - DB 레코드 O + 실제 파일 X = 삭제된 파일               │
 * │ - PC USB 연결 삭제, 파일 매니저 직접 삭제 등 커버        │
 * └─────────────────────────────────────────────────────────┘
 */
class MediaStoreDataSource(private val context: Context) {

    companion object {
        private const val TAG = "MediaStoreScan"

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

    suspend fun scanOthers(): List<RecoverableFile> = withContext(Dispatchers.IO) {
        val results = mutableListOf<RecoverableFile>()
        val seenUris = mutableSetOf<String>()

        // 전략 1+2: IS_TRASHED / MATCH_ONLY (Android 11+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            queryOthersTrashed().forEach { file ->
                val key = file.uri?.toString() ?: return@forEach
                if (seenUris.add(key)) results += file
            }
        }

        // 전략 3: Orphaned file check (PC 삭제 등) — 모든 버전
        queryOthersOrphaned().forEach { file ->
            val key = file.uri?.toString() ?: file.path
            if (key.isNotEmpty() && seenUris.add(key)) results += file
        }

        Log.d(TAG, "OTHER total: ${results.size}개")
        results
    }

    /**
     * 삭제된 파일 통합 쿼리 — 3가지 전략 병합
     *
     * Android 11+: IS_TRASHED + MATCH_ONLY + Orphaned 3가지 전략 합산
     * Android 10-: Orphaned (DATA + File.exists()) 만 사용
     *
     * PC USB 연결 후 삭제한 파일은 IS_TRASHED가 설정되지 않고
     * MediaStore에 orphaned record로만 남기 때문에 Orphaned check 필수
     */
    private suspend fun queryDeletedFiles(
        externalUri: Uri,
        category: FileCategory,
        mimeTypes: List<String>? = null
    ): List<RecoverableFile> {
        val results = mutableListOf<RecoverableFile>()
        val seenUris = mutableSetOf<String>()

        // 전략 1+2: IS_TRASHED / MATCH_ONLY (Android 11+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            queryTrashedFiles(externalUri, category, mimeTypes).forEach { file ->
                val key = file.uri?.toString() ?: return@forEach
                if (seenUris.add(key)) results += file
            }
        }

        // 전략 3: Orphaned file check — DB 레코드 O + 실제 파일 X
        // PC에서 USB 삭제, 파일 매니저 직접 삭제, 앱 데이터 정리 등 커버
        queryOrphanedFiles(externalUri, category, mimeTypes).forEach { file ->
            val key = file.uri?.toString() ?: file.path
            if (key.isNotEmpty() && seenUris.add(key)) results += file
        }

        Log.d(TAG, "${category.name} deleted total: ${results.size}개 (trashed+orphaned)")
        return results
    }

    /**
     * Android 11+ — IS_TRASHED 기반 삭제 파일 탐지
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

        // 전략 2: MATCH_ONLY (일부 OEM 대응)
        results += queryWithMatchMode(
            externalUri, category, mimeTypes,
            matchMode = MediaStore.MATCH_ONLY,
            requireIsTrashed = false,
            seenIds = seenIds
        )

        Log.d(TAG, "${category.name} trashed: ${results.size}개")
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
                    if (!seenIds.add(id)) continue

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
     * Orphaned file check — DB 레코드는 있지만 실제 파일은 없는 경우
     *
     * [이 전략이 커버하는 삭제 시나리오]
     * 1. PC USB 연결 후 파일 탐색기에서 삭제 (MTP 삭제)
     * 2. 파일 매니저 앱에서 직접 삭제 (IS_TRASHED 미경유)
     * 3. 앱이 파일을 직접 삭제 (MediaStore 업데이트 전)
     * 4. adb shell rm 등 시스템 레벨 삭제
     *
     * Android 11+에서도 DATA 컬럼은 읽기 가능 (deprecated이지만 동작)
     * MANAGE_EXTERNAL_STORAGE 권한으로 File.exists() 사용 가능
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

                // 핵심: 경로가 있는데 실제 파일이 없으면 = 삭제된 파일
                if (filePath.isEmpty()) continue
                if (java.io.File(filePath).exists()) continue

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

        queryOthersWithMode(externalUri, projection, MediaStore.MATCH_INCLUDE, true, seenIds, results)
        queryOthersWithMode(externalUri, projection, MediaStore.MATCH_ONLY, false, seenIds, results)

        Log.d(TAG, "OTHER trashed: ${results.size}개")
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
                    if (EXCLUDE_MIME_PREFIXES.any { mimeType.startsWith(it) }) continue
                    if (mimeType in EXCLUDE_MIME_EXACT) continue

                    val name     = cursor.getString(nameCol) ?: continue
                    val size     = if (sizeCol >= 0) cursor.getLong(sizeCol) else 0L
                    if (size < 1024L) continue

                    val modified = if (dateCol >= 0) cursor.getLong(dateCol) * 1000L else 0L
                    val ext      = name.substringAfterLast('.', "").lowercase()
                    val uri      = ContentUris.withAppendedId(externalUri, id)
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
                if (filePath.isEmpty()) continue
                if (java.io.File(filePath).exists()) continue

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
