package com.filerecovery.data.repository

import com.filerecovery.presentation.ui.purchase.PurchaseProduct
import org.junit.Assert.*
import org.junit.Test

/**
 * BillingState sealed class 및 PurchaseProduct enum 단위 테스트
 */
class BillingStateTest {

    // ── BillingState.Idle ──────────────────────

    @Test
    fun `BillingState Idle is object singleton`() {
        val a = BillingState.Idle
        val b = BillingState.Idle
        assertSame(a, b)
    }

    @Test
    fun `BillingState Idle is correctly identified`() {
        val state: BillingState = BillingState.Idle
        assertTrue(state is BillingState.Idle)
        assertFalse(state is BillingState.Loading)
        assertFalse(state is BillingState.Success)
    }

    // ── BillingState.Loading ───────────────────

    @Test
    fun `BillingState Loading is object singleton`() {
        assertSame(BillingState.Loading, BillingState.Loading)
    }

    // ── BillingState.Success ───────────────────

    @Test
    fun `BillingState Success holds ONE_TIME product`() {
        val state = BillingState.Success(PurchaseProduct.ONE_TIME)
        assertEquals(PurchaseProduct.ONE_TIME, state.product)
    }

    @Test
    fun `BillingState Success holds ONE_DAY product`() {
        val state = BillingState.Success(PurchaseProduct.ONE_DAY)
        assertEquals(PurchaseProduct.ONE_DAY, state.product)
    }

    @Test
    fun `BillingState Success equality based on product`() {
        val a = BillingState.Success(PurchaseProduct.ONE_TIME)
        val b = BillingState.Success(PurchaseProduct.ONE_TIME)
        assertEquals(a, b)
    }

    @Test
    fun `BillingState Success with different products are not equal`() {
        val a = BillingState.Success(PurchaseProduct.ONE_TIME)
        val b = BillingState.Success(PurchaseProduct.ONE_DAY)
        assertNotEquals(a, b)
    }

    // ── BillingState.Error ─────────────────────

    @Test
    fun `BillingState Error holds error message`() {
        val msg   = "결제 오류: 네트워크 연결을 확인하세요"
        val state = BillingState.Error(msg)
        assertEquals(msg, state.message)
    }

    @Test
    fun `BillingState Error equality based on message`() {
        val a = BillingState.Error("에러")
        val b = BillingState.Error("에러")
        assertEquals(a, b)
    }

    @Test
    fun `BillingState Error with different messages are not equal`() {
        val a = BillingState.Error("에러 A")
        val b = BillingState.Error("에러 B")
        assertNotEquals(a, b)
    }

    // ── BillingState.AlreadyPurchased ─────────

    @Test
    fun `BillingState AlreadyPurchased is object singleton`() {
        assertSame(BillingState.AlreadyPurchased, BillingState.AlreadyPurchased)
    }

    // ── when 분기 테스트 ───────────────────────

    @Test
    fun `BillingState when branch correctly identifies all states`() {
        val states = listOf(
            BillingState.Idle,
            BillingState.Loading,
            BillingState.Success(PurchaseProduct.ONE_TIME),
            BillingState.Error("test"),
            BillingState.AlreadyPurchased
        )

        val labels = states.map { state ->
            when (state) {
                is BillingState.Idle             -> "idle"
                is BillingState.Loading          -> "loading"
                is BillingState.Success          -> "success:${state.product.productId}"
                is BillingState.Error            -> "error:${state.message}"
                is BillingState.AlreadyPurchased -> "purchased"
            }
        }

        assertEquals(listOf(
            "idle",
            "loading",
            "success:recover_once",
            "error:test",
            "purchased"
        ), labels)
    }
}

// ═══════════════════════════════════════════════
// PurchaseProduct enum 테스트
// ═══════════════════════════════════════════════

class PurchaseProductTest {

    @Test
    fun `PurchaseProduct has exactly 2 products after removing UNLIMITED`() {
        assertEquals(2, PurchaseProduct.entries.size)
    }

    @Test
    fun `PurchaseProduct entries are ONE_TIME and ONE_DAY`() {
        val ids = PurchaseProduct.entries.map { it.productId }.toSet()
        assertTrue("recover_once"  in ids)
        assertTrue("recover_daily" in ids)
        // 평생권은 제거됨
        assertFalse("recover_lifetime" in ids)
    }

    @Test
    fun `ONE_TIME has correct productId and Korean currency price`() {
        assertEquals("recover_once", PurchaseProduct.ONE_TIME.productId)
        assertTrue(PurchaseProduct.ONE_TIME.price.contains("₩"))
    }

    @Test
    fun `ONE_DAY has correct productId and dollar price`() {
        assertEquals("recover_daily", PurchaseProduct.ONE_DAY.productId)
        assertTrue(PurchaseProduct.ONE_DAY.price.contains("$"))
        assertEquals("$1.00", PurchaseProduct.ONE_DAY.price)
    }

    @Test
    fun `ONE_DAY desc mentions 24 hours`() {
        assertTrue(PurchaseProduct.ONE_DAY.desc.contains("24"))
    }

    @Test
    fun `All PurchaseProduct have non-empty title desc and price`() {
        PurchaseProduct.entries.forEach { product ->
            assertTrue("${product.name} title should not be blank", product.title.isNotBlank())
            assertTrue("${product.name} desc should not be blank", product.desc.isNotBlank())
            assertTrue("${product.name} price should not be blank", product.price.isNotBlank())
            assertTrue("${product.name} productId should not be blank", product.productId.isNotBlank())
        }
    }
}
