'use client';

import { motion } from 'framer-motion';
import { History } from 'lucide-react';
import HistoryList from '@/components/HistoryList';

export default function HistoryPage() {
  return (
    <div className="space-y-6 py-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1"
      >
        <div className="flex items-center justify-center gap-2">
          <History className="text-gold-400" size={24} />
          <h1 className="text-xl font-bold text-gray-800">번호 기록</h1>
        </div>
        <p className="text-xs text-gray-400">생성한 번호를 관리하고 저장하세요</p>
      </motion.div>

      {/* 기록 리스트 */}
      <HistoryList />
    </div>
  );
}
