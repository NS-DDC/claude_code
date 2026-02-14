'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Hash, Lightbulb, PieChart, Layers } from 'lucide-react';
import {
  getNumberFrequencyFiltered,
  getRangeDistribution,
  getOddEvenRatio,
  getSumDistribution,
  getPairFrequency,
} from '@/lib/storage';
import { getBallColor } from '@/lib/lotto';

type SortMode = 'number' | 'frequency';
type StatsFilter = 'all' | 'saved';
type StatsTab = 'overview' | 'frequency' | 'analysis' | 'recommend';

export default function StatsChart() {
  const [frequency, setFrequency] = useState<Map<number, number>>(new Map());
  const [totalSets, setTotalSets] = useState(0);
  const [sortMode, setSortMode] = useState<SortMode>('number');
  const [statsFilter, setStatsFilter] = useState<StatsFilter>('all');
  const [activeTab, setActiveTab] = useState<StatsTab>('overview');

  useEffect(() => {
    const { freq, totalSets: count } = getNumberFrequencyFiltered(statsFilter === 'saved');
    setFrequency(freq);
    setTotalSets(count);
  }, [statsFilter]);

  const maxFreq = useMemo(() => Math.max(...Array.from(frequency.values()), 1), [frequency]);

  const sortedEntries = useMemo(() => {
    const entries = Array.from(frequency.entries());
    if (sortMode === 'frequency') {
      return entries.sort((a, b) => b[1] - a[1]);
    }
    return entries.sort((a, b) => a[0] - b[0]);
  }, [frequency, sortMode]);

  const topNumbers = useMemo(
    () => [...sortedEntries].sort((a, b) => b[1] - a[1]).slice(0, 6),
    [sortedEntries]
  );

  const coldNumbers = useMemo(
    () => [...sortedEntries].sort((a, b) => a[1] - b[1]).slice(0, 6),
    [sortedEntries]
  );

  const rangeData = useMemo(
    () => getRangeDistribution(statsFilter === 'saved'),
    [statsFilter, totalSets]
  );

  const oddEven = useMemo(
    () => getOddEvenRatio(statsFilter === 'saved'),
    [statsFilter, totalSets]
  );

  const sumData = useMemo(
    () => getSumDistribution(statsFilter === 'saved'),
    [statsFilter, totalSets]
  );

  const topPairs = useMemo(() => {
    const pairs = getPairFrequency(statsFilter === 'saved');
    return Array.from(pairs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [statsFilter, totalSets]);

  // 추천 번호: COLD 번호 위주 + 다양한 구간에서 골고루
  const recommendedNumbers = useMemo(() => {
    if (totalSets < 3) return [];
    const sorted = [...sortedEntries].sort((a, b) => a[1] - b[1]);
    // 구간별로 1~2개씩 COLD 번호 선택
    const ranges = [
      { min: 1, max: 10 },
      { min: 11, max: 20 },
      { min: 21, max: 30 },
      { min: 31, max: 40 },
      { min: 41, max: 45 },
    ];
    const selected: number[] = [];
    for (const range of ranges) {
      const pool = sorted.filter(([n]) => n >= range.min && n <= range.max);
      if (pool.length > 0 && selected.length < 6) {
        selected.push(pool[0][0]);
      }
    }
    // 부족하면 전체 COLD에서 채우기
    for (const [num] of sorted) {
      if (selected.length >= 6) break;
      if (!selected.includes(num)) selected.push(num);
    }
    return selected.slice(0, 6).sort((a, b) => a - b);
  }, [sortedEntries, totalSets]);

  const filterButtons = (
    <div className="flex gap-2">
      <button
        onClick={() => setStatsFilter('all')}
        className={`px-3 py-1.5 text-xs rounded-full transition-all ${
          statsFilter === 'all'
            ? 'bg-gold-300 text-white font-semibold'
            : 'bg-white/60 text-gray-500 border border-white/30 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700'
        }`}
      >
        전체
      </button>
      <button
        onClick={() => setStatsFilter('saved')}
        className={`px-3 py-1.5 text-xs rounded-full transition-all ${
          statsFilter === 'saved'
            ? 'bg-gold-300 text-white font-semibold'
            : 'bg-white/60 text-gray-500 border border-white/30 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700'
        }`}
      >
        저장됨
      </button>
    </div>
  );

  if (totalSets === 0) {
    return (
      <div className="space-y-4">
        {filterButtons}
        <div className="text-center py-16">
          <BarChart3 className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-400 text-sm">
            {statsFilter === 'saved'
              ? '저장된 번호가 없습니다.'
              : '통계를 보려면 먼저 번호를 생성하세요.'}
          </p>
          <p className="text-gray-300 text-xs mt-1">
            {statsFilter === 'saved'
              ? '기록에서 별 아이콘을 눌러 번호를 저장하세요.'
              : '저장된 번호가 많을수록 의미 있는 통계를 제공합니다.'}
          </p>
        </div>
      </div>
    );
  }

  const tabs: { key: StatsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: '요약', icon: <PieChart size={12} /> },
    { key: 'frequency', label: '빈도', icon: <BarChart3 size={12} /> },
    { key: 'analysis', label: '분석', icon: <Layers size={12} /> },
    { key: 'recommend', label: '추천', icon: <Lightbulb size={12} /> },
  ];

  return (
    <div className="space-y-5">
      {filterButtons}

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 p-1 bg-white/40 rounded-2xl border border-white/30 dark:bg-gray-800/40 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium rounded-xl transition-all ${
              activeTab === tab.key
                ? 'bg-white/80 text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-200'
                : 'text-gray-400 hover:text-gray-500 dark:text-gray-500'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 요약 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* 기본 통계 */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="생성 횟수" value={totalSets} />
            <StatCard label="총 번호 수" value={totalSets * 6} />
            <StatCard label="합계 평균" value={sumData.avg} />
          </div>

          {/* HOT / COLD */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100 dark:from-red-950/30 dark:to-orange-950/30 dark:border-red-900/50">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp size={14} className="text-red-400" />
                <p className="text-xs font-semibold text-red-500">HOT 번호</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topNumbers.map(([num, count]) => (
                  <div key={num} className="flex items-center gap-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: getBallColor(num) }}
                    >
                      {num}
                    </div>
                    <span className="text-[10px] text-gray-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 dark:from-blue-950/30 dark:to-cyan-950/30 dark:border-blue-900/50">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingDown size={14} className="text-blue-400" />
                <p className="text-xs font-semibold text-blue-500">COLD 번호</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {coldNumbers.map(([num, count]) => (
                  <div key={num} className="flex items-center gap-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: getBallColor(num) }}
                    >
                      {num}
                    </div>
                    <span className="text-[10px] text-gray-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 홀짝 비율 */}
          {oddEven.total > 0 && (
            <div className="p-4 bg-white/50 rounded-2xl border border-white/30 dark:bg-gray-800/50 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 mb-3 dark:text-gray-300">홀짝 비율</p>
              <div className="flex gap-2 items-center">
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden flex dark:bg-gray-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-l-full flex items-center justify-center"
                    initial={{ width: 0 }}
                    animate={{ width: `${(oddEven.odd / oddEven.total) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  >
                    <span className="text-[9px] font-bold text-white px-1">홀 {Math.round((oddEven.odd / oddEven.total) * 100)}%</span>
                  </motion.div>
                  <motion.div
                    className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-r-full flex items-center justify-center"
                    initial={{ width: 0 }}
                    animate={{ width: `${(oddEven.even / oddEven.total) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  >
                    <span className="text-[9px] font-bold text-white px-1">짝 {Math.round((oddEven.even / oddEven.total) * 100)}%</span>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 빈도 탭 */}
      {activeTab === 'frequency' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 dark:text-gray-200">
              <Hash size={14} />
              번호별 출현 빈도
            </h3>
            <div className="flex gap-1.5">
              <button
                onClick={() => setSortMode('number')}
                className={`px-2.5 py-1 text-[10px] rounded-full transition-all ${
                  sortMode === 'number' ? 'bg-gold-300 text-white' : 'bg-white/60 text-gray-400 dark:bg-gray-800/60'
                }`}
              >
                번호순
              </button>
              <button
                onClick={() => setSortMode('frequency')}
                className={`px-2.5 py-1 text-[10px] rounded-full transition-all ${
                  sortMode === 'frequency' ? 'bg-gold-300 text-white' : 'bg-white/60 text-gray-400 dark:bg-gray-800/60'
                }`}
              >
                빈도순
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {sortedEntries.map(([num, count], idx) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.01 }}
                className="flex items-center gap-2"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: getBallColor(num) }}
                >
                  {num}
                </div>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-700">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${getBallColor(num)}88, ${getBallColor(num)})`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: maxFreq > 0 ? `${(count / maxFreq) * 100}%` : '0%' }}
                    transition={{ duration: 0.5, delay: idx * 0.02 }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-6 text-right font-mono">{count}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 분석 탭 */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          {/* 구간별 분포 */}
          <div className="p-4 bg-white/50 rounded-2xl border border-white/30 dark:bg-gray-800/50 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-600 mb-3 dark:text-gray-300">구간별 분포</p>
            <div className="space-y-2">
              {rangeData.map(({ range, count, total }) => (
                <div key={range} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 w-12 flex-shrink-0 dark:text-gray-400">{range}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-700">
                    <motion.div
                      className="h-full bg-gradient-to-r from-mint-300 to-mint-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 w-8 text-right font-mono">{count}</span>
                  <span className="text-[9px] text-gray-300 w-8 text-right">
                    {total > 0 ? `${Math.round((count / total) * 100)}%` : '0%'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 자주 나오는 쌍 */}
          {topPairs.length > 0 && (
            <div className="p-4 bg-white/50 rounded-2xl border border-white/30 dark:bg-gray-800/50 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 mb-3 dark:text-gray-300">자주 함께 나오는 번호 쌍</p>
              <div className="space-y-2">
                {topPairs.map(([pair, count], idx) => {
                  const [a, b] = pair.split('-').map(Number);
                  return (
                    <motion.div
                      key={pair}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-[10px] text-gray-300 w-4">{idx + 1}.</span>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: getBallColor(a) }}
                        >
                          {a}
                        </div>
                        <span className="text-gray-300 text-xs">+</span>
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: getBallColor(b) }}
                        >
                          {b}
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400 ml-auto">{count}회</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 합계 분포 */}
          {sumData.sums.length > 0 && (
            <div className="p-4 bg-white/50 rounded-2xl border border-white/30 dark:bg-gray-800/50 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 mb-1 dark:text-gray-300">번호 합계 분석</p>
              <p className="text-[10px] text-gray-400 mb-3">
                평균 합계: <span className="font-bold text-gold-500">{sumData.avg}</span>
                <span className="text-gray-300 ml-2">(로또 당첨 평균: 100~175)</span>
              </p>
              <div className="flex items-end gap-0.5 h-16">
                {(() => {
                  // 합계를 구간별로 분류
                  const buckets = [
                    { label: '~80', min: 0, max: 80, count: 0 },
                    { label: '81~120', min: 81, max: 120, count: 0 },
                    { label: '121~160', min: 121, max: 160, count: 0 },
                    { label: '161~200', min: 161, max: 200, count: 0 },
                    { label: '201~', min: 201, max: 999, count: 0 },
                  ];
                  sumData.sums.forEach((s) => {
                    const b = buckets.find((b) => s >= b.min && s <= b.max);
                    if (b) b.count++;
                  });
                  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
                  return buckets.map((b) => (
                    <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        className="w-full bg-gradient-to-t from-gold-300 to-gold-200 rounded-t"
                        initial={{ height: 0 }}
                        animate={{ height: `${(b.count / maxCount) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        style={{ minHeight: b.count > 0 ? 4 : 0 }}
                      />
                      <span className="text-[8px] text-gray-400">{b.label}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 추천 탭 */}
      {activeTab === 'recommend' && (
        <div className="space-y-4">
          {recommendedNumbers.length > 0 ? (
            <>
              <div className="p-5 bg-gradient-to-br from-gold-50 to-orange-50 rounded-2xl border border-gold-200 dark:from-gold-950/30 dark:to-orange-950/20 dark:border-gold-900/50">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={16} className="text-gold-500" />
                  <p className="text-sm font-semibold text-gold-600">AI 추천 번호</p>
                </div>
                <p className="text-[11px] text-gray-400 mb-4">
                  나의 통계에서 덜 나온(COLD) 번호들을 구간별로 균형 있게 선택했습니다.
                </p>
                <div className="flex gap-2.5 justify-center">
                  {recommendedNumbers.map((num, idx) => (
                    <motion.div
                      key={num}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: idx * 0.15 }}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg relative overflow-hidden"
                        style={{ background: `radial-gradient(circle at 35% 35%, ${getBallColor(num)}ee, ${getBallColor(num)})` }}
                      >
                        <div
                          className="absolute top-[15%] left-[20%] w-[30%] h-[25%] rounded-full opacity-50"
                          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8), transparent)' }}
                        />
                        <span className="relative z-10">{num}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white/50 rounded-2xl border border-white/30 space-y-2 dark:bg-gray-800/50 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">추천 근거</p>
                <ul className="space-y-1 text-[11px] text-gray-400">
                  <li>- 각 구간(1~10, 11~20, ...)에서 가장 적게 나온 번호 우선</li>
                  <li>- 나의 {totalSets}회 생성 데이터 기반 분석</li>
                  <li>- 홀짝 비율: 홀 {oddEven.odd} / 짝 {oddEven.even}</li>
                  <li>- 합계 범위: 평균 {sumData.avg} (권장: 100~175)</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Lightbulb className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-gray-400 text-sm">최소 3회 이상 번호를 생성하면</p>
              <p className="text-gray-400 text-sm">AI가 추천 번호를 분석합니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 text-center dark:bg-gray-800/50 dark:border-gray-700">
      <p className="text-[10px] text-gray-400 mb-0.5 dark:text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{value}</p>
    </div>
  );
}
