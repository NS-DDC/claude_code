package com.filerecovery.presentation.ui.preview

import android.content.Context
import android.content.Intent
import android.widget.MediaController
import android.widget.Toast
import android.widget.VideoView
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.domain.model.RecoveryChance
import com.filerecovery.presentation.theme.*
import com.filerecovery.presentation.viewmodel.ScanViewModel

// ═══════════════════════════════════════════════
// 정렬 옵션
// ═══════════════════════════════════════════════

enum class SortOrder(val label: String) {
    DATE_DESC("최신순"),
    DATE_ASC("오래된순"),
    SIZE_DESC("크기 큰순"),
    SIZE_ASC("크기 작은순"),
    NAME_ASC("이름순"),
    CHANCE("복구 가능성순")
}

// ═══════════════════════════════════════════════
// 메인 화면
// ═══════════════════════════════════════════════

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

    // ── 검색/정렬/필터 상태 ──────────────────────
    var searchQuery   by remember { mutableStateOf("") }
    var sortOrder     by remember { mutableStateOf(SortOrder.DATE_DESC) }
    var filterChances by remember { mutableStateOf(emptySet<RecoveryChance>()) }

    // ── 미리보기 상태 ────────────────────────────
    var previewDocFile   by remember { mutableStateOf<RecoverableFile?>(null) } // 문서 프리뷰
    var photoViewerFile  by remember { mutableStateOf<RecoverableFile?>(null) } // 사진 전체화면
    var videoPlayerFile  by remember { mutableStateOf<RecoverableFile?>(null) } // 동영상 재생

    // ── 필터+정렬 적용 결과 ──────────────────────
    val displayFiles = remember(files, searchQuery, sortOrder, filterChances) {
        files
            .filter { file ->
                (searchQuery.isEmpty() || file.name.contains(searchQuery, ignoreCase = true)) &&
                (filterChances.isEmpty() || file.recoveryChance in filterChances)
            }
            .let { list ->
                when (sortOrder) {
                    SortOrder.DATE_DESC -> list.sortedByDescending { it.lastModified }
                    SortOrder.DATE_ASC  -> list.sortedBy { it.lastModified }
                    SortOrder.SIZE_DESC -> list.sortedByDescending { it.size }
                    SortOrder.SIZE_ASC  -> list.sortedBy { it.size }
                    SortOrder.NAME_ASC  -> list.sortedBy { it.name.lowercase() }
                    SortOrder.CHANCE    -> list.sortedBy { it.recoveryChance.ordinal }
                }
            }
    }

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
            Spacer(Modifier.height(12.dp))

            // ── 헤더 ─────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = if (category == FileCategory.IMAGE) 12.dp else 0.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "${categoryTitle(category)} ${files.size}개 발견" +
                            if (displayFiles.size != files.size) " (${displayFiles.size}개 표시)" else "",
                        color = TextPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = when (category) {
                            FileCategory.IMAGE -> "탭: 선택 · 길게 누르기: 전체화면 미리보기"
                            FileCategory.VIDEO -> "▶ 버튼으로 동영상 재생"
                            else               -> "파일을 선택하고 '복구' 버튼을 누르세요"
                        },
                        color = TextSecond,
                        fontSize = 12.sp
                    )
                }
                // 전체선택 버튼
                if (displayFiles.isNotEmpty()) {
                    val allSelected = displayFiles.all { it.id in selected }
                    TextButton(onClick = {
                        if (allSelected) {
                            selected.removeAll(displayFiles.map { it.id }.toSet())
                        } else {
                            val ids = displayFiles.map { it.id }
                            selected.addAll(ids.filterNot { it in selected })
                        }
                    }) {
                        Text(
                            if (allSelected) "선택 해제" else "전체 선택",
                            color = Primary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Spacer(Modifier.height(10.dp))

            // ── 검색/정렬/필터 바 ─────────────────────
            SearchSortFilterBar(
                query         = searchQuery,
                onQueryChange = { searchQuery = it },
                sortOrder     = sortOrder,
                onSortChange  = { sortOrder = it },
                filterChances = filterChances,
                onFilterChange = { filterChances = it }
            )

            Spacer(Modifier.height(10.dp))

            // ── 빈 화면 처리 ─────────────────────────
            if (displayFiles.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            if (files.isEmpty()) "발견된 파일 없음" else "검색 결과 없음",
                            color = TextSecond, fontSize = 16.sp
                        )
                        if (searchQuery.isNotEmpty() || filterChances.isNotEmpty()) {
                            Spacer(Modifier.height(8.dp))
                            TextButton(onClick = {
                                searchQuery = ""
                                filterChances = emptySet()
                            }) {
                                Text("필터 초기화", color = Primary, fontSize = 13.sp)
                            }
                        }
                    }
                }
            } else {
                // ── 카테고리별 레이아웃 ─────────────────
                when (category) {
                    FileCategory.IMAGE -> PhotoGalleryGrid(
                        files       = displayFiles,
                        selected    = selected,
                        onToggle    = { id -> if (id in selected) selected.remove(id) else selected.add(id) },
                        onLongClick = { file -> photoViewerFile = file }
                    )
                    FileCategory.DOCUMENT -> DocumentList(
                        files    = displayFiles,
                        selected = selected,
                        onToggle = { id -> if (id in selected) selected.remove(id) else selected.add(id) },
                        onPreview = { file -> previewDocFile = file }
                    )
                    FileCategory.VIDEO -> DefaultFileList(
                        files    = displayFiles,
                        selected = selected,
                        onToggle = { id -> if (id in selected) selected.remove(id) else selected.add(id) },
                        onPreview = { file -> videoPlayerFile = file }
                    )
                    else -> DefaultFileList(
                        files    = displayFiles,
                        selected = selected,
                        onToggle = { id -> if (id in selected) selected.remove(id) else selected.add(id) },
                        onPreview = null
                    )
                }
            }
        }
    }

    // ── 다이얼로그 ────────────────────────────────
    previewDocFile?.let { file ->
        DocumentPreviewDialog(file = file, onDismiss = { previewDocFile = null })
    }
    photoViewerFile?.let { file ->
        PhotoViewerDialog(file = file, onDismiss = { photoViewerFile = null })
    }
    videoPlayerFile?.let { file ->
        VideoPlayerDialog(file = file, onDismiss = { videoPlayerFile = null })
    }
}

