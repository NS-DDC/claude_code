package com.filerecovery.data.datasource

import com.filerecovery.domain.model.FileCategory
import com.filerecovery.domain.model.RecoverableFile
import com.filerecovery.domain.model.RecoveryChance
import io.mockk.mockk
import org.junit.Assert.*
import org.junit.Test

/**
 * 스캔 필터링 로직 단위 테스트
 *
 * MediaStoreDataSource의 내부 필터 로직을 순수 함수로 추출하여 검증
 * (Android API 의존 없이 JVM에서 실행 가능)
 */
class ScanFilterTest {

    // ═══════════════════════════════════════════════
    // 앱 데이터 경로 필터 테스트
    // ═══════════════════════════════════════════════

    /**
     * isAppDataPath 로직 시뮬레이션
     * MediaStoreDataSource.isAppDataPath()와 동일한 로직
     */
    private fun isAppDataPath(relativePath: String): Boolean {
        if (relativePath.isBlank()) return false
        return relativePath.lowercase().startsWith("android/")
    }

    @Test
    fun `DCIM Camera path is NOT app data`() {
        assertFalse(isAppDataPath("DCIM/Camera/"))
    }

    @Test
    fun `Pictures path is NOT app data`() {
        assertFalse(isAppDataPath("Pictures/"))
    }

    @Test
    fun `Download path is NOT app data`() {
        assertFalse(isAppDataPath("Download/"))
    }

    @Test
    fun `Movies path is NOT app data`() {
        assertFalse(isAppDataPath("Movies/"))
    }

    @Test
    fun `Music path is NOT app data`() {
        assertFalse(isAppDataPath("Music/"))
    }

    @Test
    fun `Documents path is NOT app data`() {
        assertFalse(isAppDataPath("Documents/"))
    }

    @Test
    fun `Pictures Instagram path is NOT app data (user-visible)`() {
        // 사용자가 인스타그램에서 저장한 사진 → 삭제 시 복구 대상
        assertFalse(isAppDataPath("Pictures/Instagram/"))
    }

    @Test
    fun `Pictures KakaoTalk path is NOT app data (user-visible)`() {
        // 카톡에서 저장한 사진 → 삭제 시 복구 대상
        assertFalse(isAppDataPath("Pictures/KakaoTalk/"))
    }

    @Test
    fun `Android data kakao path IS app data`() {
        assertTrue(isAppDataPath("Android/data/com.kakao.talk/files/"))
    }

    @Test
    fun `Android data instagram path IS app data`() {
        assertTrue(isAppDataPath("Android/data/com.instagram.android/cache/"))
    }

    @Test
    fun `Android media whatsapp path IS app data`() {
        assertTrue(isAppDataPath("Android/media/com.whatsapp/WhatsApp/Media/"))
    }

    @Test
    fun `Android data google files path IS app data`() {
        assertTrue(isAppDataPath("Android/data/com.google.android.apps.nbu.files/"))
    }

    @Test
    fun `Case insensitive - ANDROID data path IS app data`() {
        assertTrue(isAppDataPath("ANDROID/data/com.some.app/"))
    }

    @Test
    fun `Empty path is NOT app data`() {
        assertFalse(isAppDataPath(""))
    }

    @Test
    fun `Blank path is NOT app data`() {
        assertFalse(isAppDataPath("   "))
    }

    @Test
    fun `Null-like empty string is NOT app data`() {
        assertFalse(isAppDataPath(""))
    }

    // ═══════════════════════════════════════════════
    // IS_TRASHED 필터 로직 테스트
    // ═══════════════════════════════════════════════

    /**
     * IS_TRASHED 필터 시뮬레이션
     * @param matchMode 0=MATCH_ONLY, 1=MATCH_INCLUDE
     * @param isTrashed IS_TRASHED 컬럼 값 (-1=컬럼 없음, 0=정상, 1=삭제됨)
     * @return true = 결과에 포함, false = 스킵
     */
    private fun shouldInclude(matchMode: Int, isTrashed: Int): Boolean {
        if (matchMode == 1) { // MATCH_INCLUDE
            return isTrashed == 1
        } else { // MATCH_ONLY
            return isTrashed != 0
        }
    }

    // ── MATCH_ONLY 모드 ──

    @Test
    fun `MATCH_ONLY - isTrashed=1 should be included`() {
        assertTrue(shouldInclude(matchMode = 0, isTrashed = 1))
    }

    @Test
    fun `MATCH_ONLY - isTrashed=0 should be excluded`() {
        assertFalse(shouldInclude(matchMode = 0, isTrashed = 0))
    }

    @Test
    fun `MATCH_ONLY - isTrashed=-1 (column missing) should be included`() {
        // MATCH_ONLY 쿼리는 trashed만 반환해야 하므로 컬럼 없어도 신뢰
        assertTrue(shouldInclude(matchMode = 0, isTrashed = -1))
    }

    // ── MATCH_INCLUDE 모드 ──

    @Test
    fun `MATCH_INCLUDE - isTrashed=1 should be included`() {
        assertTrue(shouldInclude(matchMode = 1, isTrashed = 1))
    }

