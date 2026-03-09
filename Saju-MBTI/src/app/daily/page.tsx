'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Sparkles, ThumbsUp, ThumbsDown, Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import BirthInfoForm from '@/components/BirthInfoForm';
import FortuneScoreGauge from '@/components/FortuneScoreGauge';
import SkeletonLoader from '@/components/SkeletonLoader';
import FloatingOrbs from '@/components/FloatingOrbs';
import { getTodayFortune, getDailyFortune } from '@/lib/dailyFortune';
import { calculateSaju } from '@/lib/sajuCalculator';
import { calculateFortuneScore, getWeeklyScores, getWeekDayNames } from '@/lib/fortuneScore';
import { getDestinyCharacter } from '@/lib/destinyCharacter';
import { storage } from '@/lib/storage';
import { MBTIType, SajuInput, DailyFortuneResult, Element, UserProfile } from '@/types';

const ELEMENT_COLORS: Record<Element, string> = {
  '목': 'from-green-400 to-emerald-500',
  '화': 'from-red-400 to-rose-500',
  '토': 'from-yellow-400 to-amber-500',
  '금': 'from-gray-400 to-slate-500',
  '수': 'from-blue-400 to-cyan-500'
};

const TREND_ICONS: Record<string, typeof TrendingUp> = {
  rising: TrendingUp,
  stable: Minus,
  falling: TrendingDown
};

type ViewTab = 'today' | 'week';

