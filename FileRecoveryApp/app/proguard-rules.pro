# FileRecoveryApp ProGuard Rules

# Keep data classes used by Compose
-keep class com.filerecovery.domain.model.** { *; }
-keep class com.filerecovery.presentation.viewmodel.** { *; }

# Google Play Billing
-keep class com.android.vending.billing.** { *; }
-keep class com.android.billingclient.** { *; }

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# Coil
-dontwarn coil.**
-keep class coil.** { *; }

# Keep Compose runtime
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**
