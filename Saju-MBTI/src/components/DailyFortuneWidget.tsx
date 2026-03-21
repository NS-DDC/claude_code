'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, ArrowRight, Calendar, Share2 } from 'lucide-react';
import { Share } from '@capacitor/share';
import { getTodayFortune, generateDailyScores, DailyScores } from '@/lib/dailyFortune';
import { MBTIType, Element, DailyFortuneResult } from '@/types';

const ELEMENT_COLORS: Record<Element, string> = {
  '목': 'from-green-400 to-emerald-500',
  '화': 'from-red-400 to-rose-500',
  '토': 'from-yellow-400 to-amber-500',
  '금': 'from-gray-400 to-slate-500',
  '수': 'from-blue-400 to-cyan-500'
};

interface ScorePillProps {
  icon: string;
  label: string;
  score: number;
  color: string;
}

function ScorePill({ icon, label, score, color }: ScorePillProps) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${color} bg-white/20`}>
      <span className="text-xs">{icon}</span>
      <span className="text-xs text-white/90 font-medium">{label}</span>
      <span className="text-xs text-white font-bold">{score}</span>
    </div>
  );
}

export default function DailyFortuneWidget() {
  const [fortune, setFortune] = useState<DailyFortuneResult | null>(null);
  const [scores, setScores] = useState<DailyScores | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDailyFortune();
  }, []);

  const loadDailyFortune = () => {
    try {
      const savedMBTI = localStorage.getItem('userMBTI') as MBTIType | null;
      const savedElement = localStorage.getItem('userElement') as Element | null;

      if (savedMBTI && savedElement) {
        const todayFortune = getTodayFortune(savedMBTI, savedElement);
        const todayDateStr = new Date().toISOString().slice(0, 10);
        const dailyScores = generateDailyScores(todayDateStr, savedElement, savedMBTI);
        setFortune(todayFortune);
        setScores(dailyScores);
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

    if (!fortune || !scores) return;

    try {
      const today = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const shareText = `✨ Fortune & MBTI - 오늘의 운세\n\n${today}\n${fortune.character.emoji} ${fortune.character.name}\n\n❤️ 애정운 ${scores.love}점  💼 직업운 ${scores.career}점  💰 재물운 ${scores.wealth}점\n\n🍀 행운의 숫자: ${scores.luckyNumber}\n🍽️ 행운의 음식: ${scores.luckyFood}\n\n당신의 오늘 운세를 확인해보세요! 🌟`;

      await Share.share({
        title: 'Fortune & MBTI - 오늘의 운세',
        text: shareText,
        dialogTitle: '친구에게 공유하기'
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (!fortune || !scores || isLoading) {
    return null;
  }

  const gradientClass = ELEMENT_COLORS[fortune.character.element];
  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  // Top 3 scores sorted descending
  const scoreEntries: Array<{ icon: string; label: string; score: number }> = [
    { icon: '❤️', label: '애정', score: scores.love },
    { icon: '💼', label: '직업', score: scores.career },
    { icon: '💰', label: '재물', score: scores.wealth },
    { icon: '🌿', label: '건강', score: scores.health },
    { icon: '📚', label: '학업', score: scores.study },
  ];
  const top3 = [...scoreEntries].sort((a, b) => b.score - a.score).slice(0, 3);

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
          animate={{ boxShadow: ['0 4px 24px 0 rgba(168,85,247,0.15)', '0 4px 32px 4px rgba(236,72,153,0.25)', '0 4px 24px 0 rgba(168,85,247,0.15)'] }}
          transition={{ boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 0.2 } }}
          className={`bg-gradient-to-br ${gradientClass} rounded-2xl shadow-xl p-5 text-white cursor-pointer relative overflow-hidden`}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
          </div>

          <div className="relative z-10">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-80" />
                <span className="text-xs font-semibold opacity-90">{today}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold">오늘의 운세</span>
              </div>
            </div>

            {/* Character + lucky number */}
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl">{fortune.character.emoji}</div>
              <div className="flex-1">
                <h3 className="font-bold text-base leading-tight">{fortune.character.name}</h3>
                <p className="text-xs opacity-80 leading-snug mt-0.5 line-clamp-2">
                  {fortune.fortuneMessage}
                </p>
              </div>
              {/* Lucky number badge */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm flex flex-col items-center justify-center border border-white/30">
                <span className="text-xs opacity-80 leading-none">행운</span>
                <span className="text-xl font-black leading-none">{scores.luckyNumber}</span>
              </div>
            </div>

            {/* Top 3 score pills */}
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {top3.map((s) => (
                <ScorePill key={s.label} icon={s.icon} label={s.label} score={s.score} color="" />
              ))}
            </div>

            {/* Lucky food row */}
            <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5 mb-3">
              <span className="text-sm">🍽️</span>
              <span className="text-xs opacity-80">행운의 음식</span>
              <span className="text-xs font-bold ml-auto">{scores.luckyFood}</span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs opacity-90">
                <span>자세히 보기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="bg-white/30 hover:bg-white/40 backdrop-blur-sm rounded-full p-1.5 transition-colors"
                aria-label="공유하기"
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
