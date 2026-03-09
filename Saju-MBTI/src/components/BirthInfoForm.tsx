'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { MBTIType, SajuInput } from '@/types';
import { validateBirthInfo } from '@/lib/validation';
import { storage } from '@/lib/storage';

const MBTI_TYPES: MBTIType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

interface BirthInfoFormProps {
  showMBTI?: boolean;
  initialMBTI?: MBTIType;
  initialBirth?: SajuInput;
  onSubmit: (mbti: MBTIType, birth: SajuInput) => void;
  submitLabel?: string;
  submitGradient?: string;
  compact?: boolean;
  prefillFromProfile?: boolean;
}

export default function BirthInfoForm({
  showMBTI = true,
  initialMBTI,
  initialBirth,
  onSubmit,
  submitLabel = '분석하기',
  submitGradient = 'from-purple-500 to-pink-500',
  compact = false,
  prefillFromProfile = true
}: BirthInfoFormProps) {
  const [mbti, setMbti] = useState<MBTIType>(initialMBTI || 'INFP');
  const [birth, setBirth] = useState<SajuInput>(initialBirth || {
    gender: 'male',
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    birthHour: 12
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!prefillFromProfile) return;
    const profile = storage.getProfile();
    if (profile) {
      if (!initialMBTI) setMbti(profile.mbti);
      if (!initialBirth) setBirth(profile.birthInfo);
    }
  }, [prefillFromProfile, initialMBTI, initialBirth]);

  const handleSubmit = () => {
    const validation = validateBirthInfo(birth);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    onSubmit(mbti, birth);
  };

  return (
    <div className="space-y-4">
      {showMBTI && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">MBTI</label>
          <div className="grid grid-cols-4 gap-2">
            {MBTI_TYPES.map((type) => (
              <motion.button
                key={type}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMbti(type)}
                className={`py-${compact ? '1.5' : '2'} rounded-lg text-${compact ? 'xs' : 'sm'} font-semibold transition-all ${
                  mbti === type
                    ? `bg-gradient-to-br ${submitGradient} text-white shadow-md`
                    : 'bg-white/50 text-gray-600 hover:bg-white/70'
                }`}
              >
                {type}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">생년월일시</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">성별</label>
            <div className="flex gap-2">
              <button
                onClick={() => setBirth({ ...birth, gender: 'male' })}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  birth.gender === 'male'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/50 text-gray-600'
                }`}
              >
                남성
              </button>
              <button
                onClick={() => setBirth({ ...birth, gender: 'female' })}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  birth.gender === 'female'
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/50 text-gray-600'
                }`}
              >
                여성
              </button>
            </div>
            {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">년도</label>
            <input
              type="number"
              value={birth.birthYear}
              onChange={(e) => setBirth({ ...birth, birthYear: parseInt(e.target.value) || 0 })}
              className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="1990"
            />
            {errors.birthYear && <p className="text-xs text-red-500 mt-1">{errors.birthYear}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">월</label>
            <input
              type="number"
              min="1"
              max="12"
              value={birth.birthMonth}
              onChange={(e) => setBirth({ ...birth, birthMonth: parseInt(e.target.value) || 0 })}
              className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="1"
            />
            {errors.birthMonth && <p className="text-xs text-red-500 mt-1">{errors.birthMonth}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">일</label>
            <input
              type="number"
              min="1"
              max="31"
              value={birth.birthDay}
              onChange={(e) => setBirth({ ...birth, birthDay: parseInt(e.target.value) || 0 })}
              className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="1"
            />
            {errors.birthDay && <p className="text-xs text-red-500 mt-1">{errors.birthDay}</p>}
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-600 mb-1 block">시 (0-23)</label>
            <input
              type="number"
              min="0"
              max="23"
              value={birth.birthHour}
              onChange={(e) => setBirth({ ...birth, birthHour: parseInt(e.target.value) || 0 })}
              className="w-full p-2 rounded-lg bg-white/70 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="12"
            />
            {errors.birthHour && <p className="text-xs text-red-500 mt-1">{errors.birthHour}</p>}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        className={`w-full py-4 bg-gradient-to-r ${submitGradient} text-white rounded-xl font-semibold text-lg shadow-lg mt-2 flex items-center justify-center gap-2`}
      >
        {submitLabel}
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
