'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Calendar,
  Bell,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import GlassCard from './GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { MBTIType, SajuInput } from '@/types';
import { preferencesService } from '@/lib/firestore';
import { notificationService } from '@/lib/notifications';
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firestore';

const MBTI_TYPES: MBTIType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

const MBTI_INFO: Record<MBTIType, { emoji: string; label: string; description: string }> = {
  INTJ: { emoji: '🧠', label: '전략가', description: '상상력이 풍부한 전략가' },
  INTP: { emoji: '🔬', label: '논리술사', description: '끊임없이 탐구하는 혁신가' },
  ENTJ: { emoji: '👑', label: '통솔자', description: '대담한 지도자' },
  ENTP: { emoji: '💡', label: '변론가', description: '영리한 사색가' },
  INFJ: { emoji: '🔮', label: '옹호자', description: '이상주의적 조언자' },
  INFP: { emoji: '🌸', label: '중재자', description: '시적이고 친절한 이타주의자' },
  ENFJ: { emoji: '🌟', label: '선도자', description: '카리스마있는 지도자' },
  ENFP: { emoji: '🦋', label: '활동가', description: '열정적이고 창의적인 사교가' },
  ISTJ: { emoji: '📋', label: '현실주의자', description: '사실을 중시하는 신뢰자' },
  ISFJ: { emoji: '🛡️', label: '수호자', description: '헌신적인 보호자' },
  ESTJ: { emoji: '⚖️', label: '경영자', description: '뛰어난 관리자' },
  ESFJ: { emoji: '🤝', label: '외교관', description: '사교적이고 인기있는 협력자' },
  ISTP: { emoji: '🔧', label: '장인', description: '대담한 실험가' },
  ISFP: { emoji: '🎨', label: '모험가', description: '유연하고 매력적인 예술가' },
  ESTP: { emoji: '🏄', label: '사업가', description: '영리하고 활동적인 모험가' },
  ESFP: { emoji: '🎭', label: '연예인', description: '자발적이고 열정적인 연기자' },
};

