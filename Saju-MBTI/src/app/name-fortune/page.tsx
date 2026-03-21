'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Share } from '@capacitor/share';
import GlassCard from '@/components/GlassCard';
import { analyzeNameFortune } from '@/lib/nameFortune';
import type { NameFortuneResult } from '@/lib/nameFortune';

const KOREAN_REGEX = /^[가-힣]{2,5}$/;
const RECENT_NAMES_KEY = 'name_fortune_recent';

const categoryConfig = [
  { key: 'personality' as const, label: '성격',  icon: '🌟', colorClass: 'text-purple-400',  borderClass: 'border-purple-500/30', bgClass: 'bg-purple-500/10' },
  { key: 'loveLife'    as const, label: '사랑운', icon: '💕', colorClass: 'text-pink-400',    borderClass: 'border-pink-500/30',   bgClass: 'bg-pink-500/10'   },
  { key: 'career'      as const, label: '직업운', icon: '💼', colorClass: 'text-cyan-400',    borderClass: 'border-cyan-500/30',   bgClass: 'bg-cyan-500/10'   },
  { key: 'wealth'      as const, label: '재물운', icon: '💰', colorClass: 'text-amber-400',   borderClass: 'border-amber-500/30',  bgClass: 'bg-amber-500/10'  },
  { key: 'health'      as const, label: '건강운', icon: '🍀', colorClass: 'text-emerald-400', borderClass: 'border-emerald-500/30', bgClass: 'bg-emerald-500/10' },
];

