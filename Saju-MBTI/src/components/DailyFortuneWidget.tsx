'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, ArrowRight, Calendar, Share2 } from 'lucide-react';
import { Share } from '@capacitor/share';
import { getTodayFortune } from '@/lib/dailyFortune';
import { MBTIType, Element, DailyFortuneResult } from '@/types';

const ELEMENT_COLORS: Record<Element, string> = {
  '목': 'from-green-400 to-emerald-500',
  '화': 'from-red-400 to-rose-500',
  '토': 'from-yellow-400 to-amber-500',
  '금': 'from-gray-400 to-slate-500',
  '수': 'from-blue-400 to-cyan-500'
};

export default function DailyFortuneWidget() {
  const [fortune, setFortune] = useState<DailyFortuneResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDailyFortune();
  }, []);

  const loadDailyFortune = () => {
    try {
      // Try to load user's MBTI and birth info from localStorage
      const savedMBTI = localStorage.getItem('userMBTI') as MBTIType | null;
      const savedElement = localStorage.getItem('userElement') as Element | null;

      if (savedMBTI && savedElement) {
        const todayFortune = getTodayFortune(savedMBTI, savedElement);
        setFortune(todayFortune);
      }
    } catch (error) {
      console.error('Failed to load daily fortune:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!fortune) return;

    try {
      const today = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const shareText = `✨ Fortune & MBTI - 오늘의 운세\n\n${today}\n${fortune.character.emoji} ${fortune.character.name}\n\n📝 ${fortune.fortuneMessage}\n\n🍀 행운의 시간: ${fortune.luckyTime}\n🎲 행운의 숫자: ${fortune.luckyNumber}\n\n당신의 오늘 운세를 확인해보세요! 🌟`;

      await Share.share({
        title: 'Fortune & MBTI - 오늘의 운세',
        text: shareText,
        dialogTitle: '친구에게 공유하기'
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // Don't show widget if no user data
  if (!fortune || isLoading) {
    return null;
  }

  const gradientClass = ELEMENT_COLORS[fortune.character.element];
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
              <Sparkles className="w-6 h-6" />
            </div>

            {/* Character */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{fortune.character.emoji}</div>
              <div>
                <h3 className="font-bold text-lg mb-1">오늘의 운세</h3>
                <p className="text-sm opacity-90">{fortune.character.name}</p>
              </div>
            </div>

            {/* Fortune Message */}
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
              <p className="text-sm leading-relaxed">
                {fortune.fortuneMessage}
              </p>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xs opacity-80 mb-1">행운의 시간</p>
                <p className="text-sm font-semibold">{fortune.luckyTime}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2">
                <p className="text-xs opacity-80 mb-1">행운의 숫자</p>
                <p className="text-sm font-semibold">{fortune.luckyNumber}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm opacity-90">
                <span>자세히 보기</span>
                <ArrowRight className="w-4 h-4" />
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="bg-white/30 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 transition-colors"
                aria-label="공유하기"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
