package com.filerecovery.data.repository

import com.filerecovery.data.datasource.FileSystemDataSource
import com.filerecovery.data.datasource.MediaStoreDataSource
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
 * 스캔 파이프라인 — MediaStore + 파일시스템(OEM 휴지통) 2단계
 *
 * [v1.3.2 변경]
 * ✅ ThumbnailCacheDataSource 제거
 *    → .thumbnails는 시스템 캐시이며 사용자 파일이 아님
 *    → 정상 사진의 썸네일이 "복구 대상"으로 표시되는 오탐 원인이었음
 *
 * [스캔 순서]
 * 1단계: MediaStore IS_TRASHED 4채널 병렬 (사진/동영상/음악/문서)
 *        → 갤러리·파일관리자에서 삭제한 파일 (가장 신뢰도 높음)
 *        → RELATIVE_PATH 필터로 앱 임시데이터(카톡/인스타 등) 자동 제외
 * 2단계: 파일시스템 OEM 휴지통 디렉토리 순회
 *        → 삼성/샤오미/OPPO/화웨이 등 전용 Trash 폴더
 */
class ScanRepository(
    private val mediaStore: MediaStoreDataSource,
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
                add("휴지통에서 삭제된 파일을 찾지 못했습니다. 파일이 완전 삭제(30일 경과)된 경우 복구가 불가능할 수 있습니다.")
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
}
