package com.filerecovery.presentation.ui.onboarding

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.filerecovery.presentation.theme.*

/**
 * MANAGE_EXTERNAL_STORAGE 권한 온보딩 화면
 *
 * [삼성 One UI 대응]
 * - One UI는 ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION을 정상 지원합니다.
 * - 단, One UI 5+ (Android 13)에서 '부분 사진 접근' UI가 다른 레이아웃으로 표시됩니다.
 * - 삼성 갤러리 앱이 .thumbnails 캐시를 독자적으로 관리하므로 경로 추가 대응.
 *
 * [OEM 대응]
 * - MIUI, ColorOS 등에서 ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION 미지원 시
 *   ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION 폴백 후 → 일반 설정 화면 폴백
 */
@Composable
fun PermissionOnboardingScreen(onPermissionGranted: () -> Unit) {
    val context = LocalContext.current
    var step by remember { mutableIntStateOf(0) }
    var permissionDeniedMessage by remember { mutableStateOf<String?>(null) }

    // ✅ FIX: 설정 화면에서 돌아왔을 때 권한 상태 재확인 (기존엔 무조건 통과)
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME && step == 2) {
                // 설정에서 돌아왔을 때 실제 권한 확인
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    if (Environment.isExternalStorageManager()) {
                        onPermissionGranted()
                    }
                    // 허용 안 했으면 그냥 현재 화면 유지 → 사용자가 '나중에' 누를 수 있음
                }
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // ✅ FIX: Android 14 부분 접근 + 권한 거부 시 피드백 추가
    val mediaPermLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val allGranted = grants.values.all { it }
        val anyGranted = grants.values.any { it }

        when {
            allGranted -> {
                // 모든 권한 승인됨
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    step = 2  // MANAGE_EXTERNAL_STORAGE 안내
                } else {
                    onPermissionGranted()
                }
            }
            anyGranted -> {
                // ✅ FIX: Android 14 '일부만 허용' 대응 → 경고 후 진행 허용
                permissionDeniedMessage = "일부 미디어만 접근 가능합니다. 전체 복구를 위해 모든 권한을 허용해 주세요."
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    step = 2
                } else {
                    onPermissionGranted()
                }
            }
            else -> {
                // ✅ FIX: 전부 거부 → 명확한 사용자 피드백
                permissionDeniedMessage = "파일 복구를 위해 미디어 접근 권한이 필수입니다. 허용 버튼을 다시 눌러주세요."
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(40.dp))

        StepIndicator(
            currentStep = step,
            totalSteps  = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) 3 else 2
        )

        Spacer(Modifier.height(32.dp))

        // ✅ FIX: 권한 거부 시 안내 메시지 표시
        permissionDeniedMessage?.let { msg ->
            Card(
                colors   = CardDefaults.cardColors(containerColor = MedYellow.copy(alpha = 0.12f)),
                shape    = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("⚠️", fontSize = 16.sp)
                    Spacer(Modifier.width(8.dp))
                    Text(msg, color = MedYellow, fontSize = 12.sp)
                }
            }
            Spacer(Modifier.height(12.dp))
        }

        when (step) {
            0 -> WelcomeStep { step = 1 }
            1 -> MediaPermissionStep {
                permissionDeniedMessage = null
                // ✅ FIX: Android 14 READ_MEDIA_VISUAL_USER_SELECTED 포함
                val perms = if (Build.VERSION.SDK_INT >= 34) {
                    arrayOf(
                        Manifest.permission.READ_MEDIA_IMAGES,
                        Manifest.permission.READ_MEDIA_VIDEO,
                        Manifest.permission.READ_MEDIA_AUDIO,
                        "android.permission.READ_MEDIA_VISUAL_USER_SELECTED"
                    )
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    arrayOf(
                        Manifest.permission.READ_MEDIA_IMAGES,
                        Manifest.permission.READ_MEDIA_VIDEO,
                        Manifest.permission.READ_MEDIA_AUDIO
                    )
                } else {
                    arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
                }
                mediaPermLauncher.launch(perms)
            }
            2 -> ManageStorageStep(
                onAllow = {
                    // ✅ FIX: OEM 호환 — 삼성 One UI, MIUI, ColorOS 폴백 체인
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        val opened = tryOpenManageStorageSettings(context)
                        if (!opened) {
                            // 모든 폴백 실패 → 안내 후 진행
                            Toast.makeText(
                                context,
                                "설정 > 앱 > 파일 복구 마스터 > 권한에서 직접 허용해 주세요",
                                Toast.LENGTH_LONG
                            ).show()
                            onPermissionGranted()
                        }
                        // 설정 화면 열렸으면 ON_RESUME에서 결과 확인
                    } else {
                        onPermissionGranted()
                    }
                },
                onSkip = {
                    // ✅ FIX: '나중에' 버튼은 설정 열지 않고 바로 진행
                    onPermissionGranted()
                }
            )
        }
    }
}

