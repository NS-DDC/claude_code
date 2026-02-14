'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import NumberGenerator from '@/components/NumberGenerator';
import FortuneScore from '@/components/FortuneScore';
import AdBanner from '@/components/AdBanner';
import { initKakao } from '@/lib/kakao';

export default function HomePage() {
  useEffect(() => {
    // 카카오 SDK 초기화 (SDK 로드 후 실행)
    const timer = setTimeout(() => initKakao(), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 py-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1"
      >
        <div className="flex items-center justify-center gap-2">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="text-gold-400" size={28} />
          </motion.div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 bg-clip-text text-transparent">
            Lucky Planet
          </h1>
        </div>
        <p className="text-xs text-gray-400">행운의 번호를 뽑아보세요</p>
      </motion.div>

      {/* 번호 생성기 */}
      <NumberGenerator />

      {/* 오늘의 행운 */}
      <FortuneScore />

      {/* 하단 광고 영역 */}
      <AdBanner type="banner" />
    </div>
  );
}
