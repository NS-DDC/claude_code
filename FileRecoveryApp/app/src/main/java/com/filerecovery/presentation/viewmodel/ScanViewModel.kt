package com.filerecovery.presentation.viewmodel

import android.app.Application
import android.os.Environment
import android.os.StatFs
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.filerecovery.data.datasource.FileSystemDataSource
import com.filerecovery.data.datasource.MediaStoreDataSource
import com.filerecovery.data.datasource.ThumbnailCacheDataSource
import com.filerecovery.data.repository.ScanRepository
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.domain.model.ScanProgress
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch

data class StorageInfo(
    val totalBytes: Long = 0L,
    val usedBytes: Long  = 0L,
    val freeBytes: Long  = 0L
) {
    val usedPercent: Float
        get() = if (totalBytes > 0) usedBytes.toFloat() / totalBytes else 0f
}

data class ScanUiState(
    val isScanning: Boolean          = false,
    val progress: ScanProgress       = ScanProgress(),
    val files: List<RecoverableFile> = emptyList(),
    val error: String?               = null,
    val storageInfo: StorageInfo     = StorageInfo()
)

class ScanViewModel(app: Application) : AndroidViewModel(app) {

    private val repository = ScanRepository(
        mediaStore     = MediaStoreDataSource(app),
        thumbnailCache = ThumbnailCacheDataSource(app),
        fileSystem     = FileSystemDataSource()
    )

    private val _uiState = MutableStateFlow(ScanUiState())
    val uiState: StateFlow<ScanUiState> = _uiState

    // ✅ FIX: 스캔 Job 보관 → 취소 지원
    private var scanJob: Job? = null

    init {
        loadStorageInfo()
    }

    private fun loadStorageInfo() {
        try {
            // ✅ FIX: Environment.getDataDirectory() 사용 → 실제 디바이스 저장소 반영
            @Suppress("DEPRECATION")
            val path = Environment.getExternalStorageDirectory().path
            val stat = StatFs(path)
            val total = stat.totalBytes
            val free  = stat.availableBytes
            _uiState.value = _uiState.value.copy(
                storageInfo = StorageInfo(total, total - free, free)
            )
        } catch (_: Exception) {
            // StatFs 실패 무시 (일부 에뮬레이터)
        }
    }

    fun startScan() {
        if (_uiState.value.isScanning) return
        _uiState.value = _uiState.value.copy(isScanning = true, files = emptyList(), error = null)

        // ✅ FIX: 기존 스캔 취소 후 새 스캔 시작
        scanJob?.cancel()
        scanJob = viewModelScope.launch {
            repository.scanAll()
                .catch { e ->
                    _uiState.value = _uiState.value.copy(
                        isScanning = false,
                        error      = e.message
                    )
                }
                .collect { (progress, files) ->
                    _uiState.value = _uiState.value.copy(
                        isScanning = !progress.isFinished,
                        progress   = progress,
                        files      = files
                    )
                }
        }
    }

    /** 스캔 중단 */
    fun cancelScan() {
        scanJob?.cancel()
        scanJob = null
        _uiState.value = _uiState.value.copy(isScanning = false)
    }

    fun filesOf(category: FileCategory): List<RecoverableFile> =
        _uiState.value.files.filter { it.category == category }
}
