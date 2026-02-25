package com.filerecovery.util

import android.content.Context
import android.net.Uri
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoveryChance
import java.io.File

/**
 * 파일 헤더 시그니처(Magic Number)를 분석해 복구 가능성을 계산합니다.
 *
 * [수정 내역]
 * - MKV: EBML magic (1A 45 DF A3) at offset 0 — 기존 ftyp offset 4 오류 수정
 * - MP3: ID3 태그 (49 44 33) 시그니처 추가
 * - bytesRead 기반 체크로 uninitialized byte 오탐 방지
 * - 시그니처 미등록 확장자 → false (보수적 판단)
 * - [v1.4] findMagicInBuffer() + 끝 마커 탐지 — Raw 디스크 카빙 지원
 */
object RecoveryAnalyzer {

    data class Signature(val magic: ByteArray, val offset: Int = 0)

    /**
     * Raw 디스크 버퍼에서 발견된 Magic Number 매치 결과
     */
    data class MagicMatch(
        val extension: String,         // 확장자 (jpg, png, mp4 등)
        val category: FileCategory,    // 파일 카테고리
        val bufferOffset: Int          // 버퍼 내 시작 오프셋 (magic.offset 보정 후)
    )

    val MAGIC_SIGNATURES: Map<String, Signature> = mapOf(
        "jpg"  to Signature(byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte())),
        "jpeg" to Signature(byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte())),
        "png"  to Signature(byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47)),
        "webp" to Signature(byteArrayOf(0x52, 0x49, 0x46, 0x46)),           // RIFF
        "gif"  to Signature(byteArrayOf(0x47, 0x49, 0x46, 0x38)),           // GIF8
        "bmp"  to Signature(byteArrayOf(0x42, 0x4D)),                       // BM
        "mp4"  to Signature(byteArrayOf(0x66, 0x74, 0x79, 0x70), offset = 4), // ftyp
        "mov"  to Signature(byteArrayOf(0x66, 0x74, 0x79, 0x70), offset = 4),
        "3gp"  to Signature(byteArrayOf(0x66, 0x74, 0x79, 0x70), offset = 4),
        // ✅ FIX: MKV EBML magic at offset 0
        "mkv"  to Signature(byteArrayOf(0x1A, 0x45, 0xDF.toByte(), 0xA3.toByte())),
        "webm" to Signature(byteArrayOf(0x1A, 0x45, 0xDF.toByte(), 0xA3.toByte())),
        // ✅ FIX: MP3 ID3 태그 시그니처 추가
        "mp3"  to Signature(byteArrayOf(0x49, 0x44, 0x33)),                 // ID3
        "wav"  to Signature(byteArrayOf(0x52, 0x49, 0x46, 0x46)),           // RIFF
        "flac" to Signature(byteArrayOf(0x66, 0x4C, 0x61, 0x43)),           // fLaC
        "ogg"  to Signature(byteArrayOf(0x4F, 0x67, 0x67, 0x53)),           // OggS
        "pdf"  to Signature(byteArrayOf(0x25, 0x50, 0x44, 0x46)),           // %PDF
        "zip"  to Signature(byteArrayOf(0x50, 0x4B, 0x03, 0x04)),
        "docx" to Signature(byteArrayOf(0x50, 0x4B, 0x03, 0x04)),
        "xlsx" to Signature(byteArrayOf(0x50, 0x4B, 0x03, 0x04)),
        "pptx" to Signature(byteArrayOf(0x50, 0x4B, 0x03, 0x04)),
    )

    /**
     * 확장자 → 카테고리 매핑
     */
    private val EXT_CATEGORY: Map<String, FileCategory> = mapOf(
        "jpg" to FileCategory.IMAGE, "jpeg" to FileCategory.IMAGE,
        "png" to FileCategory.IMAGE, "webp" to FileCategory.IMAGE,
        "gif" to FileCategory.IMAGE, "bmp" to FileCategory.IMAGE,
        "mp4" to FileCategory.VIDEO, "mov" to FileCategory.VIDEO,
        "3gp" to FileCategory.VIDEO, "mkv" to FileCategory.VIDEO,
        "webm" to FileCategory.VIDEO,
        "mp3" to FileCategory.AUDIO, "wav" to FileCategory.AUDIO,
        "flac" to FileCategory.AUDIO, "ogg" to FileCategory.AUDIO,
        "pdf" to FileCategory.DOCUMENT, "zip" to FileCategory.DOCUMENT,
        "docx" to FileCategory.DOCUMENT, "xlsx" to FileCategory.DOCUMENT,
        "pptx" to FileCategory.DOCUMENT
    )

    /**
     * 카빙 시 중복 방지: 동일 magic을 가진 확장자 중 대표 확장자만 사용
     * (jpg/jpeg, mp4/mov/3gp, mkv/webm, wav/webp, zip/docx/xlsx/pptx)
     */
    val CARVING_SIGNATURES: Map<String, Signature> = mapOf(
        "jpg"  to MAGIC_SIGNATURES["jpg"]!!,
        "png"  to MAGIC_SIGNATURES["png"]!!,
        "gif"  to MAGIC_SIGNATURES["gif"]!!,
        "bmp"  to MAGIC_SIGNATURES["bmp"]!!,
        "mp4"  to MAGIC_SIGNATURES["mp4"]!!,   // ftyp: mp4/mov/3gp 대표
        "mkv"  to MAGIC_SIGNATURES["mkv"]!!,   // EBML: mkv/webm 대표
        "mp3"  to MAGIC_SIGNATURES["mp3"]!!,
        "wav"  to MAGIC_SIGNATURES["wav"]!!,   // RIFF (WAV only — WEBP는 별도 판별 필요)
        "flac" to MAGIC_SIGNATURES["flac"]!!,
        "ogg"  to MAGIC_SIGNATURES["ogg"]!!,
        "pdf"  to MAGIC_SIGNATURES["pdf"]!!,
        "zip"  to MAGIC_SIGNATURES["zip"]!!,   // PK: zip/docx/xlsx/pptx 대표
    )

    /**
     * 끝 마커(EOF signature) 정의 — 카빙 파일 끝 탐지용
     */
    private val END_MARKERS: Map<String, ByteArray> = mapOf(
        "jpg"  to byteArrayOf(0xFF.toByte(), 0xD9.toByte()),        // JPEG EOI
        "png"  to byteArrayOf(0x49, 0x45, 0x4E, 0x44,              // IEND + CRC
                               0xAE.toByte(), 0x42, 0x60, 0x82.toByte()),
        "pdf"  to byteArrayOf(0x25, 0x25, 0x45, 0x4F, 0x46),      // %%EOF
    )

    /**
     * 최대 카빙 파일 크기 (끝 마커 없을 때 기본 상한)
     */
    val MAX_CARVE_SIZE: Map<String, Long> = mapOf(
        "jpg"  to 30L * 1024 * 1024,      // 30 MB
        "png"  to 30L * 1024 * 1024,      // 30 MB
        "gif"  to 20L * 1024 * 1024,      // 20 MB
        "bmp"  to 50L * 1024 * 1024,      // 50 MB
        "mp4"  to 500L * 1024 * 1024,     // 500 MB
        "mkv"  to 500L * 1024 * 1024,     // 500 MB
        "mp3"  to 50L * 1024 * 1024,      // 50 MB
        "wav"  to 100L * 1024 * 1024,     // 100 MB
        "flac" to 100L * 1024 * 1024,     // 100 MB
        "ogg"  to 50L * 1024 * 1024,      // 50 MB
        "pdf"  to 100L * 1024 * 1024,     // 100 MB
        "zip"  to 200L * 1024 * 1024,     // 200 MB
    )

    /** ContentResolver URI 기반 헤더 검증 (미리보기 on-demand 호출용) */
    fun isHeaderIntact(context: Context, uri: Uri, ext: String): Boolean {
        return try {
            context.contentResolver.openInputStream(uri)?.use { stream ->
                val buf = ByteArray(12)
                val bytesRead = stream.read(buf)
                if (bytesRead < 2) return@use false
                matchesSignature(buf, bytesRead, ext.lowercase())
            } ?: false
        } catch (_: Exception) {
            false
        }
    }

    /** File 경로 기반 헤더 검증 */
    fun calcHeaderFromPath(file: File): Boolean {
        return try {
            val buf = ByteArray(12)
            val bytesRead = file.inputStream().use { it.read(buf) }
            if (bytesRead < 2) return false
            matchesSignature(buf, bytesRead, file.extension.lowercase())
        } catch (_: Exception) {
            false
        }
    }

    private fun matchesSignature(buf: ByteArray, bytesRead: Int, ext: String): Boolean {
        val sig = MAGIC_SIGNATURES[ext]
            ?: return false  // ✅ FIX: 미등록 확장자 → false (보수적)

        val offset = sig.offset
        val magic  = sig.magic

        // ✅ FIX: bytesRead 기준 체크 (buf.size는 항상 12 → uninitialized 비교 방지)
        if (bytesRead < offset + magic.size) return false
        return magic.indices.all { i -> buf[offset + i] == magic[i] }
    }

    /**
     * [v1.4 — 디스크 카빙용]
     * Raw 버퍼 내에서 모든 Magic Number 매치 위치를 탐색합니다.
     *
     * CARVING_SIGNATURES (대표 확장자만)를 사용하여 중복 매치를 방지합니다.
     *
     * @param buffer 읽어들인 바이트 배열
     * @param bufferSize 실제 유효 바이트 수 (buffer.size보다 작을 수 있음)
     * @return 발견된 매치 목록 (bufferOffset 오름차순)
     */
    fun findMagicInBuffer(buffer: ByteArray, bufferSize: Int): List<MagicMatch> {
        val matches = mutableListOf<MagicMatch>()

        for (pos in 0 until bufferSize) {
            for ((ext, sig) in CARVING_SIGNATURES) {
                val magic = sig.magic
                val fileStart = pos - sig.offset  // 실제 파일 시작 위치

                // 파일 시작이 버퍼 범위 밖이면 스킵
                if (fileStart < 0) continue
                // magic이 버퍼를 초과하면 스킵
                if (pos + magic.size > bufferSize) continue

                // 바이트 비교
                var matched = true
                for (i in magic.indices) {
                    if (buffer[pos + i] != magic[i]) {
                        matched = false
                        break
                    }
                }
                if (matched) {
                    val category = EXT_CATEGORY[ext] ?: FileCategory.DOCUMENT
                    matches.add(MagicMatch(ext, category, fileStart))
                }
            }
        }

        return matches.sortedBy { it.bufferOffset }
    }

    /**
     * [v1.4 — 디스크 카빙용]
     * 끝 마커(EOF signature)를 버퍼에서 탐색합니다.
     *
     * @param buffer 데이터 버퍼
     * @param bufferSize 유효 바이트 수
     * @param extension 파일 확장자 (jpg, png, pdf)
     * @return 끝 마커 직후의 오프셋 (파일 끝), 없으면 -1
     */
    fun findEndMarker(buffer: ByteArray, bufferSize: Int, extension: String): Int {
        val marker = END_MARKERS[extension] ?: return -1

        for (pos in 0..(bufferSize - marker.size)) {
            var matched = true
            for (i in marker.indices) {
                if (buffer[pos + i] != marker[i]) {
                    matched = false
                    break
                }
            }
            if (matched) {
                return pos + marker.size  // 마커 직후 = 파일 끝
            }
        }
        return -1
    }

    /**
     * 해당 확장자에 끝 마커가 정의되어 있는지 확인
     */
    fun hasEndMarker(extension: String): Boolean = END_MARKERS.containsKey(extension)

    /**
     * 확장자로 카테고리 조회
     */
    fun categoryForExtension(ext: String): FileCategory =
        EXT_CATEGORY[ext.lowercase()] ?: FileCategory.DOCUMENT

    fun calcChance(size: Long, headerIntact: Boolean): RecoveryChance = when {
        headerIntact && size > 10_240L -> RecoveryChance.HIGH
        headerIntact                   -> RecoveryChance.MEDIUM
        size > 0                       -> RecoveryChance.LOW
        else                           -> RecoveryChance.LOW
    }

    fun chanceLabel(chance: RecoveryChance): String = when (chance) {
        RecoveryChance.HIGH   -> "복구 가능성 높음"
        RecoveryChance.MEDIUM -> "복구 가능성 보통"
        RecoveryChance.LOW    -> "복구 가능성 낮음"
    }
}
