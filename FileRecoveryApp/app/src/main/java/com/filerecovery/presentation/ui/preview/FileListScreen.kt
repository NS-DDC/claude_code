package com.filerecovery.presentation.ui.preview

import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.domain.model.RecoveryChance
import com.filerecovery.presentation.theme.*
import com.filerecovery.presentation.viewmodel.ScanViewModel

@Composable
fun FileListScreen(
    category: FileCategory,
    onRecoverClick: (List<RecoverableFile>) -> Unit,
    onTestRecover: ((List<RecoverableFile>) -> Unit)? = null,
    vm: ScanViewModel = viewModel()
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val files = remember(state.files, category) {
        state.files.filter { it.category == category }
    }
    val selected = remember(category) { mutableStateListOf<String>() }

    // 문서 프리뷰 상태
    var previewFile by remember { mutableStateOf<RecoverableFile?>(null) }

    Scaffold(
        containerColor = Background,
        bottomBar = {
            if (selected.isNotEmpty()) {
                RecoverBottomBar(
                    selectedCount = selected.size,
                    onRecover = {
                        val toRecover = files.filter { it.id in selected }
                        onRecoverClick(toRecover)
                    },
                    onTestRecover = if (onTestRecover != null) {
                        {
                            val toRecover = files.filter { it.id in selected }
                            onTestRecover(toRecover)
                        }
                    } else null
                )
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = if (category == FileCategory.IMAGE) 4.dp else 16.dp)
        ) {
            // 헤더
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = if (category == FileCategory.IMAGE) 12.dp else 0.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "${categoryTitle(category)} - ${files.size}개 발견",
                        color = TextPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = if (category == FileCategory.IMAGE) "탭하여 선택 · 길게 눌러 미리보기"
                        else "파일을 선택하고 '복구' 버튼을 누르세요",
                        color = TextSecond,
                        fontSize = 13.sp
                    )
                }
                // 전체선택 버튼
                if (files.isNotEmpty()) {
                    TextButton(onClick = {
                        if (selected.size == files.size) {
                            selected.clear()
                        } else {
                            selected.clear()
                            selected.addAll(files.map { it.id })
                        }
                    }) {
                        Text(
                            if (selected.size == files.size) "선택 해제" else "전체 선택",
                            color = Primary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
            Spacer(Modifier.height(12.dp))

            // ── 카테고리별 다른 레이아웃 ──
            when (category) {
                FileCategory.IMAGE -> {
                    // 사진: 갤러리 그리드 (3열)
                    PhotoGalleryGrid(
                        files = files,
                        selected = selected,
                        onToggle = { id ->
                            if (id in selected) selected.remove(id) else selected.add(id)
                        }
                    )
                }
                FileCategory.DOCUMENT -> {
                    // 문서: 리스트 + 프리뷰 버튼
                    DocumentList(
                        files = files,
                        selected = selected,
                        onToggle = { id ->
                            if (id in selected) selected.remove(id) else selected.add(id)
                        },
                        onPreview = { file -> previewFile = file }
                    )
                }
                else -> {
                    // 동영상, 오디오: 기존 리스트
                    DefaultFileList(
                        files = files,
                        selected = selected,
                        onToggle = { id ->
                            if (id in selected) selected.remove(id) else selected.add(id)
                        }
                    )
                }
            }
        }
    }

    // 문서 프리뷰 다이얼로그
    previewFile?.let { file ->
        DocumentPreviewDialog(
            file = file,
            onDismiss = { previewFile = null }
        )
    }
}

// ═══════════════════════════════════════════════
// 사진: 갤러리 그리드 (3열)
// ═══════════════════════════════════════════════

@Composable
private fun PhotoGalleryGrid(
    files: List<RecoverableFile>,
    selected: List<String>,
    onToggle: (String) -> Unit
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(3),
        horizontalArrangement = Arrangement.spacedBy(3.dp),
        verticalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        items(files, key = { it.id }) { file ->
            val isSelected = file.id in selected
            PhotoGridItem(
                file = file,
                isSelected = isSelected,
                onToggle = { onToggle(file.id) }
            )
        }
    }
}

