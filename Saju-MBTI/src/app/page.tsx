'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Star, ChevronRight, History, Calendar, Scan } from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import AdBanner from '@/components/AdBanner';
import DailyFortuneWidget from '@/components/DailyFortuneWidget';
import FortuneScoreGauge from '@/components/FortuneScoreGauge';
import { storage } from '@/lib/storage';
import { calculateFortuneScore } from '@/lib/fortuneScore';
import { UserProfile, Element } from '@/types';

const ELEMENT_EMOJIS: Record<Element, string> = {
  '목': '🌿', '화': '🔥', '토': '🏔', '금': '⚡', '수': '💧'
};

const features = [
  {
    title: '스마트 사주 분석',
    description: '오행 분포와 운세를 알아보세요',
    icon: Sparkles,
    link: '/saju',
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconGradient: 'from-purple-400 to-pink-400',
    borderColor: 'border-purple-300/30'
  },
  {
    title: 'MBTI 궁합',
    description: '찰떡궁합을 확인해보세요',
    icon: Heart,
    link: '/mbti',
    gradient: 'from-red-500/20 to-pink-500/20',
    iconGradient: 'from-red-400 to-pink-400',
    borderColor: 'border-red-300/30'
  },
  {
    title: '운명 캐릭터',
    description: '나만의 80가지 캐릭터 발견',
    icon: Star,
    link: '/destiny',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    iconGradient: 'from-yellow-400 to-amber-400',
    borderColor: 'border-amber-300/30'
  }
];

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fortuneScore, setFortuneScore] = useState(0);
  const [fortuneLevel, setFortuneLevel] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedProfile = storage.getProfile();
    if (savedProfile) {
      setProfile(savedProfile);
      const score = calculateFortuneScore(savedProfile);
      setFortuneScore(score.totalScore);
      setFortuneLevel(score.level);
    }
    setIsLoaded(true);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg pb-24">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-6"
      >
        {profile ? (
          /* 프로필 있을 때: 캐릭터 + 점수 표시 */
          <div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mb-3"
            >
              <span className="text-6xl">{profile.characterEmoji}</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              안녕하세요, {profile.characterName}님
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="px-2 py-0.5 bg-purple-500/15 rounded-full text-xs font-semibold text-purple-700">
                {profile.mbti}
              </span>
              <span className="px-2 py-0.5 bg-amber-500/15 rounded-full text-xs font-semibold text-amber-700">
                {ELEMENT_EMOJIS[profile.element]} {profile.element}
              </span>
            </div>
          </div>
        ) : (
          /* 프로필 없을 때: 기본 히어로 */
          <div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/30">
                <Sparkles className="w-10 h-10 text-royal-gold" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              운명과 성격
            </h1>
            <p className="text-pastel-brown text-base">
              Fortune & MBTI
            </p>
          </div>
        )}
      </motion.div>

      {/* Daily Fortune Widget (온보딩 CTA 또는 오늘 운세) */}
      <DailyFortuneWidget />

      {/* Feature Cards */}
      <div className="space-y-3 mb-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Link key={index} href={feature.link}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`bg-gradient-to-r ${feature.gradient} backdrop-blur-md rounded-2xl shadow-lg border ${feature.borderColor} p-5 mb-1`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.iconGradient} shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-0.5">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/history">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <GlassCard className="!p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-400">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">히스토리</h3>
                  <p className="text-xs text-gray-500">분석 기록</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </Link>

        <Link href="/scan">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <GlassCard className="!p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-400">
                  <Scan className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">운세 스캔</h3>
                  <p className="text-xs text-gray-500">카메라 분석</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </Link>
      </div>

      <AdBanner />
    </div>
  );
}
