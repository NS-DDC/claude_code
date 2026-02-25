package com.filerecovery.presentation.viewmodel

import android.app.Application
import android.os.Environment
import android.os.StatFs
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.filerecovery.data.datasource.FileSystemDataSource
import com.filerecovery.data.datasource.MediaStoreDataSource
import com.filerecovery.data.datasource.RawDiskDataSource
import com.filerecovery.data.repository.ScanRepository
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.domain.model.ScanProgress
import com.filerecovery.util.RootUtils
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
    val storageInfo: StorageInfo     = StorageInfo(),
    // ✅ v1.4: 루트/심층 스캔 상태
    val isRootAvailable: Boolean     = false,
    val isDeepScanning: Boolean      = false,
    val deepScanProgress: ScanProgress = ScanProgress(),
    val deepScanFiles: List<RecoverableFile> = emptyList()
)

class ScanViewModel(app: Application) : AndroidViewModel(app) {

    private val rawDiskDataSource = RawDiskDataSource(app)

    private val repository = ScanRepository(
        mediaStore = MediaStoreDataSource(app),
        fileSystem = FileSystemDataSource(),
        rawDisk = rawDiskDataSource
    )

    private val _uiState = MutableStateFlow(ScanUiState())
    val uiState: StateFlow<ScanUiState> = _uiState

    // ✅ FIX: 스캔 Job 보관 → 취소 지원
    private var scanJob: Job? = null
    private var deepScanJob: Job? = null

    init {
        loadStorageInfo()
        checkRootAvailability()
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

    /** 루트 사용 가능 여부 비동기 확인 */
    private fun checkRootAvailability() {
        viewModelScope.launch {
            val available = try { RootUtils.isRootAvailable() } catch (_: Exception) { false }
            _uiState.value = _uiState.value.copy(isRootAvailable = available)
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

    /**
     * ✅ v1.4: 심층 디스크 스캔 시작 (루트 권한 필요)
     *
     * 기존 일반 스캔과 독립적으로 실행됩니다.
     * Raw 블록 디바이스를 직접 스캔하여 완전 삭제된 파일을 복구합니다.
     */
    fun startDeepScan() {
        if (_uiState.value.isDeepScanning) return
        if (!_uiState.value.isRootAvailable) {
            _uiState.value = _uiState.value.copy(
                error = "루트 권한이 필요합니다. Magisk/KernelSU로 루트 설정 후 다시 시도하세요."
            )
            return
        }

        _uiState.value = _uiState.value.copy(
            isDeepScanning = true,
            deepScanFiles = emptyList(),
            deepScanProgress = ScanProgress(isDeepScanning = true),
            error = null
        )

        deepScanJob?.cancel()
        deepScanJob = viewModelScope.launch {
            val flow = repository.deepScan(_uiState.value.files)
            if (flow == null) {
                _uiState.value = _uiState.value.copy(
                    isDeepScanning = false,
                    error = "디스크 스캔을 초기화할 수 없습니다."
                )
                return@launch
            }

            flow.catch { e ->
                    _uiState.value = _uiState.value.copy(
                        isDeepScanning = false,
                        error = "심층 스캔 오류: ${e.message}"
                    )
                }
                .collect { (progress, files) ->
                    _uiState.value = _uiState.value.copy(
                        isDeepScanning = !progress.isFinished,
                        deepScanProgress = progress,
                        deepScanFiles = files,
                        // 심층 스캔 결과를 기존 파일 목록에 병합
                        files = mergeFiles(_uiState.value.files, files)
                    )
                }
        }
    }

    /** 심층 스캔 중단 */
    fun cancelDeepScan() {
        deepScanJob?.cancel()
        deepScanJob = null
        _uiState.value = _uiState.value.copy(isDeepScanning = false)
    }

    /** 스캔 중단 */
    fun cancelScan() {
        scanJob?.cancel()
        scanJob = null
        _uiState.value = _uiState.value.copy(isScanning = false)
    }

    fun filesOf(category: FileCategory): List<RecoverableFile> =
        _uiState.value.files.filter { it.category == category }

    /**
     * 기존 파일 + 심층 스캔 파일 병합 (중복 제거)
     */
    private fun mergeFiles(
        existing: List<RecoverableFile>,
        carved: List<RecoverableFile>
    ): List<RecoverableFile> {
        val existingIds = existing.map { it.id }.toSet()
        val newFiles = carved.filter { it.id !in existingIds }
        return existing + newFiles
    }
}
