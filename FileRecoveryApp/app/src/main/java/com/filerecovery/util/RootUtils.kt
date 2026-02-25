package com.filerecovery.util

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/**
 * 루트 권한 유틸리티
 *
 * su 바이너리를 통해 루트 명령을 실행하고,
 * 블록 디바이스 경로를 탐색합니다.
 */
object RootUtils {

    private const val TAG = "RootUtils"

    /**
     * su 바이너리가 존재하고 실행 가능한지 확인
     * @return true = 루트 사용 가능
     */
    suspend fun isRootAvailable(): Boolean = withContext(Dispatchers.IO) {
        try {
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", "id"))
            val output = process.inputStream.bufferedReader().readText()
            val exitCode = process.waitFor()
            val result = exitCode == 0 && output.contains("uid=0")
            Log.i(TAG, "루트 확인: $result (exit=$exitCode, output=${output.take(50)})")
            result
        } catch (e: Exception) {
            Log.w(TAG, "루트 불가: ${e.message}")
            false
        }
    }

    /**
     * userdata 파티션의 블록 디바이스 경로 탐색
     *
     * /proc/mounts에서 /data 마운트 포인트의 블록 디바이스를 찾음
     * 예: /dev/block/sda13, /dev/block/dm-0, /dev/block/mmcblk0p38
     */
    suspend fun getBlockDevicePath(): String? = withContext(Dispatchers.IO) {
        try {
            // 방법 1: /proc/mounts 에서 /data 파티션 찾기
            val mounts = executeAsRoot("cat /proc/mounts") ?: return@withContext null
            for (line in mounts.lines()) {
                val parts = line.split("\\s+".toRegex())
                if (parts.size >= 2 && parts[1] == "/data") {
                    val device = parts[0]
                    Log.i(TAG, "userdata 블록 디바이스: $device")
                    return@withContext device
                }
            }

            // 방법 2: by-name 심볼릭 링크
            val byName = executeAsRoot("ls -la /dev/block/by-name/userdata 2>/dev/null")
            if (byName != null && byName.contains("->")) {
                val target = byName.substringAfterLast("-> ").trim()
                Log.i(TAG, "by-name 블록 디바이스: $target")
                return@withContext target
            }

            Log.w(TAG, "블록 디바이스를 찾을 수 없음")
            null
        } catch (e: Exception) {
            Log.e(TAG, "블록 디바이스 탐색 실패: ${e.message}")
            null
        }
    }

    /**
     * 블록 디바이스 전체 크기 (바이트)
     */
    suspend fun getBlockDeviceSize(devicePath: String): Long = withContext(Dispatchers.IO) {
        try {
            val output = executeAsRoot("blockdev --getsize64 $devicePath")
                ?: return@withContext 0L
            output.trim().toLongOrNull() ?: 0L
        } catch (e: Exception) {
            Log.e(TAG, "디바이스 크기 조회 실패: ${e.message}")
            0L
        }
    }

    /**
     * 루트 권한으로 명령 실행
     * @return stdout 출력 문자열, 실패 시 null
     */
    suspend fun executeAsRoot(command: String): String? = withContext(Dispatchers.IO) {
        try {
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", command))
            val output = process.inputStream.bufferedReader().readText()
            val exitCode = process.waitFor()
            if (exitCode == 0) output else {
                val error = process.errorStream.bufferedReader().readText()
                Log.w(TAG, "루트 명령 실패 (exit=$exitCode): $error")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "루트 명령 예외: ${e.message}")
            null
        }
    }

    /**
     * 루트로 블록 디바이스에서 raw 바이트 읽기
     *
     * @param devicePath 블록 디바이스 경로
     * @param offsetBytes 시작 오프셋 (바이트)
     * @param length 읽을 바이트 수
     * @return 읽은 바이트 배열, 실패 시 null
     */
    suspend fun readBlockRaw(
        devicePath: String,
        offsetBytes: Long,
        length: Int
    ): ByteArray? = withContext(Dispatchers.IO) {
        try {
            // dd bs=4096으로 성능 최적화 (bs=1은 극도로 느림)
            val blockSize = 4096
            val skipBlocks = offsetBytes / blockSize
            val countBlocks = (length.toLong() + blockSize - 1) / blockSize
            val cmd = "dd if=$devicePath bs=$blockSize skip=$skipBlocks count=$countBlocks 2>/dev/null"
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", cmd))
            val bytes = process.inputStream.readBytes()
            process.waitFor()

            // dd는 블록 단위이므로 요청 크기보다 클 수 있음 → trim
            when {
                bytes.size >= length -> bytes.copyOf(length)
                bytes.isNotEmpty()   -> bytes
                else                 -> null
            }
        } catch (e: Exception) {
            Log.e(TAG, "블록 읽기 실패 (offset=$offsetBytes): ${e.message}")
            null
        }
    }

    /**
     * 루트로 블록 디바이스의 특정 범위를 파일로 추출
     *
     * @param devicePath 블록 디바이스
     * @param offsetBytes 시작 오프셋
     * @param length 추출할 바이트 수
     * @param outputFile 출력 파일 경로
     * @return 성공 여부
     */
    suspend fun extractToFile(
        devicePath: String,
        offsetBytes: Long,
        length: Long,
        outputFile: File
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val tmpPath = "/data/local/tmp/carved_${System.currentTimeMillis()}"
            val cmd = "dd if=$devicePath bs=4096 skip=${offsetBytes / 4096} " +
                "count=${(length + 4095) / 4096} 2>/dev/null | " +
                "head -c $length > $tmpPath && " +
                "cp $tmpPath ${outputFile.absolutePath} && rm $tmpPath"
            val result = executeAsRoot(cmd)
            outputFile.exists() && outputFile.length() > 0
        } catch (e: Exception) {
            Log.e(TAG, "파일 추출 실패: ${e.message}")
            false
        }
    }
}
