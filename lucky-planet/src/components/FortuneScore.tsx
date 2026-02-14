'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clover, Gem, Sparkles } from 'lucide-react';
import {
  generateFortuneScore,
  getFortuneMessage,
  getFortuneGrade,
  getLuckyItem,
  getLuckyNumber,
} from '@/lib/fortune';
import { getTodayFortune, saveTodayFortune } from '@/lib/storage';
import { getBallColor } from '@/lib/lotto';

export default function FortuneScore() {
  const [score, setScore] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const saved = getTodayFortune();
    if (saved) {
      setScore(saved.score);
      setIsRevealed(true);
    }
  }, []);

  const handleReveal = () => {
    const newScore = generateFortuneScore();
    setScore(newScore);
    setIsRevealed(true);
    saveTodayFortune(newScore);
  };

  if (!isRevealed || score === null) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleReveal}
        className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur-sm rounded-3xl border border-purple-100/50 cursor-pointer hover:shadow-lg transition-shadow"
      >
        <div className="text-center space-y-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <Clover className="text-purple-300 mx-auto" size={40} />
          </motion.div>
          <h3 className="text-sm font-semibold text-purple-500">오늘의 행운 점수</h3>
          <p className="text-xs text-purple-300">탭하여 확인하기</p>
        </div>
      </motion.div>
    );
  }

  const grade = getFortuneGrade(score);
  const message = getFortuneMessage(score);
  const luckyItem = getLuckyItem();
  const luckyNumber = getLuckyNumber();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur-sm rounded-3xl border border-purple-100/50"
    >
      <div className="text-center space-y-4">
        <h3 className="text-sm font-semibold text-purple-500 flex items-center justify-center gap-1.5">
          <Sparkles size={14} />
          오늘의 행운 점수
        </h3>

        {/* 점수 원형 */}
        <div className="relative w-28 h-28 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={grade.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - score / 100) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: grade.color }}>
              {score}
            </span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
        </div>

        {/* 등급 */}
        <div
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold"
          style={{ background: `${grade.color}20`, color: grade.color }}
        >
          <span>{grade.emoji}</span>
          <span>{grade.label}</span>
        </div>

        {/* 운세 메시지 */}
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>

        {/* 행운 아이템 & 번호 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-white/60 rounded-xl">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Gem size={12} className="text-purple-400" />
              <span className="text-[10px] text-gray-400">행운 아이템</span>
            </div>
            <p className="text-sm font-medium text-gray-700">{luckyItem}</p>
          </div>
          <div className="p-3 bg-white/60 rounded-xl">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clover size={12} className="text-green-400" />
              <span className="text-[10px] text-gray-400">행운 번호</span>
            </div>
            <div className="flex justify-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md"
                style={{ background: getBallColor(luckyNumber) }}
              >
                {luckyNumber}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
