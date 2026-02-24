package com.filerecovery.util

import com.filerecovery.domain.model.RecoveryChance
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

/**
 * RecoveryAnalyzer 단위 테스트
 *
 * - calcChance() : 순수 Kotlin 로직 → JVM에서 직접 실행 가능
 * - calcHeaderFromPath() : 임시 파일 생성 후 Magic Number 검증
 */
class RecoveryAnalyzerTest {

    @get:Rule
    val tmpDir: TemporaryFolder = TemporaryFolder()

    // ──────────────────────────────────────────
    // calcChance 테스트
    // ──────────────────────────────────────────

    @Test
    fun `calcChance returns HIGH when header intact and size over 10KB`() {
        val result = RecoveryAnalyzer.calcChance(size = 100_000L, headerIntact = true)
        assertEquals(RecoveryChance.HIGH, result)
    }

    @Test
    fun `calcChance returns MEDIUM when header intact but size under 10KB`() {
        val result = RecoveryAnalyzer.calcChance(size = 5_000L, headerIntact = true)
        assertEquals(RecoveryChance.MEDIUM, result)
    }

    @Test
    fun `calcChance returns MEDIUM at exact 10KB boundary`() {
        // size > 10_240 이므로: 10_241=HIGH, 10_240=MEDIUM
        assertEquals(RecoveryChance.HIGH,   RecoveryAnalyzer.calcChance(10_241L, true))
        assertEquals(RecoveryChance.MEDIUM, RecoveryAnalyzer.calcChance(10_240L, true))
    }

    @Test
    fun `calcChance returns LOW when header not intact regardless of size`() {
        assertEquals(RecoveryChance.LOW, RecoveryAnalyzer.calcChance(size = 500_000L, headerIntact = false))
    }

    @Test
    fun `calcChance returns LOW when size is zero`() {
        assertEquals(RecoveryChance.LOW, RecoveryAnalyzer.calcChance(size = 0L, headerIntact = false))
    }

    @Test
    fun `calcChance returns LOW when size is zero even with intact header`() {
        // headerIntact true이지만 size 0 → MEDIUM (10KB 미만)
        assertEquals(RecoveryChance.MEDIUM, RecoveryAnalyzer.calcChance(size = 0L, headerIntact = true))
    }

    // ──────────────────────────────────────────
    // calcHeaderFromPath — JPEG
    // ──────────────────────────────────────────

    @Test
    fun `calcHeaderFromPath detects valid JPEG magic bytes`() {
        val file = writeTmpFile("photo.jpg",
            byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte(), 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
        )
        assertTrue(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    @Test
    fun `calcHeaderFromPath returns false for invalid JPEG magic bytes`() {
        val file = writeTmpFile("broken.jpg",
            byteArrayOf(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
        )
        assertFalse(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    // ──────────────────────────────────────────
    // calcHeaderFromPath — PNG
    // ──────────────────────────────────────────

    @Test
    fun `calcHeaderFromPath detects valid PNG magic bytes`() {
        val file = writeTmpFile("image.png",
            byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D)
        )
        assertTrue(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    // ──────────────────────────────────────────
    // calcHeaderFromPath — PDF
    // ──────────────────────────────────────────

    @Test
    fun `calcHeaderFromPath detects valid PDF magic bytes`() {
        val file = writeTmpFile("doc.pdf",
            byteArrayOf(0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x00, 0x00, 0x00, 0x00)
        )
        assertTrue(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    // ──────────────────────────────────────────
    // calcHeaderFromPath — MP4 (offset=4)
    // ──────────────────────────────────────────

    @Test
    fun `calcHeaderFromPath detects MP4 ftyp magic at offset 4`() {
        val bytes = ByteArray(12)
        // ftyp at offset 4
        bytes[4] = 0x66; bytes[5] = 0x74; bytes[6] = 0x79; bytes[7] = 0x70
        val file = writeTmpFile("video.mp4", bytes)
        assertTrue(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    @Test
    fun `calcHeaderFromPath returns false when MP4 magic is at offset 0`() {
        val bytes = ByteArray(12)
        // ftyp at wrong position (offset 0 instead of 4)
        bytes[0] = 0x66; bytes[1] = 0x74; bytes[2] = 0x79; bytes[3] = 0x70
        val file = writeTmpFile("video.mp4", bytes)
        assertFalse(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    // ──────────────────────────────────────────
    // calcHeaderFromPath — MKV (EBML, offset=0)
    // ──────────────────────────────────────────

    @Test
    fun `calcHeaderFromPath detects MKV EBML magic`() {
        val file = writeTmpFile("movie.mkv",
            byteArrayOf(0x1A, 0x45, 0xDF.toByte(), 0xA3.toByte(), 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
        )
        assertTrue(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    // ──────────────────────────────────────────
    // calcHeaderFromPath — MP3 (ID3)
    // ──────────────────────────────────────────

    @Test
    fun `calcHeaderFromPath detects MP3 ID3 magic`() {
        val file = writeTmpFile("song.mp3",
            byteArrayOf(0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
        )
        assertTrue(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    // ──────────────────────────────────────────
    // calcHeaderFromPath — DOCX/XLSX/PPTX (ZIP 기반)
    // ──────────────────────────────────────────

    @Test
    fun `calcHeaderFromPath detects DOCX PK zip magic`() {
        val file = writeTmpFile("report.docx",
            byteArrayOf(0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
        )
        assertTrue(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    // ──────────────────────────────────────────
    // calcHeaderFromPath — 미등록 확장자
    // ──────────────────────────────────────────

    @Test
    fun `calcHeaderFromPath returns false for unregistered extension`() {
        val file = writeTmpFile("file.xyz",
            byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte(), 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
        )
        assertFalse(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    // ──────────────────────────────────────────
    // calcHeaderFromPath — 파일 내용 부족
    // ──────────────────────────────────────────

    @Test
    fun `calcHeaderFromPath returns false when file is too short`() {
        val file = writeTmpFile("tiny.jpg", byteArrayOf(0xFF.toByte()))  // 1바이트만
        assertFalse(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    @Test
    fun `calcHeaderFromPath returns false for empty file`() {
        val file = writeTmpFile("empty.jpg", byteArrayOf())
        assertFalse(RecoveryAnalyzer.calcHeaderFromPath(file))
    }

    // ──────────────────────────────────────────
    // chanceLabel 테스트
    // ──────────────────────────────────────────

    @Test
    fun `chanceLabel returns correct Korean labels`() {
        assertEquals("복구 가능성 높음", RecoveryAnalyzer.chanceLabel(RecoveryChance.HIGH))
        assertEquals("복구 가능성 보통", RecoveryAnalyzer.chanceLabel(RecoveryChance.MEDIUM))
        assertEquals("복구 가능성 낮음", RecoveryAnalyzer.chanceLabel(RecoveryChance.LOW))
    }

    // ──────────────────────────────────────────
    // 헬퍼
    // ──────────────────────────────────────────

    private fun writeTmpFile(name: String, bytes: ByteArray): File {
        val ext = name.substringAfterLast('.', "")
        val base = name.substringBeforeLast('.')
        return tmpDir.newFile("${base}_test.$ext").also { it.writeBytes(bytes) }
    }
}
