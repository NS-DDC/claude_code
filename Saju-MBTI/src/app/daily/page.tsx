'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Sparkles, ThumbsUp, ThumbsDown, Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import FloatingOrbs from '@/components/FloatingOrbs';
import { getTodayFortune } from '@/lib/dailyFortune';
import { calculateSaju } from '@/lib/sajuCalculator';
import { storage } from '@/lib/storage';
import { MBTIType, SajuInput, DailyFortuneResult, Element } from '@/types';

const mbtiTypes: MBTIType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

const ELEMENT_COLORS: Record<Element, string> = {
  '목': 'from-green-400 to-emerald-500',
  '화': 'from-red-400 to-rose-500',
  '토': 'from-yellow-400 to-amber-500',
  '금': 'from-gray-400 to-slate-500',
  '수': 'from-blue-400 to-cyan-500'
};

export default function DailyFortunePage() {
  const [fortune, setFortune] = useState<DailyFortuneResult | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [mbti, setMbti] = useState<MBTIType>('INTJ');
  const [birth, setBirth] = useState<SajuInput>({
    gender: 'male',
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    birthHour: 12
  });

  useEffect(() => {
    loadFortune();
  }, []);

  const loadFortune = () => {
    try {
      // Try to load from localStorage
      const savedMBTI = localStorage.getItem('userMBTI') as MBTIType | null;
      const savedElement = localStorage.getItem('userElement') as Element | null;

      if (savedMBTI && savedElement) {
        const todayFortune = getTodayFortune(savedMBTI, savedElement);
        setFortune(todayFortune);

        // Save to history
        storage.add({
          type: 'daily-fortune',
          data: todayFortune
        });
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

  const handleCalculate = () => {
    // Calculate element from birth
    const sajuResult = calculateSaju(birth);
    const element = (Object.entries(sajuResult.elements) as [Element, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    // Get fortune
    const todayFortune = getTodayFortune(mbti, element);
    setFortune(todayFortune);

    // Save to localStorage
    localStorage.setItem('userMBTI', mbti);
    localStorage.setItem('userElement', element);

    // Save to history
    storage.add({
      type: 'daily-fortune',
      data: todayFortune
    });

    setShowInput(false);
  };

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 mb-4 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
          <span>홈으로</span>
        </Link>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          오늘의 운세
        </h1>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-5 h-5" />
          <p>{today}</p>
        </div>
      </motion.div>

      {showInput || !fortune ? (
        /* Input Form */
        <GlassCard>
          <h2 className="text-xl font-bold mb-4 text-gray-800">정보 입력</h2>

          {/* MBTI Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">MBTI</label>
            <div className="grid grid-cols-4 gap-2">
              {mbtiTypes.map((type) => (
                <motion.button
                  key={type}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMbti(type)}
                  className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                    mbti === type
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-white/50 text-gray-600 hover:bg-white/70'
                  }`}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Birth Info */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">생년월일시</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600">성별</label>
                <select
                  value={birth.gender}
                  onChange={(e) => setBirth({ ...birth, gender: e.target.value as 'male' | 'female' })}
                  className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">년도</label>
                <input
                  type="number"
                  value={birth.birthYear}
                  onChange={(e) => setBirth({ ...birth, birthYear: parseInt(e.target.value) })}
                  className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">월</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={birth.birthMonth}
                  onChange={(e) => setBirth({ ...birth, birthMonth: parseInt(e.target.value) })}
                  className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">일</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={birth.birthDay}
                  onChange={(e) => setBirth({ ...birth, birthDay: parseInt(e.target.value) })}
                  className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-600">시 (0-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={birth.birthHour}
                  onChange={(e) => setBirth({ ...birth, birthHour: parseInt(e.target.value) })}
                  className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCalculate}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <Sparkles className="w-6 h-6" />
            오늘의 운세 보기
          </motion.button>
        </GlassCard>
      ) : (
        /* Fortune Display */
        <div className="space-y-6">
          {/* Character Card */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className={`bg-gradient-to-br ${ELEMENT_COLORS[fortune.character.element]} rounded-2xl p-8 text-center shadow-xl`}
          >
            <div className="text-8xl mb-4">{fortune.character.emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2">{fortune.character.name}</h2>
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
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-600" />
              <h3 className="text-xl font-bold text-gray-800">오늘의 메시지</h3>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              {fortune.fortuneMessage}
            </p>
          </GlassCard>

          {/* Lucky Elements */}
          <div className="grid grid-cols-2 gap-4">
            {/* Lucky Time */}
            <GlassCard className="text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-800 mb-1">행운의 시간</h4>
              <p className="text-sm text-gray-600">{fortune.luckyTime}</p>
            </GlassCard>

            {/* Lucky Number */}
            <GlassCard className="text-center">
              <Sparkles className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-800 mb-1">행운의 숫자</h4>
              <p className="text-2xl font-bold text-purple-600">{fortune.luckyNumber}</p>
            </GlassCard>
          </div>

          {/* Lucky Color */}
          <GlassCard className="text-center">
            <h4 className="font-semibold text-gray-800 mb-3">행운의 색상</h4>
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-12 h-12 rounded-full shadow-lg border-2 border-white"
                style={{ backgroundColor: fortune.luckyColor }}
              />
              <p className="text-lg font-semibold text-gray-700">{fortune.luckyColor}</p>
            </div>
          </GlassCard>

          {/* Lucky Action */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="w-6 h-6 text-green-600" />
              <h4 className="font-semibold text-gray-800">오늘 하면 좋은 일</h4>
            </div>
            <p className="text-gray-700 bg-green-50 p-4 rounded-lg border border-green-200">
              {fortune.luckyAction}
            </p>
          </GlassCard>

          {/* Avoid Action */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown className="w-6 h-6 text-red-600" />
              <h4 className="font-semibold text-gray-800">오늘 피하면 좋은 일</h4>
            </div>
            <p className="text-gray-700 bg-red-50 p-4 rounded-lg border border-red-200">
              {fortune.avoidAction}
            </p>
          </GlassCard>

          {/* Compatible Character */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-pink-600" />
              <h4 className="font-semibold text-gray-800">오늘의 궁합 파트너</h4>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{fortune.compatibleCharacter.emoji}</div>
                <div>
                  <h5 className="font-bold text-gray-800 mb-1">
                    {fortune.compatibleCharacter.name}
                  </h5>
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

          {/* Change Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInput(true)}
            className="w-full bg-white/50 backdrop-blur-md text-gray-700 font-bold py-3 px-6 rounded-xl shadow-lg"
          >
            다른 정보로 보기
          </motion.button>
        </div>
      )}
    </div>
  );
}
