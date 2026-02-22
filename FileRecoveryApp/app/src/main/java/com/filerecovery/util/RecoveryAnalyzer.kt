package com.filerecovery.util

import android.content.Context
import android.net.Uri
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
 */
object RecoveryAnalyzer {

    private data class Signature(val magic: ByteArray, val offset: Int = 0)

    private val MAGIC_SIGNATURES: Map<String, Signature> = mapOf(
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
