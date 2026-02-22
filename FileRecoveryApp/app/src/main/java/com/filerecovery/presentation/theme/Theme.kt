package com.filerecovery.presentation.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Primary      = Color(0xFF00D4FF)   // 밝은 시안 - 신뢰/기술感
val PrimaryDark  = Color(0xFF0099BB)
val Secondary    = Color(0xFF7C4DFF)   // 보라 - 프리미엄
val Background   = Color(0xFF0A0E1A)   // 딥 네이비 배경
val Surface      = Color(0xFF141929)
val CardBg       = Color(0xFF1E2640)
val TextPrimary  = Color(0xFFECEFF4)
val TextSecond   = Color(0xFF8B9AC0)
val HighGreen    = Color(0xFF00E676)   // 복구 가능성 높음
val MedYellow    = Color(0xFFFFD740)   // 중간
val LowRed       = Color(0xFFFF5252)   // 낮음

private val DarkColors = darkColorScheme(
    primary          = Primary,
    secondary        = Secondary,
    background       = Background,
    surface          = Surface,
    onPrimary        = Color.Black,
    onBackground     = TextPrimary,
    onSurface        = TextPrimary
)

@Composable
fun FileRecoveryTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColors,
        content     = content
    )
}
