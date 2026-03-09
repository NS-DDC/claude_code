'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, ArrowRight, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getTodayFortune } from '@/lib/dailyFortune';
import { calculateFortuneScore } from '@/lib/fortuneScore';
import { storage } from '@/lib/storage';
import { MBTIType, Element, DailyFortuneResult, UserProfile } from '@/types';
import SkeletonLoader from './SkeletonLoader';

const ELEMENT_COLORS: Record<Element, string> = {
  '목': 'from-green-400 to-emerald-500',
  '화': 'from-red-400 to-rose-500',
  '토': 'from-yellow-400 to-amber-500',
  '금': 'from-gray-400 to-slate-500',
  '수': 'from-blue-400 to-cyan-500'
};

const TREND_ICONS = {
  rising: TrendingUp,
  stable: Minus,
  falling: TrendingDown
};

const TREND_LABELS = {
  rising: '상승',
  stable: '유지',
  falling: '하락'
};

export default function DailyFortuneWidget() {
  const [fortune, setFortune] = useState<DailyFortuneResult | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fortuneScore, setFortuneScore] = useState(0);
  const [fortuneLevel, setFortuneLevel] = useState('');
  const [fortuneEmoji, setFortuneEmoji] = useState('');
  const [fortuneTrend, setFortuneTrend] = useState<'rising' | 'stable' | 'falling'>('stable');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDailyFortune();
  }, []);

  const loadDailyFortune = () => {
    try {
      const savedProfile = storage.getProfile();
      setProfile(savedProfile);

      if (savedProfile) {
        const todayFortune = getTodayFortune(savedProfile.mbti, savedProfile.element);
        setFortune(todayFortune);

        const score = calculateFortuneScore(savedProfile);
        setFortuneScore(score.totalScore);
        setFortuneLevel(score.level);
        setFortuneEmoji(score.emoji);
        setFortuneTrend(score.trend);
      }
    } catch (error) {
      console.error('Failed to load daily fortune:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중
  if (isLoading) {
    return <SkeletonLoader type="widget" />;
  }

  // 프로필 없을 때: 온보딩 CTA 카드
  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <Link href="/onboarding">
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white cursor-pointer relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-12 h-12" />
                </motion.div>
                <div>
                  <h3 className="font-bold text-lg mb-1">나만의 운명 캐릭터를 발견하세요</h3>
                  <p className="text-sm opacity-90">MBTI와 사주가 만든 80가지 운명</p>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔮</span>
                  <div>
                    <p className="text-sm font-medium">매일 변하는 운세 점수</p>
                    <p className="text-xs opacity-80">사주 궁합과 MBTI 분석까지 한 번에</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">프로필 설정하기</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  // 프로필 있지만 fortune 로드 실패
  if (!fortune) return null;

  const gradientClass = ELEMENT_COLORS[fortune.character.element];
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const TrendIcon = TREND_ICONS[fortuneTrend];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <Link href="/daily">
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className={`bg-gradient-to-br ${gradientClass} rounded-2xl shadow-xl p-6 text-white cursor-pointer relative overflow-hidden`}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold text-sm">{today}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/25 backdrop-blur-sm rounded-full px-3 py-1">
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{TREND_LABELS[fortuneTrend]}</span>
                </div>
              </div>
            </div>

            {/* Character + Score */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{fortune.character.emoji}</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">오늘의 운세</h3>
                <p className="text-sm opacity-90">{fortune.character.name}</p>
              </div>
              {/* Fortune Score Badge */}
              <div className="bg-white/25 backdrop-blur-sm rounded-2xl px-4 py-3 text-center">
                <div className="text-2xl font-bold">{fortuneScore}</div>
                <div className="text-xs opacity-90">{fortuneLevel}</div>
              </div>
            </div>

            {/* Fortune Message */}
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
              <p className="text-sm leading-relaxed">
                {fortune.fortuneMessage}
              </p>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white/20 rounded-lg p-2 text-center">
                <p className="text-xs opacity-80 mb-1">행운 시간</p>
                <p className="text-xs font-semibold">{fortune.luckyTime}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 text-center">
                <p className="text-xs opacity-80 mb-1">행운 숫자</p>
                <p className="text-sm font-bold">{fortune.luckyNumber}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 text-center">
                <p className="text-xs opacity-80 mb-1">행운 색상</p>
                <div className="flex items-center justify-center gap-1">
                  <div
                    className="w-4 h-4 rounded-full border border-white/50"
                    style={{ backgroundColor: fortune.luckyColor.hex }}
                  />
                  <span className="text-xs font-semibold">{fortune.luckyColor.name}</span>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">자세히 보기</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