// ═══════════════════════════════════════════════
// 검색/정렬/필터 바
// ═══════════════════════════════════════════════

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SearchSortFilterBar(
    query:          String,
    onQueryChange:  (String) -> Unit,
    sortOrder:      SortOrder,
    onSortChange:   (SortOrder) -> Unit,
    filterChances:  Set<RecoveryChance>,
    onFilterChange: (Set<RecoveryChance>) -> Unit
) {
    var showSortMenu by remember { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        // 검색 입력창
        OutlinedTextField(
            value          = query,
            onValueChange  = onQueryChange,
            placeholder    = { Text("파일명 검색...", color = TextSecond, fontSize = 14.sp) },
            singleLine     = true,
            modifier       = Modifier.fillMaxWidth(),
            shape          = RoundedCornerShape(12.dp),
            colors         = OutlinedTextFieldDefaults.colors(
                focusedBorderColor   = Primary,
                unfocusedBorderColor = TextSecond.copy(alpha = 0.3f),
                focusedTextColor     = TextPrimary,
                unfocusedTextColor   = TextPrimary,
                cursorColor          = Primary,
                focusedContainerColor   = Surface,
                unfocusedContainerColor = Surface
            ),
            leadingIcon  = { Text("🔍", fontSize = 16.sp, modifier = Modifier.padding(start = 4.dp)) },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton(onClick = { onQueryChange("") }) {
                        Text("✕", color = TextSecond, fontSize = 14.sp)
                    }
                }
            }
        )

        // 정렬 버튼 + 복구 가능성 필터 칩
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(horizontal = 2.dp)
        ) {
            // 정렬 드롭다운 버튼
            item {
                Box {
                    OutlinedButton(
                        onClick = { showSortMenu = true },
                        shape   = RoundedCornerShape(20.dp),
                        colors  = ButtonDefaults.outlinedButtonColors(contentColor = Primary),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Text("정렬: ${sortOrder.label}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Text(" ▾", fontSize = 12.sp)
                    }
                    DropdownMenu(
                        expanded         = showSortMenu,
                        onDismissRequest = { showSortMenu = false },
                        modifier         = Modifier.background(Surface)
                    ) {
                        SortOrder.entries.forEach { order ->
                            DropdownMenuItem(
                                text = {
                                    Text(
                                        order.label,
                                        color      = if (sortOrder == order) Primary else TextPrimary,
                                        fontWeight = if (sortOrder == order) FontWeight.Bold else FontWeight.Normal,
                                        fontSize   = 14.sp
                                    )
                                },
                                onClick = {
                                    onSortChange(order)
                                    showSortMenu = false
                                }
                            )
                        }
                    }
                }
            }

            // 복구 가능성 필터 칩
            item {
                RecoveryFilterChip(
                    label     = "높음",
                    chance    = RecoveryChance.HIGH,
                    color     = HighGreen,
                    selected  = RecoveryChance.HIGH in filterChances,
                    onToggle  = { onFilterChange(filterChances.toggleChance(RecoveryChance.HIGH)) }
                )
            }
            item {
                RecoveryFilterChip(
                    label    = "보통",
                    chance   = RecoveryChance.MEDIUM,
                    color    = MedYellow,
                    selected = RecoveryChance.MEDIUM in filterChances,
                    onToggle = { onFilterChange(filterChances.toggleChance(RecoveryChance.MEDIUM)) }
                )
            }
            item {
                RecoveryFilterChip(
                    label    = "낮음",
                    chance   = RecoveryChance.LOW,
                    color    = LowRed,
                    selected = RecoveryChance.LOW in filterChances,
                    onToggle = { onFilterChange(filterChances.toggleChance(RecoveryChance.LOW)) }
                )
            }
        }
    }
}

