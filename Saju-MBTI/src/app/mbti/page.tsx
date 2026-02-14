'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import AdBanner from '@/components/AdBanner';
import { calculateMBTICompatibility, mbtiTypes } from '@/lib/mbtiCompatibility';
import { storage } from '@/lib/storage';
import { MBTIType } from '@/types';
import { Share } from '@capacitor/share';

export default function MBTIPage() {
  const [myMBTI, setMyMBTI] = useState<MBTIType>('INFP');
  const [partnerMBTI, setPartnerMBTI] = useState<MBTIType>('ENFJ');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCalculate = () => {
    const compatResult = calculateMBTICompatibility(myMBTI, partnerMBTI);
    setResult(compatResult);
    storage.add({ type: 'mbti', data: compatResult });
    setShowResult(true);
  };

  const handleReset = () => {
    setShowResult(false);
    setResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <Heart className="w-12 h-12 text-royal-gold mx-auto mb-2" />
        <h1 className="text-3xl font-bold text-gray-800">MBTI 궁합</h1>
        <p className="text-pastel-brown mt-2">찰떡궁합을 알아보세요</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="mb-4">
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    나의 MBTI
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {mbtiTypes.map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMyMBTI(type)}
                        className={`py-3 rounded-lg font-semibold transition-all ${
                          myMBTI === type
                            ? 'bg-gradient-to-br from-royal-gold to-yellow-500 text-white shadow-lg'
                            : 'bg-white/50 text-pastel-brown'
                        }`}
                      >
                        {type}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Heart className="w-8 h-8 text-red-400 fill-red-400" />
                  </motion.div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    상대방의 MBTI
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {mbtiTypes.map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPartnerMBTI(type)}
                        className={`py-3 rounded-lg font-semibold transition-all ${
                          partnerMBTI === type
                            ? 'bg-gradient-to-br from-pink-500 to-red-500 text-white shadow-lg'
                            : 'bg-white/50 text-pastel-brown'
                        }`}
                      >
                        {type}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCalculate}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold text-lg shadow-lg"
                >
                  궁합 확인하기
                  <ArrowRight className="inline w-5 h-5 ml-2" />
                </motion.button>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-semibold text-gray-800 mb-2">MBTI란?</h3>
              <p className="text-sm text-pastel-brown leading-relaxed">
                Myers-Briggs Type Indicator의 약자로, 개인의 성격 유형을 16가지로 분류하는 성격 유형 검사입니다.
                각 유형은 4가지 선호 지표(E/I, S/N, T/F, J/P)의 조합으로 이루어집니다.
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <GlassCard className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                궁합 분석 결과
              </h2>

              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="text-3xl font-bold text-royal-gold"
                  >
                    {myMBTI}
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Heart className="w-10 h-10 text-red-500 fill-red-500" />
                  </motion.div>
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="text-3xl font-bold text-pink-500"
                  >
                    {partnerMBTI}
                  </motion.div>
                </div>

                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-6xl font-bold text-royal-gold mb-3"
                >
                  {result.score}점
                </motion.div>

                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.span
                      key={star}
                      initial={{ opacity: 0, rotate: -180 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ delay: star * 0.1 }}
                      className="text-3xl"
                    >
                      {star <= Math.round(result.score / 20) ? '⭐' : '☆'}
                    </motion.span>
                  ))}
                </div>

                <div className="inline-block bg-gradient-to-r from-royal-gold/20 to-pink-500/20 rounded-full px-6 py-2">
                  <p className="font-semibold text-gray-800">
                    {result.score >= 80 && '찰떡 궁합 '}
                    {result.score >= 60 && result.score < 80 && '좋은 궁합 '}
                    {result.score >= 40 && result.score < 60 && '보통 궁합 '}
                    {result.score < 40 && '노력이 필요한 궁합 '}
                  </p>
                </div>
              </div>

              <div className="bg-white/50 rounded-lg p-4 mb-4">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {result.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="py-3 bg-white/50 text-pastel-brown rounded-lg font-semibold"
                >
                  다시 하기
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    try {
                      const stars = '⭐'.repeat(Math.round(result.score / 20));
                      let compatType = '';
                      if (result.score >= 80) compatType = '찰떡 궁합';
                      else if (result.score >= 60) compatType = '좋은 궁합';
                      else if (result.score >= 40) compatType = '보통 궁합';
                      else compatType = '노력이 필요한 궁합';

                      const shareText = `💕 MBTI 궁합 분석\n\n${myMBTI} ❤️ ${partnerMBTI}\n\n⭐ 궁합 점수: ${result.score}점 ${stars}\n🎭 ${compatType}\n\n📝 ${result.description}\n\n📅 ${new Date().toLocaleDateString('ko-KR')}\n🔮 Saju MBTI - NAMSIK93`;

                      await Share.share({
                        title: 'MBTI 궁합 결과',
                        text: shareText,
                        dialogTitle: '친구에게 공유하기'
                      });
                    } catch (error) {
                      // Fallback to browser share API
                      if (navigator.share) {
                        navigator.share({
                          title: 'MBTI 궁합 결과',
                          text: `${myMBTI} ❤️ ${partnerMBTI} 궁합: ${result.score}점!`,
                        });
                      } else {
                        alert('공유 기능을 사용할 수 없습니다.');
                      }
                    }
                  }}
                  className="py-3 bg-gradient-to-r from-royal-gold to-yellow-500 text-white rounded-lg font-semibold"
                >
                  공유하기
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AdBanner />
    </div>
  );
}