@Composable
private fun PhotoGridItem(
    file: RecoverableFile,
    isSelected: Boolean,
    onToggle: () -> Unit
) {
    Box(
        modifier = Modifier
            .aspectRatio(1f)
            .clip(RoundedCornerShape(4.dp))
            .clickable { onToggle() }
            .then(
                if (isSelected) Modifier.border(3.dp, Primary, RoundedCornerShape(4.dp))
                else Modifier
            )
    ) {
        // 썸네일 이미지
        if (file.uri != null) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(file.thumbnailUri ?: file.uri)
                    .crossfade(true)
                    .build(),
                contentDescription = file.name,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            Box(
                modifier = Modifier.fillMaxSize().background(Surface),
                contentAlignment = Alignment.Center
            ) {
                Text("🖼", fontSize = 28.sp)
            }
        }

        // 선택 체크 표시
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(4.dp)
                .size(24.dp)
                .clip(CircleShape)
                .background(
                    if (isSelected) Primary
                    else Color.Black.copy(alpha = 0.4f)
                ),
            contentAlignment = Alignment.Center
        ) {
            if (isSelected) {
                Text("✓", color = Color.Black, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }
        }

        // 하단 복구 가능성 표시
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(4.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(Color.Black.copy(alpha = 0.6f))
                .padding(horizontal = 4.dp, vertical = 2.dp)
        ) {
            val chanceColor = when (file.recoveryChance) {
                RecoveryChance.HIGH   -> HighGreen
                RecoveryChance.MEDIUM -> MedYellow
                RecoveryChance.LOW    -> LowRed
            }
            Text(
                text = formatBytes(file.size),
                color = chanceColor,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

// ═══════════════════════════════════════════════
// 문서: 리스트 + 프리뷰 버튼
// ═══════════════════════════════════════════════

@Composable
private fun DocumentList(
    files: List<RecoverableFile>,
    selected: List<String>,
    onToggle: (String) -> Unit,
    onPreview: (RecoverableFile) -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(files, key = { it.id }) { file ->
            val isSelected = file.id in selected
            DocumentItemCard(
                file = file,
                isSelected = isSelected,
                onToggle = { onToggle(file.id) },
                onPreview = { onPreview(file) }
            )
        }
    }
}

@Composable
private fun DocumentItemCard(
    file: RecoverableFile,
    isSelected: Boolean,
    onToggle: () -> Unit,
    onPreview: () -> Unit
) {
    val borderColor = if (isSelected) Primary else Color.Transparent

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() }
            .border(1.5.dp, borderColor, RoundedCornerShape(14.dp)),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) CardBg.copy(alpha = 0.8f) else CardBg
        ),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 문서 아이콘
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Surface),
                contentAlignment = Alignment.Center
            ) {
                Text(extToEmoji(file.extension), fontSize = 26.sp)
            }

            Spacer(Modifier.width(12.dp))

            // 파일 정보
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = file.name,
                    color = TextPrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(3.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(formatBytes(file.size), color = TextSecond, fontSize = 11.sp)
                    Text("•", color = TextSecond, fontSize = 11.sp)
                    Text(file.extension.uppercase(), color = TextSecond, fontSize = 11.sp)
                    Text("•", color = TextSecond, fontSize = 11.sp)
                    Text(formatDate(file.lastModified), color = TextSecond, fontSize = 11.sp)
                }
                Spacer(Modifier.height(6.dp))
                RecoveryChanceChip(file.recoveryChance)
            }

            // 프리뷰 버튼
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                IconButton(
                    onClick = onPreview,
                    modifier = Modifier.size(36.dp)
                ) {
                    Text("👁", fontSize = 18.sp)
                }
                Checkbox(
                    checked = isSelected,
                    onCheckedChange = { onToggle() },
                    colors = CheckboxDefaults.colors(
                        checkedColor = Primary,
                        uncheckedColor = TextSecond
                    ),
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
private fun DocumentPreviewDialog(file: RecoverableFile, onDismiss: () -> Unit) {
    val context = LocalContext.current

    Dialog(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(Surface)
                .padding(24.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(extToEmoji(file.extension), fontSize = 48.sp)
            Spacer(Modifier.height(12.dp))
            Text(
                file.name,
                color = TextPrimary,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(Modifier.height(16.dp))

            // 상세 정보
            listOf(
                "파일 형식" to file.extension.uppercase(),
                "파일 크기" to formatBytes(file.size),
                "수정 날짜" to formatDate(file.lastModified),
                "복구 가능성" to when (file.recoveryChance) {
                    RecoveryChance.HIGH   -> "높음 ✅"
                    RecoveryChance.MEDIUM -> "보통 ⚠️"
                    RecoveryChance.LOW    -> "낮음 ❌"
                },
                "헤더 상태" to if (file.headerIntact) "정상" else "손상 가능"
            ).forEach { (label, value) ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(label, color = TextSecond, fontSize = 13.sp)
                    Text(value, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }
            }

            Spacer(Modifier.height(16.dp))

            // 외부 앱으로 열기 시도
            if (file.uri != null) {
                OutlinedButton(
                    onClick = {
                        tryOpenWith(context, file)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary)
                ) {
                    Text("외부 앱으로 미리보기", fontSize = 14.sp)
                }
                Spacer(Modifier.height(8.dp))
            }

            TextButton(onClick = onDismiss) {
                Text("닫기", color = TextSecond)
            }
        }
    }
}

private fun tryOpenWith(context: Context, file: RecoverableFile) {
    try {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(file.uri, mimeTypeOf(file.extension))
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(intent)
    } catch (_: Exception) {
        Toast.makeText(context, "이 파일을 열 수 있는 앱이 없습니다", Toast.LENGTH_SHORT).show()
    }
}

private fun mimeTypeOf(ext: String) = when (ext.lowercase()) {
    "pdf"         -> "application/pdf"
    "docx", "doc" -> "application/msword"
    "xlsx", "xls" -> "application/vnd.ms-excel"
    "pptx", "ppt" -> "application/vnd.ms-powerpoint"
    "txt"         -> "text/plain"
    else          -> "application/*"
}

// ═══════════════════════════════════════════════
// 기본 파일 리스트 (동영상, 오디오)
// ═══════════════════════════════════════════════

@Composable
private fun DefaultFileList(
    files: List<RecoverableFile>,
    selected: List<String>,
    onToggle: (String) -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(files, key = { it.id }) { file ->
            val isSelected = file.id in selected
            DefaultFileItemCard(
                file = file,
                isSelected = isSelected,
                onToggle = { onToggle(file.id) }
            )
        }
    }
}

@Composable
private fun DefaultFileItemCard(
    file: RecoverableFile,
    isSelected: Boolean,
    onToggle: () -> Unit
) {
    val borderColor = if (isSelected) Primary else Color.Transparent

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() }
            .border(1.5.dp, borderColor, RoundedCornerShape(14.dp)),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) CardBg.copy(alpha = 0.8f) else CardBg
        ),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            FileThumbnail(file = file)
            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = file.name,
                    color = TextPrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(3.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(formatBytes(file.size), color = TextSecond, fontSize = 11.sp)
                    Text("•", color = TextSecond, fontSize = 11.sp)
                    Text(formatDate(file.lastModified), color = TextSecond, fontSize = 11.sp)
                }
                Spacer(Modifier.height(6.dp))
                RecoveryChanceChip(file.recoveryChance)
            }

            Checkbox(
                checked = isSelected,
                onCheckedChange = { onToggle() },
                colors = CheckboxDefaults.colors(
                    checkedColor = Primary,
                    uncheckedColor = TextSecond
                )
            )
        }
    }
}