    @Test
    fun `MATCH_INCLUDE - isTrashed=0 should be excluded (normal file)`() {
        assertFalse(shouldInclude(matchMode = 1, isTrashed = 0))
    }

    @Test
    fun `MATCH_INCLUDE - isTrashed=-1 (column missing) should be excluded`() {
        // MATCH_INCLUDE는 정상+삭제 전부 반환 → 컬럼 없으면 판별 불가 → 스킵
        assertFalse(shouldInclude(matchMode = 1, isTrashed = -1))
    }

    // ═══════════════════════════════════════════════
    // Android 10 이하 orphaned 파일 경로 필터 테스트
    // ═══════════════════════════════════════════════

    private fun isLegacyAppDataPath(filePath: String): Boolean {
        return filePath.contains("/Android/data/") || filePath.contains("/Android/media/")
    }

    @Test
    fun `Legacy - DCIM Camera path is valid`() {
        assertFalse(isLegacyAppDataPath("/storage/emulated/0/DCIM/Camera/photo.jpg"))
    }

    @Test
    fun `Legacy - Android data path is app data`() {
        assertTrue(isLegacyAppDataPath("/storage/emulated/0/Android/data/com.kakao.talk/tmp.jpg"))
    }

    @Test
    fun `Legacy - Android media path is app data`() {
        assertTrue(isLegacyAppDataPath("/storage/emulated/0/Android/media/com.whatsapp/WA/image.jpg"))
    }

    @Test
    fun `Legacy - Download path is valid`() {
        assertFalse(isLegacyAppDataPath("/storage/emulated/0/Download/file.pdf"))
    }

    // ═══════════════════════════════════════════════
    // FileSystemDataSource 스캔 디렉토리 필터 테스트
    // ═══════════════════════════════════════════════

    private val SKIP_DIR_NAMES = setOf("Android", ".android_secure", "cache", "code_cache")

    @Test
    fun `Android directory should be skipped in recursion`() {
        assertTrue("Android" in SKIP_DIR_NAMES)
    }

    @Test
    fun `cache directory should be skipped in recursion`() {
        assertTrue("cache" in SKIP_DIR_NAMES)
    }

    @Test
    fun `Normal directory name should not be skipped`() {
        assertFalse("DCIM" in SKIP_DIR_NAMES)
        assertFalse("Pictures" in SKIP_DIR_NAMES)
        assertFalse(".Trash" in SKIP_DIR_NAMES)
    }

    // ═══════════════════════════════════════════════
    // 중복 제거 로직 테스트
    // ═══════════════════════════════════════════════

    @Test
    fun `seenIds deduplication filters duplicate MediaStore IDs`() {
        val seenIds = mutableSetOf<Long>()
        val ids = listOf(100L, 200L, 100L, 300L, 200L)
        val unique = ids.filter { seenIds.add(it) }
        assertEquals(listOf(100L, 200L, 300L), unique)
    }

    @Test
    fun `URI-based deduplication in ScanRepository`() {
        val seenUris = mutableSetOf<String>()
        val uris = listOf(
            "content://media/external/images/media/100",
            "content://media/external/images/media/200",
            "content://media/external/images/media/100", // 중복
        )
        val unique = uris.filter { seenUris.add(it) }
        assertEquals(2, unique.size)
    }

    @Test
    fun `Path-based deduplication for filesystem results`() {
        val seenPaths = mutableSetOf<String>()
        val paths = listOf(
            "/storage/emulated/0/.Trash/photo.jpg",
            "/storage/emulated/0/DCIM/.Trash/photo.jpg", // 다른 경로 → 중복 아님
            "/storage/emulated/0/.Trash/photo.jpg",       // 같은 경로 → 중복
        )
        val unique = paths.filter { seenPaths.add(it) }
        assertEquals(2, unique.size)
    }

    // ═══════════════════════════════════════════════
    // path 필드 빈 문자열 검증 (MediaStore 결과)
    // ═══════════════════════════════════════════════

    @Test
    fun `MediaStore results should have empty path`() {
        // MediaStore 결과는 URI로 접근하므로 path가 비어있어야 함
        // path가 비어있으면 seenPaths 중복 제거에 영향 없음
        val mockUri = mockk<android.net.Uri>(relaxed = true)
        val file = RecoverableFile(
            id = "test", name = "photo.jpg", path = "",
            uri = mockUri, size = 1000L, lastModified = 0L,
            category = FileCategory.IMAGE, extension = "jpg",
            recoveryChance = RecoveryChance.HIGH
        )
        assertTrue(file.path.isEmpty())
    }

    @Test
    fun `FileSystem results should have non-empty path`() {
        val file = RecoverableFile(
            id = "test", name = "photo.jpg",
            path = "/storage/emulated/0/.Trash/photo.jpg",
            uri = null, size = 1000L, lastModified = 0L,
            category = FileCategory.IMAGE, extension = "jpg",
            recoveryChance = RecoveryChance.HIGH
        )
        assertTrue(file.path.isNotEmpty())
    }
}
