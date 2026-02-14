'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Info, TestTube } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import AdBanner from '@/components/AdBanner';
import { notificationService, NotificationSettings } from '@/lib/notifications';

export default function SettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    dailyFortune: false,
    dailyFortuneTime: '09:00',
    reminders: false
  });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadSettings();
    checkPendingNotifications();
  }, []);

  const loadSettings = () => {
    const saved = notificationService.getSettings();
    setSettings(saved);
  };

  const checkPendingNotifications = async () => {
    const pending = await notificationService.getPending();
    setPendingCount(pending.length);
  };

  const handleToggleNotifications = async () => {
    if (!settings.enabled) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        alert('알림 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
        return;
      }
      await notificationService.initialize();
    }

    const newSettings = { ...settings, enabled: !settings.enabled };

    if (!newSettings.enabled) {
      await notificationService.cancelAll();
      newSettings.dailyFortune = false;
    }

    setSettings(newSettings);
    notificationService.saveSettings(newSettings);
  };

  const handleToggleDailyFortune = async () => {
    if (!settings.enabled) {
      alert('먼저 알림을 활성화해주세요.');
      return;
    }

    const newSettings = { ...settings, dailyFortune: !settings.dailyFortune };

    if (newSettings.dailyFortune) {
      await notificationService.scheduleDailyFortune(settings.dailyFortuneTime);
    } else {
      await notificationService.cancelAll();
    }

    setSettings(newSettings);
    notificationService.saveSettings(newSettings);
    await checkPendingNotifications();
  };

  const handleTimeChange = async (time: string) => {
    const newSettings = { ...settings, dailyFortuneTime: time };
    setSettings(newSettings);
    notificationService.saveSettings(newSettings);

    if (settings.dailyFortune) {
      await notificationService.cancelAll();
      await notificationService.scheduleDailyFortune(time);
      await checkPendingNotifications();
    }
  };

  const handleTestNotification = async () => {
    if (!settings.enabled) {
      alert('먼저 알림을 활성화해주세요.');
      return;
    }

    await notificationService.sendTestNotification();
    alert('1초 후 테스트 알림이 전송됩니다!');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <Settings className="w-12 h-12 text-royal-gold mx-auto mb-2" />
        <h1 className="text-3xl font-bold text-gray-800">설정</h1>
        <p className="text-pastel-brown mt-2">앱 설정을 관리하세요</p>
      </motion.div>

      <GlassCard className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-royal-gold" />
          알림 설정
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-700">알림 허용</p>
              <p className="text-sm text-pastel-brown">모든 알림 기능 활성화</p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`w-14 h-8 rounded-full transition-all ${
                settings.enabled ? 'bg-royal-gold' : 'bg-gray-300'
              }`}
            >
              <motion.div
                animate={{ x: settings.enabled ? 24 : 4 }}
                className="w-6 h-6 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          <div className="border-t border-white/30 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-700">일일 운세 알림</p>
                <p className="text-sm text-pastel-brown">매일 운세를 알려드립니다</p>
              </div>
              <button
                onClick={handleToggleDailyFortune}
                disabled={!settings.enabled}
                className={`w-14 h-8 rounded-full transition-all ${
                  settings.dailyFortune ? 'bg-royal-gold' : 'bg-gray-300'
                } ${!settings.enabled && 'opacity-50'}`}
              >
                <motion.div
                  animate={{ x: settings.dailyFortune ? 24 : 4 }}
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                />
              </button>
            </div>

            {settings.dailyFortune && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white/30 rounded-lg p-3"
              >
                <label className="block text-sm text-pastel-brown mb-2">
                  알림 시간
                </label>
                <input
                  type="time"
                  value={settings.dailyFortuneTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-royal-gold"
                />
                {pendingCount > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ {pendingCount}개의 알림이 예약되어 있습니다
                  </p>
                )}
              </motion.div>
            )}
          </div>

          <div className="border-t border-white/30 pt-4">
            <button
              onClick={handleTestNotification}
              disabled={!settings.enabled}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                settings.enabled
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              <TestTube className="inline w-5 h-5 mr-2" />
              테스트 알림 보내기
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-royal-gold" />
          앱 정보
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-pastel-brown">버전</span>
            <span className="font-semibold text-gray-700">1.0.3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-pastel-brown">개발자</span>
            <span className="font-semibold text-gray-700">NAMSIK93</span>
          </div>
          <div className="flex justify-between">
            <span className="text-pastel-brown">플랫폼</span>
            <span className="font-semibold text-gray-700">Next.js + Capacitor</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold text-gray-800 mb-2">알림 사용 가이드</h3>
        <ul className="text-sm text-pastel-brown space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-royal-gold">1.</span>
            <span>알림 허용을 켜주세요</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-royal-gold">2.</span>
            <span>일일 운세 알림을 활성화하세요</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-royal-gold">3.</span>
            <span>원하는 시간을 설정하세요</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-royal-gold">4.</span>
            <span>매일 설정된 시간에 운세를 받아보세요!</span>
          </li>
        </ul>
      </GlassCard>

      <AdBanner />
    </div>
  );
}
