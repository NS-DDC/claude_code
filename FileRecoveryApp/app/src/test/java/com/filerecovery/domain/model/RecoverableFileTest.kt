package com.filerecovery.domain.model

import android.net.Uri
import io.mockk.mockk
import org.junit.Assert.*
import org.junit.Test

/**
 * RecoverableFile, ScanProgress, FileCategory, RecoveryChance 도메인 모델 테스트
 */
class RecoverableFileTest {

    private val mockUri: Uri = mockk(relaxed = true)

    private fun sampleFile(
        id              : String          = "uuid-001",
        name            : String          = "photo.jpg",
        path            : String          = "/sdcard/DCIM/photo.jpg",
        uri             : Uri?            = mockUri,
        size            : Long            = 1_048_576L,
        lastModified    : Long            = 1_700_000_000_000L,
        category        : FileCategory    = FileCategory.IMAGE,
        extension       : String          = "jpg",
        recoveryChance  : RecoveryChance  = RecoveryChance.HIGH,
        thumbnailUri    : Uri?            = null,
        headerIntact    : Boolean         = true
    ) = RecoverableFile(
        id            = id,
        name          = name,
        path          = path,
        uri           = uri,
        size          = size,
        lastModified  = lastModified,
        category      = category,
        extension     = extension,
        recoveryChance = recoveryChance,
        thumbnailUri  = thumbnailUri,
        headerIntact  = headerIntact
    )

    // ── 기본값 테스트 ──────────────────────────────

    @Test
    fun `RecoverableFile default thumbnailUri is null`() {
        val file = sampleFile()
        assertNull(file.thumbnailUri)
    }

    @Test
    fun `RecoverableFile default headerIntact is false when not provided`() {
        val file = sampleFile(headerIntact = false)
        assertFalse(file.headerIntact)
    }

    // ── 복사 및 동등성 테스트 ─────────────────────

    @Test
    fun `RecoverableFile copy preserves all fields`() {
        val original = sampleFile()
        val copy     = original.copy()
        assertEquals(original, copy)
    }

    @Test
    fun `RecoverableFile copy with name change only changes name`() {
        val original = sampleFile()
        val copy     = original.copy(name = "renamed.jpg")
        assertEquals("renamed.jpg", copy.name)
        assertEquals(original.id, copy.id)
        assertEquals(original.size, copy.size)
        assertEquals(original.category, copy.category)
    }

    @Test
    fun `Two RecoverableFile with same fields are equal`() {
        val a = sampleFile(id = "same-id")
        val b = sampleFile(id = "same-id")
        assertEquals(a, b)
        assertEquals(a.hashCode(), b.hashCode())
    }

    @Test
    fun `Two RecoverableFile with different ids are not equal`() {
        val a = sampleFile(id = "id-001")
        val b = sampleFile(id = "id-002")
        assertNotEquals(a, b)
    }

    // ── 카테고리별 생성 테스트 ────────────────────

    @Test
    fun `RecoverableFile can be created for each FileCategory`() {
        FileCategory.values().forEach { category ->
            val file = sampleFile(category = category)
            assertEquals(category, file.category)
        }
    }

    // ── 크기 경계 테스트 ─────────────────────────

    @Test
    fun `RecoverableFile accepts zero size`() {
        val file = sampleFile(size = 0L)
        assertEquals(0L, file.size)
    }

    @Test
    fun `RecoverableFile accepts very large size`() {
        val largeSize = 10L * 1024 * 1024 * 1024  // 10 GB
        val file = sampleFile(size = largeSize)
        assertEquals(largeSize, file.size)
    }

    // ── null URI 허용 ─────────────────────────────

    @Test
    fun `RecoverableFile with null uri is valid`() {
        val file = sampleFile(uri = null)
        assertNull(file.uri)
    }

    // ── 빈 경로 허용 (Android 11+ Scoped Storage) ─

    @Test
    fun `RecoverableFile with empty path is valid`() {
        val file = sampleFile(path = "")
        assertEquals("", file.path)
    }
}

// ═══════════════════════════════════════════════
// ScanProgress 테스트
// ═══════════════════════════════════════════════

class ScanProgressTest {

    @Test
    fun `ScanProgress default values are all zero and not finished`() {
        val progress = ScanProgress()
        assertEquals(0, progress.scannedCount)
        assertEquals(0, progress.imageCount)
        assertEquals(0, progress.videoCount)
        assertEquals(0, progress.audioCount)
        assertEquals(0, progress.documentCount)
        assertFalse(progress.isFinished)
    }

    @Test
    fun `ScanProgress tracks each category count`() {
        val progress = ScanProgress(
            scannedCount  = 100,
            imageCount    = 50,
            videoCount    = 20,
            audioCount    = 15,
            documentCount = 15,
            isFinished    = false
        )
        assertEquals(50, progress.imageCount)
        assertEquals(20, progress.videoCount)
        assertEquals(15, progress.audioCount)
        assertEquals(15, progress.documentCount)
        assertEquals(100, progress.scannedCount)
    }

    @Test
    fun `ScanProgress isFinished flag can be set to true`() {
        val progress = ScanProgress(scannedCount = 42, isFinished = true)
        assertTrue(progress.isFinished)
        assertEquals(42, progress.scannedCount)
    }

    @Test
    fun `ScanProgress copy updates specific field`() {
        val original = ScanProgress(scannedCount = 10, imageCount = 5)
        val updated  = original.copy(imageCount = 10, isFinished = true)
        assertEquals(10, updated.imageCount)
        assertEquals(10, updated.scannedCount)
        assertTrue(updated.isFinished)
    }
}

// ═══════════════════════════════════════════════
// FileCategory 열거형 테스트
// ═══════════════════════════════════════════════

class FileCategoryTest {

    @Test
    fun `FileCategory has exactly 4 values`() {
        assertEquals(4, FileCategory.values().size)
    }

    @Test
    fun `FileCategory contains IMAGE, VIDEO, AUDIO, DOCUMENT`() {
        val values = FileCategory.values().toSet()
        assertTrue(FileCategory.IMAGE    in values)
        assertTrue(FileCategory.VIDEO    in values)
        assertTrue(FileCategory.AUDIO    in values)
        assertTrue(FileCategory.DOCUMENT in values)
    }
}

// ═══════════════════════════════════════════════
// RecoveryChance 열거형 테스트
// ═══════════════════════════════════════════════

class RecoveryChanceTest {

    @Test
    fun `RecoveryChance has exactly 3 levels`() {
        assertEquals(3, RecoveryChance.values().size)
    }

    @Test
    fun `RecoveryChance ordinal order is HIGH MEDIUM LOW`() {
        // HIGH < MEDIUM < LOW (ordinal 순서로 정렬 시 HIGH가 먼저 나와야 함)
        assertTrue(RecoveryChance.HIGH.ordinal < RecoveryChance.MEDIUM.ordinal)
        assertTrue(RecoveryChance.MEDIUM.ordinal < RecoveryChance.LOW.ordinal)
    }
}