private fun Set<RecoveryChance>.toggleChance(c: RecoveryChance) =
    if (c in this) this - c else this + c

@Composable
private fun RecoveryFilterChip(
    label: String, chance: RecoveryChance, color: Color,
    selected: Boolean, onToggle: () -> Unit
) {
    val bg     = if (selected) color.copy(alpha = 0.18f) else Surface
    val border = if (selected) color else TextSecond.copy(alpha = 0.3f)
    Box(
        modifier = Modifier
            .height(34.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(20.dp))
            .clickable { onToggle() }
            .padding(horizontal = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(label, color = if (selected) color else TextSecond, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

// ═══════════════════════════════════════════════
// 사진: 갤러리 그리드 (3열) — 길게 누르면 전체화면
// ═══════════════════════════════════════════════

@Composable
private fun PhotoGalleryGrid(
    files:       List<RecoverableFile>,
    selected:    List<String>,
    onToggle:    (String) -> Unit,
    onLongClick: (RecoverableFile) -> Unit
) {
    LazyVerticalGrid(
        columns              = GridCells.Fixed(3),
        horizontalArrangement = Arrangement.spacedBy(3.dp),
        verticalArrangement   = Arrangement.spacedBy(3.dp)
    ) {
        items(files, key = { it.id }) { file ->
            PhotoGridItem(
                file        = file,
                isSelected  = file.id in selected,
                onToggle    = { onToggle(file.id) },
                onLongClick = { onLongClick(file) }
            )
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun PhotoGridItem(
    file:        RecoverableFile,
    isSelected:  Boolean,
    onToggle:    () -> Unit,
    onLongClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .aspectRatio(1f)
            .clip(RoundedCornerShape(4.dp))
            .combinedClickable(
                onClick     = { onToggle() },
                onLongClick = { onLongClick() }       // 길게 누르기 → 전체화면
            )
            .then(
                if (isSelected) Modifier.border(3.dp, Primary, RoundedCornerShape(4.dp))
                else Modifier
            )
    ) {
        // 썸네일
        if (file.uri != null) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(file.thumbnailUri ?: file.uri)
                    .crossfade(true)
                    .build(),
                contentDescription = file.name,
                contentScale       = ContentScale.Crop,
                modifier           = Modifier.fillMaxSize()
            )
        } else {
            Box(
                modifier = Modifier.fillMaxSize().background(Surface),
                contentAlignment = Alignment.Center
            ) { Text("🖼", fontSize = 28.sp) }
        }

        // 선택 체크
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(4.dp)
                .size(24.dp)
                .clip(CircleShape)
                .background(if (isSelected) Primary else Color.Black.copy(alpha = 0.4f)),
            contentAlignment = Alignment.Center
        ) {
            if (isSelected) Text("✓", color = Color.Black, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }

        // 복구 가능성 + 크기
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(4.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(Color.Black.copy(alpha = 0.6f))
                .padding(horizontal = 4.dp, vertical = 2.dp)
        ) {
            Text(
                text  = formatBytes(file.size),
                color = when (file.recoveryChance) {
                    RecoveryChance.HIGH   -> HighGreen
                    RecoveryChance.MEDIUM -> MedYellow
                    RecoveryChance.LOW    -> LowRed
                },
                fontSize   = 9.sp,
                fontWeight = FontWeight.Bold
            )
        }

        // 미리보기 힌트 아이콘
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(4.dp)
        ) {
            Text("👁", fontSize = 11.sp)
        }
    }
}

// ═══════════════════════════════════════════════
// 사진 전체화면 뷰어 — 핀치 줌 지원
// ═══════════════════════════════════════════════

@Composable
fun PhotoViewerDialog(file: RecoverableFile, onDismiss: () -> Unit) {
    var scale  by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }
    val transformState = rememberTransformableState { zoomChange, panChange, _ ->
        scale = (scale * zoomChange).coerceIn(0.8f, 6f)
        offset = if (scale > 1f) offset + panChange else Offset.Zero
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties       = DialogProperties(usePlatformDefaultWidth = false, dismissOnClickOutside = true)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.95f))
                .clickable { onDismiss() },
            contentAlignment = Alignment.Center
        ) {
            if (file.uri != null) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(file.uri)
                        .crossfade(true)
                        .build(),
                    contentDescription = file.name,
                    contentScale       = ContentScale.Fit,
                    modifier           = Modifier
                        .fillMaxWidth()
                        .graphicsLayer {
                            scaleX       = scale
                            scaleY       = scale
                            translationX = offset.x
                            translationY = offset.y
                        }
                        .transformable(transformState)
                        .clickable(onClick = {})   // 이미지 클릭 시 닫힘 방지
                )
            } else {
                Text("이미지를 불러올 수 없습니다", color = TextSecond)
            }

            // 상단 정보바
            Column(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.5f))
                    .padding(horizontal = 16.dp, vertical = 10.dp)
            ) {
                Text(
                    text       = file.name,
                    color      = Color.White,
                    fontSize   = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines   = 1,
                    overflow   = TextOverflow.Ellipsis
                )
                Text(
                    text     = "${formatBytes(file.size)}  •  ${formatDate(file.lastModified)}",
                    color    = Color.White.copy(alpha = 0.7f),
                    fontSize = 12.sp
                )
            }

            // 닫기 버튼
            IconButton(
                onClick  = onDismiss,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.5f))
                    .size(36.dp)
            ) {
                Text("✕", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }

            // 줌 힌트
            if (scale == 1f) {
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 20.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.Black.copy(alpha = 0.5f))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text("핀치로 확대 · 탭하여 닫기", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════
// 동영상 플레이어 다이얼로그 — VideoView 인앱 재생
// ═══════════════════════════════════════════════

@Composable
fun VideoPlayerDialog(file: RecoverableFile, onDismiss: () -> Unit) {
    val videoViewRef = remember { mutableStateOf<VideoView?>(null) }

    // 다이얼로그 닫힐 때 재생 중단
    DisposableEffect(Unit) {
        onDispose { videoViewRef.value?.stopPlayback() }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties       = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.Black)
        ) {
            // 상단 바
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF1A1A1A))
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment     = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text     = file.name,
                        color    = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text     = formatBytes(file.size),
                        color    = Color.White.copy(alpha = 0.6f),
                        fontSize = 11.sp
                    )
                }
                IconButton(
                    onClick  = onDismiss,
                    modifier = Modifier.size(32.dp)
                ) {
                    Text("✕", color = Color.White, fontSize = 18.sp)
                }
            }

            // VideoView
            if (file.uri != null) {
                AndroidView(
                    factory = { ctx ->
                        VideoView(ctx).also { vv ->
                            videoViewRef.value = vv
                        }.apply {
                            setVideoURI(file.uri)
                            val mc = MediaController(ctx)
                            mc.setAnchorView(this)
                            setMediaController(mc)
                            setOnPreparedListener { mp -> mp.start() }
                            setOnErrorListener { _, what, extra ->
                                // 재생 오류 무시 (Toast는 컴포저블 컨텍스트 밖이라 여기서 처리 어려움)
                                true
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(16f / 9f)
                )
            } else {
                // URI 없음 → 재생 불가 안내
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(16f / 9f)
                        .background(Color(0xFF0D0D0D)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🎬", fontSize = 40.sp)
                        Spacer(Modifier.height(8.dp))
                        Text("동영상을 재생할 수 없습니다", color = TextSecond, fontSize = 14.sp)
                        Text("파일을 먼저 복구해주세요", color = TextSecond, fontSize = 12.sp)
                    }
                }
            }

            // 하단 여백
            Spacer(Modifier.height(8.dp))
        }
    }
}