/**
 * ✅ 삼성 One UI / OEM 호환 설정 화면 열기 체인
 *
 * 시도 순서:
 * 1. ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION (표준 — 삼성 One UI 정상 지원)
 * 2. ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION (일부 OEM 폴백)
 * 3. ACTION_APPLICATION_DETAILS_SETTINGS (최종 폴백 — 앱 정보 화면)
 */
private fun tryOpenManageStorageSettings(context: android.content.Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return false

    // 1차: 앱별 전체 파일 접근 설정 (삼성 One UI ✅)
    try {
        val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
            data = Uri.parse("package:${context.packageName}")
        }
        context.startActivity(intent)
        return true
    } catch (_: ActivityNotFoundException) { /* 이 OEM은 미지원 */ }

    // 2차: 전체 파일 접근 목록 화면 (MIUI 폴백)
    try {
        val intent = Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)
        context.startActivity(intent)
        return true
    } catch (_: ActivityNotFoundException) { /* 이것도 미지원 */ }

    // 3차: 일반 앱 설정 화면 (최종 폴백)
    try {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:${context.packageName}")
        }
        context.startActivity(intent)
        return true
    } catch (_: ActivityNotFoundException) {
        return false
    }
}

@Composable
private fun StepIndicator(currentStep: Int, totalSteps: Int) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        repeat(totalSteps) { i ->
            Box(
                modifier = Modifier
                    .size(if (i == currentStep) 28.dp else 10.dp, 10.dp)
                    .clip(CircleShape)
                    .background(if (i == currentStep) Primary else TextSecond.copy(alpha = 0.4f))
            )
        }
    }
}

@Composable
private fun WelcomeStep(onNext: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("🔍", fontSize = 64.sp)
        Spacer(Modifier.height(20.dp))
        Text(
            "소중한 파일을\n안전하게 복구하세요",
            color      = TextPrimary,
            fontSize   = 26.sp,
            fontWeight = FontWeight.ExtraBold,
            textAlign  = TextAlign.Center
        )
        Spacer(Modifier.height(12.dp))
        Text(
            "실수로 삭제된 사진, 영상, 문서를\n전문적인 스캔 기술로 복구합니다.",
            color     = TextSecond,
            fontSize  = 15.sp,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(40.dp))
        FeatureRow("🛡️", "개인 정보 완전 보호", "파일은 기기 내에서만 처리되며 외부 서버로 전송되지 않습니다")
        Spacer(Modifier.height(12.dp))
        FeatureRow("⚡", "3단계 정밀 스캔", "MediaStore · 썸네일 캐시 · 파일 시스템을 동시에 분석합니다")
        Spacer(Modifier.height(12.dp))
        FeatureRow("✅", "Google Play 인증", "엄격한 구글 심사를 통과한 신뢰할 수 있는 앱입니다")
        Spacer(Modifier.weight(1f))
        PrimaryButton("시작하기", onNext)
    }
}