export default function DailyFortunePage() {
  const [fortune, setFortune] = useState<DailyFortuneResult | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>('today');
  const [fortuneScore, setFortuneScore] = useState(0);
  const [fortuneTrend, setFortuneTrend] = useState<'rising' | 'stable' | 'falling'>('stable');
  const [weeklyScores, setWeeklyScores] = useState<any[]>([]);
  const [selectedWeekDay, setSelectedWeekDay] = useState<number | null>(null);

  useEffect(() => {
    loadFortune();
  }, []);

  const loadFortune = () => {
    try {
      const savedProfile = storage.getProfile();
      setProfile(savedProfile);

      if (savedProfile) {
        const todayFortune = getTodayFortune(savedProfile.mbti, savedProfile.element);
        setFortune(todayFortune);

        const score = calculateFortuneScore(savedProfile);
        setFortuneScore(score.totalScore);
        setFortuneTrend(score.trend);

        const weekly = getWeeklyScores(savedProfile);
        setWeeklyScores(weekly);

        storage.add({ type: 'daily-fortune', data: todayFortune });
      } else {
        setShowInput(true);
      }
    } catch (error) {
      console.error('Failed to load fortune:', error);
      setShowInput(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (mbti: MBTIType, birth: SajuInput) => {
    const sajuResult = calculateSaju(birth);
    const element = (Object.entries(sajuResult.elements) as [Element, number][])
      .sort((a, b) => b[1] - a[1])[0][0];
    const destinyChar = getDestinyCharacter(mbti, element);

    const newProfile: UserProfile = {
      mbti,
      element,
      birthInfo: birth,
      characterId: destinyChar.id,
      characterName: destinyChar.name,
      characterEmoji: destinyChar.emoji,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storage.saveProfile(newProfile);
    setProfile(newProfile);

    const todayFortune = getTodayFortune(mbti, element);
    setFortune(todayFortune);

    const score = calculateFortuneScore(newProfile);
    setFortuneScore(score.totalScore);
    setFortuneTrend(score.trend);

    const weekly = getWeeklyScores(newProfile);
    setWeeklyScores(weekly);

    storage.add({ type: 'daily-fortune', data: todayFortune });
    setShowInput(false);
  };

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // 요일 인덱스 (월=0 ~ 일=6)
  const todayDayIndex = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  })();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg pb-24">
        <SkeletonLoader type="gauge" />
        <div className="mt-6"><SkeletonLoader type="card" /></div>
        <div className="mt-4"><SkeletonLoader type="card" /></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg pb-24">
      <FloatingOrbs />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          오늘의 운세
        </h1>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <p className="text-sm">{today}</p>
        </div>
      </motion.div>

      {showInput || !fortune ? (
        /* Input Form */
        <GlassCard>
          <h2 className="text-xl font-bold mb-4 text-gray-800">정보 입력</h2>
          <BirthInfoForm
            onSubmit={handleFormSubmit}
            submitLabel="오늘의 운세 보기"
            submitGradient="from-purple-500 to-pink-500"
          />
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex gap-2 bg-white/30 backdrop-blur-md rounded-xl p-1 border border-white/20">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'today'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/30'
              }`}
            >
              오늘
            </button>
            <button
              onClick={() => setActiveTab('week')}
              className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'week'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/30'
              }`}
            >
              이번 주
            </button>
          </div>

          {activeTab === 'today' ? (
            /* TODAY TAB */
            <>
              {/* Fortune Score Gauge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <GlassCard hover={false} className="text-center">
                  <FortuneScoreGauge score={fortuneScore} size="lg" />
                </GlassCard>
              </motion.div>

              {/* Character Card */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`bg-gradient-to-br ${ELEMENT_COLORS[fortune.character.element]} rounded-2xl p-6 text-center shadow-xl`}
              >
                <div className="text-7xl mb-3">{fortune.character.emoji}</div>
                <h2 className="text-xl font-bold text-white mb-2">{fortune.character.name}</h2>
                <div className="flex justify-center gap-2">
                  <span className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-sm text-white font-semibold">
                    {fortune.character.mbti}
                  </span>
                  <span className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-sm text-white font-semibold">
                    {fortune.character.element}
                  </span>
                </div>
              </motion.div>

              {/* Fortune Message */}
              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-bold text-gray-800">오늘의 메시지</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {fortune.fortuneMessage}
                </p>
              </GlassCard>

              {/* Lucky Elements Grid */}
              <div className="grid grid-cols-3 gap-3">
                <GlassCard className="text-center !p-3">
                  <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <h4 className="font-semibold text-gray-800 text-xs mb-1">행운 시간</h4>
                  <p className="text-xs text-gray-600">{fortune.luckyTime}</p>
                </GlassCard>
                <GlassCard className="text-center !p-3">
                  <Sparkles className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                  <h4 className="font-semibold text-gray-800 text-xs mb-1">행운 숫자</h4>
                  <p className="text-xl font-bold text-purple-600">{fortune.luckyNumber}</p>
                </GlassCard>
                <GlassCard className="text-center !p-3">
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-1 shadow border-2 border-white"
                    style={{ backgroundColor: fortune.luckyColor.hex }}
                  />
                  <h4 className="font-semibold text-gray-800 text-xs mb-1">행운 색상</h4>
                  <p className="text-xs text-gray-600">{fortune.luckyColor.name}</p>
                </GlassCard>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <GlassCard className="!p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-800 text-sm">하면 좋은 일</h4>
                  </div>
                  <p className="text-sm text-gray-700 bg-green-50/50 p-3 rounded-lg">
                    {fortune.luckyAction}
                  </p>
                </GlassCard>
                <GlassCard className="!p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsDown className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-gray-800 text-sm">피할 일</h4>
                  </div>
                  <p className="text-sm text-gray-700 bg-red-50/50 p-3 rounded-lg">
                    {fortune.avoidAction}
                  </p>
                </GlassCard>
              </div>

              {/* Compatible Character */}
              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-pink-600" />
                  <h4 className="font-semibold text-gray-800">오늘의 궁합 파트너</h4>
                </div>
                <div className="bg-gradient-to-br from-pink-50/50 to-purple-50/50 rounded-xl p-4 border border-pink-200/50">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{fortune.compatibleCharacter.emoji}</div>
                    <div>
                      <h5 className="font-bold text-gray-800 text-sm mb-1">
                        {fortune.compatibleCharacter.name}
                      </h5>
                      <div className="flex gap-1">
                        <span className="px-2 py-0.5 bg-white/70 rounded-full text-xs font-semibold text-purple-700">
                          {fortune.compatibleCharacter.mbti}
                        </span>
                        <span className="px-2 py-0.5 bg-white/70 rounded-full text-xs font-semibold text-indigo-700">
                          {fortune.compatibleCharacter.element}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </>
          ) : (
            /* WEEK TAB */
            <>
              {/* Weekly Score Cards */}
              <GlassCard hover={false}>
                <h3 className="font-bold text-gray-800 mb-4">이번 주 운세 흐름</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {weeklyScores.map((dayScore, index) => {
                    const dayNames = getWeekDayNames();
                    const isToday = index === todayDayIndex;
                    const TrendIcon = TREND_ICONS[dayScore.trend];
                    const scoreColor = dayScore.totalScore >= 70 ? 'text-green-600' :
                                       dayScore.totalScore >= 50 ? 'text-yellow-600' :
                                       dayScore.totalScore >= 30 ? 'text-orange-600' : 'text-red-600';

                    return (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedWeekDay(selectedWeekDay === index ? null : index)}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-shrink-0 w-16 rounded-xl p-3 text-center transition-all ${
                          isToday
                            ? 'bg-gradient-to-b from-purple-500 to-pink-500 text-white shadow-lg'
                            : selectedWeekDay === index
                              ? 'bg-white/60 border-2 border-purple-300'
                              : 'bg-white/30 border border-white/20'
                        }`}
                      >
                        <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-white' : 'text-gray-500'}`}>
                          {dayNames[index]}
                        </p>
                        <p className={`text-xl font-bold mb-1 ${isToday ? 'text-white' : scoreColor}`}>
                          {dayScore.totalScore}
                        </p>
                        <TrendIcon className={`w-4 h-4 mx-auto ${isToday ? 'text-white/80' : 'text-gray-400'}`} />
                        <p className={`text-[10px] mt-0.5 ${isToday ? 'text-white/80' : 'text-gray-400'}`}>
                          {dayScore.level}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Weekly Chart Bar */}
              <GlassCard hover={false}>
                <h3 className="font-bold text-gray-800 mb-4">운세 차트</h3>
                <div className="flex items-end gap-2 h-32">
                  {weeklyScores.map((dayScore, index) => {
                    const dayNames = getWeekDayNames();
                    const isToday = index === todayDayIndex;
                    const height = `${dayScore.totalScore}%`;
                    const scoreColor = dayScore.totalScore >= 70 ? 'from-green-400 to-emerald-500' :
                                       dayScore.totalScore >= 50 ? 'from-yellow-400 to-amber-500' :
                                       dayScore.totalScore >= 30 ? 'from-orange-400 to-red-400' : 'from-red-400 to-rose-500';

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height }}
                          transition={{ delay: index * 0.1, duration: 0.6 }}
                          className={`w-full rounded-t-lg bg-gradient-to-t ${scoreColor} ${
                            isToday ? 'ring-2 ring-purple-400 ring-offset-1' : ''
                          }`}
                          style={{ minHeight: '4px' }}
                        />
                        <p className={`text-[10px] mt-1 font-semibold ${isToday ? 'text-purple-600' : 'text-gray-400'}`}>
                          {dayNames[index]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Weekly Summary */}
              <GlassCard hover={false}>
                <h3 className="font-bold text-gray-800 mb-3">주간 분석</h3>
                {(() => {
                  const avg = Math.round(weeklyScores.reduce((s, d) => s + d.totalScore, 0) / 7);
                  const best = weeklyScores.reduce((max, d, i) => d.totalScore > max.score ? { score: d.totalScore, day: i } : max, { score: 0, day: 0 });
                  const worst = weeklyScores.reduce((min, d, i) => d.totalScore < min.score ? { score: d.totalScore, day: i } : min, { score: 100, day: 0 });
                  const dayNames = getWeekDayNames();

                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/30 rounded-lg p-3">
                        <span className="text-sm text-gray-600">주간 평균</span>
                        <span className="font-bold text-lg text-purple-600">{avg}점</span>
                      </div>
                      <div className="flex justify-between items-center bg-green-50/50 rounded-lg p-3">
                        <span className="text-sm text-gray-600">최고의 날</span>
                        <span className="font-bold text-green-600">
                          {dayNames[best.day]}요일 ({best.score}점)
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-red-50/50 rounded-lg p-3">
                        <span className="text-sm text-gray-600">주의할 날</span>
                        <span className="font-bold text-red-600">
                          {dayNames[worst.day]}요일 ({worst.score}점)
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </GlassCard>
            </>
          )}

          {/* Change Info Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInput(true)}
            className="w-full bg-white/40 backdrop-blur-md text-gray-600 font-semibold py-3 rounded-xl border border-white/30 text-sm"
          >
            다른 정보로 보기
          </motion.button>
        </div>
      )}
    </div>
  );
}
