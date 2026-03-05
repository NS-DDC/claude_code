import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.namsik93.fortune',
  appName: 'Saju MBTI',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // WebView 에러 로깅 활성화
    errorPath: '/error'
  },
  android: {
    // WebView 디버깅 허용 (개발 시)
    webContentsDebuggingEnabled: true
  }
};

export default config;
