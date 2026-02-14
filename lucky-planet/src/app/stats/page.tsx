'use client';

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import StatsChart from '@/components/StatsChart';
import AdBanner from '@/components/AdBanner';

export default function StatsPage() {
  return (
    <div className="space-y-6 py-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1"
      >
        <div className="flex items-center justify-center gap-2">
          <BarChart3 className="text-mint-500" size={24} />
          <h1 className="text-xl font-bold text-gray-800">통계</h1>
        </div>
        <p className="text-xs text-gray-400">나의 번호 빈도수를 분석합니다</p>
      </motion.div>

      {/* 통계 차트 */}
      <StatsChart />

      {/* 광고 영역 */}
      <AdBanner type="rectangle" />
    </div>
  );
}
