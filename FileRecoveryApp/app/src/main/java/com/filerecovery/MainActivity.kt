package com.filerecovery

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.filerecovery.data.repository.BillingRepository
import com.filerecovery.data.repository.BillingState
import com.filerecovery.data.repository.RecoveryRepository
import com.filerecovery.data.repository.RecoveryResult
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.presentation.theme.FileRecoveryTheme
import com.filerecovery.presentation.ui.dashboard.DashboardScreen
import com.filerecovery.presentation.ui.onboarding.PermissionOnboardingScreen
import com.filerecovery.presentation.ui.preview.FileListScreen
import com.filerecovery.presentation.ui.purchase.PurchaseDialog
import com.filerecovery.presentation.viewmodel.ScanViewModel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private var billingRepository: BillingRepository? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        billingRepository = BillingRepository(applicationContext).also { it.init() }

        setContent {
            FileRecoveryTheme {
                // ✅ FIX: billingRepository를 안전하게 전달 (!! 제거)
                val billing = billingRepository
                if (billing != null) {
                    AppNavigation(
                        billingRepository = billing,
                        activity          = this
                    )
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        billingRepository?.release()
        billingRepository = null
    }
}

sealed class Screen {
    object Onboarding : Screen()
    object Dashboard  : Screen()
    data class FileList(val category: FileCategory) : Screen()
}

@Composable
fun AppNavigation(billingRepository: BillingRepository, activity: MainActivity) {
    val vm: ScanViewModel = viewModel()
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Onboarding) }
    var showPurchaseDialog by remember { mutableStateOf(false) }
    var filesToRecover by remember { mutableStateOf<List<RecoverableFile>>(emptyList()) }
    val coroutineScope = rememberCoroutineScope()

    // ✅ FIX: BillingState 관찰 — 결제 성공/실패 피드백 제공
    val billingState by billingRepository.billingState.collectAsStateWithLifecycle()

    // ✅ FIX: 결제 성공 시 실제 복구 실행
    LaunchedEffect(billingState) {
        when (val state = billingState) {
            is BillingState.Success -> {
                if (filesToRecover.isNotEmpty()) {
                    val recoveryRepo = RecoveryRepository(activity.applicationContext)
                    recoveryRepo.recoverFiles(filesToRecover)
                        .onEach { result ->
                            when (result) {
                                is RecoveryResult.Success -> {
                                    Toast.makeText(
                                        activity,
                                        "${result.savedPaths.size}개 파일 복구 완료!",
                                        Toast.LENGTH_LONG
                                    ).show()
                                    filesToRecover = emptyList()
                                }
                                is RecoveryResult.Failure -> {
                                    Toast.makeText(
                                        activity,
                                        "${result.fileName}: ${result.reason}",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                }
                                is RecoveryResult.Progress -> { /* 진행 중 */ }
                            }
                        }
                        .launchIn(this)
                }
            }
            is BillingState.Error -> {
                Toast.makeText(activity, state.message, Toast.LENGTH_LONG).show()
            }
            else -> {}
        }
    }

    // ✅ FIX: BackHandler — FileList에서만 활성화, Dashboard에서는 시스템 기본 동작(앱 종료) 허용
    BackHandler(enabled = currentScreen is Screen.FileList) {
        currentScreen = Screen.Dashboard
    }

    when (val screen = currentScreen) {
        is Screen.Onboarding -> PermissionOnboardingScreen {
            currentScreen = Screen.Dashboard
        }
        is Screen.Dashboard -> DashboardScreen(
            onCategoryClick = { category -> currentScreen = Screen.FileList(category) },
            vm              = vm
        )
        is Screen.FileList -> FileListScreen(
            category       = screen.category,
            onRecoverClick = { selected ->
                filesToRecover = selected
                // ✅ FIX: 이미 구매한 사용자는 바로 복구 실행
                if (billingState is BillingState.AlreadyPurchased) {
                    showPurchaseDialog = false
                } else {
                    showPurchaseDialog = true
                }
            },
            // ✅ 테스트 복구: 결제 없이 바로 RecoveryRepository 호출
            onTestRecover = { selected ->
                coroutineScope.launch {
                    val recoveryRepo = RecoveryRepository(activity.applicationContext)
                    recoveryRepo.recoverFiles(selected)
                        .onEach { result ->
                            when (result) {
                                is RecoveryResult.Success -> {
                                    Toast.makeText(
                                        activity,
                                        "🧪 테스트 복구 완료: ${result.savedPaths.size}개 파일",
                                        Toast.LENGTH_LONG
                                    ).show()
                                }
                                is RecoveryResult.Failure -> {
                                    Toast.makeText(
                                        activity,
                                        "🧪 실패: ${result.fileName} - ${result.reason}",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                }
                                is RecoveryResult.Progress -> {
                                    // 진행 중 — UI 피드백 가능
                                }
                            }
                        }
                        .launchIn(this)
                }
            },
            vm = vm
        )
    }

    // ✅ FIX: 이미 구매 사용자가 복구 요청 시 바로 실행
    LaunchedEffect(filesToRecover, billingState) {
        if (billingState is BillingState.AlreadyPurchased && filesToRecover.isNotEmpty() && !showPurchaseDialog) {
            val recoveryRepo = RecoveryRepository(activity.applicationContext)
            recoveryRepo.recoverFiles(filesToRecover)
                .onEach { result ->
                    when (result) {
                        is RecoveryResult.Success -> {
                            Toast.makeText(
                                activity,
                                "${result.savedPaths.size}개 파일 복구 완료!",
                                Toast.LENGTH_LONG
                            ).show()
                            filesToRecover = emptyList()
                        }
                        is RecoveryResult.Failure -> {
                            Toast.makeText(
                                activity,
                                "${result.fileName}: ${result.reason}",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                        is RecoveryResult.Progress -> { /* 진행 중 */ }
                    }
                }
                .launchIn(this)
        }
    }

    if (showPurchaseDialog && filesToRecover.isNotEmpty()) {
        PurchaseDialog(
            filesToRecover = filesToRecover,
            onDismiss      = { showPurchaseDialog = false },
            onPurchase     = { product ->
                billingRepository.launchPurchase(activity, product)
                showPurchaseDialog = false
            }
        )
    }
}
