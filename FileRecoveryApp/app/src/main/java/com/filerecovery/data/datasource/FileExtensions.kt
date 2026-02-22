package com.filerecovery.data.datasource

import com.filerecovery.domain.model.FileCategory

object FileExtensions {
    val IMAGE = setOf("jpg", "jpeg", "png", "webp", "gif", "bmp", "heic", "heif")
    val VIDEO = setOf("mp4", "mkv", "avi", "mov", "wmv", "flv", "3gp", "webm")
    val AUDIO = setOf("mp3", "wav", "aac", "flac", "ogg", "m4a", "wma", "opus")
    val DOCUMENT = setOf("pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "zip")

    fun categoryOf(ext: String): FileCategory? = when (ext.lowercase()) {
        in IMAGE    -> FileCategory.IMAGE
        in VIDEO    -> FileCategory.VIDEO
        in AUDIO    -> FileCategory.AUDIO
        in DOCUMENT -> FileCategory.DOCUMENT
        else        -> null
    }
}
