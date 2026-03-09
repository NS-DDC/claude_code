'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Edit3, Bell, Info, TestTube, Calendar, Sparkles, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import BirthInfoForm from '@/components/BirthInfoForm';
import FortuneScoreGauge from '@/components/FortuneScoreGauge';
import SkeletonLoader from '@/components/SkeletonLoader';
import FloatingOrbs from '@/components/FloatingOrbs';
import { storage } from '@/lib/storage';
import { calculateSaju } from '@/lib/sajuCalculator';
import { getDestinyCharacter } from '@/lib/destinyCharacter';
import { calculateFortuneScore } from '@/lib/fortuneScore';
import { notificationService, NotificationSettings } from '@/lib/notifications';
import { UserProfile, MBTIType, SajuInput, Element } from '@/types';

const ELEMENT_GRADIENTS: Record<Element, string> = {
  '목': 'from-green-400 to-emerald-500',
  '화': 'from-red-400 to-rose-500',
  '토': 'from-yellow-400 to-amber-500',
  '금': 'from-gray-400 to-slate-500',
  '수': 'from-blue-400 to-cyan-500'
};

const CATEGORY_NAMES: Record<string, string> = {
  'analyst': '분석가',
  'diplomat': '외교관',
  'sentinel': '관리자',
  'explorer': '탐험가'
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fortuneScore, setFortuneScore] = useState(0);
  const [fortuneLevel, setFortuneLevel] = useState('');
  const [fortuneEmoji, setFortuneEmoji] = useState('');

  // 알림 설정
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    enabled: false,
    dailyFortune: false,
    dailyFortuneTime: '09:00',
    reminders: false
  });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedProfile = storage.getProfile();
    if (!savedProfile) {
      router.push('/onboarding');
      return;
    }

    setProfile(savedProfile);

    // 운세 점수
    const score = calculateFortuneScore(savedProfile);
    setFortuneScore(score.totalScore);
    setFortuneLevel(score.level);
    setFortuneEmoji(score.emoji);

    // 알림 설정
    const savedNotif = notificationService.getSettings();
    setNotifSettings(savedNotif);

    checkPendingNotifications();
    setIsLoading(false);
  };

  const checkPendingNotifications = async () => {
    const pending = await notificationService.getPending();
    setPendingCount(pending.length);
  };

  const handleProfileUpdate = (mbti: MBTIType, birth: SajuInput) => {
    const sajuResult = calculateSaju(birth);
    const dominantElement = (Object.entries(sajuResult.elements) as [Element, number][])
      .sort((a, b) => b[1] - a[1])[0][0];
    const destinyChar = getDestinyCharacter(mbti, dominantElement);

    const updatedProfile: UserProfile = {
      ...profile!,
      mbti,
      element: dominantElement,
      birthInfo: birth,
      characterId: destinyChar.id,
      characterName: destinyChar.name,
      characterEmoji: destinyChar.emoji,
      updatedAt: new Date().toISOString()
    };

    storage.saveProfile(updatedProfile);
    setProfile(updatedProfile);
    setIsEditing(false);

    const score = calculateFortuneScore(updatedProfile);
    setFortuneScore(score.totalScore);
    setFortuneLevel(score.level);
    setFortuneEmoji(score.emoji);
  };

  const handleToggleNotifications = async () => {
    if (!notifSettings.enabled) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        alert('알림 권한이 필요합니다.');
        return;
      }
      await notificationService.initialize();
    }

    const newSettings = { ...notifSettings, enabled: !notifSettings.enabled };
    if (!newSettings.enabled) {
      await notificationService.cancelAll();
      newSettings.dailyFortune = false;
    }
    setNotifSettings(newSettings);
    notificationService.saveSettings(newSettings);
  };

  const handleToggleDailyFortune = async () => {
    if (!notifSettings.enabled) {
      alert('먼저 알림을 활성화해주세요.');
      return;
    }
    const newSettings = { ...notifSettings, dailyFortune: !notifSettings.dailyFortune };
    if (newSettings.dailyFortune) {
      await notificationService.scheduleDailyFortune(notifSettings.dailyFortuneTime);
    } else {
      await notificationService.cancelAll();
    }
    setNotifSettings(newSettings);
    notificationService.saveSettings(newSettings);
    await checkPendingNotifications();
  };

  const handleTimeChange = async (time: string) => {
    const newSettings = { ...notifSettings, dailyFortuneTime: time };
    setNotifSettings(newSettings);
    notificationService.saveSettings(newSettings);
    if (notifSettings.dailyFortune) {
      await notificationService.cancelAll();
      await notificationService.scheduleDailyFortune(time);
      await checkPendingNotifications();
    }
  };

  const handleTestNotification = async () => {
    if (!notifSettings.enabled) {
      alert('먼저 알림을 활성화해주세요.');
      return;
    }
    await notificationService.sendTestNotification();
    alert('테스트 알림이 전송됩니다!');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg pb-24">
        <SkeletonLoader type="gauge" />
        <div className="mt-6"><SkeletonLoader type="card" /></div>
        <div className="mt-4"><SkeletonLoader type="card" /></div>
      </div>
    );
  }

  if (!profile) return null;

  const character = getDestinyCharacter(profile.mbti, profile.element);
  const gradient = ELEMENT_GRADIENTS[profile.element];

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg pb-24">
      <FloatingOrbs />

      {/* Hero: Character Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${gradient} rounded-3xl p-8 text-white text-center shadow-2xl mb-6 relative overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-20 translate-x-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-16 -translate-x-16" />
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
            className="text-7xl mb-3"
          >
            {profile.characterEmoji}
          </motion.div>
          <h1 className="text-2xl font-bold mb-1">{profile.characterName}</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-sm font-semibold">
              {profile.mbti}
            </span>
            <span className="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-sm font-semibold">
              {profile.element}
            </span>
            <span className="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-sm font-semibold">
              {CATEGORY_NAMES[character.category] || character.category}
            </span>
          </div>

          {/* Fortune Score */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
            <FortuneScoreGauge score={fortuneScore} size="sm" showLevel={false} />
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-lg">{fortuneEmoji}</span>
              <span className="font-bold text-sm">{fortuneLevel}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Birth Info / Edit */}
      <GlassCard className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-royal-gold" />
            내 정보
          </h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 text-sm text-purple-600 font-semibold"
          >
            {isEditing ? (
              <>
                <RotateCcw className="w-4 h-4" />
                취소
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                수정
              </>
            )}
          </button>
        </div>

        {isEditing ? (
          <BirthInfoForm
            initialMBTI={profile.mbti}
            initialBirth={profile.birthInfo}
            onSubmit={handleProfileUpdate}
            submitLabel="프로필 업데이트"
            submitGradient="from-purple-500 to-pink-500"
            prefillFromProfile={false}
          />
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">MBTI</span>
              <span className="font-semibold text-gray-800">{profile.mbti}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">성별</span>
              <span className="font-semibold text-gray-800">
                {profile.birthInfo.gender === 'male' ? '남성' : '여성'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">생년월일</span>
              <span className="font-semibold text-gray-800">
                {profile.birthInfo.birthYear}년 {profile.birthInfo.birthMonth}월 {profile.birthInfo.birthDay}일
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">태어난 시</span>
              <span className="font-semibold text-gray-800">{profile.birthInfo.birthHour}시</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">주도 오행</span>
              <span className="font-semibold text-gray-800">{profile.element}</span>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Notification Settings */}
      <GlassCard className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-royal-gold" />
          알림 설정
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-700 text-sm">알림 허용</p>
              <p className="text-xs text-gray-500">모든 알림 기능 활성화</p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`w-14 h-8 rounded-full transition-all ${
                notifSettings.enabled ? 'bg-royal-gold' : 'bg-gray-300'
              }`}
            >
              <motion.div
                animate={{ x: notifSettings.enabled ? 24 : 4 }}
                className="w-6 h-6 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          <div className="border-t border-white/30 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-700 text-sm">일일 운세 알림</p>
                <p className="text-xs text-gray-500">매일 운세를 알려드립니다</p>
              </div>
              <button
                onClick={handleToggleDailyFortune}
                disabled={!notifSettings.enabled}
                className={`w-14 h-8 rounded-full transition-all ${
                  notifSettings.dailyFortune ? 'bg-royal-gold' : 'bg-gray-300'
                } ${!notifSettings.enabled && 'opacity-50'}`}
              >
                <motion.div
                  animate={{ x: notifSettings.dailyFortune ? 24 : 4 }}
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                />
              </button>
            </div>

            {notifSettings.dailyFortune && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white/30 rounded-lg p-3"
              >
                <label className="block text-xs text-gray-500 mb-2">알림 시간</label>
                <input
                  type="time"
                  value={notifSettings.dailyFortuneTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-royal-gold text-sm"
                />
                {pendingCount > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    {pendingCount}개의 알림이 예약됨
                  </p>
                )}
              </motion.div>
            )}
          </div>

          <button
            onClick={handleTestNotification}
            disabled={!notifSettings.enabled}
            className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
              notifSettings.enabled
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            <TestTube className="inline w-4 h-4 mr-1" />
            테스트 알림 보내기
          </button>
        </div>
      </GlassCard>

      {/* App Info */}
      <GlassCard>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-royal-gold" />
          앱 정보
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">버전</span>
            <span className="font-semibold text-gray-700">2.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">개발자</span>
            <span className="font-semibold text-gray-700">NAMSIK93</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">플랫폼</span>
            <span className="font-semibold text-gray-700">Next.js + Capacitor</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