interface OnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedMBTI, setSelectedMBTI] = useState<MBTIType | ''>('');
  const [birthInfo, setBirthInfo] = useState<Partial<SajuInput>>({
    gender: 'male',
    birthYear: undefined,
    birthMonth: undefined,
    birthDay: undefined,
    birthHour: undefined,
  });
  const [saving, setSaving] = useState(false);

  const totalSteps = 4;

  // Save partial data when skipping
  const handleSkip = async () => {
    if (!user?.uid || !firestore) {
      onSkip?.();
      return;
    }

    try {
      setSaving(true);

      // Save whatever data we have collected
      const prefsToSave: any = {};
      if (selectedMBTI) prefsToSave.mbti = selectedMBTI;
      if (birthInfo.birthYear) {
        prefsToSave.birthInfo = {
          gender: birthInfo.gender || 'male',
          birthYear: birthInfo.birthYear,
          birthMonth: birthInfo.birthMonth || 1,
          birthDay: birthInfo.birthDay || 1,
          birthHour: birthInfo.birthHour || 0,
        };
      }

      if (Object.keys(prefsToSave).length > 0) {
        await preferencesService.save(user.uid, prefsToSave);
      }

      // Mark onboarding as skipped (partial completion)
      const profileRef = doc(firestore, 'users', user.uid, 'profile', 'default');
      await setDoc(profileRef, {
        onboardingCompleted: true,
        onboardingSkipped: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      toast.success('나중에 프로필에서 정보를 입력할 수 있어요');
      onSkip?.();
    } catch (error) {
      console.error('Failed to save partial data:', error);
      onSkip?.();
    } finally {
      setSaving(false);
    }
  };

  // Complete onboarding and save all data
  const handleComplete = async () => {
    if (!user?.uid || !firestore) {
      onComplete();
      return;
    }

    try {
      setSaving(true);

      // Save preferences
      const prefsToSave: any = {};
      if (selectedMBTI) prefsToSave.mbti = selectedMBTI;
      if (birthInfo.birthYear) {
        prefsToSave.birthInfo = {
          gender: birthInfo.gender || 'male',
          birthYear: birthInfo.birthYear,
          birthMonth: birthInfo.birthMonth || 1,
          birthDay: birthInfo.birthDay || 1,
          birthHour: birthInfo.birthHour || 0,
        };
      }

      if (Object.keys(prefsToSave).length > 0) {
        await preferencesService.save(user.uid, prefsToSave);
      }

      // Mark onboarding as completed
      const profileRef = doc(firestore, 'users', user.uid, 'profile', 'default');
      await setDoc(profileRef, {
        onboardingCompleted: true,
        onboardingSkipped: false,
        mbtiType: selectedMBTI || '',
        gender: birthInfo.gender || '',
        birthYear: birthInfo.birthYear || null,
        birthMonth: birthInfo.birthMonth || null,
        birthDay: birthInfo.birthDay || null,
        birthHour: birthInfo.birthHour || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      toast.success('환영합니다! 이제 시작할 준비가 되었어요');
      onComplete();
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      toast.error('정보 저장에 실패했습니다');
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Request notification permissions
  const handleNotificationRequest = async () => {
    try {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        const pushGranted = await notificationService.requestPushPermissions();
        if (pushGranted) {
          toast.success('알림 권한이 허용되었습니다');
        }
      } else {
        toast('알림을 거부하셨어요. 나중에 설정에서 변경할 수 있습니다', { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
    handleNext();
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  const goToStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-100 via-pink-50 to-amber-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-lg min-h-screen flex flex-col">
        {/* Header with Skip Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-royal-gold" />
            <span className="font-semibold text-gray-800">Fortune & MBTI</span>
          </div>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="text-pastel-brown hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-pastel-brown font-medium">
              {step}/{totalSteps}
            </span>
            <span className="text-sm text-pastel-brown">
              {Math.round((step / totalSteps) * 100)}% 완료
            </span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-royal-gold to-amber-500"
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {/* Step 1: Welcome */}
              {step === 1 && (
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="inline-block mb-6"
                  >
                    <Sparkles className="w-20 h-20 text-royal-gold" />
                  </motion.div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    환영합니다!
                  </h1>
                  <p className="text-lg text-pastel-brown mb-8">
                    Fortune & MBTI는 사주와 성격 유형을 결합하여<br />
                    당신만의 운명을 찾아드립니다
                  </p>

                  <GlassCard className="mb-6 text-left">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-1">사주 분석</h3>
                          <p className="text-sm text-pastel-brown">
                            생년월일시로 오행 분포와 운세 확인
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-1">MBTI 궁합</h3>
                          <p className="text-sm text-pastel-brown">
                            나와 상대방의 찰떡궁합 분석
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-1">운명 캐릭터</h3>
                          <p className="text-sm text-pastel-brown">
                            MBTI와 사주가 만난 나만의 캐릭터
                          </p>
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  <p className="text-sm text-pastel-brown">
                    간단한 정보를 입력하면 바로 시작할 수 있어요
                  </p>
                </div>
              )}

              {/* Step 2: MBTI Selection */}
              {step === 2 && (
                <div>
                  <div className="text-center mb-6">
                    <Heart className="w-16 h-16 text-royal-gold mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      MBTI 유형
                    </h2>
                    <p className="text-pastel-brown">
                      나의 성격 유형을 선택해주세요
                    </p>
                  </div>

                  {selectedMBTI && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mb-6"
                    >
                      <GlassCard className="text-center bg-gradient-to-br from-royal-gold/20 to-amber-100/30">
                        <span className="text-5xl mb-2 block">
                          {MBTI_INFO[selectedMBTI].emoji}
                        </span>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                          {selectedMBTI}
                        </h3>
                        <p className="text-royal-gold font-semibold mb-1">
                          {MBTI_INFO[selectedMBTI].label}
                        </p>
                        <p className="text-sm text-pastel-brown">
                          {MBTI_INFO[selectedMBTI].description}
                        </p>
                      </GlassCard>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {MBTI_TYPES.map((type) => (
                      <motion.button
                        key={type}
                        onClick={() => setSelectedMBTI(type)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-3 rounded-xl transition-all ${
                          selectedMBTI === type
                            ? 'bg-gradient-to-br from-royal-gold to-amber-500 text-white shadow-lg'
                            : 'bg-white/50 text-gray-700 hover:bg-white/70'
                        }`}
                      >
                        <div className="text-2xl mb-1">{MBTI_INFO[type].emoji}</div>
                        <div className="text-xs font-semibold">{type}</div>
                      </motion.button>
                    ))}
                  </div>

                  <p className="text-xs text-center text-pastel-brown">
                    MBTI를 모르신다면 건너뛰고 나중에 입력하세요
                  </p>
                </div>
              )}

              {/* Step 3: Birth Information */}
              {step === 3 && (
                <div>
                  <div className="text-center mb-6">
                    <Calendar className="w-16 h-16 text-royal-gold mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      생년월일시
                    </h2>
                    <p className="text-pastel-brown">
                      사주 분석을 위한 정보를 입력해주세요
                    </p>
                  </div>

                  <GlassCard>
                    <div className="space-y-4">
                      {/* Gender */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          성별
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setBirthInfo({ ...birthInfo, gender: 'male' })}
                            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                              birthInfo.gender === 'male'
                                ? 'bg-royal-gold text-white shadow-md'
                                : 'bg-white/50 text-pastel-brown'
                            }`}
                          >
                            남성
                          </button>
                          <button
                            onClick={() => setBirthInfo({ ...birthInfo, gender: 'female' })}
                            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                              birthInfo.gender === 'female'
                                ? 'bg-royal-gold text-white shadow-md'
                                : 'bg-white/50 text-pastel-brown'
                            }`}
                          >
                            여성
                          </button>
                        </div>
                      </div>

                      {/* Birth Year */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          출생년도
                        </label>
                        <input
                          type="number"
                          value={birthInfo.birthYear ?? ''}
                          onChange={(e) =>
                            setBirthInfo({
                              ...birthInfo,
                              birthYear: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          placeholder="예: 1990"
                          min={1920}
                          max={2025}
                          className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/30
                                     focus:outline-none focus:ring-2 focus:ring-royal-gold
                                     text-gray-800 placeholder-gray-400"
                        />
                      </div>

                      {/* Birth Date */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            월
                          </label>
                          <input
                            type="number"
                            value={birthInfo.birthMonth ?? ''}
                            onChange={(e) =>
                              setBirthInfo({
                                ...birthInfo,
                                birthMonth: e.target.value ? parseInt(e.target.value) : undefined,
                              })
                            }
                            placeholder="1-12"
                            min={1}
                            max={12}
                            className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/30
                                       focus:outline-none focus:ring-2 focus:ring-royal-gold
                                       text-gray-800 placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            일
                          </label>
                          <input
                            type="number"
                            value={birthInfo.birthDay ?? ''}
                            onChange={(e) =>
                              setBirthInfo({
                                ...birthInfo,
                                birthDay: e.target.value ? parseInt(e.target.value) : undefined,
                              })
                            }
                            placeholder="1-31"
                            min={1}
                            max={31}
                            className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/30
                                       focus:outline-none focus:ring-2 focus:ring-royal-gold
                                       text-gray-800 placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {/* Birth Hour */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          출생 시간 (선택사항)
                        </label>
                        <input
                          type="number"
                          value={birthInfo.birthHour ?? ''}
                          onChange={(e) =>
                            setBirthInfo({
                              ...birthInfo,
                              birthHour: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          placeholder="0-23시"
                          min={0}
                          max={23}
                          className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/30
                                     focus:outline-none focus:ring-2 focus:ring-royal-gold
                                     text-gray-800 placeholder-gray-400"
                        />
                        <p className="text-xs text-pastel-brown mt-1">
                          정확한 사주 분석을 위해 출생 시간을 입력해주세요
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  <p className="text-xs text-center text-pastel-brown mt-4">
                    나중에 프로필에서 수정할 수 있어요
                  </p>
                </div>
              )}

              {/* Step 4: Notification Permission */}
              {step === 4 && (
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block mb-6"
                  >
                    <Bell className="w-20 h-20 text-royal-gold" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    알림 허용
                  </h2>
                  <p className="text-lg text-pastel-brown mb-8">
                    매일 아침 당신만의 운세를<br />
                    알림으로 받아보세요
                  </p>

                  <GlassCard className="mb-6 text-left">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-royal-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-1">일일 운세</h3>
                          <p className="text-sm text-pastel-brown">
                            매일 아침 9시, 나만의 운세 메시지
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-royal-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-1">중요한 날짜</h3>
                          <p className="text-sm text-pastel-brown">
                            운세가 좋은 날을 놓치지 마세요
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-royal-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-1">맞춤 알림</h3>
                          <p className="text-sm text-pastel-brown">
                            내 MBTI와 사주에 맞춘 조언
                          </p>
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  <p className="text-sm text-pastel-brown">
                    설정에서 언제든지 변경할 수 있습니다
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 space-y-3">
          {step === 4 ? (
            <>
              <motion.button
                onClick={handleNotificationRequest}
                disabled={saving}
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                className="w-full py-4 rounded-2xl font-semibold text-white
                           bg-gradient-to-r from-royal-gold to-amber-500
                           shadow-lg hover:shadow-xl transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                <Bell className="w-5 h-5" />
                <span>알림 허용하기</span>
              </motion.button>
              <button
                onClick={handleNext}
                disabled={saving}
                className="w-full py-4 rounded-2xl font-semibold text-gray-700
                           bg-white/50 hover:bg-white/70 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                나중에 설정하기
              </button>
            </>
          ) : (
            <motion.button
              onClick={handleNext}
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              className="w-full py-4 rounded-2xl font-semibold text-white
                         bg-gradient-to-r from-royal-gold to-amber-500
                         shadow-lg hover:shadow-xl transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              <span>{step === totalSteps ? '완료' : '다음'}</span>
              {step < totalSteps && <ChevronRight className="w-5 h-5" />}
            </motion.button>
          )}

          {step > 1 && (
            <button
              onClick={handleBack}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-semibold text-gray-700
                         bg-white/50 hover:bg-white/70 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>이전</span>
            </button>
          )}

          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-3 text-pastel-brown hover:text-gray-800
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}
