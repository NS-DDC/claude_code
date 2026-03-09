'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import BirthInfoForm from '@/components/BirthInfoForm';
import FortuneScoreGauge from '@/components/FortuneScoreGauge';
import FloatingOrbs from '@/components/FloatingOrbs';
import { calculateSaju } from '@/lib/sajuCalculator';
import { getDestinyCharacter } from '@/lib/destinyCharacter';
import { calculateFortuneScore } from '@/lib/fortuneScore';
import { storage } from '@/lib/storage';
import { MBTIType, SajuInput, Element, DestinyCharacter, UserProfile } from '@/types';

type Step = 'welcome' | 'input' | 'reveal';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [character, setCharacter] = useState<DestinyCharacter | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fortuneScore, setFortuneScore] = useState(0);

  const handleFormSubmit = (mbti: MBTIType, birth: SajuInput) => {
    // 오행 계산
    const sajuResult = calculateSaju(birth);
    const dominantElement = (Object.entries(sajuResult.elements) as [Element, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    // 운명 캐릭터 조회
    const destinyChar = getDestinyCharacter(mbti, dominantElement);
    setCharacter(destinyChar);

    // 프로필 생성
    const newProfile: UserProfile = {
      mbti,
      element: dominantElement,
      birthInfo: birth,
      characterId: destinyChar.id,
      characterName: destinyChar.name,
      characterEmoji: destinyChar.emoji,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProfile(newProfile);

    // 운세 점수 계산
    const score = calculateFortuneScore(newProfile);
    setFortuneScore(score.totalScore);

    // 프로필 저장
    storage.saveProfile(newProfile);

    setStep('reveal');
  };

  const handleComplete = () => {
    router.push('/');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg min-h-screen flex flex-col justify-center">
      <FloatingOrbs />

      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-md border border-white/30 mb-6">
                <Sparkles className="w-16 h-16 text-royal-gold" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              운명과 성격
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600 text-lg mb-2"
            >
              사주와 MBTI가 만나 탄생한
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-gray-600 text-lg mb-8"
            >
              80가지 운명 캐릭터를 발견하세요
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="space-y-3 mb-8 text-left max-w-xs mx-auto"
            >
              {[
                { icon: '🔮', text: '나만의 운명 캐릭터 발견' },
                { icon: '📊', text: '매일 변하는 운세 점수' },
                { icon: '💕', text: '사주 & MBTI 궁합 분석' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.15 }}
                  className="flex items-center gap-3 bg-white/30 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-gray-700 font-medium">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep('input')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-xl flex items-center gap-2 mx-auto"
            >
              시작하기
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Input */}
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <div className="text-center mb-6">
              <Star className="w-10 h-10 text-royal-gold mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-gray-800">내 정보 입력</h2>
              <p className="text-gray-600 mt-1">MBTI와 생년월일시를 알려주세요</p>
            </div>

            <GlassCard hover={false}>
              <BirthInfoForm
                onSubmit={handleFormSubmit}
                submitLabel="내 운명 캐릭터 발견하기"
                submitGradient="from-purple-500 to-pink-500"
                prefillFromProfile={false}
              />
            </GlassCard>
          </motion.div>
        )}

        {/* Step 3: Character Reveal */}
        {step === 'reveal' && character && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-600 mb-4"
            >
              당신의 운명 캐릭터는...
            </motion.p>

            {/* Character Reveal */}
            <motion.div
              initial={{ scale: 0, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="mb-6"
            >
              <div className="inline-flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-3xl p-8 border-2 border-royal-gold/40 shadow-2xl">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="text-8xl mb-4"
                >
                  {character.emoji}
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"
                >
                  {character.name}
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex gap-2"
                >
                  <span className="px-3 py-1 bg-purple-500/20 rounded-full text-sm font-semibold text-purple-700">
                    {character.mbti}
                  </span>
                  <span className="px-3 py-1 bg-pink-500/20 rounded-full text-sm font-semibold text-pink-700">
                    {character.element}
                  </span>
                </motion.div>
              </div>
            </motion.div>

            {/* Fortune Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mb-6"
            >
              <GlassCard hover={false}>
                <FortuneScoreGauge score={fortuneScore} size="md" />
              </GlassCard>
            </motion.div>

            {/* Character Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="mb-6"
            >
              <GlassCard hover={false}>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {character.description}
                </p>
              </GlassCard>
            </motion.div>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleComplete}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-2"
            >
              시작하기
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
