'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Save, Filter, Check } from 'lucide-react';
import LottoBall from './LottoBall';
import ShareButton from './ShareButton';
import { generateNumbers } from '@/lib/lotto';
import { addHistoryBatch, getSettings } from '@/lib/storage';

const LINE_LABELS = ['A', 'B', 'C', 'D', 'E'];

export default function NumberGenerator() {
  const [numberSets, setNumberSets] = useState<number[][]>([]);
  const [lineCount, setLineCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [includeInput, setIncludeInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const settings = getSettings();
    setLineCount(settings.defaultLineCount || 1);
  }, []);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setSaved(false);
    setAutoSaved(false);
    setAnimationKey((k) => k + 1);

    const settings = getSettings();

    const parseNums = (input: string): number[] =>
      input
        .split(/[,\s]+/)
        .map(Number)
        .filter((n) => n >= 1 && n <= 45);

    const include = [...settings.includeNumbers, ...parseNums(includeInput)];
    const exclude = [...settings.excludeNumbers, ...parseNums(excludeInput)];

    setTimeout(() => {
      try {
        const result = generateNumbers({ count: lineCount, include, exclude });
        setNumberSets(result);

        // autoSave가 켜져 있으면 자동 저장
        if (settings.autoSave) {
          addHistoryBatch(result);
          setAutoSaved(true);
          setTimeout(() => setAutoSaved(false), 2500);
        }
      } catch (e) {
        alert(e instanceof Error ? e.message : '번호 생성 오류');
      }
      setIsGenerating(false);
    }, 800);
  }, [includeInput, excludeInput, lineCount]);

  const handleSave = useCallback(() => {
    if (numberSets.length === 0 || autoSaved) return;
    addHistoryBatch(numberSets);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [numberSets, autoSaved]);

  const isSaved = saved || autoSaved;

  return (
    <div className="space-y-6">
      {/* 줄 수 선택 + 필터 토글 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setLineCount(n)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                lineCount === n
                  ? 'bg-gold-300 text-white shadow-md shadow-gold-200/50'
                  : 'bg-white/60 text-gray-500 border border-white/30 hover:bg-white/80 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700'
              }`}
            >
              {n}
            </button>
          ))}
          <span className="self-center text-xs text-gray-400 ml-1">줄</span>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 bg-white/60 backdrop-blur-sm rounded-full border border-white/30 hover:bg-white/80 transition-all dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700"
        >
          <Filter size={14} />
          필터
        </button>
      </div>

      {/* 필터 패널 */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 space-y-3 dark:bg-gray-800/50 dark:border-gray-700">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block dark:text-gray-400">
                  포함할 번호 (쉼표 구분)
                </label>
                <input
                  type="text"
                  value={includeInput}
                  onChange={(e) => setIncludeInput(e.target.value)}
                  placeholder="예: 7, 14, 21"
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block dark:text-gray-400">
                  제외할 번호 (쉼표 구분)
                </label>
                <input
                  type="text"
                  value={excludeInput}
                  onChange={(e) => setExcludeInput(e.target.value)}
                  placeholder="예: 3, 33, 43"
                  className="w-full px-3 py-2 text-sm bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 번호 표시 영역 */}
      <div className="relative min-h-[120px] flex items-center justify-center p-6 bg-white/40 backdrop-blur-md rounded-3xl border border-white/30 shadow-lg dark:bg-gray-800/40 dark:border-gray-700">
        {numberSets.length === 0 ? (
          <p className="text-gray-400 text-sm dark:text-gray-500">번호를 생성해보세요!</p>
        ) : (
          <div key={animationKey} className="w-full space-y-3">
            {numberSets.map((nums, lineIdx) => (
              <div key={`${animationKey}-${lineIdx}`} className="flex items-center gap-2">
                {numberSets.length > 1 && (
                  <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0">
                    {LINE_LABELS[lineIdx]}
                  </span>
                )}
                <div className="flex gap-2 flex-wrap">
                  {nums.map((num, idx) => (
                    <LottoBall
                      key={`${animationKey}-${lineIdx}-${num}`}
                      number={num}
                      size="lg"
                      delay={lineIdx * 6 + idx}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {isGenerating && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl dark:bg-gray-900/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="text-gold-400" size={40} />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* 생성 버튼 */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-4 bg-gradient-to-r from-gold-300 to-gold-400 text-white font-bold text-lg rounded-2xl shadow-lg shadow-gold-200/50 hover:shadow-xl hover:shadow-gold-300/50 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <RefreshCw className="animate-spin" size={22} />
        ) : (
          <Sparkles size={22} />
        )}
        {isGenerating ? '번호 생성 중...' : `행운의 번호 뽑기 (${lineCount}줄)`}
      </motion.button>

      {/* 액션 버튼들 */}
      {numberSets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
              isSaved
                ? 'bg-green-100 text-green-600 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                : 'bg-white/60 text-gray-600 border border-white/30 hover:bg-white/80 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700'
            }`}
          >
            {isSaved ? <Check size={16} /> : <Save size={16} />}
            {autoSaved ? '자동 저장됨!' : saved ? '저장됨!' : '저장하기'}
          </button>
          <ShareButton numberSets={numberSets} />
        </motion.div>
      )}
    </div>
  );
}
