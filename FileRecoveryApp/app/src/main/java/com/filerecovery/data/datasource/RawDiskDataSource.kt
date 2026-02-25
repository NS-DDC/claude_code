package com.filerecovery.data.datasource

import android.content.Context
import android.net.Uri
import android.util.Log
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.domain.model.RecoveryChance
import com.filerecovery.domain.model.ScanProgress
import com.filerecovery.util.RecoveryAnalyzer
import com.filerecovery.util.RootUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.channelFlow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.isActive
import java.io.File

/**
 * Raw 디스크 스캔 + 파일 카빙 데이터소스 (루트 권한 필요)
 *
 * 블록 디바이스를 직접 읽어 Magic Number 기반으로 삭제된 파일을 발견합니다.
 * 30일이 지나 MediaStore에서 완전 삭제된 파일도 복구할 수 있습니다.
 *
 * [동작 흐름]
 * 1. RootUtils로 블록 디바이스 경로 + 전체 크기 획득
 * 2. 청크(1MB) 단위로 dd 읽기 → RecoveryAnalyzer.findMagicInBuffer()
 * 3. Magic 발견 시 → 끝 마커 탐색 or 최대 크기까지 추출
 * 4. 추출된 파일을 앱 캐시에 저장 → RecoverableFile 생성
 * 5. channelFlow로 실시간 진행률 + 발견 파일 방출
 */
class RawDiskDataSource(private val context: Context) {

    companion object {
        private const val TAG = "RawDiskDataSource"

        /** 한 번에 읽는 청크 크기 (1 MB) */
        private const val CHUNK_SIZE = 1024 * 1024

        /** 끝 마커 탐색용 추가 읽기 크기 (2 MB) */
        private const val END_SEARCH_SIZE = 2 * 1024 * 1024

        /** 최소 유효 파일 크기 (너무 작은 조각 무시) */
        private const val MIN_FILE_SIZE = 4096L

        /** 진행률 emit 간격 (MB 단위) */
        private const val PROGRESS_EMIT_INTERVAL_MB = 10
    }

    data class DeepScanResult(
        val progress: ScanProgress,
        val files: List<RecoverableFile>
    )

