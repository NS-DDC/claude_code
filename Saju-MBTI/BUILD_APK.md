# 📱 APK 빌드 가이드

## 🎯 추가된 신기능

✅ **푸시 알림 기능**
- 일일 운세 알림 (시간 설정 가능)
- 테스트 알림 기능
- 알림 권한 관리

✅ **설정 페이지**
- 알림 설정 관리
- 다크모드 (추후 업데이트 예정)
- 앱 정보

✅ **개선된 UI/UX**
- 하단 네비게이션에 설정 메뉴 추가
- 홈에서 히스토리 바로가기
- 부드러운 애니메이션

---

## 방법 1: Android Studio 사용 (권장 ⭐)

### 1단계: Android Studio 설치
https://developer.android.com/studio 에서 다운로드 및 설치

### 2단계: 프로젝트 열기
```bash
# 프로젝트 디렉토리에서
npx cap open android
```

또는 Android Studio에서:
- `File` → `Open` → `E:\app_dir\claude_code\Saju-MBTI\android` 폴더 선택

### 3단계: Gradle Sync
- Android Studio가 자동으로 Gradle을 동기화합니다
- 하단에 "Sync successful" 메시지가 나타날 때까지 기다립니다

### 4단계: APK 빌드

#### Debug APK (테스트용)
1. 상단 메뉴: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. 빌드 완료 후 알림 클릭 → `locate` 클릭
3. APK 위치: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Release APK (배포용)
1. 상단 메뉴: `Build` → `Generate Signed Bundle / APK`
2. `APK` 선택 → `Next`
3. 키 스토어 생성:
   - `Create new...` 클릭
   - Key store path: 원하는 위치 선택 (예: `my-app-key.jks`)
   - Password: 비밀번호 입력 (잊지 마세요!)
   - Alias: `my-key-alias`
   - Password: 비밀번호 입력
   - Validity: 25 (년)
   - Certificate: 정보 입력
   - `OK` 클릭
4. `Next` → `release` 선택 → `Finish`
5. APK 위치: `android/app/release/app-release.apk`

---

## 방법 2: 명령줄 사용 (Java 필요)

### 전제조건
```bash
# Java 17 이상 설치 확인
java -version

# JAVA_HOME 환경 변수 설정
# Windows:
setx JAVA_HOME "C:\Program Files\Java\jdk-17"
```

### Debug APK 빌드
```bash
cd android
./gradlew assembleDebug
# Windows: gradlew.bat assembleDebug
```

APK 위치: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK 빌드
```bash
cd android
./gradlew assembleRelease
# Windows: gradlew.bat assembleRelease
```

APK 위치: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 📲 APK 설치 방법

### 갤럭시/안드로이드폰에 설치

1. **APK 파일을 폰으로 전송**
   - USB 케이블로 연결
   - 파일을 폰의 다운로드 폴더로 복사

2. **설치**
   - 폰에서 APK 파일 찾기
   - 파일 클릭
   - "출처를 알 수 없는 앱 설치 허용" 체크
   - 설치 진행

3. **권한 허용**
   - 카메라 권한 (운세 스캔용)
   - 알림 권한 (일일 운세용)

---

## 🔧 문제 해결

### Gradle 빌드 실패
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### 의존성 문제
```bash
# 프로젝트 루트에서
npm run build
npx cap sync
```

### Android Studio가 느릴 때
- `File` → `Invalidate Caches / Restart`
- 재시작 후 다시 빌드

### 서명 관련 오류
Debug APK는 자동 서명되므로 별도 설정 불필요
Release APK는 위의 키 스토어 생성 과정 필요

---

## 📦 APK 파일 위치

빌드 후 APK 파일 찾기:
```
android/
└── app/
    └── build/
        └── outputs/
            └── apk/
                ├── debug/
                │   └── app-debug.apk         (테스트용)
                └── release/
                    └── app-release.apk       (배포용)
```

---

## 🚀 배포 전 체크리스트

- [ ] 모든 기능 테스트 완료
- [ ] 권한 설정 확인 (카메라, 알림)
- [ ] 앱 아이콘 설정
- [ ] 버전 코드 업데이트 (`android/app/build.gradle`)
- [ ] Release APK 서명 완료
- [ ] ProGuard/R8 설정 (난독화)

---

## 📝 추가 정보

### 앱 아이콘 변경
1. `android/app/src/main/res/` 폴더의 각 `mipmap-*` 폴더에 아이콘 배치
2. 또는 Android Studio의 Image Asset Studio 사용:
   - `File` → `New` → `Image Asset`

### 버전 업데이트
`android/app/build.gradle` 파일:
```gradle
android {
    defaultConfig {
        versionCode 2        // 숫자 증가
        versionName "1.1.0"  // 버전 문자열
    }
}
```

### Google Play 스토어 배포
1. Release APK 생성
2. https://play.google.com/console 접속
3. 앱 등록 및 APK 업로드
4. 스토어 등록 정보 작성
5. 검토 제출

---

## 🎉 완료!

이제 **Fortune & MBTI** 앱을 갤럭시폰에 설치하여 사용할 수 있습니다!

문제가 발생하면 이슈를 등록해주세요.
