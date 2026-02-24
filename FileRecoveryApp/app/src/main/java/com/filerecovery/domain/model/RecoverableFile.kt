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
    val headerIntact: Boolean = false
    // ✅ FIX: isSelected 제거 — UI 상태는 Composable 쪽에서 관리 (기존 dead code)
)

data class ScanProgress(
    val scannedCount: Int = 0,
    val imageCount: Int = 0,
    val videoCount: Int = 0,
    val audioCount: Int = 0,
    val documentCount: Int = 0,
    val isFinished: Boolean = false,
    val warnings: List<String> = emptyList()   // ✅ 스캔 피드백 (권한 부족, 접근 거부 등)
)
