'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Users, Calendar, Share2, Save } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import FloatingOrbs from '@/components/FloatingOrbs';
import BirthInfoForm from '@/components/BirthInfoForm';
import DestinyCharacterCard from '@/components/DestinyCharacterCard';
import TalismanCard from '@/components/TalismanCard';
import DestinyCompatibilityDisplay from '@/components/DestinyCompatibilityDisplay';
import { getDestinyCharacter } from '@/lib/destinyCharacter';
import { calculateSaju } from '@/lib/sajuCalculator';
import { calculateDestinyCompatibility } from '@/lib/destinyCompatibility';
import { getDestinyYearAdvice, getYearlyLuck } from '@/lib/yearlyLuck';
import { storage } from '@/lib/storage';
import { validateBirthInfo } from '@/lib/validation';
import { MBTIType, SajuInput, Element, DestinyCharacter, DestinyCompatibilityResult } from '@/types';
import { Share } from '@capacitor/share';

type Mode = 'character' | 'compatibility';

const mbtiTypes: MBTIType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

export default function DestinyPage() {
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

  // 프로필 데이터 자동 로드
  useEffect(() => {
    const profile = storage.getProfile();
    if (profile) {
      setMyMBTI(profile.mbti);
      setMyBirth(profile.birthInfo);
    }
  }, []);

  // 캐릭터 발견 (BirthInfoForm에서 호출)
  const handleCharacterDiscover = (mbti: MBTIType, birth: SajuInput) => {
    const sajuResult = calculateSaju(birth);
    const dominantElement = (Object.entries(sajuResult.elements) as [Element, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    const destinyChar = getDestinyCharacter(mbti, dominantElement);
    setCharacter(destinyChar);

    const currentYear = new Date().getFullYear();
    const advice = getDestinyYearAdvice(currentYear, dominantElement, mbti);
    setYearAdvice(advice);

    // 프로필 저장/업데이트
    const existingProfile = storage.getProfile();
    storage.saveProfile({
      mbti,
      element: dominantElement,
      birthInfo: birth,
      characterId: destinyChar.id,
      characterName: destinyChar.name,
      characterEmoji: destinyChar.emoji,
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    storage.add({
      type: 'destiny',
      data: {
        id: `destiny_${Date.now()}`,
        date: new Date().toISOString(),
        mbti,
        birthInfo: birth,
        character: destinyChar,
        element: dominantElement,
        yearElement: getYearlyLuck(currentYear).element,
        yearAdvice: advice
      }
    });

    setShowResult(true);
  };

  // 궁합 분석
  const handleCompatDiscover = () => {
    // 유효성 검사
    const myValidation = validateBirthInfo(myBirth);
    if (!myValidation.valid) {
      alert(Object.values(myValidation.errors).join('\n'));
      return;
    }
    const partnerValidation = validateBirthInfo(partnerBirth);
    if (!partnerValidation.valid) {
      alert(Object.values(partnerValidation.errors).join('\n'));
      return;
    }

    const mySajuResult = calculateSaju(myBirth);
    const partnerSajuResult = calculateSaju(partnerBirth);

    const myElement = (Object.entries(mySajuResult.elements) as [Element, number][])
      .sort((a, b) => b[1] - a[1])[0][0];
    const partnerElement = (Object.entries(partnerSajuResult.elements) as [Element, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    const compat = calculateDestinyCompatibility(myMBTI, myElement, partnerMBTI, partnerElement);
    setCompatResult(compat);

    storage.add({
      type: 'destiny-compatibility',
      data: compat
    });

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
        await Share.share({
          title: '나의 운명 캐릭터',
          text: `나는 ${character.name} (${character.mbti}/${character.element})입니다! 당신의 운명 캐릭터는?`,
          url: window.location.href
        });
      } else if (compatResult) {
        await Share.share({
          title: '운명 캐릭터 궁합',
          text: `우리의 궁합은 ${compatResult.totalScore}점, ${compatResult.compatibilityType}입니다!`,
          url: window.location.href
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
            /* My Character Form - BirthInfoForm 적용 */
            <GlassCard>
              <h2 className="text-xl font-bold mb-4 text-gray-800">내 정보 입력</h2>
              <BirthInfoForm
                showMBTI={true}
                onSubmit={handleCharacterDiscover}
                submitLabel="내 운명 캐릭터 발견하기"
                submitGradient="from-purple-500 to-pink-500"
              />
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
                onClick={handleCompatDiscover}
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
