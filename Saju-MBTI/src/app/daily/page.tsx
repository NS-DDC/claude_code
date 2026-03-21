'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, ArrowLeft, Flame, Compass, Star, Trophy } from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { getTodayFortune, generateDailyScores, DailyScores } from '@/lib/dailyFortune';

const FloatingOrbs = dynamic(() => import('@/components/FloatingOrbs'), {
  loading: () => <LoadingSkeleton type="orbs" />,
  ssr: false
});

import { storageService } from '@/lib/storageService';
import { useAuth } from '@/contexts/AuthContext';
import { MBTIType, Element, DailyFortuneResult } from '@/types';

const ELEMENT_COLORS: Record<Element, string> = {
  '목': 'from-green-400 to-emerald-500',
  '화': 'from-red-400 to-rose-500',
  '토': 'from-yellow-400 to-amber-500',
  '금': 'from-gray-400 to-slate-500',
  '수': 'from-blue-400 to-cyan-500'
};

const LUCKY_COLOR_HEX: Record<string, string> = {
  '빨간색': '#ef4444',
  '파란색': '#3b82f6',
  '초록색': '#22c55e',
  '노란색': '#eab308',
  '보라색': '#a855f7',
  '흰색': '#f1f5f9',
  '주황색': '#f97316',
  '분홍색': '#ec4899',
};

interface ScoreBarProps {
  label: string;
  icon: string;
  score: number;
  color: string;
}

function ScoreBar({ label, icon, score, color }: ScoreBarProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-white/90 text-sm font-medium">{icon} {label}</span>
        <span className="font-bold text-white text-sm">{score}점</span>
      </div>
      <div className="h-3 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '새벽에도 별이 빛나듯';
  if (hour < 12) return '좋은 아침이에요';
  if (hour < 18) return '활기찬 오후예요';
  return '편안한 저녁이에요';
}

function getTimeAdviceKey(): 'morningAdvice' | 'afternoonAdvice' | 'eveningAdvice' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morningAdvice';
  if (hour < 18) return 'afternoonAdvice';
  return 'eveningAdvice';
}

function useStreak(): number {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    try {
      const today = new Date().toDateString();
      const saved = parseInt(localStorage.getItem('daily_streak') ?? '0', 10);
      const lastVisit = localStorage.getItem('last_visit_date');
      let next = saved;
      if (lastVisit !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastVisit === yesterday.toDateString()) {
          next = saved + 1;
        } else {
          next = 1;
        }
        localStorage.setItem('daily_streak', String(next));
        localStorage.setItem('last_visit_date', today);
      }
      setStreak(next);
    } catch {
      setStreak(0);
    }
  }, []);
  return streak;
}

const MILESTONE_LABELS: Record<number, string> = {
  3:  '첫 번째 마일스톤 달성! 🥉',
  7:  '7일 연속! 일주일 달성! 🥈',
  14: '2주 연속! 대단해요! 🥇',
  30: '한 달 연속! 전설이 되었습니다! 👑',
};

