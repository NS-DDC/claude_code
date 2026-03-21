'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Star, Moon, Sun, Type } from 'lucide-react';
import Link from 'next/link';
import DailyFortuneWidget from '@/components/DailyFortuneWidget';

interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  gradient: string;
  isNew?: boolean;
}

const features: Feature[] = [
  {
    title: '사주 분석',
    description: '생년월일시로 오행과 운세 확인',
    icon: Sparkles,
    link: '/saju',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    title: 'MBTI 궁합',
    description: '나와 상대방의 찰떡궁합 분석',
    icon: Heart,
    link: '/mbti',
    gradient: 'from-red-500 to-rose-600',
  },
  {
    title: '운명 캐릭터',
    description: 'MBTI × 사주 나만의 캐릭터',
    icon: Star,
    link: '/destiny',
    gradient: 'from-amber-500 to-yellow-600',
  },
  {
    title: '타로 카드',
    description: '오늘 타로가 전하는 메시지',
    icon: Moon,
    link: '/tarot',
    gradient: 'from-indigo-500 to-blue-700',
    isNew: true,
  },
  {
    title: '이름 운세',
    description: '이름 속에 담긴 운명의 뜻',
    icon: Type,
    link: '/name-fortune',
    gradient: 'from-green-500 to-emerald-600',
    isNew: true,
  },
  {
    title: '오늘의 운세',
    description: '오늘 하루 나의 운세 한눈에',
    icon: Sun,
    link: '/daily',
    gradient: 'from-orange-500 to-amber-600',
  },
];

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 11) return '좋은 아침이에요';
  if (hour >= 11 && hour < 17) return '좋은 낮이에요';
  if (hour >= 17 && hour < 21) return '좋은 저녁이에요';
  return '좋은 밤이에요';
}

function getTimeEmoji(hour: number): string {
  if (hour >= 5 && hour < 11) return '🌅';
  if (hour >= 11 && hour < 17) return '☀️';
  if (hour >= 17 && hour < 21) return '🌆';
  return '🌙';
}

interface StreakData {
  streak: number;
}

function useStreak(): StreakData {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      const today = new Date().toDateString();
      const savedStreak = parseInt(localStorage.getItem('daily_streak') ?? '0', 10);
      const lastVisit = localStorage.getItem('last_visit_date');

      let newStreak = savedStreak;
      if (lastVisit !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastVisit === yesterday.toDateString()) {
          newStreak = savedStreak + 1;
        } else if (lastVisit === null) {
          newStreak = 1;
        } else {
          newStreak = 1;
        }
        localStorage.setItem('daily_streak', String(newStreak));
        localStorage.setItem('last_visit_date', today);
      }
      setStreak(newStreak);
    } catch {
      setStreak(0);
    }
  }, []);

  return { streak };
}

const starPositions = [
  { top: '8%', left: '12%', size: 'w-1.5 h-1.5' },
  { top: '15%', left: '75%', size: 'w-2 h-2' },
  { top: '5%', left: '45%', size: 'w-1 h-1' },
  { top: '22%', left: '88%', size: 'w-1.5 h-1.5' },
  { top: '30%', left: '5%', size: 'w-1 h-1' },
];

export default function Home() {
  const { streak } = useStreak();
  const [greeting, setGreeting] = useState('좋은 하루예요');
  const [timeEmoji, setTimeEmoji] = useState('✨');
  const [hasFortune, setHasFortune] = useState(false);
  // mounted: false during SSR/first render → content visible; true after mount → animations play
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(getGreeting(hour));
    setTimeEmoji(getTimeEmoji(hour));
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const userMBTI = localStorage.getItem('userMBTI');
      const userElement = localStorage.getItem('userElement');
      setHasFortune(!!userMBTI && !!userElement);
    } catch {
      setHasFortune(false);
    }
  }, []);

  // Capacitor / Android fix: initial={false} renders content visible in SSR HTML
  // so Android WebView always shows content even if JS animations load slowly
  const headerAnim = mounted
    ? { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } }
    : { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background stars */}
      {starPositions.map((pos, i) => (
        <div
          key={i}
          className={`star-float absolute ${pos.size} rounded-full bg-star-white opacity-60 pointer-events-none`}
          style={{ top: pos.top, left: pos.left }}
        />
      ))}

      <div className="container mx-auto px-4 py-8 max-w-lg relative z-10">
        {/* Header greeting — always visible, animates after mount */}
        <motion.div
          initial={headerAnim.initial}
          animate={headerAnim.animate}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-3"
          >
            <Sparkles className="w-14 h-14 text-royal-gold" />
          </motion.div>

          <h1 className="text-3xl font-bold text-star-white mb-1">
            {timeEmoji} {greeting}
          </h1>
          <p className="text-pastel-brown text-base">
            오늘도 운명이 당신을 기다립니다
          </p>

          {/* Streak badge */}
          {streak > 1 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full glass-mystical text-royal-gold text-sm font-semibold"
            >
              <span>🔥</span>
              <span>{streak}일 연속</span>
              {[3, 7, 14, 30].includes(streak) && (
                <span className="ml-1 text-xs bg-yellow-400/20 text-yellow-300 px-1.5 rounded-full">
                  {streak}일 달성!
                </span>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Daily Fortune Widget or Onboarding CTA */}
        {hasFortune ? (
          <DailyFortuneWidget />
        ) : (
          <div className="glass-mystical rounded-2xl p-5 text-center mb-6">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="text-star-white font-bold mb-1">맞춤 운세를 받아보세요</h3>
            <p className="text-white/60 text-sm mb-3">프로필을 설정하면 오늘의 운세를 확인할 수 있어요</p>
            <Link href="/profile" className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">프로필 설정하기</Link>
          </div>
        )}

        {/* Feature grid — 2 columns × 3 rows, always visible for Capacitor compatibility */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.link} href={feature.link}>
                <motion.div
                  initial={mounted ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: mounted ? index * 0.08 + 0.1 : 0 }}
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  className="glass-mystical rounded-2xl p-4 cursor-pointer h-full relative"
                >
                  {feature.isNew && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                  )}
                  <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${feature.gradient} mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-star-white mb-1 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-pastel-brown leading-snug">
                    {feature.description}
                  </p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
