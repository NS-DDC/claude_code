import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.namsik93.fortune',
  appName: 'Saju MBTI',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  android: {
    webContentsDebuggingEnabled: true
  }
};

export default config;