export default function DailyFortunePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [fortune, setFortune] = useState<DailyFortuneResult | null>(null);
  const [scores, setScores] = useState<DailyScores | null>(null);
  const [tomorrowScores, setTomorrowScores] = useState<DailyScores | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noProfile, setNoProfile] = useState(false);
  const streak = useStreak();

  useEffect(() => { setMounted(true); }, []);

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const tomorrowDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  useEffect(() => {
    loadFortune();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadFortune = async () => {
    try {
      const prefs = await storageService.getUserPreferences(user?.uid);
      if (prefs?.mbti && prefs?.element) {
        const mbti = prefs.mbti as MBTIType;
        const element = prefs.element as Element;
        const todayFortune = getTodayFortune(mbti, element);
        const dailyScores = generateDailyScores(todayDateStr, element, mbti);
        const nextDayScores = generateDailyScores(tomorrowDateStr, element, mbti);
        setFortune(todayFortune);
        setScores(dailyScores);
        setTomorrowScores(nextDayScores);

        await storageService.add({
          type: 'daily-fortune',
          data: todayFortune
        }, user?.uid);
      } else {
        setNoProfile(true);
      }
    } catch {
      setNoProfile(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg pb-24">
        <div className="flex items-center justify-center h-96">
          <Sparkles className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg pb-24">
      <FloatingOrbs />

      {/* Header */}
      <motion.div
        initial={mounted ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 mb-4 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
          <span>홈으로</span>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              오늘의 운세
            </h1>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <p className="text-sm">{today}</p>
            </div>
          </div>

          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-400 to-rose-500 text-white px-3 py-2 rounded-xl shadow-md"
            >
              <Flame className="w-4 h-4" />
              <span className="font-bold text-sm">{streak}일 연속</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Streak milestone celebration banner */}
      {streak > 0 && streak in MILESTONE_LABELS && (
        <motion.div
          initial={mounted ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="mb-6 bg-gradient-to-r from-yellow-400 via-orange-400 to-rose-400 rounded-2xl p-4 shadow-xl text-center"
        >
          <Trophy className="w-8 h-8 text-white mx-auto mb-1" />
          <p className="text-white font-bold text-lg">{streak}일 연속 달성!</p>
          <p className="text-white/90 text-sm mt-0.5">{MILESTONE_LABELS[streak]}</p>
        </motion.div>
      )}

      {noProfile || !fortune || !scores ? (
        /* No profile — prompt user */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard>
            <div className="text-center py-6">
              <div className="text-6xl mb-4">🔮</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">프로필을 먼저 설정해주세요</h2>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                MBTI와 사주 정보를 입력하면<br />
                매일 맞춤 운세를 확인할 수 있어요
              </p>
              <Link href="/profile">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  프로필 설정하기
                </motion.div>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <GlassCard>
              <p className="text-center text-gray-500 text-sm mb-1">{getTimeGreeting()}</p>
              <p className="text-center text-gray-800 font-semibold leading-relaxed">
                {fortune.fortuneMessage}
              </p>
            </GlassCard>
          </motion.div>

          {/* Character badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6, delay: 0.1 }}
            className={`bg-gradient-to-br ${ELEMENT_COLORS[fortune.character.element]} rounded-2xl p-6 text-center shadow-xl`}
          >
            <div className="text-6xl mb-3">{fortune.character.emoji}</div>
            <h2 className="text-xl font-bold text-white mb-2">{fortune.character.name}</h2>
            <div className="flex justify-center gap-2 mb-5">
              <span className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-xs text-white font-semibold">
                {fortune.character.mbti}
              </span>
              <span className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-xs text-white font-semibold">
                {fortune.character.element}원소
              </span>
            </div>

            {/* Score Bars */}
            <div className="text-left">
              <ScoreBar label="애정운" icon="❤️" score={scores.love} color="bg-rose-400" />
              <ScoreBar label="직업운" icon="💼" score={scores.career} color="bg-blue-400" />
              <ScoreBar label="재물운" icon="💰" score={scores.wealth} color="bg-yellow-400" />
              <ScoreBar label="건강운" icon="🌿" score={scores.health} color="bg-emerald-400" />
              <ScoreBar label="학업운" icon="📚" score={scores.study} color="bg-purple-400" />
            </div>
          </motion.div>

          {/* Lucky items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-bold text-gray-800">오늘의 행운 아이템</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Direction */}
                <div className="bg-white/50 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">
                    <Compass className="w-6 h-6 text-blue-500 mx-auto" />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">행운의 방향</p>
                  <p className="font-bold text-gray-800 text-sm">{scores.direction}</p>
                </div>

                {/* Lucky Number */}
                <div className="bg-white/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-purple-600 mb-1">
                    {scores.luckyNumber}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">행운의 숫자</p>
                  <p className="font-bold text-gray-800 text-sm">#{scores.luckyNumber}</p>
                </div>

                {/* Lucky Color */}
                <div className="bg-white/50 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <div
                      className="w-8 h-8 rounded-full shadow border-2 border-white"
                      style={{ backgroundColor: LUCKY_COLOR_HEX[scores.luckyColor] ?? '#94a3b8' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">행운의 색상</p>
                  <p className="font-bold text-gray-800 text-sm">{scores.luckyColor}</p>
                </div>

                {/* Lucky Food */}
                <div className="bg-white/50 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">🍽️</div>
                  <p className="text-xs text-gray-500 mb-1">행운의 음식</p>
                  <p className="font-bold text-gray-800 text-sm">{scores.luckyFood}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Time-based advice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🕐</span>
                <h3 className="text-lg font-bold text-gray-800">시간대별 조언</h3>
              </div>

              <div className="space-y-3">
                <div className={`flex gap-3 p-3 rounded-xl ${getTimeAdviceKey() === 'morningAdvice' ? 'bg-orange-50 border border-orange-200' : 'bg-white/40'}`}>
                  <span className="text-lg flex-shrink-0">🌅</span>
                  <div>
                    <p className="text-xs font-semibold text-orange-600 mb-0.5">오전</p>
                    <p className="text-sm text-gray-700">{scores.morningAdvice}</p>
                  </div>
                </div>

                <div className={`flex gap-3 p-3 rounded-xl ${getTimeAdviceKey() === 'afternoonAdvice' ? 'bg-blue-50 border border-blue-200' : 'bg-white/40'}`}>
                  <span className="text-lg flex-shrink-0">☀️</span>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 mb-0.5">오후</p>
                    <p className="text-sm text-gray-700">{scores.afternoonAdvice}</p>
                  </div>
                </div>

                <div className={`flex gap-3 p-3 rounded-xl ${getTimeAdviceKey() === 'eveningAdvice' ? 'bg-indigo-50 border border-indigo-200' : 'bg-white/40'}`}>
                  <span className="text-lg flex-shrink-0">🌙</span>
                  <div>
                    <p className="text-xs font-semibold text-indigo-600 mb-0.5">저녁</p>
                    <p className="text-sm text-gray-700">{scores.eveningAdvice}</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Daily affirmation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 shadow-xl text-center">
              <div className="text-3xl mb-3">✨</div>
              <p className="text-xs text-white/80 mb-2 tracking-widest uppercase">오늘의 긍정 확언</p>
              <p className="text-white font-bold text-lg leading-relaxed">
                &ldquo;{scores.affirmation}&rdquo;
              </p>
            </div>
          </motion.div>

          {/* Compatible character */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">❤️</span>
                <h3 className="text-lg font-bold text-gray-800">오늘의 궁합 파트너</h3>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{fortune.compatibleCharacter.emoji}</div>
                  <div>
                    <h5 className="font-bold text-gray-800 mb-1">{fortune.compatibleCharacter.name}</h5>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-white/70 rounded-full text-xs font-semibold text-purple-700">
                        {fortune.compatibleCharacter.mbti}
                      </span>
                      <span className="px-2 py-1 bg-white/70 rounded-full text-xs font-semibold text-indigo-700">
                        {fortune.compatibleCharacter.element}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  오늘은 이 캐릭터와 특별한 인연이 있을 수 있습니다!
                </p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Tomorrow teaser */}
          {tomorrowScores && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🔮</span>
                  <h3 className="text-lg font-bold text-gray-800">내일의 운세 미리보기</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">내일은 오늘과 비교해서...</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(
                    [
                      { key: 'love',   label: '❤️ 애정' },
                      { key: 'career', label: '💼 직업' },
                      { key: 'wealth', label: '💰 재물' },
                    ] as { key: keyof DailyScores; label: string }[]
                  ).map(({ key, label }) => {
                    const diff = (tomorrowScores[key] as number) - (scores[key] as number);
                    return (
                      <div key={key} className="bg-white/50 rounded-xl p-2 text-center">
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p
                          className={`font-bold text-sm ${
                            diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-500'
                          }`}
                        >
                          {diff > 0 ? `↑ +${diff}` : diff < 0 ? `↓ ${diff}` : '→ 유지'}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-center text-gray-400">내일도 꼭 확인하세요 ✨</p>
              </GlassCard>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
