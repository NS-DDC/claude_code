package com.filerecovery.data.repository

import com.filerecovery.data.datasource.FileSystemDataSource
import com.filerecovery.data.datasource.MediaStoreDataSource
import com.filerecovery.data.datasource.ThumbnailCacheDataSource
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
 * 3가지 스캔 소스를 병렬로 실행하고 Flow로 실시간 진행 상황을 방출합니다.
 *
 * [수정 사항]
 * - ✅ 스캔 완료 시 경고 메시지(warnings) 생성 — 권한 부족 등 사용자 피드백
 * - channelFlow 사용 — withContext 내부에서 안전하게 send 가능
 * - Uri 기반 중복 제거 (path가 빈 문자열인 MediaStore 결과 대응)
 * - 파일 시스템 스캔 시 일정 간격으로만 emit (O(n²) → O(n) 메모리 최적화)
 */
class ScanRepository(
    private val mediaStore: MediaStoreDataSource,
    private val thumbnailCache: ThumbnailCacheDataSource,
    private val fileSystem: FileSystemDataSource
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

        // -- 2단계: 썸네일 캐시 스캔 --
        coroutineScope {
            val thumbFiles = async(Dispatchers.IO) { thumbnailCache.scanThumbnailCaches() }.await()

            val newThumbs = thumbFiles.filter { file ->
                val pathKey = file.path
                val uriKey  = file.uri?.toString() ?: ""
                pathKey.isNotEmpty() && seenPaths.add(pathKey) &&
                    (uriKey.isEmpty() || seenUris.add(uriKey))
            }

            accumulated += newThumbs
            progress = progress.copy(
                scannedCount = accumulated.size,
                imageCount   = progress.imageCount + newThumbs.size
            )
            send(Pair(progress, accumulated.toList()))
        }

        // -- 3단계: 파일 시스템 순회 (배치 emit) --
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
                add("휴지통에서 삭제된 파일을 찾지 못했습니다. 파일이 완전 삭제된 경우 복구가 불가능할 수 있습니다.")
            }
            if (mediaStoreCount == 0) {
                add("MediaStore 휴지통(IS_TRASHED)에서 파일을 찾지 못했습니다. 갤러리 '최근 삭제' 폴더를 확인해보세요.")
            }
        }

        // 최종 emit + 완료 플래그
        send(Pair(
            progress.copy(isFinished = true, warnings = warnings),
            accumulated.toList()
        ))
    }.flowOn(Dispatchers.IO)
}