// ═══════════════════════════════════════════════
// 문서: 리스트 + 프리뷰 버튼
// ═══════════════════════════════════════════════

@Composable
private fun DocumentList(
    files:     List<RecoverableFile>,
    selected:  List<String>,
    onToggle:  (String) -> Unit,
    onPreview: (RecoverableFile) -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(files, key = { it.id }) { file ->
            DocumentItemCard(
                file       = file,
                isSelected = file.id in selected,
                onToggle   = { onToggle(file.id) },
                onPreview  = { onPreview(file) }
            )
        }
    }
}

@Composable
private fun DocumentItemCard(
    file:      RecoverableFile,
    isSelected: Boolean,
    onToggle:  () -> Unit,
    onPreview: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() }
            .border(1.5.dp, if (isSelected) Primary else Color.Transparent, RoundedCornerShape(14.dp)),
        colors = CardDefaults.cardColors(containerColor = if (isSelected) CardBg.copy(alpha = 0.8f) else CardBg),
        shape  = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.size(52.dp).clip(RoundedCornerShape(10.dp)).background(Surface),
                contentAlignment = Alignment.Center
            ) { Text(extToEmoji(file.extension), fontSize = 26.sp) }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text       = file.name,
                    color      = TextPrimary,
                    fontSize   = 14.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines   = 1,
                    overflow   = TextOverflow.Ellipsis
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

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                IconButton(onClick = onPreview, modifier = Modifier.size(36.dp)) {
                    Text("👁", fontSize = 18.sp)
                }
                Checkbox(
                    checked         = isSelected,
                    onCheckedChange = { onToggle() },
                    colors          = CheckboxDefaults.colors(
                        checkedColor   = Primary,
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
                color      = TextPrimary,
                fontSize   = 16.sp,
                fontWeight = FontWeight.Bold,
                textAlign  = TextAlign.Center,
                maxLines   = 2,
                overflow   = TextOverflow.Ellipsis
            )
            Spacer(Modifier.height(16.dp))

            listOf(
                "파일 형식"    to file.extension.uppercase(),
                "파일 크기"    to formatBytes(file.size),
                "수정 날짜"    to formatDate(file.lastModified),
                "복구 가능성"  to when (file.recoveryChance) {
                    RecoveryChance.HIGH   -> "높음 ✅"
                    RecoveryChance.MEDIUM -> "보통 ⚠️"
                    RecoveryChance.LOW    -> "낮음 ❌"
                },
                "헤더 상태"    to if (file.headerIntact) "정상" else "손상 가능"
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
            if (file.uri != null) {
                OutlinedButton(
                    onClick  = { tryOpenWith(context, file) },
                    modifier = Modifier.fillMaxWidth(),
                    shape    = RoundedCornerShape(12.dp),
                    colors   = ButtonDefaults.outlinedButtonColors(contentColor = Primary)
                ) { Text("외부 앱으로 미리보기", fontSize = 14.sp) }
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

// ═══════════════════════════════════════════════
// 기본 파일 리스트 (동영상, 오디오)
// ═══════════════════════════════════════════════

@Composable
private fun DefaultFileList(
    files:     List<RecoverableFile>,
    selected:  List<String>,
    onToggle:  (String) -> Unit,
    onPreview: ((RecoverableFile) -> Unit)?
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(files, key = { it.id }) { file ->
            DefaultFileItemCard(
                file       = file,
                isSelected = file.id in selected,
                onToggle   = { onToggle(file.id) },
                onPreview  = if (onPreview != null && file.category == FileCategory.VIDEO) {
                    { onPreview(file) }
                } else null
            )
        }
    }
}

@Composable
private fun DefaultFileItemCard(
    file:      RecoverableFile,
    isSelected: Boolean,
    onToggle:  () -> Unit,
    onPreview: (() -> Unit)?
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() }
            .border(1.5.dp, if (isSelected) Primary else Color.Transparent, RoundedCornerShape(14.dp)),
        colors = CardDefaults.cardColors(containerColor = if (isSelected) CardBg.copy(alpha = 0.8f) else CardBg),
        shape  = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            FileThumbnail(file = file)
            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text       = file.name,
                    color      = TextPrimary,
                    fontSize   = 14.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines   = 1,
                    overflow   = TextOverflow.Ellipsis
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

            // 동영상 재생 버튼
            if (onPreview != null) {
                IconButton(
                    onClick  = onPreview,
                    modifier = Modifier.size(40.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Primary.copy(alpha = 0.15f))
                            .border(1.dp, Primary.copy(alpha = 0.5f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("▶", color = Primary, fontSize = 14.sp)
                    }
                }
            }

            Checkbox(
                checked         = isSelected,
                onCheckedChange = { onToggle() },
                colors          = CheckboxDefaults.colors(
                    checkedColor   = Primary,
                    uncheckedColor = TextSecond
                )
            )
        }
    }
}

