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
 * 파일 시스템 직접 순회 — 삭제 흔적(휴지통/Trash) 디렉토리 전용 스캔
 *
 * [핵심 원칙]
 * 이 DataSource는 **휴지통/Trash/Recycle 디렉토리만** 스캔합니다.
 * DCIM, Pictures 등 일반 사용자 디렉토리는 스캔하지 않습니다.
 * → 일반 디렉토리를 스캔하면 방금 찍은 사진 등 정상 파일이 "복구 대상"으로 표시됨
 *
 * [수정 이력]
 * ✅ v1.3.0: MANAGE_EXTERNAL_STORAGE 하드게이트 제거
 * ✅ v1.3.0: OEM 트래시 경로 대폭 추가
 * ✅ v1.3.1: USER_MEDIA_DIRS 삭제 — 정상 파일 오탐 근본 원인 제거
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
         * 사용자가 삭제한 파일이 존재하는 휴지통/Recycle 디렉토리만
         *
         * [v1.3.2 정리]
         * ❌ 제거: gallery3d/cache (갤러리 캐시 — 휴지통 아님)
         * ❌ 제거: .thumbnails 3개 (시스템 썸네일 — 유저 파일 아님)
         * ❌ 제거: lost+found (시스템 파편 — 의미 없는 데이터)
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
            "/storage/emulated/0/.FileManagerTrash",
            "/storage/emulated/0/.recycle",
            "/storage/emulated/0/.Recycle",
        )

        /** 재귀 탐색에서 제외할 디렉토리 이름 */
        private val SKIP_DIR_NAMES = setOf("Android", ".android_secure", "cache", "code_cache")
    }

    /** MANAGE_EXTERNAL_STORAGE 허용 여부 */
    val hasFullAccess: Boolean
        get() = Build.VERSION.SDK_INT < Build.VERSION_CODES.R ||
            Environment.isExternalStorageManager()

    /**
     * 메인 스캔 진입점 — 휴지통/Trash 디렉토리만 스캔
     *
     * ✅ FIX v1.3.1: USER_MEDIA_DIRS(DCIM, Pictures 등) 스캔 제거
     *    → 정상 파일이 "복구 대상"으로 표시되는 버그 근본 원인
     *    → 일반 디렉토리의 삭제된 파일은 MediaStore IS_TRASHED로 탐지됨
     */
    suspend fun scanAll(onFileFound: suspend (RecoverableFile) -> Unit) =
        withContext(Dispatchers.IO) {
            val visited = mutableSetOf<String>()
            var scannedDirs = 0
            var skippedDirs = 0

            // 휴지통/삭제 흔적 디렉토리만 스캔 (권한 없어도 항상 시도)
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
