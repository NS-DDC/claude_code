package com.filerecovery.data.datasource

import android.os.Build
import android.os.Environment
import androidx.core.net.toUri
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.util.RecoveryAnalyzer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID
import kotlin.coroutines.coroutineContext

/**
 * 파일 시스템 직접 순회 — 삭제 흔적 디렉토리만 스캔
 *
 * [스캔 대상]
 * - .Trash (삼성 One UI 휴지통)
 * - .recently-deleted (일부 OEM 휴지통)
 * - .thumbnails (삭제된 사진의 썸네일 잔존 파일)
 * - lost+found (파일 시스템 복구 잔여 파일)
 * - .nomedia 포함 숨김 디렉토리의 미디어 파일
 *
 * [안전 장치]
 * - 최대 깊이 5 (휴지통/캐시는 깊지 않음)
 * - 심볼릭 링크 순환 감지
 * - MANAGE_EXTERNAL_STORAGE 미보유 시 자동 스킵
 * - 코루틴 취소 지원
 */
class FileSystemDataSource {

    companion object {
        private const val MAX_DEPTH = 5

        /**
         * 삭제된 파일이 존재할 수 있는 디렉토리만 스캔
         * - 일반 사용자 파일 디렉토리(DCIM, Pictures 등)는 제외
         */
        private val RECOVERY_SCAN_DIRS = listOf(
            // 삼성 One UI / 일부 OEM 휴지통
            "/storage/emulated/0/.Trash",
            "/storage/emulated/0/.Trashes",
            "/storage/emulated/0/.recently-deleted",
            // 파일 시스템 복구 잔여
            "/storage/emulated/0/lost+found",
            // 숨겨진 썸네일 캐시 (원본 삭제 후에도 잔존)
            "/storage/emulated/0/DCIM/.thumbnails",
            "/storage/emulated/0/Pictures/.thumbnails",
            "/storage/emulated/0/.thumbnails",
            // 앱별 휴지통 (일부 파일 매니저)
            "/storage/emulated/0/.FileManagerTrash",
            "/storage/emulated/0/.recycle",
            "/storage/emulated/0/.Recycle",
        )
    }

    suspend fun scanAll(onFileFound: suspend (RecoverableFile) -> Unit) =
        withContext(Dispatchers.IO) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R &&
                !Environment.isExternalStorageManager()) {
                return@withContext
            }

            val visited = mutableSetOf<String>()

            RECOVERY_SCAN_DIRS.forEach { dirPath ->
                val dir = File(dirPath)
                if (dir.exists() && dir.canRead()) {
                    scanDirectory(dir, onFileFound, visited, depth = 0)
                }
            }
        }

    private suspend fun scanDirectory(
        dir: File,
        onFileFound: suspend (RecoverableFile) -> Unit,
        visited: MutableSet<String>,
        depth: Int
    ) {
        if (depth > MAX_DEPTH) return

        val canonical = try { dir.canonicalPath } catch (_: Exception) { return }
        if (!visited.add(canonical)) return

        val children = try {
            dir.listFiles() ?: return
        } catch (_: SecurityException) {
            return
        }

        for (child in children) {
            coroutineContext.ensureActive()

            if (child.isDirectory) {
                scanDirectory(child, onFileFound, visited, depth + 1)
            } else if (child.isFile && child.length() > 0) {
                val ext = child.extension.lowercase()
                val category = FileExtensions.categoryOf(ext) ?: continue

                val sizeBasedIntact = child.length() > 1024L
                val chance = RecoveryAnalyzer.calcChance(child.length(), sizeBasedIntact)

                onFileFound(
                    RecoverableFile(
                        id             = UUID.randomUUID().toString(),
                        name           = child.name,
                        path           = child.absolutePath,
                        uri            = child.toUri(),
                        size           = child.length(),
                        lastModified   = child.lastModified(),
                        category       = category,
                        extension      = ext,
                        recoveryChance = chance,
                        headerIntact   = sizeBasedIntact
                    )
                )
            }
        }
    }
}
