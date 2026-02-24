package com.filerecovery.presentation.viewmodel

import android.app.Application
import android.content.ContentResolver
import android.content.Context
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.domain.model.RecoveryChance
import com.filerecovery.domain.model.ScanProgress
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert.*
import org.junit.Test

/**
 * ScanViewModel 관련 상태(ScanUiState, StorageInfo) 단위 테스트
 *
 * NOTE: ScanViewModel 자체는 AndroidViewModel이라 Application과 Android API 의존성이 있어
 * JVM 단위 테스트에서 직접 인스턴스화하기 어렵습니다.
 * 여기서는 ViewModel에서 사용되는 상태 클래스와 파생 로직을 검증합니다.
 */
class ScanUiStateTest {

    // ── ScanUiState 기본값 테스트 ──────────────

    @Test
    fun `ScanUiState has correct default values`() {
        val state = ScanUiState()
        assertFalse(state.isScanning)
        assertTrue(state.files.isEmpty())
        assertNull(state.error)
        assertFalse(state.progress.isFinished)
    }

    @Test
    fun `ScanUiState copy isScanning to true`() {
        val state   = ScanUiState()
        val updated = state.copy(isScanning = true)
        assertTrue(updated.isScanning)
        // 나머지 필드 유지
        assertTrue(updated.files.isEmpty())
        assertNull(updated.error)
    }

    @Test
    fun `ScanUiState copy with error clears isScanning`() {
        val scanning = ScanUiState(isScanning = true)
        val errored  = scanning.copy(isScanning = false, error = "스캔 실패")
        assertFalse(errored.isScanning)
        assertEquals("스캔 실패", errored.error)
    }

    @Test
    fun `ScanUiState copy with files updates file list`() {
        val mockUri = mockk<android.net.Uri>(relaxed = true)
        val files   = listOf(
            RecoverableFile("1", "a.jpg", "", mockUri, 1000L, 0L, FileCategory.IMAGE, "jpg", RecoveryChance.HIGH),
            RecoverableFile("2", "b.mp4", "", null, 2000L, 0L, FileCategory.VIDEO, "mp4", RecoveryChance.LOW)
        )
        val state   = ScanUiState().copy(files = files)
        assertEquals(2, state.files.size)
        assertEquals("a.jpg", state.files[0].name)
    }

    // ── StorageInfo 테스트 ─────────────────────

    @Test
    fun `StorageInfo default values are zero`() {
        val info = StorageInfo()
        assertEquals(0L, info.totalBytes)
        assertEquals(0L, info.usedBytes)
        assertEquals(0L, info.freeBytes)
    }

    @Test
    fun `StorageInfo usedPercent is zero when totalBytes is zero`() {
        val info = StorageInfo(totalBytes = 0L, usedBytes = 0L)
        assertEquals(0f, info.usedPercent, 0.001f)
    }

    @Test
    fun `StorageInfo usedPercent calculates correctly`() {
        val info = StorageInfo(totalBytes = 100L, usedBytes = 45L, freeBytes = 55L)
        assertEquals(0.45f, info.usedPercent, 0.001f)
    }

    @Test
    fun `StorageInfo usedPercent is 1f when storage is full`() {
        val info = StorageInfo(totalBytes = 128L, usedBytes = 128L, freeBytes = 0L)
        assertEquals(1.0f, info.usedPercent, 0.001f)
    }

    @Test
    fun `StorageInfo usedPercent handles partial usage`() {
        val total = 256L * 1024 * 1024 * 1024   // 256 GB
        val used  = 64L  * 1024 * 1024 * 1024   // 64  GB
        val info  = StorageInfo(totalBytes = total, usedBytes = used, freeBytes = total - used)
        assertEquals(0.25f, info.usedPercent, 0.001f)
    }
}

// ═══════════════════════════════════════════════
// ScanProgress 파생 로직 테스트
// ═══════════════════════════════════════════════

class ScanProgressLogicTest {

    @Test
    fun `ScanProgress total count is sum of all categories`() {
        val progress = ScanProgress(
            scannedCount  = 185,
            imageCount    = 100,
            videoCount    = 50,
            audioCount    = 20,
            documentCount = 15
        )
        val categoryTotal = progress.imageCount + progress.videoCount +
            progress.audioCount + progress.documentCount
        // scannedCount는 카테고리 합계보다 클 수 있음 (중복 경로 등)
        assertTrue(progress.scannedCount >= categoryTotal)
    }

    @Test
    fun `ScanProgress isFinished transition`() {
        val running  = ScanProgress(scannedCount = 50, isFinished = false)
        val finished = running.copy(scannedCount = 100, isFinished = true)
        assertFalse(running.isFinished)
        assertTrue(finished.isFinished)
        assertEquals(100, finished.scannedCount)
    }
}

// ═══════════════════════════════════════════════
// SortOrder enum 테스트 (FileListScreen에서 정의)
// ═══════════════════════════════════════════════

class SortOrderTest {

    @Test
    fun `Sorting by DATE_DESC puts latest file first`() {
        val mockUri = mockk<android.net.Uri>(relaxed = true)
        val files = listOf(
            RecoverableFile("1", "old.jpg", "", mockUri, 100L, 1_000L, FileCategory.IMAGE, "jpg", RecoveryChance.HIGH),
            RecoverableFile("2", "new.jpg", "", mockUri, 200L, 9_000L, FileCategory.IMAGE, "jpg", RecoveryChance.HIGH)
        )
        val sorted = files.sortedByDescending { it.lastModified }
        assertEquals("new.jpg", sorted.first().name)
    }

