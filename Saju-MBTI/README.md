# 🔮 Fortune & MBTI - 운명과 성격

Next.js 기반의 하이브리드 사주 & MBTI 궁합 앱입니다.

## ✨ 주요 기능

- **스마트 사주 분석**: 생년월일시 기반 오행 분포 분석 및 사주 궁합
- **MBTI 궁합**: 16가지 MBTI 타입 간의 궁합 분석
- **운세 스캔**: 카메라를 활용한 오늘의 행운 메시지
- **히스토리 관리**: LocalStorage 기반 분석 결과 저장 및 관리
- **공유 기능**: 분석 결과 공유
- **Glassmorphism UI**: 고급스러운 유리 효과 디자인
- **🆕 푸시 알림**: 일일 운세 알림 (시간 설정 가능)
- **🆕 설정 페이지**: 알림 및 테마 관리
- **🆕 테스트 알림**: 알림 기능 테스트

## 🛠️ 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Mobile**: Capacitor (iOS/Android)
- **Data**: LocalStorage (브라우저 저장)

## 📦 설치 방법

### 1. 의존성 설치

```bash
npm install
```

### 설치되는 주요 패키지:
- `next@^16.1.6` - React 프레임워크
- `react@^18.2.0` - UI 라이브러리
- `framer-motion@^10.18.0` - 애니메이션
- `lucide-react@^0.300.0` - 아이콘
- `@capacitor/core@^5.6.0` - 모바일 앱 변환
- `@capacitor/camera@^5.0.9` - 카메라 기능
- `@capacitor/local-notifications@^5.0.7` - 로컬 알림
- `@capacitor/push-notifications@^5.1.0` - 푸시 알림
- `tailwindcss@^3.4.0` - CSS 프레임워크

## 🚀 실행 방법

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 프로덕션 빌드

```bash
npm run build
npm start
```

## 📱 APK 생성 및 모바일 앱 변환

자세한 APK 빌드 가이드는 **[BUILD_APK.md](BUILD_APK.md)** 파일을 참고하세요!

### 빠른 가이드

**Android APK 생성:**
```bash
# 1. 웹 앱 빌드
npm run build

# 2. Android 플랫폼 추가 (최초 1회)
npx cap add android

# 3. Android Studio 열기
npx cap open android

# 4. Android Studio에서:
# Build → Build Bundle(s) / APK(s) → Build APK(s)
# APK 위치: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 모바일 앱 변환 상세 가이드 (Capacitor)

### 1. 웹 앱 빌드 및 내보내기

```bash
npm run build
```

### 2. Capacitor 초기화 (최초 1회만)

```bash
npx cap init
```

프롬프트가 나오면:
- **App name**: `Fortune & MBTI` (또는 원하는 이름)
- **App ID**: `com.fortune.mbti` (또는 원하는 ID)
- **Web dir**: `out` (Enter로 기본값 사용)

### 3. Android 플랫폼 추가

```bash
npx cap add android
```

### 4. iOS 플랫폼 추가 (macOS에서만 가능)

```bash
npx cap add ios
```

### 5. 웹 리소스를 네이티브 프로젝트에 동기화

```bash
npm run build:mobile
```

또는 개별 명령어:
```bash
npm run build
npx cap sync
```

### 6. Android Studio에서 열기

```bash
npx cap open android
```

그 후 Android Studio에서:
1. 가상 디바이스(에뮬레이터) 또는 실제 디바이스 연결
2. Run 버튼 클릭하여 앱 실행

### 7. Xcode에서 열기 (macOS)

```bash
npx cap open ios
```

그 후 Xcode에서:
1. 시뮬레이터 또는 실제 iPhone 선택
2. Run 버튼 클릭하여 앱 실행

## 📝 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 전역 레이아웃
│   ├── page.tsx           # 메인 페이지
│   ├── globals.css        # 전역 스타일
│   ├── saju/              # 사주 분석 페이지
│   ├── mbti/              # MBTI 궁합 페이지
│   ├── scan/              # 운세 스캔 페이지
│   └── history/           # 히스토리 페이지
├── components/            # 공통 컴포넌트
│   ├── BottomNav.tsx     # 하단 네비게이션
│   ├── GlassCard.tsx     # 유리 효과 카드
│   └── AdBanner.tsx      # 광고 배너
├── lib/                   # 유틸리티 함수
│   ├── storage.ts        # LocalStorage CRUD
│   ├── sajuCalculator.ts # 사주 계산 로직
│   └── mbtiCompatibility.ts # MBTI 궁합 로직
└── types/                 # TypeScript 타입 정의
    └── index.ts
```

## 🎨 UI/UX 특징

- **컬러 스킴**:
  - 소프트 민트 (#E0F2F1) - 배경
  - 로열 골드 (#FFD700) - 포인트
  - 파스텔 브라운 (#A1887F) - 텍스트

- **Glassmorphism**: backdrop-blur와 반투명 배경 조합
- **Bottom Navigation**: 5개 메뉴 (홈, 사주, MBTI, 스캔, 히스토리)
- **Framer Motion**: 부드러운 페이지 전환 및 요소 애니메이션
- **Safe Area**: 모바일 노치 대응

## 📊 데이터 저장

모든 분석 결과는 브라우저의 LocalStorage에 저장됩니다:
- 사주 분석 결과
- 사주 궁합 결과
- MBTI 궁합 결과
- 운세 스캔 결과

히스토리 페이지에서 언제든지 확인 및 삭제 가능합니다.

## 📷 카메라 권한

운세 스캔 기능은 카메라 권한이 필요합니다:
- **웹**: 브라우저에서 자동으로 권한 요청
- **Android**: `AndroidManifest.xml`에 자동 추가
- **iOS**: `Info.plist`에 권한 설명 추가 필요

## 🔧 커스터마이징

### 광고 배너 연동

`src/components/AdBanner.tsx` 파일에서 Google AdMob/AdSense 코드를 추가하세요:

```tsx
// 예시: Google AdSense
<ins className="adsbygoogle"
     style={{ display: 'block' }}
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"
     data-ad-format="auto"></ins>
```

### 카카오톡 공유 연동

1. [Kakao Developers](https://developers.kakao.com/)에서 앱 등록
2. JavaScript 키 발급
3. 각 페이지의 공유하기 버튼에 Kakao SDK 연동

```javascript
Kakao.Share.sendDefault({
  objectType: 'feed',
  content: {
    title: '사주 분석 결과',
    description: '나의 사주를 확인해보세요!',
    imageUrl: 'YOUR_IMAGE_URL',
    link: {
      mobileWebUrl: 'YOUR_URL',
      webUrl: 'YOUR_URL',
    },
  },
});
```

## 🐛 문제 해결

### 빌드 에러
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Capacitor 동기화 문제
```bash
npx cap sync
```

### Android 빌드 문제
- Android Studio에서 Gradle 동기화
- JDK 버전 확인 (11 이상 권장)

### iOS 빌드 문제 (macOS)
- Xcode 최신 버전 사용
- CocoaPods 설치 확인: `sudo gem install cocoapods`

## 📄 라이선스

MIT License

## 🤝 기여

이슈나 PR은 언제든 환영합니다!

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

Made with ❤️ using Next.js and Capacitor
