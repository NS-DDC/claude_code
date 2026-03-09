'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, ArrowRight, Calendar, Star } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import AdBanner from '@/components/AdBanner';
import FloatingOrbs from '@/components/FloatingOrbs';
import RadarChart from '@/components/RadarChart';
import { calculateSaju, calculateSajuCompatibility } from '@/lib/sajuCalculator';
import { generateCompleteFortune } from '@/lib/fortuneLogic';
import { getYearlyLuck, analyzeYearElementCompatibility } from '@/lib/yearlyLuck';
import { storage } from '@/lib/storage';
import { validateBirthInfo } from '@/lib/validation';
import { SajuInput, Element } from '@/types';
import { Share } from '@capacitor/share';

type Mode = 'personal' | 'compatibility';

const elements: Element[] = ['목', '화', '토', '금', '수'];

const elementColors: Record<Element, string> = {
  '목': 'bg-green-500',
  '화': 'bg-red-500',
  '토': 'bg-yellow-600',
  '금': 'bg-gray-400',
  '수': 'bg-blue-500'
};

export default function SajuPage() {
  const [mode, setMode] = useState<Mode>('personal');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [completeFortune, setCompleteFortune] = useState<any>(null);
  const [yearlyLuck, setYearlyLuck] = useState<any>(null);
  const [showCardFront, setShowCardFront] = useState(true);

  const [myInput, setMyInput] = useState<SajuInput>({
    gender: 'male',
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    birthHour: 12
  });

  const [partnerInput, setPartnerInput] = useState<SajuInput>({
    gender: 'female',
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    birthHour: 12
  });

  // 프로필 데이터 자동 로드
  useEffect(() => {
    const profile = storage.getProfile();
    if (profile) {
      setMyInput(profile.birthInfo);
    }
  }, []);

  const handleCalculate = () => {
    // 유효성 검사
    const myValidation = validateBirthInfo(myInput);
    if (!myValidation.valid) {
      alert(Object.values(myValidation.errors).join('\n'));
      return;
    }
    if (mode === 'compatibility') {
      const partnerValidation = validateBirthInfo(partnerInput);
      if (!partnerValidation.valid) {
        alert(Object.values(partnerValidation.errors).join('\n'));
        return;
      }
    }

    if (mode === 'personal') {
      const sajuResult = calculateSaju(myInput);
      const fortune = generateCompleteFortune(myInput);
      const currentYear = new Date().getFullYear();
      const yearInfo = getYearlyLuck(currentYear);
      const yearCompat = analyzeYearElementCompatibility(yearInfo.element, fortune.dominantElement);

      setResult(sajuResult);
      setCompleteFortune(fortune);
      setYearlyLuck({ ...yearInfo, compatibility: yearCompat });

      storage.add({
        type: 'saju',
        data: {
          ...sajuResult,
          fortune,
          yearlyLuck: yearInfo
        }
      });
    } else {
      const compatResult = calculateSajuCompatibility(myInput, partnerInput);

      // 궁합용 포춘 생성
      const myFortune = generateCompleteFortune(myInput);
      const partnerFortune = generateCompleteFortune(partnerInput);

      setResult({
        ...compatResult,
        myFortune,
        partnerFortune
      });
      setCompleteFortune(null);
      storage.add({ type: 'saju-compatibility', data: compatResult });
    }
    setShowResult(true);
    setShowCardFront(true);
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
        <Sparkles className="w-12 h-12 text-royal-gold mx-auto mb-2" />
        <h1 className="text-3xl font-bold text-gray-800">스마트 사주 분석</h1>
        <p className="text-pastel-brown mt-2">생년월일시로 운명을 알아보세요</p>
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
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setMode('personal')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    mode === 'personal'
                      ? 'bg-royal-gold text-white'
                      : 'bg-white/50 text-pastel-brown'
                  }`}
                >
                  <Sparkles className="inline w-5 h-5 mr-2" />
                  개인 사주
                </button>
                <button
                  onClick={() => setMode('compatibility')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    mode === 'compatibility'
                      ? 'bg-royal-gold text-white'
                      : 'bg-white/50 text-pastel-brown'
                  }`}
                >
                  <Users className="inline w-5 h-5 mr-2" />
                  사주 궁합
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-lg">
                  {mode === 'compatibility' ? '내 정보' : '생년월일시 입력'}
                </h3>

                <div>
                  <label className="block text-sm text-pastel-brown mb-2">성별</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMyInput({ ...myInput, gender: 'male' })}
                      className={`flex-1 py-2 rounded-lg ${
                        myInput.gender === 'male'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/50 text-gray-600'
                      }`}
                    >
                      남성
                    </button>
                    <button
                      onClick={() => setMyInput({ ...myInput, gender: 'female' })}
                      className={`flex-1 py-2 rounded-lg ${
                        myInput.gender === 'female'
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/50 text-gray-600'
                      }`}
                    >
                      여성
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-pastel-brown mb-2">년도</label>
                    <input
                      type="number"
                      value={myInput.birthYear}
                      onChange={(e) => setMyInput({ ...myInput, birthYear: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-royal-gold"
                      placeholder="1990"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-pastel-brown mb-2">월</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={myInput.birthMonth}
                      onChange={(e) => setMyInput({ ...myInput, birthMonth: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-royal-gold"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-pastel-brown mb-2">일</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={myInput.birthDay}
                      onChange={(e) => setMyInput({ ...myInput, birthDay: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-royal-gold"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-pastel-brown mb-2">시 (0-23)</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={myInput.birthHour}
                      onChange={(e) => setMyInput({ ...myInput, birthHour: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-royal-gold"
                      placeholder="12"
                    />
                  </div>
                </div>

                {mode === 'compatibility' && (
                  <>
                    <div className="border-t border-white/30 my-6" />
                    <h3 className="font-semibold text-gray-800 text-lg">상대방 정보</h3>

                    <div>
                      <label className="block text-sm text-pastel-brown mb-2">성별</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPartnerInput({ ...partnerInput, gender: 'male' })}
                          className={`flex-1 py-2 rounded-lg ${
                            partnerInput.gender === 'male'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/50 text-gray-600'
                          }`}
                        >
                          남성
                        </button>
                        <button
                          onClick={() => setPartnerInput({ ...partnerInput, gender: 'female' })}
                          className={`flex-1 py-2 rounded-lg ${
                            partnerInput.gender === 'female'
                              ? 'bg-pink-500 text-white'
                              : 'bg-white/50 text-gray-600'
                          }`}
                        >
                          여성
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-pastel-brown mb-2">년도</label>
                        <input
                          type="number"
                          value={partnerInput.birthYear}
                          onChange={(e) => setPartnerInput({ ...partnerInput, birthYear: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-royal-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-pastel-brown mb-2">월</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={partnerInput.birthMonth}
                          onChange={(e) => setPartnerInput({ ...partnerInput, birthMonth: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-royal-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-pastel-brown mb-2">일</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={partnerInput.birthDay}
                          onChange={(e) => setPartnerInput({ ...partnerInput, birthDay: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-royal-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-pastel-brown mb-2">시 (0-23)</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={partnerInput.birthHour}
                          onChange={(e) => setPartnerInput({ ...partnerInput, birthHour: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-royal-gold"
                        />
                      </div>
                    </div>
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCalculate}
                  className="w-full py-4 bg-gradient-to-r from-royal-gold to-yellow-500 text-white rounded-xl font-semibold text-lg shadow-lg mt-6"
                >
                  {mode === 'personal' ? '사주 분석하기' : '궁합 보기'}
                  <ArrowRight className="inline w-5 h-5 ml-2" />
                </motion.button>
              </div>
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
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                {mode === 'personal' ? '사주 분석 결과' : '사주 궁합 결과'}
              </h2>

              {mode === 'personal' && result && completeFortune && (
                <>
                  {/* Floating Orbs Background */}
                  <FloatingOrbs elements={completeFortune.elementRadar} />

                  {/* Yearly Luck Info */}
                  {yearlyLuck && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-4 border-2 border-royal-gold/30"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-6 h-6 text-royal-gold" />
                        <h3 className="font-bold text-gray-800">
                          {yearlyLuck.year}년 {yearlyLuck.color} {yearlyLuck.animal}의 해
                        </h3>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{yearlyLuck.description}</p>
                      <div className="flex items-center gap-2 text-xs bg-white/50 rounded-lg p-2">
                        <span className="font-semibold text-royal-gold">{yearlyLuck.compatibility.relationship}</span>
                        <span className="text-gray-600">{yearlyLuck.compatibility.message}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Overall Summary with Card Flip */}
                  <motion.div
                    className="relative mb-6 cursor-pointer"
                    style={{ perspective: 1000 }}
                    onClick={() => setShowCardFront(!showCardFront)}
                  >
                    <motion.div
                      className="relative w-full"
                      initial={false}
                      animate={{ rotateY: showCardFront ? 0 : 180 }}
                      transition={{ duration: 0.6 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Front of Card - Summary */}
                      <div
                        className="bg-gradient-to-br from-royal-gold/30 to-amber-500/30 rounded-xl p-6 border-2 border-royal-gold"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-royal-gold" />
                          <h3 className="font-bold text-gray-800 text-lg">운명 총평</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-3">{completeFortune.overallSummary}</p>

                        {/* Fusion Character */}
                        {completeFortune.fusionCharacter && (
                          <div className="bg-white/50 rounded-lg p-3 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-3xl">{completeFortune.fusionCharacter.emoji}</span>
                              <span className="font-bold text-royal-gold">{completeFortune.fusionCharacter.name}</span>
                            </div>
                            <p className="text-sm text-gray-600">{completeFortune.fusionCharacter.description}</p>
                          </div>
                        )}

                        <p className="text-xs text-center text-royal-gold mt-3">탭하여 뒤집기 →</p>
                      </div>

                      {/* Back of Card - Energy Character */}
                      <div
                        className="absolute top-0 left-0 w-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-xl p-6 border-2 border-indigo-500"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Star className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-bold text-gray-800 text-lg">에너지 특성</h3>
                        </div>
                        <div className="bg-white/50 rounded-lg p-3">
                          <p className="font-semibold text-indigo-600 mb-2">{completeFortune.energyCharacter.type}</p>
                          <p className="text-sm text-gray-700">{completeFortune.energyCharacter.description}</p>
                        </div>
                        {completeFortune.fusionCharacter && (
                          <div className="mt-3 space-y-2 text-sm">
                            <div className="flex gap-2">
                              <span className="text-green-600 font-semibold">💪 강점:</span>
                              <span className="text-gray-700">{completeFortune.fusionCharacter.strength}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-red-600 font-semibold">⚠️ 약점:</span>
                              <span className="text-gray-700">{completeFortune.fusionCharacter.weakness}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-pink-600 font-semibold">✨ 매력:</span>
                              <span className="text-gray-700">{completeFortune.fusionCharacter.charm}</span>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-center text-indigo-600 mt-3">← 탭하여 뒤집기</p>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Element Radar */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3 text-center">오행 에너지 분포</h3>
                    <div className="bg-white/30 rounded-xl p-4">
                      <div className="space-y-2">
                        {elements.map((element, index) => {
                          const normalizedValue = completeFortune.elementRadar[element] || 0;
                          return (
                            <motion.div
                              key={element}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1, duration: 0.5 }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-12 font-semibold text-gray-700">{element}</span>
                                <div className="flex-1 bg-white/50 rounded-full h-8 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${normalizedValue}%` }}
                                    transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                                    className={`h-full ${elementColors[element]} flex items-center justify-end pr-2`}
                                  >
                                    <span className="text-white font-bold text-sm">{normalizedValue}</span>
                                  </motion.div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                      <div className="mt-3 text-center">
                        <span className="inline-flex items-center gap-2 bg-gradient-to-r from-royal-gold/20 to-amber-500/20 px-4 py-2 rounded-full">
                          <span className="text-sm text-pastel-brown">주도 오행:</span>
                          <span className={`${elementColors[completeFortune.dominantElement as Element]} text-white px-3 py-1 rounded-lg font-bold`}>
                            {completeFortune.dominantElement}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Luck Radar Chart */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3 text-center">운세 레이더</h3>
                    <div className="bg-gradient-to-br from-amber-100/50 to-yellow-100/50 rounded-xl p-4">
                      <RadarChart data={completeFortune.luckRadar} size={280} />
                    </div>
                  </div>

                  {/* Lucky Items */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">🍀 행운 아이템</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-pink-200/50 to-red-200/50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">행운의 색</p>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full shadow-lg border-2 border-white"
                            style={{ backgroundColor: completeFortune.luckyItems.color.hex }}
                          />
                          <span className="font-semibold text-gray-800">{completeFortune.luckyItems.color.name}</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-200/50 to-emerald-200/50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">행운의 음식</p>
                        <p className="font-semibold text-gray-800">{completeFortune.luckyItems.food}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-200/50 to-cyan-200/50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">행운의 장소</p>
                        <p className="font-semibold text-gray-800">{completeFortune.luckyItems.place}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-200/50 to-indigo-200/50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">행운의 시간</p>
                        <p className="font-semibold text-gray-800">{completeFortune.luckyItems.time}</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-royal-gold/20 to-amber-500/20 rounded-lg p-3 mt-3">
                      <p className="text-xs text-gray-600 mb-1">행운의 숫자</p>
                      <div className="flex gap-2 flex-wrap">
                        {completeFortune.luckyItems.numbers.map((num: number, idx: number) => (
                          <motion.span
                            key={idx}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-royal-gold text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg"
                          >
                            {num}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Things to Avoid */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-3">⚠️ 피해야 할 것</h3>
                    <div className="bg-gradient-to-br from-red-100/50 to-orange-100/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-semibold text-sm">시간:</span>
                        <span className="text-gray-700 text-sm">{completeFortune.avoid.time}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-semibold text-sm">물건:</span>
                        <span className="text-gray-700 text-sm">{completeFortune.avoid.item}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-semibold text-sm">행동:</span>
                        <span className="text-gray-700 text-sm">{completeFortune.avoid.action}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {mode === 'compatibility' && result && (
                <>
                  {/* 궁합 점수 */}
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-6xl font-bold text-royal-gold mb-2"
                    >
                      {result.compatibilityScore}점
                    </motion.div>
                    <div className="flex justify-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.span
                          key={star}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: star * 0.1 }}
                          className="text-2xl"
                        >
                          {star <= Math.round(result.compatibilityScore / 20) ? '⭐' : '☆'}
                        </motion.span>
                      ))}
                    </div>
                    <div className="inline-block bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-full px-6 py-2">
                      <p className="font-bold text-gray-800">
                        {result.compatibilityScore >= 85 && '천생연분 💕'}
                        {result.compatibilityScore >= 70 && result.compatibilityScore < 85 && '찰떡 궁합 ❤️'}
                        {result.compatibilityScore >= 55 && result.compatibilityScore < 70 && '좋은 인연 💛'}
                        {result.compatibilityScore >= 40 && result.compatibilityScore < 55 && '보완 관계 💙'}
                        {result.compatibilityScore < 40 && '노력이 필요 💚'}
                      </p>
                    </div>
                  </div>

                  {/* 두 사람의 오행 비교 */}
                  {result.myFortune && result.partnerFortune && (
                    <>
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-700 mb-3 text-center">오행 궁합 분석</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {/* 나 */}
                          <div className="bg-gradient-to-br from-blue-100/50 to-cyan-100/50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-2 text-center">나</p>
                            <div className="space-y-1">
                              {elements.map((element) => (
                                <div key={element} className="flex items-center gap-2">
                                  <span className="text-xs w-8">{element}</span>
                                  <div className="flex-1 bg-white/50 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-full ${elementColors[element]}`}
                                      style={{ width: `${(result.myFortune.elementRadar[element] || 0)}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-center">
                              <span className={`${elementColors[result.myFortune.dominantElement as Element]} text-white px-2 py-1 rounded text-xs font-bold`}>
                                {result.myFortune.dominantElement} 주도
                              </span>
                            </div>
                          </div>

                          {/* 상대방 */}
                          <div className="bg-gradient-to-br from-pink-100/50 to-red-100/50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-2 text-center">상대방</p>
                            <div className="space-y-1">
                              {elements.map((element) => (
                                <div key={element} className="flex items-center gap-2">
                                  <span className="text-xs w-8">{element}</span>
                                  <div className="flex-1 bg-white/50 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-full ${elementColors[element]}`}
                                      style={{ width: `${(result.partnerFortune.elementRadar[element] || 0)}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-center">
                              <span className={`${elementColors[result.partnerFortune.dominantElement as Element]} text-white px-2 py-1 rounded text-xs font-bold`}>
                                {result.partnerFortune.dominantElement} 주도
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 오행 상생상극 분석 */}
                        <div className="bg-gradient-to-r from-purple-100/50 to-pink-100/50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-2 text-sm">오행 관계</h4>
                          {(() => {
                            const myElem = result.myFortune.dominantElement as Element;
                            const partnerElem = result.partnerFortune.dominantElement as Element;
                            const sheng: Record<Element, Element> = {
                              '목': '화', '화': '토', '토': '금', '금': '수', '수': '목'
                            };
                            const ke: Record<Element, Element> = {
                              '목': '토', '화': '금', '토': '수', '금': '목', '수': '화'
                            };

                            let relationship = '';
                            let message = '';
                            let emoji = '';

                            if (myElem === partnerElem) {
                              relationship = '비화(比和)';
                              message = '같은 오행으로 서로를 잘 이해하고 편안한 관계입니다.';
                              emoji = '😊';
                            } else if (sheng[myElem] === partnerElem) {
                              relationship = '상생(相生)';
                              message = `${myElem}이 ${partnerElem}을 생성하여 상대방에게 힘을 주는 관계입니다.`;
                              emoji = '💪';
                            } else if (sheng[partnerElem] === myElem) {
                              relationship = '피상생(被相生)';
                              message = `${partnerElem}이 ${myElem}을 생성하여 상대방으로부터 도움을 받는 관계입니다.`;
                              emoji = '🙏';
                            } else if (ke[myElem] === partnerElem) {
                              relationship = '상극(相克)';
                              message = `${myElem}이 ${partnerElem}을 극하여 주도적이지만 조화가 필요합니다.`;
                              emoji = '⚡';
                            } else if (ke[partnerElem] === myElem) {
                              relationship = '피상극(被相克)';
                              message = `${partnerElem}이 ${myElem}을 극하여 겸손과 이해가 필요합니다.`;
                              emoji = '🤝';
                            }

                            return (
                              <div className="text-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">{emoji}</span>
                                  <span className="font-bold text-purple-600">{relationship}</span>
                                </div>
                                <p className="text-gray-700">{message}</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* 두 사람의 캐릭터 */}
                      {result.myFortune.fusionCharacter && result.partnerFortune.fusionCharacter && (
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-700 mb-3 text-center">두 사람의 캐릭터</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-lg p-3">
                              <div className="text-center mb-2">
                                <span className="text-3xl">{result.myFortune.fusionCharacter.emoji}</span>
                              </div>
                              <p className="font-bold text-sm text-center text-blue-700 mb-1">
                                {result.myFortune.fusionCharacter.name}
                              </p>
                              <p className="text-xs text-gray-600 text-center">
                                {result.myFortune.fusionCharacter.description.slice(0, 50)}...
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-200/30 to-red-200/30 rounded-lg p-3">
                              <div className="text-center mb-2">
                                <span className="text-3xl">{result.partnerFortune.fusionCharacter.emoji}</span>
                              </div>
                              <p className="font-bold text-sm text-center text-pink-700 mb-1">
                                {result.partnerFortune.fusionCharacter.name}
                              </p>
                              <p className="text-xs text-gray-600 text-center">
                                {result.partnerFortune.fusionCharacter.description.slice(0, 50)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* 기존 설명 */}
                  <div className="bg-white/50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">종합 해석</h4>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {result.description}
                    </p>
                  </div>

                  {/* 궁합 조언 */}
                  <div className="bg-gradient-to-br from-amber-100/50 to-yellow-100/50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      💡 관계 발전 조언
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      {result.compatibilityScore >= 70 && (
                        <>
                          <p>✨ 서로의 강점을 인정하고 존중하세요</p>
                          <p>💕 자연스러운 교감을 즐기세요</p>
                          <p>🌟 함께하는 시간을 소중히 여기세요</p>
                        </>
                      )}
                      {result.compatibilityScore >= 40 && result.compatibilityScore < 70 && (
                        <>
                          <p>🤝 서로의 차이를 이해하려 노력하세요</p>
                          <p>💬 솔직한 대화로 오해를 풀어가세요</p>
                          <p>🌱 함께 성장하는 관계를 만들어가세요</p>
                        </>
                      )}
                      {result.compatibilityScore < 40 && (
                        <>
                          <p>🙏 인내심을 가지고 상대를 이해하세요</p>
                          <p>📖 서로에 대해 더 많이 알아가세요</p>
                          <p>💪 차이를 극복하는 노력이 필요합니다</p>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-white/50 text-pastel-brown rounded-lg font-semibold"
                >
                  다시 분석하기
                </button>
                <button
                  onClick={async () => {
                    try {
                      let shareText = '';

                      if (mode === 'personal' && completeFortune) {
                        shareText = `🔮 사주 분석 결과\n\n✨ ${completeFortune.fusionCharacter?.name || '운명의 전사'}\n${completeFortune.fusionCharacter?.emoji || '⭐'}\n\n📝 ${completeFortune.overallSummary}\n\n🎯 주도 오행: ${completeFortune.dominantElement}\n\n🍀 행운 아이템\n🎨 색상: ${completeFortune.luckyItems.color.name}\n🍽️ 음식: ${completeFortune.luckyItems.food}\n📍 장소: ${completeFortune.luckyItems.place}\n🕐 시간: ${completeFortune.luckyItems.time}\n🎲 숫자: ${completeFortune.luckyItems.numbers.join(', ')}\n\n📅 ${new Date().toLocaleDateString('ko-KR')}\n🔮 Saju MBTI - NAMSIK93`;
                      } else if (mode === 'compatibility' && result) {
                        shareText = `💕 사주 궁합 결과\n\n⭐ 궁합 점수: ${result.compatibilityScore}점\n\n${result.description}\n\n📅 ${new Date().toLocaleDateString('ko-KR')}\n🔮 Saju MBTI - NAMSIK93`;
                      }

                      await Share.share({
                        title: mode === 'personal' ? '사주 분석 결과' : '사주 궁합 결과',
                        text: shareText,
                        dialogTitle: '친구에게 공유하기'
                      });
                    } catch (error) {
                      // Fallback to browser share API
                      if (navigator.share) {
                        navigator.share({
                          title: '사주 분석 결과',
                          text: '나의 사주 분석 결과를 확인해보세요!',
                        });
                      } else {
                        alert('공유 기능을 사용할 수 없습니다.');
                      }
                    }
                  }}
                  className="flex-1 py-3 bg-royal-gold text-white rounded-lg font-semibold"
                >
                  공유하기
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AdBanner />
    </div>
  );
}
