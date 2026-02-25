package com.filerecovery.presentation.ui.dashboard

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.presentation.theme.*
import com.filerecovery.presentation.viewmodel.ScanViewModel

// ✅ FIX: onScanStart 파라미터 제거 (미사용)
@Composable
fun DashboardScreen(
    onCategoryClick: (FileCategory) -> Unit,
    vm: ScanViewModel = viewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        DashboardHeader()

        Spacer(Modifier.height(20.dp))

        StorageGaugeSection(
            usedPercent = state.storageInfo.usedPercent,
            usedBytes   = state.storageInfo.usedBytes,
            totalBytes  = state.storageInfo.totalBytes,
            isScanning  = state.isScanning,
            onScanClick = { vm.startScan() }
        )

        Spacer(Modifier.height(24.dp))

        // ✅ FIX: 스캔 에러 메시지 표시
        state.error?.let { errorMsg ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors   = CardDefaults.cardColors(containerColor = LowRed.copy(alpha = 0.12f)),
                shape    = RoundedCornerShape(12.dp)
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("⚠️", fontSize = 16.sp)
                    Spacer(Modifier.width(8.dp))
                    Text("스캔 오류: $errorMsg", color = LowRed, fontSize = 12.sp)
                }
            }
            Spacer(Modifier.height(12.dp))
        }

        if (state.isScanning) {
            ScanningSection(progress = state.progress)
            Spacer(Modifier.height(24.dp))
        }

        // ✅ v1.4: 심층 스캔 진행 중
        if (state.isDeepScanning) {
            DeepScanningSection(progress = state.deepScanProgress)
            Spacer(Modifier.height(24.dp))
        }

        // ✅ v1.4: 루트 감지 시 심층 스캔 버튼 (일반 스캔 완료 후에만 표시)
        if (!state.isScanning && !state.isDeepScanning && state.isRootAvailable && state.progress.isFinished) {
            DeepScanButton(
                onDeepScanClick = { vm.startDeepScan() },
                carvedCount = state.deepScanFiles.size
            )
            Spacer(Modifier.height(16.dp))
        }

        // ✅ v1.4: 루트 미감지 + 일반 스캔 완료 → 루트 필요 안내
        if (!state.isScanning && !state.isRootAvailable && state.progress.isFinished) {
            RootRequiredHint()
            Spacer(Modifier.height(16.dp))
        }

        // ✅ 스캔 완료 후 경고 메시지 표시 (권한 부족, 검색 결과 없음 등)
        if (!state.isScanning && state.progress.warnings.isNotEmpty()) {
            state.progress.warnings.forEach { warning ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors   = CardDefaults.cardColors(containerColor = MedYellow.copy(alpha = 0.10f)),
                    shape    = RoundedCornerShape(12.dp)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.Top) {
                        Text("💡", fontSize = 14.sp)
                        Spacer(Modifier.width(8.dp))
                        Text(warning, color = TextSecond, fontSize = 12.sp)
                    }
                }
                Spacer(Modifier.height(8.dp))
            }
            Spacer(Modifier.height(8.dp))
        }

        Text(
            text       = "카테고리별 복구",
            color      = TextPrimary,
            fontSize   = 16.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(Modifier.height(12.dp))
        CategoryGrid(
            imageCount    = state.progress.imageCount,
            videoCount    = state.progress.videoCount,
            audioCount    = state.progress.audioCount,
            documentCount = state.progress.documentCount,
            onCategoryClick = onCategoryClick
        )

        Spacer(Modifier.height(24.dp))

        DataProtectionTips()
    }
}

