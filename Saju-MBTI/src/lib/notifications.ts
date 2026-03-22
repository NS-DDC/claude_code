import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { preferencesService } from './firestore';
import { User } from 'firebase/auth';

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

export const notificationService = {
  // 설정 가져오기
  async getSettings(user?: User | null): Promise<NotificationSettings> {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    // Load from Firestore if user is authenticated
    if (user?.uid) {
      try {
        const prefs = await preferencesService.get(user.uid);
        if (prefs?.notificationSettings) {
          return prefs.notificationSettings;
        }
      } catch (error) {
        console.error('Failed to load notification settings from Firestore:', error);
        // Fall through to localStorage on error
      }
    }

    // Fallback to localStorage for non-authenticated users or on error
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  // 설정 저장
  async saveSettings(settings: NotificationSettings, user?: User | null): Promise<void> {
    if (typeof window === 'undefined') return;

    // Save to Firestore if user is authenticated
    if (user?.uid) {
      try {
        const existingPrefs = await preferencesService.get(user.uid);
        await preferencesService.save(user.uid, {
          ...existingPrefs,
          notificationSettings: settings,
        });
        console.log('Notification settings saved to Firestore');
      } catch (error) {
        console.error('Failed to save notification settings to Firestore:', error);
        // Fall through to localStorage on error
      }
    }

    // Always save to localStorage as backup/fallback
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save notification settings to localStorage:', error);
    }
  },

  // 알림 권한 요청
  async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  },

  // 푸시 알림 권한 요청
  async requestPushPermissions(): Promise<boolean> {
    try {
      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.error('Push permission request failed:', error);
      return false;
    }
  },

  // 일일 운세 알림 등록
  async scheduleDailyFortune(time: string): Promise<void> {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0
      );

      // 오늘 시간이 지났으면 내일로 설정
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🔮 오늘의 운세',
            body: '오늘의 행운 메시지를 확인해보세요!',
            id: 1,
            schedule: {
              at: scheduledTime,
              every: 'day'
            },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });

      console.log('Daily fortune notification scheduled for:', time);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  },

  // 모든 예약된 알림 취소
  async cancelAll(): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  },

  // 즉시 알림 보내기 (테스트용)
  async sendTestNotification(): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🎉 테스트 알림',
            body: '알림이 정상적으로 작동합니다!',
            id: 999,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  },

  // 알림 초기화
  async initialize(): Promise<void> {
    try {
      // 알림 리스너 등록
      await LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Notification received:', notification);
      });

      await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Notification action performed:', notification);
      });

      // 푸시 알림 리스너 (선택사항)
      await PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token:', token.value);
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received:', notification);
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed:', notification);
      });

    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  },

  // 예약된 알림 목록 가져오기
  async getPending(): Promise<any[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }
};