function ScoreCircle({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#10b981' :
    score >= 60 ? '#7c3aed' :
    score >= 40 ? '#f59e0b' :
    '#ef4444';

  return (
    <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 128 128"
        className="-rotate-90"
      >
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="10"
        />
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl sm:text-3xl font-extrabold" style={{ color }}>{score}</span>
        <span className="text-[11px] text-purple-300/60">점</span>
      </div>
    </div>
  );
}

export default function NameFortunePage() {
  const [nameInput, setNameInput]     = useState('');
  const [result, setResult]           = useState<NameFortuneResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress]       = useState(0);
  const [recentNames, setRecentNames] = useState<string[]>([]);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_NAMES_KEY);
      if (stored) setRecentNames(JSON.parse(stored) as string[]);
    } catch {
      // ignore
    }
  }, []);

  const saveRecentName = useCallback((name: string) => {
    setRecentNames((prev) => {
      const updated = [name, ...prev.filter((n) => n !== name)].slice(0, 5);
      try {
        localStorage.setItem(RECENT_NAMES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  function handleAnalyze(name?: string) {
    const target = (name ?? nameInput).trim();
    if (!target) return;

    if (!KOREAN_REGEX.test(target)) {
      setError('한글 이름만 입력 가능합니다 (2~5자)');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResult(null);
    setProgress(0);

    // Deterministic 800 ms progress animation
    const DURATION_MS = 800;
    const STEPS = 20;
    const stepMs = DURATION_MS / STEPS;
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      const pct = Math.min((step / STEPS) * 100, 100);
      setProgress(pct);
      if (step >= STEPS) {
        clearInterval(interval);
        const analysisResult = analyzeNameFortune(target);
        setResult(analysisResult);
        setIsAnalyzing(false);
        saveRecentName(target);
      }
    }, stepMs);
  }

  async function handleShare() {
    if (!result) return;
    const text = `이름 운세 분석: ${result.name}\n총 획수: ${result.totalStrokes}획\n운세 점수: ${result.fortuneScore}점\n${result.advice}`;
    try {
      await Share.share({ title: '이름 운세', text, dialogTitle: '친구에게 공유하기' });
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('클립보드에 복사되었습니다!');
      } catch {
        // ignore
      }
    }
  }

  function handleReset() {
    setResult(null);
    setNameInput('');
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1b2a] via-[#1a0040] to-[#0d1b2a]">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">✍️ 이름 운세</h1>
          <p className="text-purple-300 text-sm">이름의 획수로 알아보는 나의 운명</p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-purple-500/20 rounded-2xl p-6 mb-6"
        >
          <label className="block text-purple-200/80 text-[13px] mb-2">
            한국어 이름 입력
          </label>
          <div className="flex gap-2.5">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="이름을 입력하세요 (예: 김민준)"
              className="flex-1 bg-white/7 border border-purple-400/30 rounded-xl px-4 py-3 text-white text-[15px] outline-none placeholder:text-white/30 focus:border-purple-400/60 transition-colors"
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing || !nameInput.trim()}
              className="bg-gradient-to-br from-violet-600 to-purple-900 disabled:from-purple-900/30 disabled:to-purple-900/30 border-none rounded-xl px-5 py-3 text-white text-sm font-bold whitespace-nowrap transition-all disabled:cursor-default cursor-pointer"
            >
              분석하기
            </button>
          </div>

          {/* Inline error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-xs mt-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Recent names */}
          {recentNames.length > 0 && (
            <div className="mt-3">
              <p className="text-purple-400/50 text-[11px] mb-1.5">최근 검색</p>
              <div className="flex flex-wrap gap-1.5">
                {recentNames.map((n) => (
                  <button
                    key={n}
                    onClick={() => { setNameInput(n); handleAnalyze(n); }}
                    className="bg-violet-600/20 border border-purple-400/30 rounded-full px-3 py-1 text-xs text-purple-300 cursor-pointer hover:bg-violet-600/30 transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Progress bar */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/5 border border-purple-500/20 rounded-2xl p-6 mb-6 text-center"
            >
              <p className="text-purple-300 mb-4 text-[15px]">
                ✨ 이름의 기운을 분석하는 중...
              </p>
              <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-pink-600"
                  style={{ width: `${progress}%`, transition: 'width 0.04s linear' }}
                />
              </div>
              <p className="text-purple-300/50 text-xs mt-2">{Math.round(progress)}%</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              {/* Score & strokes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <GlassCard hover={false} className="!bg-white/5 !border-purple-500/20 !rounded-2xl">
                  <div className="flex items-center gap-6">
                    <ScoreCircle score={result.fortuneScore} />
                    <div className="min-w-0">
                      <h2 className="text-white text-[22px] font-extrabold mb-1">{result.name}</h2>
                      <span className="inline-block bg-violet-600/25 border border-purple-400/40 rounded-lg px-3 py-1 text-[13px] text-purple-300 mb-2">
                        총 {result.totalStrokes}획
                      </span>
                      <p className="text-purple-200/80 text-[13px] leading-relaxed">{result.advice}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Category cards */}
              {categoryConfig.map(({ key, label, icon, colorClass, borderClass, bgClass }, index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`${bgClass} border ${borderClass} rounded-2xl p-5`}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-xl">{icon}</span>
                      <span className={`${colorClass} text-[15px] font-bold`}>{label}</span>
                    </div>
                    <p className="text-purple-100/85 text-[13px] leading-7">{result[key]}</p>
                  </div>
                </motion.div>
              ))}

              {/* Lucky numbers & colors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryConfig.length * 0.1 }}
                className="bg-white/5 border border-purple-500/20 rounded-2xl p-5 flex gap-6"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-purple-300/70 text-xs mb-2.5">행운의 숫자</p>
                  <div className="flex gap-2 flex-wrap">
                    {result.luckyNumbers.map((n) => (
                      <div
                        key={n}
                        className="w-10 h-10 rounded-full bg-violet-600/40 border-2 border-purple-400/50 flex items-center justify-center text-purple-300 text-base font-bold"
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-purple-300/70 text-xs mb-2.5">행운의 색상</p>
                  <div className="flex flex-col gap-1">
                    {result.luckyColors.map((c) => (
                      <span key={c} className="text-white text-[13px]">🎨 {c}</span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (categoryConfig.length + 1) * 0.1 }}
                className="flex flex-col sm:flex-row gap-3 pb-4"
              >
                <button
                  onClick={handleReset}
                  className="flex-1 bg-white/8 border border-purple-400/30 rounded-full py-2.5 px-7 text-sm text-purple-300 cursor-pointer hover:bg-white/12 transition-colors font-medium"
                >
                  다른 이름 분석하기
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-white/8 border border-purple-400/30 rounded-full py-2.5 px-7 text-sm text-purple-300 cursor-pointer hover:bg-white/12 transition-colors font-medium"
                >
                  🔗 결과 공유하기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
