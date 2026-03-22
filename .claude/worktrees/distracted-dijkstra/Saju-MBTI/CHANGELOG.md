# Changelog

All notable changes to Saju-MBTI are documented in this file.
Format: `[version] - date` / Added / Fixed / Changed

---

## [3.0.0] - 2026-03-22

### Added
- 타로 카드 페이지 (`/tarot`) — djb2 해시 기반 일일 카드, 정/역방향, 클립보드 공유
- 이름 운세 페이지 (`/name-fortune`) — 자모 획수 알고리즘(11,172자 완전 커버), 카테고리별 독립 점수
- 비밀번호 찾기 페이지 (`/forgot-password`) — 이메일 인증 기반 재설정
- 일일 운세: 스트릭 마일스톤 배너 (3/7/14/30일 달성 시 축하 배너)
- 일일 운세: 내일 운세 미리보기 (애정/직업/재물 증감 표시)
- MBTI 테스트: 4개 차원 퍼센트 바
- MBTI 테스트: 이전 문항 버튼

### Fixed
- **Galaxy S24 블랙스크린** — Framer Motion `initial={{ opacity:0 }}` SSR 문제, `mounted` 패턴으로 해결
- INTP 캐릭터명 오타 수정 (논리술사 → 논리학자)
- MBTI 궁합 비대칭 점수 버그 — 양방향 조회 fallback 추가
- 타로 카드 해시 편향 — ASCII 합산 → djb2 해시로 균등 분포
- 이름 운세 획수 계산 — sparse lookup(200자) → 자모 분해 알고리즘(전체 한글)

### Changed
- BottomNav: 6개 탭 → 5개 탭 (홈/사주/MBTI/타로/프로필), 인증 페이지 자동 숨김
- versionCode 1 → 300, versionName "1.0" → "3.0.0" (패키지 충돌 방지)

---

## [2.1.0] - 2026-03

### Added
- Firebase 인증 (이메일/비밀번호, 소셜 로그인)
- Firestore 연동 — 운세 이력 클라우드 저장
- 로그인/회원가입 페이지

---

## [2.0.0] - 2026-03

### Added
- 사주 계산기 페이지 (`/saju`)
- 일일 운세 페이지 (`/daily`) — 오행별 캐릭터, 점수 바
- 히스토리 페이지 (`/history`)
- 프로필 페이지 (`/profile`)
- FloatingOrbs, GlassCard 컴포넌트
- Capacitor Android 빌드 설정

### Changed
- 다크 미스틱 테마 전면 적용
- Next.js static export (`output: 'export'`)

---

## [1.0.0] - 2026-02

### Added
- 초기 프로젝트 생성
- MBTI 테스트 (`/mbti`) — 60문항, 16개 유형
- 기본 운세 계산 로직
