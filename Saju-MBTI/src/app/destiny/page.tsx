'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Star, Users, Calendar, Share2, Save } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';

// Dynamic imports for heavy components (loaded only when results are shown)
const FloatingOrbs = dynamic(() => import('@/components/FloatingOrbs'), {
  loading: () => <LoadingSkeleton type="orbs" />,
  ssr: false
});

const DestinyCharacterCard = dynamic(() => import('@/components/DestinyCharacterCard'), {
  loading: () => <LoadingSkeleton type="card" />,
  ssr: false
});

const TalismanCard = dynamic(() => import('@/components/TalismanCard'), {
  loading: () => <LoadingSkeleton type="card" />,
  ssr: false
});

const DestinyCompatibilityDisplay = dynamic(() => import('@/components/DestinyCompatibilityDisplay'), {
  loading: () => <LoadingSkeleton type="card" />,
  ssr: false
});
import { getDestinyCharacter } from '@/lib/destinyCharacter';
import { calculateSaju } from '@/lib/sajuCalculator';
import { calculateDestinyCompatibility } from '@/lib/destinyCompatibility';
import { getDestinyYearAdvice, getYearlyLuck } from '@/lib/yearlyLuck';
import { storageService } from '@/lib/storageService';
import { useAuth } from '@/contexts/AuthContext';
import { MBTIType, SajuInput, DestinyCharacter, DestinyCompatibilityResult } from '@/types';
import { Share } from '@capacitor/share';

type Mode = 'character' | 'compatibility';

const mbtiTypes: MBTIType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

