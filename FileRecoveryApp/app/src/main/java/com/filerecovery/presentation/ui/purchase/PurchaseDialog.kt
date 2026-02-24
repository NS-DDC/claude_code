package com.filerecovery.presentation.ui.purchase

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.presentation.theme.*

// 평생 무제한권 삭제 → 1일 복구권($1.00) 추가
enum class PurchaseProduct(val productId: String, val title: String, val price: String, val desc: String) {
    ONE_TIME("recover_once", "1회 복구권", "₩1,900", "선택한 파일을 1회 복구"),
    ONE_DAY ("recover_daily",  "1일 복구권",  "$1.00",  "24시간 동안 무제한 복구")
}

@Composable
fun PurchaseDialog(
    filesToRecover: List<RecoverableFile>,
    onDismiss: () -> Unit,
    onPurchase: (PurchaseProduct) -> Unit
) {
    // 기본 선택: ONE_DAY (추천)
    var selected by remember { mutableStateOf(PurchaseProduct.ONE_DAY) }

    Dialog(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .clip(RoundedCornerShape(24.dp))
                .background(Surface)
                .padding(24.dp)
        ) {
            // 헤더
            Text(
                text       = "복구를 시작하려면\n프리미엄이 필요합니다",
                color      = TextPrimary,
                fontSize   = 20.sp,
                fontWeight = FontWeight.ExtraBold,
                textAlign  = TextAlign.Center,
                modifier   = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text      = "${filesToRecover.size}개 파일 복구 준비 완료",
                color     = Primary,
                fontSize  = 14.sp,
                textAlign = TextAlign.Center,
                modifier  = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(20.dp))

            // 상품 선택 (ONE_TIME, ONE_DAY)
            PurchaseProduct.entries.forEach { product ->
                ProductOption(
                    product    = product,
                    isSelected = selected == product,
                    onClick    = { selected = product }
                )
                Spacer(Modifier.height(10.dp))
            }

            Spacer(Modifier.height(8.dp))

            // 혜택 리스트
            listOf(
                "광고 없는 클린 복구 경험",
                "복구 파일 즉시 다운로드",
                "24시간 고객 지원"
            ).forEach {
                Row(modifier = Modifier.padding(vertical = 2.dp)) {
                    Text("✓ ", color = HighGreen, fontSize = 13.sp)
                    Text(it, color = TextSecond, fontSize = 13.sp)
                }
            }

            Spacer(Modifier.height(20.dp))

            // 구매 버튼
            Button(
                onClick  = { onPurchase(selected) },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                colors   = ButtonDefaults.buttonColors(containerColor = Primary),
                shape    = RoundedCornerShape(14.dp)
            ) {
                Text(
                    "${selected.price} 결제하기",
                    color      = Color.Black,
                    fontSize   = 16.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }

            Spacer(Modifier.height(8.dp))
            Text(
                text      = "Google Play 환불 정책 적용 • 안전하게 결제",
                color     = TextSecond,
                fontSize  = 11.sp,
                textAlign = TextAlign.Center,
                modifier  = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun ProductOption(product: PurchaseProduct, isSelected: Boolean, onClick: () -> Unit) {
    val borderColor = if (isSelected) Primary else TextSecond.copy(alpha = 0.3f)
    val bgColor     = if (isSelected) Primary.copy(alpha = 0.08f) else CardBg

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(bgColor)
            .border(1.5.dp, borderColor, RoundedCornerShape(14.dp))
            .clickable { onClick() }
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(product.title, color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                // ONE_DAY에 "추천" 배지
                if (product == PurchaseProduct.ONE_DAY) {
                    Spacer(Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Secondary.copy(alpha = 0.2f))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("추천", color = Secondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Text(product.desc, color = TextSecond, fontSize = 12.sp)
        }
        Text(
            product.price,
            color      = if (isSelected) Primary else TextPrimary,
            fontWeight = FontWeight.ExtraBold,
            fontSize   = 16.sp
        )
    }
}
