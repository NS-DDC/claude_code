package com.filerecovery.data.datasource

import android.content.Context
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
 * 썸네일 캐시 스캔
 *
 * [삼성 One UI 대응]
 * - 삼성 갤러리 캐시는 Android 11+ 접근 불가 → 표준 .thumbnails 경로만 스캔
 * - /sdcard 심볼릭 링크 중복 제거
 */
class ThumbnailCacheDataSource(private val context: Context) {

    companion object {
        // ✅ FIX: /sdcard 중복 제거
        private val THUMBNAIL_DIRS = listOf(
            "/storage/emulated/0/DCIM/.thumbnails",
            "/storage/emulated/0/Pictures/.thumbnails",
            "/storage/emulated/0/.thumbnails"
        )
    }

    suspend fun scanThumbnailCaches(): List<RecoverableFile> = withContext(Dispatchers.IO) {
        val results = mutableListOf<RecoverableFile>()
        val seenPaths = mutableSetOf<String>()

        val internalCacheDirs = listOf(
            File(context.cacheDir, "image_cache")
        )
        val externalDirs = THUMBNAIL_DIRS.map { File(it) }

        (internalCacheDirs + externalDirs).forEach { dir ->
            if (dir.exists() && dir.isDirectory) {
                // ✅ FIX: maxDepth 제한
                dir.walkTopDown()
                    .maxDepth(3)
                    .filter { it.isFile && it.extension.lowercase() in FileExtensions.IMAGE }
                    .forEach { file ->
                        coroutineContext.ensureActive()

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
        results
    }
}
