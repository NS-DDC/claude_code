package com.filerecovery.data.repository

import com.filerecovery.data.datasource.FileSystemDataSource
import com.filerecovery.data.datasource.MediaStoreDataSource
import com.filerecovery.data.datasource.RawDiskDataSource
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.domain.model.ScanProgress
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.channelFlow
import kotlinx.coroutines.flow.flowOn

/**
 * 스캔 파이프라인 — MediaStore + 파일시스템(OEM 휴지통) + Raw 디스크(루트) 3단계
 *
 * [v1.4 변경]
 * ✅ 3단계 추가: RawDiskDataSource — 루트 권한 Raw 디스크 카빙
 *    → 30일 경과 완전 삭제 파일 복구 가능
 *    → 루트 가용 시에만 실행
 *
 * [스캔 순서]
 * 1단계: MediaStore IS_TRASHED 4채널 병렬 (사진/동영상/음악/문서)
 *        → 갤러리·파일관리자에서 삭제한 파일 (가장 신뢰도 높음)
 *        → RELATIVE_PATH 필터로 앱 임시데이터(카톡/인스타 등) 자동 제외
 * 2단계: 파일시스템 OEM 휴지통 디렉토리 순회
 *        → 삼성/샤오미/OPPO/화웨이 등 전용 Trash 폴더
 * 3단계: Raw 디스크 카빙 (루트 전용)
 *        → 블록 디바이스 직접 스캔, Magic Number 기반 파일 복구
 */
class ScanRepository(
    private val mediaStore: MediaStoreDataSource,
    private val fileSystem: FileSystemDataSource,
    private val rawDisk: RawDiskDataSource? = null   // 루트 가용 시에만 주입
) {

    companion object {
        private const val FS_EMIT_INTERVAL = 50
    }

    fun scanAll(): Flow<Pair<ScanProgress, List<RecoverableFile>>> = channelFlow {
        val accumulated = mutableListOf<RecoverableFile>()
        val seenUris  = mutableSetOf<String>()
        val seenPaths = mutableSetOf<String>()
        var progress = ScanProgress()

        // -- 1단계: MediaStore 4채널 병렬 쿼리 --
        val mediaStoreCount: Int
        coroutineScope {
            val imgDeferred = async(Dispatchers.IO) { mediaStore.scanImages() }
            val vidDeferred = async(Dispatchers.IO) { mediaStore.scanVideos() }
            val audDeferred = async(Dispatchers.IO) { mediaStore.scanAudios() }
            val docDeferred = async(Dispatchers.IO) { mediaStore.scanDocuments() }

            val images    = imgDeferred.await()
            val videos    = vidDeferred.await()
            val audios    = audDeferred.await()
            val documents = docDeferred.await()

            val all = images + videos + audios + documents
            all.forEach { file ->
                val key = file.uri?.toString() ?: file.path
                if (key.isNotEmpty() && seenUris.add(key)) {
                    accumulated += file
                    if (file.path.isNotEmpty()) seenPaths.add(file.path)
                }
            }

            mediaStoreCount = accumulated.size

            progress = progress.copy(
                scannedCount  = accumulated.size,
                imageCount    = accumulated.count { it.category == FileCategory.IMAGE },
                videoCount    = accumulated.count { it.category == FileCategory.VIDEO },
                audioCount    = accumulated.count { it.category == FileCategory.AUDIO },
                documentCount = accumulated.count { it.category == FileCategory.DOCUMENT }
            )
            send(Pair(progress, accumulated.toList()))
        }

        // -- 2단계: 파일시스템 OEM 휴지통 순회 (배치 emit) --
        val fsStartCount = accumulated.size
        var fsAddedCount = 0
        fileSystem.scanAll { file ->
            val pathKey = file.path
            if (pathKey.isNotEmpty() && seenPaths.add(pathKey)) {
                accumulated += file

                progress = progress.copy(
                    scannedCount  = accumulated.size,
                    imageCount    = if (file.category == FileCategory.IMAGE)    progress.imageCount    + 1 else progress.imageCount,
                    videoCount    = if (file.category == FileCategory.VIDEO)    progress.videoCount    + 1 else progress.videoCount,
                    audioCount    = if (file.category == FileCategory.AUDIO)    progress.audioCount    + 1 else progress.audioCount,
                    documentCount = if (file.category == FileCategory.DOCUMENT) progress.documentCount + 1 else progress.documentCount
                )

                fsAddedCount++
                if (fsAddedCount % FS_EMIT_INTERVAL == 0) {
                    send(Pair(progress, accumulated.toList()))
                }
            }
        }
        val fsCount = accumulated.size - fsStartCount

        // -- 스캔 완료 → 경고 메시지 생성 --
        val warnings = buildList {
            if (!fileSystem.hasFullAccess) {
                add("⚠️ '전체 파일 접근' 권한 미허용 — 심층 스캔이 제한됩니다. 설정에서 권한을 허용하면 더 많은 파일을 찾을 수 있습니다.")
            }
            if (mediaStoreCount == 0 && fsCount == 0) {
                add("휴지통에서 삭제된 파일을 찾지 못했습니다. '심층 스캔'으로 디스크에서 직접 복구를 시도하세요.")
            }
            if (mediaStoreCount == 0) {
                add("MediaStore 휴지통에서 파일을 찾지 못했습니다. 갤러리 앱의 '최근 삭제' 폴더를 확인해보세요.")
            }
        }

        // 최종 emit + 완료 플래그
        send(Pair(
            progress.copy(isFinished = true, warnings = warnings),
            accumulated.toList()
        ))
    }.flowOn(Dispatchers.IO)

    /**
     * [v1.4] 심층 디스크 스캔 (루트 권한 필요)
     *
     * 기존 scanAll()과 독립적으로 실행됩니다.
     * Raw 블록 디바이스를 직접 스캔하여 삭제된 파일을 카빙합니다.
     *
     * @param existingFiles 기존 스캔 결과 (중복 방지용)
     * @return 심층 스캔 진행률 + 발견 파일
     */
    fun deepScan(existingFiles: List<RecoverableFile> = emptyList()): Flow<Pair<ScanProgress, List<RecoverableFile>>>? {
        val ds = rawDisk ?: return null

        val existingPaths = existingFiles.mapNotNull { it.path.takeIf { p -> p.isNotEmpty() } }.toSet()

        return channelFlow {
            ds.scan(existingPaths).collect { result ->
                send(Pair(result.progress, result.files))
            }
        }.flowOn(Dispatchers.IO)
    }
}
