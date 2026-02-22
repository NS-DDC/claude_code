package com.filerecovery.data.repository

import android.app.Activity
import android.content.Context
import android.util.Log
import com.android.billingclient.api.*
import com.filerecovery.presentation.ui.purchase.PurchaseProduct
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

sealed class BillingState {
    object Idle : BillingState()
    object Loading : BillingState()
    data class Success(val product: PurchaseProduct) : BillingState()
    data class Error(val message: String) : BillingState()
    object AlreadyPurchased : BillingState()
}

/**
 * Google Play Billing Library 7.x 기반 결제 처리
 *
 * [수정 사항]
 * - ✅ Handler.postDelayed → CoroutineScope delay (라이프사이클 안전)
 * - enablePendingPurchases(PendingPurchasesParams) — 7.x deprecated API 대응
 * - 서비스 재연결 로직 (지수 백오프)
 * - acknowledgePurchase 실패 시 재시도
 */
class BillingRepository(private val context: Context) {

    companion object {
        private const val TAG = "BillingRepo"
        private const val MAX_RETRY = 3
    }

    private val _billingState = MutableStateFlow<BillingState>(BillingState.Idle)
    val billingState: StateFlow<BillingState> = _billingState

    private var billingClient: BillingClient? = null

    @Volatile
    private var productDetailsList: List<ProductDetails> = emptyList()

    private var retryCount = 0

    // ✅ FIX: CoroutineScope 사용 — release() 시 자동 취소
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    fun init() {
        billingClient = BillingClient.newBuilder(context)
            .setListener { billingResult, purchases ->
                handlePurchaseUpdate(billingResult, purchases)
            }
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .build()
            )
            .build()

        startConnection()
    }

    private fun startConnection() {
        billingClient?.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    retryCount = 0
                    queryProducts()
                    checkExistingPurchases()
                } else {
                    Log.w(TAG, "Billing setup failed: ${result.debugMessage}")
                }
            }

            override fun onBillingServiceDisconnected() {
                // ✅ FIX: 코루틴 기반 재연결 (라이프사이클 안전 — release() 시 scope 취소)
                if (retryCount < MAX_RETRY) {
                    retryCount++
                    val delay = (1000L * retryCount)
                    scope.launch {
                        delay(delay)
                        startConnection()
                    }
                    Log.w(TAG, "Billing disconnected, retry #$retryCount in ${delay}ms")
                }
            }
        })
    }

    private fun queryProducts() {
        val productList = PurchaseProduct.entries.map {
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(it.productId)
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
        }
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        billingClient?.queryProductDetailsAsync(params) { _, details ->
            productDetailsList = details
        }
    }

    private fun checkExistingPurchases() {
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.INAPP)
            .build()
        billingClient?.queryPurchasesAsync(params) { _, purchases ->
            val hasLifetime = purchases.any { p ->
                p.products.contains(PurchaseProduct.UNLIMITED.productId) &&
                    p.purchaseState == Purchase.PurchaseState.PURCHASED
            }
            if (hasLifetime) _billingState.value = BillingState.AlreadyPurchased
        }
    }

    fun launchPurchase(activity: Activity, product: PurchaseProduct) {
        if (_billingState.value is BillingState.AlreadyPurchased) {
            return
        }

        _billingState.value = BillingState.Loading
        val details = productDetailsList.find { it.productId == product.productId }
            ?: run {
                _billingState.value = BillingState.Error("상품 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.")
                return
            }

        val productDetailsParam = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(details)
            .build()

        val flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(productDetailsParam))
            .build()

        billingClient?.launchBillingFlow(activity, flowParams)
    }

    private fun handlePurchaseUpdate(result: BillingResult, purchases: List<Purchase>?) {
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                if (purchases.isNullOrEmpty()) {
                    Log.w(TAG, "OK response but no purchases")
                    _billingState.value = BillingState.Idle
                    return
                }
                purchases.forEach { purchase ->
                    if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                        acknowledgePurchase(purchase)
                        val product = PurchaseProduct.entries.firstOrNull {
                            purchase.products.contains(it.productId)
                        }
                        if (product != null) {
                            _billingState.value = BillingState.Success(product)
                        }
                    }
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED ->
                _billingState.value = BillingState.Idle
            else ->
                _billingState.value = BillingState.Error("결제 오류: ${result.debugMessage}")
        }
    }

    // ✅ FIX: 코루틴 기반 acknowledge 재시도
    private fun acknowledgePurchase(purchase: Purchase, attempt: Int = 0) {
        if (purchase.isAcknowledged) return
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()
        billingClient?.acknowledgePurchase(params) { result ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                Log.e(TAG, "Acknowledge failed: ${result.debugMessage}")
                if (attempt < 2) {
                    scope.launch {
                        delay(1000L)
                        acknowledgePurchase(purchase, attempt + 1)
                    }
                }
            }
        }
    }

    fun release() {
        scope.cancel()  // ✅ FIX: 모든 대기 중인 코루틴 취소
        billingClient?.endConnection()
        billingClient = null
    }
}