export default function DestinyPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('character');
  const [showResult, setShowResult] = useState(false);
  const [character, setCharacter] = useState<DestinyCharacter | null>(null);
  const [yearAdvice, setYearAdvice] = useState<string>('');
  const [compatResult, setCompatResult] = useState<DestinyCompatibilityResult | null>(null);

  const [myMBTI, setMyMBTI] = useState<MBTIType>('INTJ');
  const [myBirth, setMyBirth] = useState<SajuInput>({
    gender: 'male',
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    birthHour: 12
  });

  const [partnerMBTI, setPartnerMBTI] = useState<MBTIType>('ENFP');
  const [partnerBirth, setPartnerBirth] = useState<SajuInput>({
    gender: 'female',
    birthYear: 1992,
    birthMonth: 6,
    birthDay: 15,
    birthHour: 14
  });

  const handleDiscover = async () => {
    if (mode === 'character') {
      // Calculate element from birth info
      const sajuResult = calculateSaju(myBirth);
      const dominantElement = (Object.entries(sajuResult.elements) as [any, number][])
        .sort((a, b) => b[1] - a[1])[0][0];

      // Get destiny character
      const destinyChar = getDestinyCharacter(myMBTI, dominantElement);
      setCharacter(destinyChar);

      // Get year advice
      const currentYear = new Date().getFullYear();
      const advice = getDestinyYearAdvice(currentYear, dominantElement, myMBTI);
      setYearAdvice(advice);

      // Save user preferences
      await storageService.saveUserPreferences(myMBTI, dominantElement, myBirth, user?.uid);

      // Save to history
      await storageService.add({
        type: 'destiny',
        data: {
          id: `destiny_${Date.now()}`,
          date: new Date().toISOString(),
          mbti: myMBTI,
          birthInfo: myBirth,
          character: destinyChar,
          element: dominantElement,
          yearElement: getYearlyLuck(currentYear).element,
          yearAdvice: advice
        }
      }, user?.uid);
    } else {
      // Compatibility mode
      const mySajuResult = calculateSaju(myBirth);
      const partnerSajuResult = calculateSaju(partnerBirth);

      const myElement = (Object.entries(mySajuResult.elements) as [any, number][])
        .sort((a, b) => b[1] - a[1])[0][0];
      const partnerElement = (Object.entries(partnerSajuResult.elements) as [any, number][])
        .sort((a, b) => b[1] - a[1])[0][0];

      const compat = calculateDestinyCompatibility(myMBTI, myElement, partnerMBTI, partnerElement);
      setCompatResult(compat);

      // Save to history
      await storageService.add({
        type: 'destiny-compatibility',
        data: compat
      }, user?.uid);
    }

    setShowResult(true);
  };

  const handleReset = () => {
    setShowResult(false);
    setCharacter(null);
    setCompatResult(null);
  };

  const handleShare = async () => {
    try {
      if (mode === 'character' && character) {
        const shareText = `✨ Fortune & MBTI - 운명 캐릭터\n\n${character.emoji} ${character.name}\n${character.mbti} × ${character.element}\n\n📝 ${character.description.slice(0, 80)}...\n\n당신의 운명 캐릭터를 발견해보세요! 🌟`;

        await Share.share({
          title: 'Fortune & MBTI - 운명 캐릭터',
          text: shareText,
          dialogTitle: '친구에게 공유하기'
        });
      } else if (compatResult) {
        const shareText = `💕 Fortune & MBTI - 운명 궁합\n\n⭐ 궁합 점수: ${compatResult.totalScore}점\n🎭 ${compatResult.compatibilityType}\n\n${compatResult.description.slice(0, 100)}...\n\n두 사람의 운명 궁합을 확인해보세요! 💑`;

        await Share.share({
          title: 'Fortune & MBTI - 운명 궁합',
          text: shareText,
          dialogTitle: '친구에게 공유하기'
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg pb-24">
      <FloatingOrbs />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          운명 캐릭터
        </h1>
        <p className="text-gray-600">
          MBTI와 사주가 만나 탄생한 80가지 운명
        </p>
      </motion.div>

      {!showResult ? (
        <>
          {/* Mode Selector */}
          <GlassCard className="mb-6">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode('character')}
                className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  mode === 'character'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/50 text-gray-600'
                }`}
              >
                <Star className="w-5 h-5" />
                내 캐릭터
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode('compatibility')}
                className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  mode === 'compatibility'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/50 text-gray-600'
                }`}
              >
                <Users className="w-5 h-5" />
                궁합 보기
              </motion.button>
            </div>
          </GlassCard>

          {/* Input Forms */}
          {mode === 'character' ? (
            /* My Character Form */
            <GlassCard>
              <h2 className="text-xl font-bold mb-4 text-gray-800">내 정보 입력</h2>

              {/* MBTI Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">MBTI</label>
                <div className="grid grid-cols-4 gap-2">
                  {mbtiTypes.map((type) => (
                    <motion.button
                      key={type}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMyMBTI(type)}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                        myMBTI === type
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-white/50 text-gray-600 hover:bg-white/70'
                      }`}
                    >
                      {type}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Birth Info */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">생년월일시</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">성별</label>
                    <select
                      value={myBirth.gender}
                      onChange={(e) => setMyBirth({ ...myBirth, gender: e.target.value as 'male' | 'female' })}
                      className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">년도</label>
                    <input
                      type="number"
                      value={myBirth.birthYear}
                      onChange={(e) => setMyBirth({ ...myBirth, birthYear: parseInt(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">월</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={myBirth.birthMonth}
                      onChange={(e) => setMyBirth({ ...myBirth, birthMonth: parseInt(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">일</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={myBirth.birthDay}
                      onChange={(e) => setMyBirth({ ...myBirth, birthDay: parseInt(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600">시 (0-23)</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={myBirth.birthHour}
                      onChange={(e) => setMyBirth({ ...myBirth, birthHour: parseInt(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDiscover}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Star className="w-6 h-6" />
                내 운명 캐릭터 발견하기
              </motion.button>
            </GlassCard>
          ) : (
            /* Compatibility Form */
            <div className="space-y-4">
              {/* My Info */}
              <GlassCard>
                <h3 className="text-lg font-bold mb-3 text-gray-800">내 정보</h3>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">MBTI</label>
                  <div className="grid grid-cols-4 gap-2">
                    {mbtiTypes.slice(0, 8).map((type) => (
                      <button
                        key={type}
                        onClick={() => setMyMBTI(type)}
                        className={`py-1.5 rounded text-xs font-semibold ${
                          myMBTI === type ? 'bg-purple-500 text-white' : 'bg-white/50 text-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {mbtiTypes.slice(8).map((type) => (
                      <button
                        key={type}
                        onClick={() => setMyMBTI(type)}
                        className={`py-1.5 rounded text-xs font-semibold ${
                          myMBTI === type ? 'bg-purple-500 text-white' : 'bg-white/50 text-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <input
                    type="number"
                    placeholder="년"
                    value={myBirth.birthYear}
                    onChange={(e) => setMyBirth({ ...myBirth, birthYear: parseInt(e.target.value) })}
                    className="p-2 rounded bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    placeholder="월"
                    min="1"
                    max="12"
                    value={myBirth.birthMonth}
                    onChange={(e) => setMyBirth({ ...myBirth, birthMonth: parseInt(e.target.value) })}
                    className="p-2 rounded bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    placeholder="일"
                    min="1"
                    max="31"
                    value={myBirth.birthDay}
                    onChange={(e) => setMyBirth({ ...myBirth, birthDay: parseInt(e.target.value) })}
                    className="p-2 rounded bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </GlassCard>

              {/* Partner Info */}
              <GlassCard>
                <h3 className="text-lg font-bold mb-3 text-gray-800">상대방 정보</h3>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">MBTI</label>
                  <div className="grid grid-cols-4 gap-2">
                    {mbtiTypes.slice(0, 8).map((type) => (
                      <button
                        key={type}
                        onClick={() => setPartnerMBTI(type)}
                        className={`py-1.5 rounded text-xs font-semibold ${
                          partnerMBTI === type ? 'bg-pink-500 text-white' : 'bg-white/50 text-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {mbtiTypes.slice(8).map((type) => (
                      <button
                        key={type}
                        onClick={() => setPartnerMBTI(type)}
                        className={`py-1.5 rounded text-xs font-semibold ${
                          partnerMBTI === type ? 'bg-pink-500 text-white' : 'bg-white/50 text-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <input
                    type="number"
                    placeholder="년"
                    value={partnerBirth.birthYear}
                    onChange={(e) => setPartnerBirth({ ...partnerBirth, birthYear: parseInt(e.target.value) })}
                    className="p-2 rounded bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="number"
                    placeholder="월"
                    min="1"
                    max="12"
                    value={partnerBirth.birthMonth}
                    onChange={(e) => setPartnerBirth({ ...partnerBirth, birthMonth: parseInt(e.target.value) })}
                    className="p-2 rounded bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="number"
                    placeholder="일"
                    min="1"
                    max="31"
                    value={partnerBirth.birthDay}
                    onChange={(e) => setPartnerBirth({ ...partnerBirth, birthDay: parseInt(e.target.value) })}
                    className="p-2 rounded bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </GlassCard>

              {/* Calculate Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDiscover}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Users className="w-6 h-6" />
                운명 궁합 확인하기
              </motion.button>
            </div>
          )}
        </>
      ) : (
        /* Results */
        <div>
          {mode === 'character' && character ? (
            <div className="space-y-6">
              {/* Character Card */}
              <DestinyCharacterCard character={character} />

              {/* Year Advice */}
              <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-xl font-bold text-gray-800">2026년 운세</h3>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {yearAdvice}
                </p>
              </GlassCard>

              {/* Talisman */}
              <TalismanCard character={character} />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  공유하기
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="flex-1 bg-white/50 backdrop-blur-md text-gray-700 font-bold py-3 px-6 rounded-xl shadow-lg"
                >
                  다시 하기
                </motion.button>
              </div>
            </div>
          ) : compatResult ? (
            <div className="space-y-6">
              {/* Compatibility Display */}
              <DestinyCompatibilityDisplay result={compatResult} />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  공유하기
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="flex-1 bg-white/50 backdrop-blur-md text-gray-700 font-bold py-3 px-6 rounded-xl shadow-lg"
                >
                  다시 하기
                </motion.button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
