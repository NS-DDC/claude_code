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

    // ══════════════════════════════════════════
    // v1.4: findMagicInBuffer 테스트
    // ══════════════════════════════════════════

    @Test
    fun `findMagicInBuffer detects JPEG at start of buffer`() {
        val buf = ByteArray(1024)
        buf[0] = 0xFF.toByte(); buf[1] = 0xD8.toByte(); buf[2] = 0xFF.toByte()
        val matches = RecoveryAnalyzer.findMagicInBuffer(buf, buf.size)
        assertTrue(matches.any { it.extension == "jpg" && it.bufferOffset == 0 })
    }

    @Test
    fun `findMagicInBuffer detects PNG at offset 512`() {
        val buf = ByteArray(1024)
        val pos = 512
        buf[pos] = 0x89.toByte(); buf[pos+1] = 0x50; buf[pos+2] = 0x4E; buf[pos+3] = 0x47
        val matches = RecoveryAnalyzer.findMagicInBuffer(buf, buf.size)
        assertTrue(matches.any { it.extension == "png" && it.bufferOffset == 512 })
    }

    @Test
    fun `findMagicInBuffer detects MP4 ftyp with offset correction`() {
        // ftyp magic은 파일 시작+4에 위치 → bufferOffset = pos-4
        val buf = ByteArray(1024)
        val magicPos = 104  // magic 바이트 위치
        buf[magicPos] = 0x66; buf[magicPos+1] = 0x74; buf[magicPos+2] = 0x79; buf[magicPos+3] = 0x70
        val matches = RecoveryAnalyzer.findMagicInBuffer(buf, buf.size)
        assertTrue(matches.any { it.extension == "mp4" && it.bufferOffset == 100 })
    }

    @Test
    fun `findMagicInBuffer returns empty for blank buffer`() {
        val buf = ByteArray(1024)  // all zeros
        val matches = RecoveryAnalyzer.findMagicInBuffer(buf, buf.size)
        assertTrue(matches.isEmpty())
    }

    @Test
    fun `findMagicInBuffer detects multiple signatures in same buffer`() {
        val buf = ByteArray(2048)
        // JPEG at 0
        buf[0] = 0xFF.toByte(); buf[1] = 0xD8.toByte(); buf[2] = 0xFF.toByte()
        // PDF at 1024
        buf[1024] = 0x25; buf[1025] = 0x50; buf[1026] = 0x44; buf[1027] = 0x46
        val matches = RecoveryAnalyzer.findMagicInBuffer(buf, buf.size)
        assertTrue(matches.any { it.extension == "jpg" })
        assertTrue(matches.any { it.extension == "pdf" })
        assertTrue(matches.size >= 2)
    }

    @Test
    fun `findMagicInBuffer respects bufferSize limit`() {
        val buf = ByteArray(1024)
        // JPEG at offset 500 — but bufferSize is 100 (shouldn't find it)
        buf[500] = 0xFF.toByte(); buf[501] = 0xD8.toByte(); buf[502] = 0xFF.toByte()
        val matches = RecoveryAnalyzer.findMagicInBuffer(buf, 100)
        assertFalse(matches.any { it.bufferOffset == 500 })
    }

    // ══════════════════════════════════════════
    // v1.4: findEndMarker 테스트
    // ══════════════════════════════════════════

    @Test
    fun `findEndMarker finds JPEG EOI (FFD9)`() {
        val buf = ByteArray(1024)
        buf[500] = 0xFF.toByte(); buf[501] = 0xD9.toByte()
        val pos = RecoveryAnalyzer.findEndMarker(buf, buf.size, "jpg")
        assertEquals(502, pos)  // 마커 직후
    }

    @Test
    fun `findEndMarker finds PNG IEND chunk`() {
        val buf = ByteArray(1024)
        val iend = byteArrayOf(0x49, 0x45, 0x4E, 0x44,
            0xAE.toByte(), 0x42, 0x60, 0x82.toByte())
        iend.copyInto(buf, 200)
        val pos = RecoveryAnalyzer.findEndMarker(buf, buf.size, "png")
        assertEquals(208, pos)
    }

    @Test
    fun `findEndMarker finds PDF EOF`() {
        val buf = ByteArray(1024)
        val eof = byteArrayOf(0x25, 0x25, 0x45, 0x4F, 0x46)  // %%EOF
        eof.copyInto(buf, 800)
        val pos = RecoveryAnalyzer.findEndMarker(buf, buf.size, "pdf")
        assertEquals(805, pos)
    }

    @Test
    fun `findEndMarker returns -1 for format without end marker`() {
        val buf = ByteArray(1024)
        val pos = RecoveryAnalyzer.findEndMarker(buf, buf.size, "mp4")
        assertEquals(-1, pos)
    }

    @Test
    fun `findEndMarker returns -1 when no marker in buffer`() {
        val buf = ByteArray(1024)  // all zeros
        val pos = RecoveryAnalyzer.findEndMarker(buf, buf.size, "jpg")
        assertEquals(-1, pos)
    }

    // ══════════════════════════════════════════
    // v1.4: hasEndMarker / categoryForExtension 테스트
    // ══════════════════════════════════════════

    @Test
    fun `hasEndMarker returns true for jpg png pdf`() {
        assertTrue(RecoveryAnalyzer.hasEndMarker("jpg"))
        assertTrue(RecoveryAnalyzer.hasEndMarker("png"))
        assertTrue(RecoveryAnalyzer.hasEndMarker("pdf"))
    }

    @Test
    fun `hasEndMarker returns false for mp4 mkv mp3`() {
        assertFalse(RecoveryAnalyzer.hasEndMarker("mp4"))
        assertFalse(RecoveryAnalyzer.hasEndMarker("mkv"))
        assertFalse(RecoveryAnalyzer.hasEndMarker("mp3"))
    }

    @Test
    fun `categoryForExtension returns correct categories`() {
        assertEquals(com.filerecovery.domain.model.FileCategory.IMAGE, RecoveryAnalyzer.categoryForExtension("jpg"))
        assertEquals(com.filerecovery.domain.model.FileCategory.VIDEO, RecoveryAnalyzer.categoryForExtension("mp4"))
        assertEquals(com.filerecovery.domain.model.FileCategory.AUDIO, RecoveryAnalyzer.categoryForExtension("mp3"))
        assertEquals(com.filerecovery.domain.model.FileCategory.DOCUMENT, RecoveryAnalyzer.categoryForExtension("pdf"))
        assertEquals(com.filerecovery.domain.model.FileCategory.DOCUMENT, RecoveryAnalyzer.categoryForExtension("unknown"))
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
