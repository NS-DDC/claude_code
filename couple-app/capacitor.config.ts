import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loveday.coupleapp',
  appName: 'LoveDay',
  webDir: 'out',
  server: {
    url: 'https://couple-app-rosy.vercel.app',
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
