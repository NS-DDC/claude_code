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
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.channelFlow
import kotlinx.coroutines.flow.flowOn

/**
 * 3가지 스캔 소스를 병렬로 실행하고 Flow로 실시간 진행 상황을 방출합니다.
 *
 * [변경 사항]
 * - scanOthers() 추가: APK, RAR, DB 등 기타 파일 스캔
 * - ScanProgress에 otherCount 추가
 * - ImageStore 5채널 병렬 쿼리 (images, videos, audios, documents, others)
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

        // -- 1단계: MediaStore 5채널 병렬 쿼리 --
        coroutineScope {
            val imgDeferred    = async(Dispatchers.IO) { mediaStore.scanImages() }
            val vidDeferred    = async(Dispatchers.IO) { mediaStore.scanVideos() }
            val audDeferred    = async(Dispatchers.IO) { mediaStore.scanAudios() }
            val docDeferred    = async(Dispatchers.IO) { mediaStore.scanDocuments() }
            val otherDeferred  = async(Dispatchers.IO) { mediaStore.scanOthers() }

            val images    = imgDeferred.await()
            val videos    = vidDeferred.await()
            val audios    = audDeferred.await()
            val documents = docDeferred.await()
            val others    = otherDeferred.await()

            val all = images + videos + audios + documents + others
            all.forEach { file ->
                val key = file.uri?.toString() ?: file.path
                if (key.isNotEmpty() && seenUris.add(key)) {
                    accumulated += file
                    if (file.path.isNotEmpty()) seenPaths.add(file.path)
                }
            }

            progress = buildProgress(accumulated, isFinished = false)
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
            progress = buildProgress(accumulated, isFinished = false)
            send(Pair(progress, accumulated.toList()))
        }

        // -- 3단계: 파일 시스템 순회 (배치 emit) --
        var fsAddedCount = 0
        fileSystem.scanAll { file ->
            val pathKey = file.path
            if (pathKey.isNotEmpty() && seenPaths.add(pathKey)) {
                accumulated += file

                fsAddedCount++
                if (fsAddedCount % FS_EMIT_INTERVAL == 0) {
                    progress = buildProgress(accumulated, isFinished = false)
                    send(Pair(progress, accumulated.toList()))
                }
            }
        }

        // 최종 emit + 완료 플래그
        send(Pair(buildProgress(accumulated, isFinished = true), accumulated.toList()))
    }.flowOn(Dispatchers.IO)

    private fun buildProgress(files: List<RecoverableFile>, isFinished: Boolean) = ScanProgress(
        scannedCount  = files.size,
        imageCount    = files.count { it.category == FileCategory.IMAGE },
        videoCount    = files.count { it.category == FileCategory.VIDEO },
        audioCount    = files.count { it.category == FileCategory.AUDIO },
        documentCount = files.count { it.category == FileCategory.DOCUMENT },
        otherCount    = files.count { it.category == FileCategory.OTHER },
        isFinished    = isFinished
    )
}
