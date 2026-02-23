package com.filerecovery.data.datasource

import com.filerecovery.domain.model.FileCategory

object FileExtensions {
    val IMAGE    = setOf("jpg", "jpeg", "png", "webp", "gif", "bmp", "heic", "heif", "tiff", "tif", "raw", "dng", "cr2", "nef")
    val VIDEO    = setOf("mp4", "mkv", "avi", "mov", "wmv", "flv", "3gp", "webm", "m4v", "ts", "mts", "m2ts", "vob", "rmvb")
    val AUDIO    = setOf("mp3", "wav", "aac", "flac", "ogg", "m4a", "wma", "opus", "amr", "3gpp", "3ga", "m4r", "caf", "pcm", "aiff", "aif", "mid", "midi")
    val DOCUMENT = setOf("pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "hwp", "hwpx", "odt", "ods", "odp", "rtf", "pages", "numbers", "key")
    // APK, 압축파일, DB, 기타 모든 파일
    val OTHER    = setOf("apk", "rar", "7z", "tar", "gz", "bz2", "xz", "zip", "iso", "img", "bin", "exe", "msi", "dmg", "bak", "db", "sqlite", "sqlite3", "csv", "json", "xml", "html", "htm", "css", "js", "log", "conf", "cfg", "ini", "torrent", "ics", "vcf", "eml", "msg")

    /** 확장자로 카테고리 반환 — 알 수 없으면 OTHER */
    fun categoryOf(ext: String): FileCategory = when (ext.lowercase()) {
        in IMAGE    -> FileCategory.IMAGE
        in VIDEO    -> FileCategory.VIDEO
        in AUDIO    -> FileCategory.AUDIO
        in DOCUMENT -> FileCategory.DOCUMENT
        else        -> FileCategory.OTHER
    }
}
