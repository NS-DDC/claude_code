# Lucky Planet - 로또 번호 추출기

스마트한 로또 번호 생성, QR 당첨 확인, 통계 분석까지!
행운의 행성에서 당신의 번호를 뽑아보세요.

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 14+ (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS (글래스모피즘 UI) |
| 애니메이션 | Framer Motion |
| 아이콘 | Lucide React |
| QR 스캔 | html5-qrcode |
| 모바일 | Capacitor (iOS/Android) |
| 데이터 | LocalStorage (DB 없음) |
| 공유 | Kakao SDK |

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 3. 프로덕션 빌드

```bash
npm run build
```

`out/` 폴더에 정적 파일 생성 (Static Export)

---

## 모바일 앱 변환 (Capacitor)

### iOS

```bash
# Capacitor 초기화 (최초 1회)
npm run cap:init

# iOS 프로젝트 추가
npm run cap:add:ios

# 빌드 후 동기화
npm run mobile:build

# Xcode에서 열기
npm run cap:open:ios
```

> Xcode 설치 필요. Apple Developer 계정으로 서명 후 실기기 테스트 가능.

### Android

```bash
# Android 프로젝트 추가
npm run cap:add:android

# 빌드 후 동기화
npm run mobile:build

# Android Studio에서 열기
npm run cap:open:android
```

> Android Studio 설치 필요.

---

## 프로젝트 구조 & 파일 위치

```
lucky-planet/
├── src/
│   ├── app/                          # Next.js App Router 페이지
│   │   ├── layout.tsx                # 루트 레이아웃 (카카오 SDK, 하단 탭)
│   │   ├── page.tsx                  # [홈] 번호 생성 + 운세
│   │   ├── globals.css               # 전역 스타일 (글래스모피즘)
│   │   ├── scan/page.tsx             # [스캔] QR 코드 스캔 당첨 확인
│   │   ├── history/page.tsx          # [기록] 생성 번호 히스토리
│   │   ├── stats/page.tsx            # [통계] 번호 빈도 분석
│   │   └── settings/page.tsx         # [설정] 필터/데이터 관리
│   │
│   ├── components/                   # UI 컴포넌트
│   │   ├── BottomNav.tsx             # 하단 5탭 네비게이션
│   │   ├── LottoBall.tsx             # 로또 공 (색상+애니메이션)
│   │   ├── NumberGenerator.tsx       # 번호 생성기 (필터/생성/저장)
│   │   ├── QRScanner.tsx             # QR 코드 스캐너
│   │   ├── HistoryList.tsx           # 번호 기록 리스트 (CRUD)
│   │   ├── StatsChart.tsx            # 통계 바 차트
│   │   ├── FortuneScore.tsx          # 오늘의 행운 점수
│   │   ├── ShareButton.tsx           # 공유하기 (카카오톡/복사)
│   │   └── AdBanner.tsx              # 광고 배너 자리표시자
│   │
│   ├── lib/                          # 유틸리티/로직
│   │   ├── storage.ts                # LocalStorage CRUD (핵심!)
│   │   ├── lotto.ts                  # 번호 생성 알고리즘 & 색상
│   │   ├── kakao.ts                  # 카카오톡 SDK 연동
│   │   └── fortune.ts                # 운세/행운 점수 로직
│   │
│   └── hooks/                        # 커스텀 훅
│       └── useLocalStorage.ts        # LocalStorage 동기화 훅
│
├── public/                           # 정적 파일
│   └── manifest.json                 # PWA 매니페스트
│
├── package.json                      # 의존성 & 스크립트
├── next.config.mjs                   # Next.js 설정 (Static Export)
├── tailwind.config.ts                # Tailwind 커스텀 테마
├── tsconfig.json                     # TypeScript 설정
├── capacitor.config.ts               # Capacitor 모바일 설정
└── README.md                         # 이 파일
```

---

## 핵심 기능별 안내

### 1. 스마트 번호 생성 (`NumberGenerator.tsx`)
- 1~45 중 6개 랜덤 생성
- 포함/제외 번호 필터링 지원
- Framer Motion 공 애니메이션
- 생성 즉시 저장 또는 공유 가능

### 2. QR 코드 스캔 (`QRScanner.tsx`)
- `html5-qrcode` 라이브러리 사용
- 카메라 권한 요청 후 실시간 스캔
- 동행복권 URL 감지 시 결과 페이지 연결
- 스캔 라인 애니메이션 UI

### 3. 번호 히스토리 (`HistoryList.tsx` + `storage.ts`)
- LocalStorage 기반 완전한 CRUD
- 즐겨찾기, 삭제, 전체 삭제
- 날짜/시간 표시

### 4. 통계 (`StatsChart.tsx`)
- HOT/COLD 번호 분석
- 45개 번호 전체 빈도 바 차트
- 번호순/빈도순 정렬

### 5. 운세 (`FortuneScore.tsx` + `fortune.ts`)
- 날짜 기반 시드로 일관된 점수
- 등급: 대박/좋음/보통/충전중
- 행운 아이템 & 행운 번호

### 6. 카카오톡 공유 (`kakao.ts` + `ShareButton.tsx`)
- Kakao SDK Feed 메시지 공유
- 클립보드 복사 폴백
- Web Share API 지원

---

## 카카오톡 공유 설정

1. [Kakao Developers](https://developers.kakao.com)에서 애플리케이션 등록
2. **앱 키 > JavaScript 키** 복사
3. `src/lib/kakao.ts`에서 `YOUR_KAKAO_JAVASCRIPT_KEY`를 발급받은 키로 교체
4. **플랫폼 > Web** 에 사이트 도메인 등록 (예: `http://localhost:3000`)

---

## 광고(AdSense/AdMob) 설정

### 웹 (Google AdSense)
1. [Google AdSense](https://www.google.com/adsense) 계정 가입
2. `src/app/layout.tsx`에서 AdSense 스크립트 주석 해제
3. `ca-pub-XXXXXXX`를 발급받은 퍼블리셔 ID로 교체

### 모바일 (AdMob - Capacitor)
```bash
npm install @capacitor-community/admob
npx cap sync
```

---

## LocalStorage 데이터 구조

| 키 | 설명 | 형식 |
|----|------|------|
| `lotto_history` | 생성 번호 기록 | `LottoRecord[]` |
| `lotto_settings` | 앱 설정 | `AppSettings` |
| `lotto_fortune_date` | 운세 확인 날짜 | `YYYY-MM-DD` |
| `lotto_fortune_score` | 오늘의 점수 | `number` |

---

## 디자인 컬러 시스템

| 용도 | 색상 | 코드 |
|------|------|------|
| 메인 배경 | 소프트 민트 | `#E0F2F1` |
| 포인트 | 로열 골드 | `#FFD700` |
| 로또 공 1~10 | 노랑 | `#FFC107` |
| 로또 공 11~20 | 파랑 | `#2196F3` |
| 로또 공 21~30 | 빨강 | `#F44336` |
| 로또 공 31~40 | 회색 | `#9E9E9E` |
| 로또 공 41~45 | 초록 | `#4CAF50` |