@Composable
private fun MediaPermissionStep(onAllow: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("📂", fontSize = 64.sp)
        Spacer(Modifier.height(20.dp))
        Text(
            "미디어 접근 권한이\n필요합니다",
            color      = TextPrimary,
            fontSize   = 24.sp,
            fontWeight = FontWeight.ExtraBold,
            textAlign  = TextAlign.Center
        )
        Spacer(Modifier.height(16.dp))

        PermissionExplainCard(
            icon  = "🖼️",
            title = "사진 및 미디어",
            desc  = "삭제된 사진, 동영상, 오디오 파일을 스캔하기 위해 미디어 폴더에 접근합니다. 개인 미디어는 절대 외부로 전송되지 않습니다."
        )
        Spacer(Modifier.height(12.dp))
        PermissionExplainCard(
            icon  = "🔒",
            title = "데이터 보안 약속",
            desc  = "모든 스캔은 기기 내에서만 진행됩니다. 귀하의 파일은 귀하의 것입니다."
        )

        Spacer(Modifier.weight(1f))
        PrimaryButton("권한 허용하기", onAllow)
    }
}

@Composable
private fun ManageStorageStep(onAllow: () -> Unit, onSkip: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("🗄️", fontSize = 64.sp)
        Spacer(Modifier.height(20.dp))
        Text(
            "전체 파일 접근 권한\n(심층 복구용)",
            color      = TextPrimary,
            fontSize   = 24.sp,
            fontWeight = FontWeight.ExtraBold,
            textAlign  = TextAlign.Center
        )
        Spacer(Modifier.height(12.dp))
        Text(
            "최고 수준의 복구를 위해 다음 설정이 필요합니다.\n이 권한은 Android가 공식적으로 파일 관리 앱에만 허용합니다.",
            color     = TextSecond,
            fontSize  = 14.sp,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(20.dp))

        PermissionExplainCard(
            icon  = "📋",
            title = "모든 파일 접근 허용",
            desc  = "설정 → '파일 복구 마스터' → '모든 파일 접근 허용'을 켜주세요. 이 권한은 삭제된 파일이 저장되었던 영역까지 심층 스캔하는 데 사용됩니다."
        )
        Spacer(Modifier.height(12.dp))

        Card(
            colors   = CardDefaults.cardColors(containerColor = Primary.copy(alpha = 0.08f)),
            shape    = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("ℹ️", fontSize = 20.sp)
                Spacer(Modifier.width(10.dp))
                Text(
                    "이 권한은 선택 사항입니다. 허용하지 않아도 기본 복구는 가능하지만, 심층 스캔 기능이 제한됩니다.",
                    color    = TextSecond,
                    fontSize = 12.sp
                )
            }
        }

        Spacer(Modifier.weight(1f))
        PrimaryButton("설정 열기", onAllow)
        Spacer(Modifier.height(12.dp))
        // ✅ FIX: '나중에' 버튼은 별도 콜백 (설정 안 열고 바로 진행)
        TextButton(onClick = onSkip) {
            Text("나중에 하기", color = TextSecond, fontSize = 14.sp)
        }
    }
}

@Composable
private fun FeatureRow(icon: String, title: String, desc: String) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Text(icon, fontSize = 20.sp)
        Spacer(Modifier.width(12.dp))
        Column {
            Text(title, color = TextPrimary, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text(desc, color = TextSecond, fontSize = 12.sp)
        }
    }
}

@Composable
private fun PermissionExplainCard(icon: String, title: String, desc: String) {
    Card(
        colors   = CardDefaults.cardColors(containerColor = CardBg),
        shape    = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
            Text(icon, fontSize = 24.sp)
            Spacer(Modifier.width(12.dp))
            Column {
                Text(title, color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Spacer(Modifier.height(4.dp))
                Text(desc, color = TextSecond, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun PrimaryButton(text: String, onClick: () -> Unit) {
    Button(
        onClick  = onClick,
        modifier = Modifier.fillMaxWidth().height(54.dp),
        colors   = ButtonDefaults.buttonColors(containerColor = Primary),
        shape    = RoundedCornerShape(14.dp)
    ) {
        Text(text, color = Color.Black, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
    }
}
