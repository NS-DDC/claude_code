package com.filerecovery.domain.model

import android.net.Uri

enum class FileCategory {
    IMAGE, VIDEO, AUDIO, DOCUMENT
}

enum class RecoveryChance {
    HIGH, MEDIUM, LOW
}

data class RecoverableFile(
    val id: String,
    val name: String,
    val path: String,          // 파일 절대 경로 (Android 11+에서는 빈 문자열일 수 있음)
    val uri: Uri?,             // Content URI (MediaStore) 또는 file:// URI
    val size: Long,            // bytes
    val lastModified: Long,    // epoch ms
    val category: FileCategory,
    val extension: String,
    val recoveryChance: RecoveryChance,
    val thumbnailUri: Uri? = null,
    val headerIntact: Boolean = false,
    // ✅ v1.4: 디스크 카빙 관련 필드
    val isCarved: Boolean = false,       // true = Raw 디스크 카빙으로 발견된 파일
    val diskOffset: Long = 0L            // 디스크 상 시작 오프셋 (바이트)
)

data class ScanProgress(
    val scannedCount: Int = 0,
    val imageCount: Int = 0,
    val videoCount: Int = 0,
    val audioCount: Int = 0,
    val documentCount: Int = 0,
    val isFinished: Boolean = false,
    val warnings: List<String> = emptyList(),  // ✅ 스캔 피드백 (권한 부족, 접근 거부 등)
    // ✅ v1.4: 심층 스캔(디스크 카빙) 진행률
    val deepScanProgress: Float = 0f,          // 0.0 ~ 1.0
    val deepScanScannedMB: Long = 0L,          // 스캔 완료 MB
    val deepScanTotalMB: Long = 0L,            // 전체 디스크 MB
    val isDeepScanning: Boolean = false         // 심층 스캔 진행 중 여부
)