@Composable
private fun FileThumbnail(file: RecoverableFile) {
    val modifier = Modifier
        .size(64.dp)
        .clip(RoundedCornerShape(10.dp))
        .background(Surface)

    when (file.category) {
        FileCategory.IMAGE, FileCategory.VIDEO -> {
            if (file.uri != null) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(file.thumbnailUri ?: file.uri)
                        .crossfade(true)
                        .build(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = modifier
                )
            } else {
                PlaceholderIcon(modifier, if (file.category == FileCategory.IMAGE) "🖼" else "🎬")
            }
        }
        FileCategory.AUDIO -> PlaceholderIcon(modifier, "🎵")
        FileCategory.DOCUMENT -> PlaceholderIcon(modifier, extToEmoji(file.extension))
    }
}

@Composable
private fun PlaceholderIcon(modifier: Modifier, emoji: String) {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Text(emoji, fontSize = 26.sp)
    }
}

// ═══════════════════════════════════════════════
// 공통 컴포넌트
// ═══════════════════════════════════════════════

@Composable
private fun RecoveryChanceChip(chance: RecoveryChance) {
    val (color, label) = when (chance) {
        RecoveryChance.HIGH   -> Pair(HighGreen, "복구 가능성 높음")
        RecoveryChance.MEDIUM -> Pair(MedYellow, "복구 가능성 보통")
        RecoveryChance.LOW    -> Pair(LowRed, "복구 가능성 낮음")
    }
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(alpha = 0.15f))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(label, color = color, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun RecoverBottomBar(
    selectedCount: Int,
    onRecover: () -> Unit,
    onTestRecover: (() -> Unit)?
) {
    Surface(color = CardBg, shadowElevation = 8.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "${selectedCount}개 선택됨",
                color = TextPrimary,
                fontWeight = FontWeight.Medium
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // ✅ 테스트 복구 버튼 (결제 없이 복구 테스트)
                if (onTestRecover != null) {
                    OutlinedButton(
                        onClick = onTestRecover,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = MedYellow)
                    ) {
                        Text("🧪 TEST", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
                Button(
                    onClick = onRecover,
                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("복구하기", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════
// 유틸
// ═══════════════════════════════════════════════

private fun categoryTitle(cat: FileCategory) = when (cat) {
    FileCategory.IMAGE    -> "사진"
    FileCategory.VIDEO    -> "동영상"
    FileCategory.AUDIO    -> "오디오"
    FileCategory.DOCUMENT -> "문서"
}

private fun extToEmoji(ext: String) = when (ext) {
    "pdf"         -> "📕"
    "docx", "doc" -> "📘"
    "xlsx", "xls" -> "📗"
    "pptx", "ppt" -> "📙"
    else          -> "📄"
}

private fun formatBytes(bytes: Long): String = when {
    bytes >= 1_073_741_824L -> "%.1f GB".format(bytes / 1_073_741_824.0)
    bytes >= 1_048_576L     -> "%.1f MB".format(bytes / 1_048_576.0)
    bytes >= 1_024L         -> "%.0f KB".format(bytes / 1_024.0)
    else                    -> "${bytes}B"
}

private fun formatDate(epochMs: Long): String {
    val sdf = java.text.SimpleDateFormat("yy.MM.dd", java.util.Locale.getDefault())
    return sdf.format(java.util.Date(epochMs))
}
