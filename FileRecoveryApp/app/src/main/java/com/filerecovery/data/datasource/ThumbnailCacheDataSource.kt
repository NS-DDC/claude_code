package com.filerecovery.data.datasource

import android.content.Context
import android.provider.MediaStore
import android.util.Log
import androidx.core.net.toUri
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.util.RecoveryAnalyzer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID
import kotlin.coroutines.coroutineContext

/**
 * 썸네일 캐시 스캔 — 원본이 삭제된 "고아 썸네일"만 포함
 *
 * [v1.3.1 수정]
 * ✅ MediaStore에 원본 이미지가 아직 존재하는 썸네일은 제외
 *    → 기존: .thumbnails 안의 모든 파일 포함 → 정상 사진의 썸네일도 복구 대상으로 표시됨
 *    → 수정: MediaStore에서 현재 존재하는 이미지 이름 Set을 만들고,
 *            썸네일 파일명이 거기 포함되면 스킵 (원본이 살아있으므로 삭제된 게 아님)
 *
 * [삼성 One UI 대응]
 * - 삼성 갤러리 캐시는 Android 11+ 접근 불가 → 표준 .thumbnails 경로만 스캔
 * - /sdcard 심볼릭 링크 중복 제거
 */
class ThumbnailCacheDataSource(private val context: Context) {

    companion object {
        private const val TAG = "ThumbnailCacheScan"

        private val THUMBNAIL_DIRS = listOf(
            "/storage/emulated/0/DCIM/.thumbnails",
            "/storage/emulated/0/Pictures/.thumbnails",
            "/storage/emulated/0/.thumbnails"
        )
    }

    /**
     * MediaStore에 현재 존재하는 이미지 파일 이름 Set 조회
     * 이 Set에 있는 이름의 썸네일은 "원본이 살아있음" → 복구 대상 아님
     */
    private fun queryExistingImageNames(): Set<String> {
        val names = mutableSetOf<String>()
        try {
            context.contentResolver.query(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                arrayOf(MediaStore.MediaColumns.DISPLAY_NAME),
                null, null, null
            )?.use { cursor ->
                val nameCol = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
                if (nameCol < 0) return@use
                while (cursor.moveToNext()) {
                    cursor.getString(nameCol)?.let { names.add(it.lowercase()) }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "MediaStore 이미지 이름 조회 실패: ${e.message}")
        }
        return names
    }

    suspend fun scanThumbnailCaches(): List<RecoverableFile> = withContext(Dispatchers.IO) {
        val results = mutableListOf<RecoverableFile>()
        val seenPaths = mutableSetOf<String>()

        // ✅ FIX v1.3.1: 원본이 존재하는 이미지 이름 Set
        val existingNames = queryExistingImageNames()
        Log.d(TAG, "MediaStore 현존 이미지: ${existingNames.size}개")

        val internalCacheDirs = listOf(
            File(context.cacheDir, "image_cache")
        )
        val externalDirs = THUMBNAIL_DIRS.map { File(it) }

        (internalCacheDirs + externalDirs).forEach { dir ->
            if (dir.exists() && dir.isDirectory) {
                dir.walkTopDown()
                    .maxDepth(3)
                    .filter { it.isFile && it.extension.lowercase() in FileExtensions.IMAGE }
                    .forEach { file ->
                        coroutineContext.ensureActive()

                        // ✅ FIX: 원본이 MediaStore에 존재하면 스킵 (삭제된 게 아님)
                        val baseName = file.name.lowercase()
                        if (baseName in existingNames) return@forEach

                        val canonical = try { file.canonicalPath } catch (_: Exception) { file.absolutePath }
                        if (seenPaths.add(canonical)) {
                            val chance = RecoveryAnalyzer.calcChance(file.length(), headerIntact = true)
                            results += RecoverableFile(
                                id             = UUID.randomUUID().toString(),
                                name           = file.name,
                                path           = file.absolutePath,
                                uri            = file.toUri(),
                                size           = file.length(),
                                lastModified   = file.lastModified(),
                                category       = FileCategory.IMAGE,
                                extension      = file.extension.lowercase(),
                                recoveryChance = chance,
                                headerIntact   = true,
                                thumbnailUri   = file.toUri()
                            )
                        }
                    }
            }
        }

        Log.d(TAG, "고아 썸네일: ${results.size}개 발견 (원본 삭제된 것만)")
        results
    }
}