@Composable
private fun FileThumbnail(file: RecoverableFile) {
    val modifier = Modifier.size(64.dp).clip(RoundedCornerShape(10.dp)).background(Surface)
    when (file.category) {
        FileCategory.IMAGE, FileCategory.VIDEO -> {
            if (file.uri != null) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(file.thumbnailUri ?: file.uri).crossfade(true).build(),
                    contentDescription = null,
                    contentScale       = ContentScale.Crop,
                    modifier           = modifier
                )
            } else {
                PlaceholderIcon(modifier, if (file.category == FileCategory.IMAGE) "🖼" else "🎬")
            }
        }
        FileCategory.AUDIO    -> PlaceholderIcon(modifier, "🎵")
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
    onRecover:     () -> Unit,
    onTestRecover: (() -> Unit)?
) {
    Surface(color = CardBg, shadowElevation = 8.dp) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment     = Alignment.CenterVertically
        ) {
            Text("${selectedCount}개 선택됨", color = TextPrimary, fontWeight = FontWeight.Medium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (onTestRecover != null) {
                    OutlinedButton(
                        onClick = onTestRecover,
                        shape   = RoundedCornerShape(12.dp),
                        colors  = ButtonDefaults.outlinedButtonColors(contentColor = MedYellow)
                    ) {
                        Text("🧪 TEST", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
                Button(
                    onClick = onRecover,
                    colors  = ButtonDefaults.buttonColors(containerColor = Primary),
                    shape   = RoundedCornerShape(12.dp)
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

private fun mimeTypeOf(ext: String) = when (ext.lowercase()) {
    "pdf"         -> "application/pdf"
    "docx", "doc" -> "application/msword"
    "xlsx", "xls" -> "application/vnd.ms-excel"
    "pptx", "ppt" -> "application/vnd.ms-powerpoint"
    "txt"         -> "text/plain"
    else          -> "application/*"
}

fun formatBytes(bytes: Long): String = when {
    bytes >= 1_073_741_824L -> "%.1f GB".format(bytes / 1_073_741_824.0)
    bytes >= 1_048_576L     -> "%.1f MB".format(bytes / 1_048_576.0)
    bytes >= 1_024L         -> "%.0f KB".format(bytes / 1_024.0)
    else                    -> "${bytes}B"
}

fun formatDate(epochMs: Long): String {
    val sdf = java.text.SimpleDateFormat("yy.MM.dd", java.util.Locale.getDefault())
    return sdf.format(java.util.Date(epochMs))
}