@Composable
private fun DashboardHeader() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text("파일 복구 마스터", color = Primary, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
            Text("삭제된 파일을 안전하게 복구합니다", color = TextSecond, fontSize = 13.sp)
        }
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(CardBg),
            contentAlignment = Alignment.Center
        ) {
            Text("PRO", color = Secondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun StorageGaugeSection(
    usedPercent: Float,
    usedBytes: Long,
    totalBytes: Long,
    isScanning: Boolean,
    onScanClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors   = CardDefaults.cardColors(containerColor = CardBg),
        shape    = RoundedCornerShape(20.dp)
    ) {
        Row(
            modifier  = Modifier.padding(20.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CircularStorageGauge(usedPercent = usedPercent)

            Spacer(Modifier.width(20.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text("저장 공간", color = TextSecond, fontSize = 13.sp)
                Text(
                    "${formatBytes(usedBytes)} / ${formatBytes(totalBytes)} 사용 중",
                    color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold
                )
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick  = onScanClick,
                    enabled  = !isScanning,
                    modifier = Modifier.fillMaxWidth(),
                    colors   = ButtonDefaults.buttonColors(containerColor = Primary),
                    shape    = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text       = if (isScanning) "스캔 중..." else "데이터 정밀 검사 시작",
                        color      = Color.Black,
                        fontWeight = FontWeight.Bold,
                        fontSize   = 14.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun CircularStorageGauge(usedPercent: Float) {
    // ✅ FIX: EaseOutCubic → FastOutSlowInEasing (안정적인 Compose 내장 Easing)
    val animatedPercent by animateFloatAsState(
        targetValue   = usedPercent,
        animationSpec = tween(1200, easing = FastOutSlowInEasing),
        label         = "storageGauge"
    )
    Box(
        modifier        = Modifier.size(80.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawArc(
                color      = Color.White.copy(alpha = 0.1f),
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter  = false,
                style      = Stroke(width = 10.dp.toPx(), cap = StrokeCap.Round)
            )
            drawArc(
                brush      = Brush.sweepGradient(listOf(Primary, Secondary)),
                startAngle = -90f,
                sweepAngle = 360f * animatedPercent,
                useCenter  = false,
                style      = Stroke(width = 10.dp.toPx(), cap = StrokeCap.Round)
            )
        }
        Text(
            text       = "${(usedPercent * 100).toInt()}%",
            color      = TextPrimary,
            fontSize   = 16.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun ScanningSection(progress: com.filerecovery.domain.model.ScanProgress) {
    val infiniteTransition = rememberInfiniteTransition(label = "radar")
    val rotation by infiniteTransition.animateFloat(
        initialValue   = 0f,
        targetValue    = 360f,
        animationSpec  = infiniteRepeatable(tween(2000, easing = LinearEasing)),
        label          = "radarRotation"
    )
    // ✅ FIX: EaseInOut → FastOutSlowInEasing
    val pulse by infiniteTransition.animateFloat(
        initialValue   = 0.85f,
        targetValue    = 1.0f,
        animationSpec  = infiniteRepeatable(tween(900, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label          = "pulse"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors   = CardDefaults.cardColors(containerColor = CardBg),
        shape    = RoundedCornerShape(20.dp)
    ) {
        Column(
            modifier          = Modifier.padding(20.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier         = Modifier.size(120.dp),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val cx = size.width / 2
                    val cy = size.height / 2
                    listOf(0.3f, 0.6f, 1.0f).forEach { r ->
                        drawCircle(
                            color  = Primary.copy(alpha = 0.15f),
                            radius = (size.minDimension / 2) * r
                        )
                    }
                    drawArc(
                        brush      = Brush.sweepGradient(
                            colors  = listOf(Color.Transparent, Primary.copy(alpha = 0.5f)),
                            center  = androidx.compose.ui.geometry.Offset(cx, cy)
                        ),
                        startAngle = rotation,
                        sweepAngle = 90f,
                        useCenter  = true
                    )
                }
                Text(
                    text       = "${progress.scannedCount}",
                    color      = Primary,
                    fontSize   = (20 * pulse).sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }

            Spacer(Modifier.height(12.dp))
            Text("정밀 스캔 중...", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Spacer(Modifier.height(8.dp))

            Row(
                modifier              = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                ScanCountChip("사진",  progress.imageCount,    Primary)
                ScanCountChip("영상",  progress.videoCount,    Secondary)
                ScanCountChip("음악",  progress.audioCount,    HighGreen)
                ScanCountChip("문서",  progress.documentCount, MedYellow)
            }
        }
    }
}

@Composable
private fun ScanCountChip(label: String, count: Int, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text       = "$count",
            color      = color,
            fontSize   = 18.sp,
            fontWeight = FontWeight.ExtraBold
        )
        Text(text = label, color = TextSecond, fontSize = 11.sp)
    }
}

@Composable
private fun CategoryGrid(
    imageCount: Int,
    videoCount: Int,
    audioCount: Int,
    documentCount: Int,
    onCategoryClick: (FileCategory) -> Unit
) {
    val categories = listOf(
        CategoryItem("사진 복구",   imageCount,    "JPG PNG WEBP", Primary,    FileCategory.IMAGE),
        CategoryItem("동영상 복구", videoCount,    "MP4 MKV AVI",  Secondary,  FileCategory.VIDEO),
        CategoryItem("오디오 복구", audioCount,    "MP3 WAV AAC",  HighGreen,  FileCategory.AUDIO),
        CategoryItem("문서 복구",   documentCount, "PDF DOCX XLSX",MedYellow,  FileCategory.DOCUMENT)
    )

    Column {
        categories.chunked(2).forEach { row ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                row.forEach { item ->
                    CategoryCard(item = item, modifier = Modifier.weight(1f), onClick = onCategoryClick)
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
            Spacer(Modifier.height(12.dp))
        }
    }
}

private data class CategoryItem(
    val title: String,
    val count: Int,
    val formats: String,
    val color: Color,
    val category: FileCategory
)

@Composable
private fun CategoryCard(item: CategoryItem, modifier: Modifier, onClick: (FileCategory) -> Unit) {
    Card(
        modifier = modifier
            .height(110.dp)
            .clickable { onClick(item.category) },
        colors = CardDefaults.cardColors(containerColor = CardBg),
        shape  = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, item.color.copy(alpha = 0.3f))
    ) {
        Column(
            modifier  = Modifier.fillMaxSize().padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Box(
                modifier = Modifier.size(32.dp).clip(CircleShape)
                    .background(item.color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(text = when (item.category) {
                    FileCategory.IMAGE    -> "🖼"
                    FileCategory.VIDEO    -> "🎬"
                    FileCategory.AUDIO    -> "🎵"
                    FileCategory.DOCUMENT -> "📄"
                }, fontSize = 16.sp)
            }
            Column {
                Text(item.title, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Text(
                    if (item.count > 0) "${item.count}개 발견" else item.formats,
                    color    = if (item.count > 0) item.color else TextSecond,
                    fontSize = 11.sp
                )
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// ✅ v1.4: 심층 스캔(디스크 카빙) UI 컴포넌트
// ═══════════════════════════════════════════════════════════════════════

@Composable
private fun DeepScanButton(onDeepScanClick: () -> Unit, carvedCount: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors   = CardDefaults.cardColors(containerColor = CardBg),
        shape    = RoundedCornerShape(16.dp),
        border   = BorderStroke(1.dp, Secondary.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("🔓", fontSize = 18.sp)
                Spacer(Modifier.width(8.dp))
                Text(
                    "루트 권한 감지됨",
                    color = Secondary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(
                "디스크를 직접 스캔하여 완전 삭제된 파일도 복구합니다.\n30일이 지나 휴지통에서 제거된 파일을 찾을 수 있습니다.",
                color = TextSecond,
                fontSize = 12.sp,
                lineHeight = 18.sp
            )
            if (carvedCount > 0) {
                Spacer(Modifier.height(6.dp))
                Text(
                    "이전 심층 스캔: ${carvedCount}개 파일 발견",
                    color = HighGreen,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Spacer(Modifier.height(12.dp))
            Button(
                onClick  = onDeepScanClick,
                modifier = Modifier.fillMaxWidth(),
                colors   = ButtonDefaults.buttonColors(containerColor = Secondary),
                shape    = RoundedCornerShape(12.dp)
            ) {
                Text(
                    "심층 디스크 스캔 시작",
                    color = Color.Black,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
        }
    }
}

@Composable
private fun DeepScanningSection(progress: com.filerecovery.domain.model.ScanProgress) {
    val infiniteTransition = rememberInfiniteTransition(label = "deepScan")
    val pulse by infiniteTransition.animateFloat(
        initialValue  = 0.6f,
        targetValue   = 1.0f,
        animationSpec = infiniteRepeatable(tween(1200, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label         = "deepPulse"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors   = CardDefaults.cardColors(containerColor = CardBg),
        shape    = RoundedCornerShape(20.dp),
        border   = BorderStroke(1.dp, Secondary.copy(alpha = 0.3f))
    ) {
        Column(
            modifier = Modifier.padding(20.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("🔍", fontSize = 20.sp)
                Spacer(Modifier.width(8.dp))
                Text(
                    "심층 디스크 스캔 중...",
                    color = Secondary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }

            Spacer(Modifier.height(16.dp))

            // 진행률 바
            LinearProgressIndicator(
                progress   = { progress.deepScanProgress.coerceIn(0f, 1f) },
                modifier   = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color      = Secondary,
                trackColor = Secondary.copy(alpha = 0.15f)
            )

            Spacer(Modifier.height(8.dp))

            // 진행 정보
            Row(
                modifier              = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    "${(progress.deepScanProgress * 100).toInt()}%",
                    color    = Secondary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "${progress.deepScanScannedMB} / ${progress.deepScanTotalMB} MB",
                    color    = TextSecond,
                    fontSize = 12.sp
                )
            }

            Spacer(Modifier.height(12.dp))

            // 발견 파일 카운트
            Row(
                modifier              = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                ScanCountChip("사진",  progress.imageCount,    Primary)
                ScanCountChip("영상",  progress.videoCount,    Secondary)
                ScanCountChip("음악",  progress.audioCount,    HighGreen)
                ScanCountChip("문서",  progress.documentCount, MedYellow)
            }
        }
    }
}

@Composable
private fun RootRequiredHint() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors   = CardDefaults.cardColors(containerColor = CardBg.copy(alpha = 0.7f)),
        shape    = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier          = Modifier.padding(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            Text("🔒", fontSize = 14.sp)
            Spacer(Modifier.width(8.dp))
            Column {
                Text(
                    "심층 복구에는 루트 권한이 필요합니다",
                    color      = TextPrimary,
                    fontSize   = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    "Magisk 또는 KernelSU로 루트를 설정하면\n완전 삭제된 파일도 복구할 수 있습니다.",
                    color      = TextSecond,
                    fontSize   = 11.sp,
                    lineHeight = 16.sp
                )
            }
        }
    }
}

@Composable
private fun DataProtectionTips() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors   = CardDefaults.cardColors(containerColor = CardBg),
        shape    = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("데이터 보호 팁", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(Modifier.height(10.dp))
            listOf(
                "중요한 파일은 클라우드에 즉시 백업하세요",
                "파일 삭제 후 새 데이터 기록 전에 빠르게 복구하세요",
                "정기적으로 스캔하여 복구 가능 파일을 확인하세요"
            ).forEach { tip ->
                Row(modifier = Modifier.padding(vertical = 4.dp)) {
                    Text("• ", color = Primary)
                    Text(tip, color = TextSecond, fontSize = 13.sp)
                }
            }
        }
    }
}

private fun formatBytes(bytes: Long): String = when {
    bytes >= 1_073_741_824L -> "%.1f GB".format(bytes / 1_073_741_824.0)
    bytes >= 1_048_576L     -> "%.1f MB".format(bytes / 1_048_576.0)
    else                    -> "%.1f KB".format(bytes / 1_024.0)
}