    /**
     * 심층 디스크 스캔 시작
     *
     * @param existingPaths 기존 스캔에서 발견된 파일 경로 (중복 방지)
     * @return Flow<DeepScanResult> 실시간 진행률 + 발견 파일
     */
    fun scan(existingPaths: Set<String> = emptySet()): Flow<DeepScanResult> = channelFlow {
        val devicePath = RootUtils.getBlockDevicePath()
        if (devicePath == null) {
            Log.e(TAG, "블록 디바이스를 찾을 수 없음")
            send(DeepScanResult(
                progress = ScanProgress(
                    isFinished = true,
                    isDeepScanning = false,
                    warnings = listOf("블록 디바이스를 찾을 수 없습니다. 루트 권한을 확인하세요.")
                ),
                files = emptyList()
            ))
            return@channelFlow
        }

        val deviceSize = RootUtils.getBlockDeviceSize(devicePath)
        if (deviceSize <= 0) {
            Log.e(TAG, "블록 디바이스 크기를 알 수 없음: $devicePath")
            send(DeepScanResult(
                progress = ScanProgress(
                    isFinished = true,
                    isDeepScanning = false,
                    warnings = listOf("디스크 크기를 조회할 수 없습니다.")
                ),
                files = emptyList()
            ))
            return@channelFlow
        }

        val totalMB = deviceSize / (1024 * 1024)
        Log.i(TAG, "심층 스캔 시작: device=$devicePath, size=${totalMB}MB")

        val carvedFiles = mutableListOf<RecoverableFile>()
        val cacheDir = File(context.cacheDir, "carved").apply { mkdirs() }
        var fileCounter = 0
        var scannedBytes = 0L
        var lastProgressMB = 0L

        // 4096 바이트 정렬된 오프셋으로 청크 단위 스캔
        var offset = 0L
        while (offset < deviceSize && isActive) {
            val readSize = minOf(CHUNK_SIZE.toLong(), deviceSize - offset).toInt()

            // dd로 청크 읽기
            val chunk = RootUtils.readBlockRaw(devicePath, offset, readSize)
            if (chunk == null) {
                // 읽기 실패 → 다음 청크로
                offset += readSize
                scannedBytes = offset
                continue
            }

            // 버퍼에서 Magic Number 탐색
            val matches = RecoveryAnalyzer.findMagicInBuffer(chunk, chunk.size)

            for (match in matches) {
                if (!isActive) break

                val fileStartOffset = offset + match.bufferOffset
                val ext = match.extension
                val maxSize = RecoveryAnalyzer.MAX_CARVE_SIZE[ext] ?: (50L * 1024 * 1024)

                // 파일 끝 위치 결정
                val fileSize = determineFileSize(
                    devicePath = devicePath,
                    fileStartOffset = fileStartOffset,
                    extension = ext,
                    maxSize = maxSize,
                    initialChunk = chunk,
                    chunkOffset = offset,
                    matchBufferOffset = match.bufferOffset
                )

                if (fileSize < MIN_FILE_SIZE) continue

                // 카빙 파일 추출
                val outputFile = File(cacheDir, "carved_${++fileCounter}.$ext")
                val extracted = RootUtils.extractToFile(
                    devicePath = devicePath,
                    offsetBytes = fileStartOffset,
                    length = fileSize,
                    outputFile = outputFile
                )

                if (extracted && outputFile.exists() && outputFile.length() > 0) {
                    val actualSize = outputFile.length()
                    val headerOk = RecoveryAnalyzer.calcHeaderFromPath(outputFile)
                    val chance = RecoveryAnalyzer.calcChance(actualSize, headerOk)

                    // 최소 크기 + 헤더 무결성 검증
                    if (actualSize >= MIN_FILE_SIZE && headerOk) {
                        val file = RecoverableFile(
                            id = "carved_$fileCounter",
                            name = "recovered_$fileCounter.$ext",
                            path = outputFile.absolutePath,
                            uri = Uri.fromFile(outputFile),
                            size = actualSize,
                            lastModified = System.currentTimeMillis(),
                            category = match.category,
                            extension = ext,
                            recoveryChance = chance,
                            headerIntact = true,
                            isCarved = true,
                            diskOffset = fileStartOffset
                        )
                        carvedFiles.add(file)
                        Log.i(TAG, "카빙 성공: $ext, offset=$fileStartOffset, size=$actualSize")
                    } else {
                        // 유효하지 않으면 삭제
                        outputFile.delete()
                    }
                }
            }

            offset += readSize
            scannedBytes = offset
            val currentMB = scannedBytes / (1024 * 1024)

            // 주기적으로 진행률 방출
            if (currentMB - lastProgressMB >= PROGRESS_EMIT_INTERVAL_MB || offset >= deviceSize) {
                lastProgressMB = currentMB
                val progressFloat = if (deviceSize > 0) scannedBytes.toFloat() / deviceSize else 0f
                send(DeepScanResult(
                    progress = ScanProgress(
                        scannedCount = carvedFiles.size,
                        imageCount = carvedFiles.count { it.category == FileCategory.IMAGE },
                        videoCount = carvedFiles.count { it.category == FileCategory.VIDEO },
                        audioCount = carvedFiles.count { it.category == FileCategory.AUDIO },
                        documentCount = carvedFiles.count { it.category == FileCategory.DOCUMENT },
                        isFinished = false,
                        isDeepScanning = true,
                        deepScanProgress = progressFloat.coerceIn(0f, 1f),
                        deepScanScannedMB = currentMB,
                        deepScanTotalMB = totalMB
                    ),
                    files = carvedFiles.toList()
                ))
            }
        }

        // 스캔 완료
        Log.i(TAG, "심층 스캔 완료: ${carvedFiles.size}개 파일 발견, ${scannedBytes / (1024*1024)}MB 스캔")

        val warnings = buildList {
            if (carvedFiles.isEmpty()) {
                add("디스크에서 복구 가능한 파일을 찾지 못했습니다. 데이터가 덮어쓰여졌을 수 있습니다.")
            }
        }

        send(DeepScanResult(
            progress = ScanProgress(
                scannedCount = carvedFiles.size,
                imageCount = carvedFiles.count { it.category == FileCategory.IMAGE },
                videoCount = carvedFiles.count { it.category == FileCategory.VIDEO },
                audioCount = carvedFiles.count { it.category == FileCategory.AUDIO },
                documentCount = carvedFiles.count { it.category == FileCategory.DOCUMENT },
                isFinished = true,
                isDeepScanning = false,
                deepScanProgress = 1f,
                deepScanScannedMB = scannedBytes / (1024 * 1024),
                deepScanTotalMB = totalMB,
                warnings = warnings
            ),
            files = carvedFiles.toList()
        ))
    }.flowOn(Dispatchers.IO)

    /**
     * 파일의 실제 크기를 결정합니다.
     *
     * 1) 끝 마커가 정의된 포맷 (JPEG, PNG, PDF) → 끝 마커 탐색
     * 2) 끝 마커 없는 포맷 → MAX_CARVE_SIZE 사용
     * 3) 다음 Magic Number가 먼저 나타나면 거기서 종료
     */
    private suspend fun determineFileSize(
        devicePath: String,
        fileStartOffset: Long,
        extension: String,
        maxSize: Long,
        initialChunk: ByteArray,
        chunkOffset: Long,
        matchBufferOffset: Int
    ): Long {
        // 끝 마커가 없는 포맷은 기본 최대 크기 사용
        if (!RecoveryAnalyzer.hasEndMarker(extension)) {
            return maxSize
        }

        // 이미 읽은 초기 청크에서 먼저 끝 마커 탐색
        val dataAfterMatch = initialChunk.size - matchBufferOffset
        if (dataAfterMatch > 0) {
            val searchBuf = initialChunk.copyOfRange(matchBufferOffset, initialChunk.size)
            val endPos = RecoveryAnalyzer.findEndMarker(searchBuf, searchBuf.size, extension)
            if (endPos > 0) {
                return endPos.toLong()
            }
        }

        // 초기 청크에서 못 찾았으면 추가 청크 읽어서 탐색
        var searchOffset = fileStartOffset + dataAfterMatch
        val fileEndLimit = fileStartOffset + maxSize
        val searchChunkSize = END_SEARCH_SIZE

        while (searchOffset < fileEndLimit) {
            val remaining = minOf(searchChunkSize.toLong(), fileEndLimit - searchOffset).toInt()
            val extraChunk = RootUtils.readBlockRaw(devicePath, searchOffset, remaining) ?: break

            val endPos = RecoveryAnalyzer.findEndMarker(extraChunk, extraChunk.size, extension)
            if (endPos > 0) {
                return (searchOffset - fileStartOffset) + endPos
            }

            searchOffset += remaining
        }

        // 끝 마커 못 찾으면 기본 최대 크기
        return maxSize
    }
}
