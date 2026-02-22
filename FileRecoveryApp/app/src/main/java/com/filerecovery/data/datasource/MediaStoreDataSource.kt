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
 * │ 1차: Bundle 쿼리 MATCH_INCLUDE + IS_TRASHED 컬럼 읽기  │
 * │ 2차: IS_TRASHED=1 인 행만 결과에 추가 (직접 검증)      │
 * │ → MATCH_ONLY가 OEM에서 무시돼도 안전                    │
 * └─────────────────────────────────────────────────────────┘
 * ┌─────────────────────────────────────────────────────────┐
 * │ Android 10 이하                                         │
 * │ 1차: DATA 컬럼으로 파일 경로 획득                       │
 * │ 2차: File.exists() 로 실제 파일 존재 여부 확인          │
 * │ → DB 레코드 O + 실제 파일 X = 삭제된 파일              │
 * └─────────────────────────────────────────────────────────┘
 *
 * [삼성 One UI 대응]
 * - 삼성 갤러리 휴지통 = IS_TRASHED 플래그로 접근 가능
 * - One UI 5+ 독자 30일 보관도 IS_TRASHED 기반
 */
class MediaStoreDataSource(private val context: Context) {

    companion object {
        private const val TAG = "MediaStoreScan"
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
            // Android 11+: IS_TRASHED 메타데이터로 직접 판단
            queryTrashedFiles(externalUri, category, mimeTypes)
        } else {
            // Android 10 이하: 파일 존재 여부로 판단
            queryOrphanedFiles(externalUri, category, mimeTypes)
        }
    }

    /**
     * Android 11+ (API 30)
     *
     * MATCH_INCLUDE 로 trashed 포함한 전체를 가져온 뒤,
     * IS_TRASHED 컬럼 값이 1인 행만 직접 필터링.
     *
     * MATCH_ONLY를 쓰지 않는 이유:
     * - 삼성 One UI, MIUI 등 일부 OEM에서 MATCH_ONLY 무시 사례 보고
     * - MATCH_INCLUDE + 코드 필터가 모든 기기에서 안정적
     */
    private suspend fun queryTrashedFiles(
        externalUri: Uri,
        category: FileCategory,
        mimeTypes: List<String>?
    ): List<RecoverableFile> {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return emptyList()

        val results = mutableListOf<RecoverableFile>()

        // ✅ IS_TRASHED 컬럼을 projection에 포함 → 직접 읽어서 검증
        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.IS_TRASHED,       // 핵심: 삭제 여부
            MediaStore.MediaColumns.DATE_EXPIRES       // 휴지통 만료 시각
        )

        // MIME 필터 (문서만 해당)
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
            // ✅ MATCH_INCLUDE: trashed 포함해서 가져오기 (MATCH_ONLY보다 OEM 호환성 높음)
            putInt(MediaStore.QUERY_ARG_MATCH_TRASHED, MediaStore.MATCH_INCLUDE)
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

                    // ✅ 핵심 검증: IS_TRASHED 컬럼이 1인 파일만 통과
                    val isTrashed = if (trashedCol >= 0) cursor.getInt(trashedCol) else 0
                    if (isTrashed != 1) continue   // ← 삭제되지 않은 파일은 스킵

                    val id       = cursor.getLong(idCol)
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

        Log.d(TAG, "${category.name} trashed: ${results.size}개 발견")
        return results
    }

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

                // ✅ 핵심: 실제 파일이 디스크에 존재하면 = 삭제 안 됨 → 스킵
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
