package com.filerecovery.data.datasource

import android.os.Build
import android.os.Environment
import android.util.Log
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
 * 파일 시스템 직접 순회 — 삭제 흔적 디렉토리 + 사용자 디렉토리 스캔
 *
 * [수정 사항]
 * ✅ MANAGE_EXTERNAL_STORAGE 하드게이트 제거 → 디렉토리별 SecurityException 처리
 *    (기존: 권한 없으면 즉시 return → 전체 파일시스템 스캔 0건)
 *    (수정: 권한 없어도 접근 가능한 디렉토리는 시도)
 * ✅ OEM 트래시 경로 대폭 추가 (삼성, 샤오미, OPPO, 화웨이, OnePlus, Vivo, Google Files)
 * ✅ 사용자 미디어 디렉토리(DCIM, Pictures, Download 등) 스캔 추가
 * ✅ 실제 Magic Number 헤더 검증 (기존: size > 1024 으로 추정)
 * ✅ Android/data 등 시스템 디렉토리 재귀 방지
 *
 * [안전 장치]
 * - 최대 깊이 5 (순환 방지)
 * - 심볼릭 링크 canonicalPath 검증
 * - SecurityException → 해당 디렉토리만 스킵 (전체 스캔 중단 X)
 * - 코루틴 취소 지원
 */
class FileSystemDataSource {

    companion object {
        private const val TAG = "FileSystemScan"
        private const val MAX_DEPTH = 5

        /**
         * 삭제된 파일이 존재할 수 있는 휴지통/캐시 디렉토리
         * MANAGE_EXTERNAL_STORAGE 없이도 일부 경로는 접근 가능할 수 있음
         */
        private val RECOVERY_SCAN_DIRS = listOf(
            // ─── 삼성 One UI ────────────────────────
            "/storage/emulated/0/.Trash",
            "/storage/emulated/0/.Trashes",
            "/storage/emulated/0/.trash",
            "/storage/emulated/0/.recently-deleted",
            "/storage/emulated/0/DCIM/.Trash",
            "/storage/emulated/0/DCIM/.trash",
            "/storage/emulated/0/Pictures/.Trash",
            "/storage/emulated/0/Pictures/.trash",
            "/storage/emulated/0/Android/data/com.sec.android.myfiles/.Recycle",
            "/storage/emulated/0/Android/data/com.sec.android.gallery3d/cache",

            // ─── Xiaomi / MIUI ──────────────────────
            "/storage/emulated/0/MIUI/.trashbin",
            "/storage/emulated/0/.MIUI/trash",
            "/storage/emulated/0/MIUI/Gallery/cloud/.trashBin",

            // ─── OPPO / ColorOS / realme ────────────
            "/storage/emulated/0/.ColorOS/.trash",
            "/storage/emulated/0/.oppo_recycler",
            "/storage/emulated/0/.com.coloros.filemanager/.trash",

            // ─── Huawei / HarmonyOS ─────────────────
            "/storage/emulated/0/.HWRecycle",
            "/storage/emulated/0/.huawei_recycle",

            // ─── OnePlus ────────────────────────────
            "/storage/emulated/0/.OPFileManager/.trash",

            // ─── Vivo / OriginOS ────────────────────
            "/storage/emulated/0/.VivoFileManager/.trash",

            // ─── Google Files 앱 ────────────────────
            "/storage/emulated/0/Android/data/com.google.android.apps.nbu.files/files/.trash",

            // ─── 공용 ───────────────────────────────
            "/storage/emulated/0/lost+found",
            "/storage/emulated/0/.FileManagerTrash",
            "/storage/emulated/0/.recycle",
            "/storage/emulated/0/.Recycle",

            // ─── 썸네일 캐시 (삭제 후에도 잔존) ─────
            "/storage/emulated/0/DCIM/.thumbnails",
            "/storage/emulated/0/Pictures/.thumbnails",
            "/storage/emulated/0/.thumbnails",
        )

        /**
         * 사용자 미디어 디렉토리 — MANAGE_EXTERNAL_STORAGE 보유 시 추가 스캔
         * MediaStore에서 못 찾은 "고아 파일" 탐지 용도
         */
        private val USER_MEDIA_DIRS = listOf(
            "/storage/emulated/0/DCIM",
            "/storage/emulated/0/Pictures",
            "/storage/emulated/0/Download",
            "/storage/emulated/0/Movies",
            "/storage/emulated/0/Music",
            "/storage/emulated/0/Documents",
        )

        /** 재귀 탐색에서 제외할 디렉토리 이름 */
        private val SKIP_DIR_NAMES = setOf("Android", ".android_secure", "cache", "code_cache")
    }

    /** MANAGE_EXTERNAL_STORAGE 허용 여부 */
    val hasFullAccess: Boolean
        get() = Build.VERSION.SDK_INT < Build.VERSION_CODES.R ||
            Environment.isExternalStorageManager()

    /**
     * 메인 스캔 진입점
     *
     * ✅ FIX: MANAGE_EXTERNAL_STORAGE 없어도 접근 가능한 디렉토리는 시도
     * SecurityException은 디렉토리 단위로 처리 → 전체 스캔 중단 X
     */
    suspend fun scanAll(onFileFound: suspend (RecoverableFile) -> Unit) =
        withContext(Dispatchers.IO) {
            val visited = mutableSetOf<String>()
            var scannedDirs = 0
            var skippedDirs = 0

            // ── 1단계: 휴지통/삭제 흔적 디렉토리 (권한 없어도 항상 시도) ──
            RECOVERY_SCAN_DIRS.forEach { dirPath ->
                val dir = File(dirPath)
                try {
                    if (dir.exists() && dir.canRead()) {
                        scanDirectory(dir, onFileFound, visited, depth = 0)
                        scannedDirs++
                    }
                } catch (_: SecurityException) {
                    skippedDirs++
                }
            }

            // ── 2단계: 사용자 미디어 디렉토리 (전체 접근 권한 있을 때만) ──
            if (hasFullAccess) {
                USER_MEDIA_DIRS.forEach { dirPath ->
                    val dir = File(dirPath)
                    try {
                        if (dir.exists() && dir.canRead()) {
                            scanDirectory(dir, onFileFound, visited, depth = 0)
                            scannedDirs++
                        }
                    } catch (_: SecurityException) {
                        skippedDirs++
                    }
                }
            }

            Log.i(TAG, "파일시스템 스캔 완료: ${scannedDirs}개 디렉토리 스캔, " +
                "${skippedDirs}개 접근 거부, MANAGE_EXTERNAL_STORAGE=$hasFullAccess")
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
                // 시스템 디렉토리 재귀 방지
                if (child.name in SKIP_DIR_NAMES) continue
                scanDirectory(child, onFileFound, visited, depth + 1)
            } else if (child.isFile && child.length() > 0) {
                val ext = child.extension.lowercase()
                val category = FileExtensions.categoryOf(ext) ?: continue

                // ✅ FIX: 실제 Magic Number 헤더 검증 (기존: size > 1024 추정)
                val headerIntact = try {
                    RecoveryAnalyzer.calcHeaderFromPath(child)
                } catch (_: Exception) {
                    child.length() > 1024L  // 헤더 읽기 실패 시 폴백
                }
                val chance = RecoveryAnalyzer.calcChance(child.length(), headerIntact)

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
                        headerIntact   = headerIntact
                    )
                )
            }
        }
    }
}
