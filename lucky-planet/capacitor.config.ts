import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luckyplanet.app',
  appName: 'Lucky Planet - 로또 번호 추출기',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Camera: {
      permissions: ['camera'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#FFC107',
      sound: 'default',
    },
  },
};

export default config;
