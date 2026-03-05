export interface NotificationSettings {
  enabled: boolean;
  dailyFortune: boolean;
  dailyFortuneTime: string; // "09:00" format
  reminders: boolean;
}

const SETTINGS_KEY = 'notification_settings';
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyFortune: false,
  dailyFortuneTime: '09:00',
  reminders: false
};

/**
 * 알림 서비스 (Capacitor 플러그인 미설치 시 안전하게 폴백)
 * 향후 @capacitor/local-notifications, @capacitor/push-notifications 설치 시
 * 동적 import로 자동 연동됩니다.
 */
export const notificationService = {
  // 설정 가져오기
  getSettings(): NotificationSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  // 설정 저장
  saveSettings(settings: NotificationSettings): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  },

  // 알림 권한 요청
  async requestPermissions(): Promise<boolean> {
    try {
      // Web Notification API 폴백
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      return false;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  },

  // 푸시 알림 권한 요청
  async requestPushPermissions(): Promise<boolean> {
    // 푸시 알림은 네이티브 플러그인 필요 - 현재 미설치
    console.warn('Push notifications require @capacitor/push-notifications plugin');
    return false;
  },

  // 일일 운세 알림 등록
  async scheduleDailyFortune(time: string): Promise<void> {
    console.log('Daily fortune notification scheduled for:', time);
    console.warn('Native notifications require @capacitor/local-notifications plugin');
  },

  // 모든 예약된 알림 취소
  async cancelAll(): Promise<void> {
    console.log('All notifications cancelled');
  },

  // 즉시 알림 보내기 (테스트용)
  async sendTestNotification(): Promise<void> {
    try {
      // Web Notification API 폴백
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('🎉 테스트 알림', {
          body: '알림이 정상적으로 작동합니다!',
        });
      } else {
        console.warn('Notifications not available or permission not granted');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  },

  // 알림 초기화
  async initialize(): Promise<void> {
    console.log('Notification service initialized (web fallback mode)');
  },

  // 예약된 알림 목록 가져오기
  async getPending(): Promise<any[]> {
    return [];
  }
};
