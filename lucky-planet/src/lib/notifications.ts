/**
 * 푸시 알림 유틸리티 (Capacitor LocalNotifications)
 * 매주 토요일 17시 추첨 알림 스케줄링
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const SATURDAY_REMINDER_ID = 1001;

function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform()) return false;

  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleSaturdayReminder(): Promise<boolean> {
  if (!isNativePlatform()) return false;

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  try {
    // 기존 알림 취소 후 새로 등록
    await cancelAllReminders();

    // 다음 토요일 17시 계산
    const now = new Date();
    const nextSaturday = new Date(now);
    const dayOfWeek = now.getDay(); // 0=일 ~ 6=토
    const daysUntilSaturday = dayOfWeek === 6
      ? (now.getHours() >= 17 ? 7 : 0) // 이미 토요일이면 17시 지났으면 다음주
      : (6 - dayOfWeek);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setHours(17, 0, 0, 0);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: SATURDAY_REMINDER_ID,
          title: '🍀 로또 추첨일!',
          body: '오늘은 로또 추첨일이에요! 행운의 번호를 뽑아보세요.',
          schedule: {
            on: {
              weekday: 7, // 토요일 (Capacitor: 1=일 ~ 7=토)
              hour: 17,
              minute: 0,
            },
            allowWhileIdle: true,
          },
          sound: 'default',
          smallIcon: 'ic_launcher',
        },
      ],
    });

    return true;
  } catch {
    return false;
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }
  } catch {
    // 무시
  }
}

export async function checkNotificationStatus(): Promise<boolean> {
  if (!isNativePlatform()) return false;

  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') return false;

    const pending = await LocalNotifications.getPending();
    return pending.notifications.some((n) => n.id === SATURDAY_REMINDER_ID);
  } catch {
    return false;
  }
}
