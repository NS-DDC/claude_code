package com.filerecovery.data.repository

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import java.io.File
import java.io.FileInputStream

sealed class RecoveryResult {
    data class Progress(val current: Int, val total: Int, val currentFileName: String) : RecoveryResult()
    data class Success(val savedPaths: List<String>) : RecoveryResult()
    data class Failure(val fileName: String, val reason: String) : RecoveryResult()
}

/**
 * 복구된 파일을 Download/Recovered_Files/{카테고리} 폴더에 저장합니다.
 *
 * [수정 사항]
 * - Null InputStream 감지 → 0바이트 파일 생성 방지
 * - Android 10+: MediaStore가 자동으로 unique name 처리 → File.exists() 체크 제거
 * - Android 11+: path 기반 접근 제한 → Uri 우선 사용
 */
class RecoveryRepository(private val context: Context) {

    companion object {
        const val RECOVERY_ROOT = "Recovered_Files"
    }

    fun recoverFiles(files: List<RecoverableFile>): Flow<RecoveryResult> = flow {
        val savedPaths = mutableListOf<String>()

        files.forEachIndexed { index, file ->
            emit(RecoveryResult.Progress(index + 1, files.size, file.name))

            try {
                val savedPath = saveFile(file)
                if (savedPath != null) {
                    savedPaths += savedPath
                } else {
                    emit(RecoveryResult.Failure(file.name, "파일을 저장할 수 없습니다"))
                }
            } catch (e: Exception) {
                emit(RecoveryResult.Failure(file.name, e.message ?: "알 수 없는 오류"))
            }
        }

        emit(RecoveryResult.Success(savedPaths))
    }.flowOn(Dispatchers.IO)

    private fun saveFile(file: RecoverableFile): String? {
        val subFolder = categorySubFolder(file.category)

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // ✅ FIX: Android 10+ 에서는 MediaStore가 자동으로 중복 이름 처리
            saveViaMediaStore(file, file.name, subFolder)
        } else {
            val fileName = ensureUniqueFileName(file.name, subFolder)
            saveViaFileSystem(file, fileName, subFolder)
        }
    }

    private fun saveViaMediaStore(file: RecoverableFile, fileName: String, subFolder: String): String? {
        val relativePath = "${Environment.DIRECTORY_DOWNLOADS}/$RECOVERY_ROOT/$subFolder"

        // ✅ FIX: 소스 스트림을 먼저 확인 → null이면 early return (0바이트 파일 방지)
        val sourceStream = openSourceStream(file)
            ?: return null

        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE,    mimeTypeOf(file.extension))
            put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath)
            put(MediaStore.MediaColumns.IS_PENDING,   1)
        }

        val collection = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        val itemUri = context.contentResolver.insert(collection, values) ?: run {
            sourceStream.close()
            return null
        }

        try {
            context.contentResolver.openOutputStream(itemUri)?.use { out ->
                sourceStream.use { input ->
                    input.copyTo(out, bufferSize = 64 * 1024)
                }
            }
            // IS_PENDING 해제 → 파일 공개
            val updateValues = ContentValues().apply {
                put(MediaStore.MediaColumns.IS_PENDING, 0)
            }
            context.contentResolver.update(itemUri, updateValues, null, null)
        } catch (e: Exception) {
            context.contentResolver.delete(itemUri, null, null)
            return null
        }

        return "$relativePath/$fileName"
    }

    private fun saveViaFileSystem(file: RecoverableFile, fileName: String, subFolder: String): String? {
        // ✅ FIX: 소스 스트림 먼저 확인
        val sourceStream = openSourceStream(file) ?: return null

        val destDir = File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            "$RECOVERY_ROOT/$subFolder"
        ).also { it.mkdirs() }

        val destFile = File(destDir, fileName)
        try {
            sourceStream.use { input ->
                destFile.outputStream().use { out ->
                    input.copyTo(out, bufferSize = 64 * 1024)
                }
            }
        } catch (e: Exception) {
            destFile.delete()
            return null
        }
        return destFile.absolutePath
    }

    private fun openSourceStream(file: RecoverableFile) = when {
        // ✅ FIX: Android 11+에서는 path 접근이 제한되므로 Uri 우선
        file.uri != null -> {
            try {
                context.contentResolver.openInputStream(file.uri)
            } catch (_: Exception) {
                null
            }
        }
        file.path.isNotEmpty() && Build.VERSION.SDK_INT < Build.VERSION_CODES.R -> {
            try {
                FileInputStream(File(file.path))
            } catch (_: Exception) {
                null
            }
        }
        else -> null
    }

    private fun categorySubFolder(category: FileCategory) = when (category) {
        FileCategory.IMAGE    -> "Photos"
        FileCategory.VIDEO    -> "Videos"
        FileCategory.AUDIO    -> "Audio"
        FileCategory.DOCUMENT -> "Documents"
    }

    private fun mimeTypeOf(ext: String) = when (ext.lowercase()) {
        "jpg", "jpeg" -> "image/jpeg"
        "png"         -> "image/png"
        "webp"        -> "image/webp"
        "gif"         -> "image/gif"
        "bmp"         -> "image/bmp"
        "heic"        -> "image/heic"
        "mp4"         -> "video/mp4"
        "mkv"         -> "video/x-matroska"
        "avi"         -> "video/x-msvideo"
        "mov"         -> "video/quicktime"
        "mp3"         -> "audio/mpeg"
        "wav"         -> "audio/wav"
        "flac"        -> "audio/flac"
        "ogg"         -> "audio/ogg"
        "aac"         -> "audio/aac"
        "pdf"         -> "application/pdf"
        "docx"        -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        "xlsx"        -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        "pptx"        -> "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        "txt"         -> "text/plain"
        else          -> "application/octet-stream"
    }

    /** Android 9 이하 전용: 동명 파일 충돌 방지 */
    private fun ensureUniqueFileName(name: String, subFolder: String): String {
        val destDir = File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            "$RECOVERY_ROOT/$subFolder"
        )
        val baseName = name.substringBeforeLast('.')
        val ext      = name.substringAfterLast('.', "")
        var candidate = name
        var counter   = 1
        while (File(destDir, candidate).exists()) {
            candidate = if (ext.isNotEmpty()) "${baseName}_$counter.$ext" else "${baseName}_$counter"
            counter++
        }
        return candidate
    }
}