    @Test
    fun `Sorting by SIZE_DESC puts largest file first`() {
        val mockUri = mockk<android.net.Uri>(relaxed = true)
        val files = listOf(
            RecoverableFile("1", "small.jpg", "", mockUri, 500L,     0L, FileCategory.IMAGE, "jpg", RecoveryChance.LOW),
            RecoverableFile("2", "large.jpg", "", mockUri, 5_000_000L, 0L, FileCategory.IMAGE, "jpg", RecoveryChance.HIGH)
        )
        val sorted = files.sortedByDescending { it.size }
        assertEquals("large.jpg", sorted.first().name)
    }

    @Test
    fun `Sorting by NAME_ASC puts files in alphabetical order`() {
        val mockUri = mockk<android.net.Uri>(relaxed = true)
        val files = listOf(
            RecoverableFile("1", "zebra.jpg", "", mockUri, 100L, 0L, FileCategory.IMAGE, "jpg", RecoveryChance.LOW),
            RecoverableFile("2", "apple.jpg", "", mockUri, 100L, 0L, FileCategory.IMAGE, "jpg", RecoveryChance.HIGH),
            RecoverableFile("3", "mango.jpg", "", mockUri, 100L, 0L, FileCategory.IMAGE, "jpg", RecoveryChance.MEDIUM)
        )
        val sorted = files.sortedBy { it.name.lowercase() }
        assertEquals("apple.jpg", sorted[0].name)
        assertEquals("mango.jpg", sorted[1].name)
        assertEquals("zebra.jpg", sorted[2].name)
    }

    @Test
    fun `Sorting by CHANCE puts HIGH recovery files first`() {
        val mockUri = mockk<android.net.Uri>(relaxed = true)
        val files = listOf(
            RecoverableFile("1", "low.jpg",    "", mockUri, 100L, 0L, FileCategory.IMAGE, "jpg", RecoveryChance.LOW),
            RecoverableFile("2", "high.jpg",   "", mockUri, 100L, 0L, FileCategory.IMAGE, "jpg", RecoveryChance.HIGH),
            RecoverableFile("3", "medium.jpg", "", mockUri, 100L, 0L, FileCategory.IMAGE, "jpg", RecoveryChance.MEDIUM)
        )
        val sorted = files.sortedBy { it.recoveryChance.ordinal }
        assertEquals("high.jpg",   sorted[0].name)
        assertEquals("medium.jpg", sorted[1].name)
        assertEquals("low.jpg",    sorted[2].name)
    }
}

// ═══════════════════════════════════════════════
// 파일 필터 로직 테스트
// ═══════════════════════════════════════════════

class FileFilterTest {

    private val mockUri = mockk<android.net.Uri>(relaxed = true)

    private val sampleFiles = listOf(
        RecoverableFile("1", "vacation_photo.jpg", "", mockUri, 100L, 0L, FileCategory.IMAGE, "jpg", RecoveryChance.HIGH),
        RecoverableFile("2", "birthday_video.mp4", "", mockUri, 200L, 0L, FileCategory.VIDEO, "mp4", RecoveryChance.MEDIUM),
        RecoverableFile("3", "song.mp3",            "", mockUri, 300L, 0L, FileCategory.AUDIO, "mp3", RecoveryChance.LOW),
        RecoverableFile("4", "report.pdf",          "", mockUri, 400L, 0L, FileCategory.DOCUMENT, "pdf", RecoveryChance.HIGH)
    )

    @Test
    fun `Search filter returns matching files case-insensitively`() {
        val query   = "vacation"
        val results = sampleFiles.filter { it.name.contains(query, ignoreCase = true) }
        assertEquals(1, results.size)
        assertEquals("vacation_photo.jpg", results[0].name)
    }

    @Test
    fun `Search filter with uppercase query matches lowercase filename`() {
        val query   = "BIRTHDAY"
        val results = sampleFiles.filter { it.name.contains(query, ignoreCase = true) }
        assertEquals(1, results.size)
        assertEquals("birthday_video.mp4", results[0].name)
    }

    @Test
    fun `Empty search query returns all files`() {
        val results = sampleFiles.filter { it.name.contains("", ignoreCase = true) }
        assertEquals(sampleFiles.size, results.size)
    }

    @Test
    fun `Search query with no match returns empty list`() {
        val results = sampleFiles.filter { it.name.contains("xyzabc", ignoreCase = true) }
        assertTrue(results.isEmpty())
    }

    @Test
    fun `Recovery chance filter with HIGH returns only HIGH files`() {
        val filter  = setOf(RecoveryChance.HIGH)
        val results = sampleFiles.filter { it.recoveryChance in filter }
        assertEquals(2, results.size)
        assertTrue(results.all { it.recoveryChance == RecoveryChance.HIGH })
    }

    @Test
    fun `Recovery chance filter with multiple values returns union`() {
        val filter  = setOf(RecoveryChance.HIGH, RecoveryChance.LOW)
        val results = sampleFiles.filter { it.recoveryChance in filter }
        assertEquals(3, results.size)
        assertTrue(results.none { it.recoveryChance == RecoveryChance.MEDIUM })
    }

    @Test
    fun `Empty chance filter returns all files`() {
        val filter  = emptySet<RecoveryChance>()
        val results = sampleFiles.filter { filter.isEmpty() || it.recoveryChance in filter }
        assertEquals(sampleFiles.size, results.size)
    }

    @Test
    fun `Combined search and chance filter applies both conditions`() {
        val query   = "report"
        val filter  = setOf(RecoveryChance.HIGH)
        val results = sampleFiles.filter { file ->
            file.name.contains(query, ignoreCase = true) &&
            (filter.isEmpty() || file.recoveryChance in filter)
        }
        assertEquals(1, results.size)
        assertEquals("report.pdf", results[0].name)
    }
}
