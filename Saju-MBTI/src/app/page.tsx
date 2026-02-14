'use client';

import { motion } from 'framer-motion';
import { Sparkles, Heart, Star, TrendingUp, History } from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import AdBanner from '@/components/AdBanner';
import DailyFortuneWidget from '@/components/DailyFortuneWidget';

const features = [
  {
    title: '스마트 사주 분석',
    description: '생년월일시를 입력하여 오행 분포와 운세를 확인하세요',
    icon: Sparkles,
    link: '/saju',
    color: 'from-purple-400 to-pink-400'
  },
  {
    title: 'MBTI 궁합',
    description: '나와 상대방의 MBTI로 찰떡궁합을 알아보세요',
    icon: Heart,
    link: '/mbti',
    color: 'from-red-400 to-pink-400'
  },
  {
    title: '운명 캐릭터',
    description: 'MBTI와 사주가 만나 탄생한 나만의 운명 캐릭터',
    icon: Star,
    link: '/destiny',
    color: 'from-yellow-400 to-amber-400'
  }
];

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="inline-block mb-4"
        >
          <Sparkles className="w-16 h-16 text-royal-gold" />
        </motion.div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          운명과 성격
        </h1>
        <p className="text-pastel-brown text-lg">
          Fortune & MBTI
        </p>
      </motion.div>

      {/* Daily Fortune Widget */}
      <DailyFortuneWidget />

      <div className="space-y-4 mb-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Link key={index} href={feature.link}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <GlassCard>
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${feature.color}`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-pastel-brown">
                        {feature.description}
                      </p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-royal-gold" />
                  </div>
                </GlassCard>
              </motion.div>
            </Link>
          );
        })}
      </div>

      <Link href="/history">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <GlassCard className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-400">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">히스토리</h3>
                  <p className="text-sm text-pastel-brown">내 분석 기록 보기</p>
                </div>
              </div>
              <TrendingUp className="w-5 h-5 text-royal-gold" />
            </div>
          </GlassCard>
        </motion.div>
      </Link>

      <AdBanner />
    </div>
  );
}
