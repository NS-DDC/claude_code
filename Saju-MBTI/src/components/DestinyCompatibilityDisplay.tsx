'use client';

import { motion } from 'framer-motion';
import { DestinyCompatibilityResult, Element } from '@/types';
import { Heart, MapPin, Clock, TrendingUp, Users } from 'lucide-react';

interface DestinyCompatibilityDisplayProps {
  result: DestinyCompatibilityResult;
}

const ELEMENT_COLORS: Record<Element, string> = {
  '목': 'text-green-600',
  '화': 'text-red-600',
  '토': 'text-yellow-600',
  '금': 'text-gray-600',
  '수': 'text-blue-600'
};

const COMPATIBILITY_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  '천생연분': { bg: 'bg-gradient-to-r from-pink-400 to-rose-500', text: 'text-white', icon: '💖' },
  '애증의 소울메이트': { bg: 'bg-gradient-to-r from-purple-400 to-indigo-500', text: 'text-white', icon: '⚡' },
  '정신적 동반자': { bg: 'bg-gradient-to-r from-blue-400 to-cyan-500', text: 'text-white', icon: '🤝' },
  '비즈니스 파트너': { bg: 'bg-gradient-to-r from-gray-400 to-slate-500', text: 'text-white', icon: '💼' }
};

export default function DestinyCompatibilityDisplay({ result }: DestinyCompatibilityDisplayProps) {
  const compatColor = COMPATIBILITY_TYPE_COLORS[result.compatibilityType];

  return (
    <div className="space-y-6">
      {/* Character Cards Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        {/* My Character */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/30 backdrop-blur-md rounded-xl p-4 border border-white/20"
        >
          <div className="text-center">
            <div className="text-5xl mb-2">{result.myCharacter.emoji}</div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">
              {result.myCharacter.name}
            </h3>
            <div className="flex flex-wrap justify-center gap-1 text-xs">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                {result.myCharacter.mbti}
              </span>
              <span className={`px-2 py-1 bg-white/50 rounded-full ${ELEMENT_COLORS[result.myCharacter.element]}`}>
                {result.myCharacter.element}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Partner Character */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/30 backdrop-blur-md rounded-xl p-4 border border-white/20"
        >
          <div className="text-center">
            <div className="text-5xl mb-2">{result.partnerCharacter.emoji}</div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">
              {result.partnerCharacter.name}
            </h3>
            <div className="flex flex-wrap justify-center gap-1 text-xs">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                {result.partnerCharacter.mbti}
              </span>
              <span className={`px-2 py-1 bg-white/50 rounded-full ${ELEMENT_COLORS[result.partnerCharacter.element]}`}>
                {result.partnerCharacter.element}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Animated Heart Between Cards */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, times: [0, 0.6, 1] }}
        className="text-center -my-2"
      >
        <Heart className="w-12 h-12 mx-auto text-pink-500 fill-pink-500" />
      </motion.div>

      {/* Total Score */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        className={`${compatColor.bg} rounded-2xl p-6 text-center shadow-xl`}
      >
        <div className="text-6xl mb-2">
          {compatColor.icon}
        </div>
        <h2 className={`text-3xl font-bold ${compatColor.text} mb-2`}>
          {result.totalScore}점
        </h2>
        <p className={`text-xl font-semibold ${compatColor.text} mb-2`}>
          {result.compatibilityType}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-white/90">
          <TrendingUp className="w-4 h-4" />
          <span>궁합도 {result.totalScore >= 90 ? '최상' : result.totalScore >= 70 ? '상' : result.totalScore >= 50 ? '중' : '하'}</span>
        </div>
      </motion.div>

      {/* Score Breakdown */}
      <div className="bg-white/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          궁합 분석
        </h3>

        <div className="space-y-4">
          {/* MBTI Score */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700">MBTI 궁합</span>
              <span className="font-semibold text-purple-700">{result.mbtiScore}점</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.mbtiScore}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full"
              />
            </div>
          </div>

          {/* Element Score */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700">오행 궁합</span>
              <span className="font-semibold text-indigo-700">{result.elementScore}점</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.elementScore}%` }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-full rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 p-4 bg-white/50 rounded-lg">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {result.description}
          </p>
        </div>
      </div>

      {/* Location Recommendations */}
      {result.locationRecommendations && result.locationRecommendations.length > 0 && (
        <div className="bg-white/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-500" />
            추천 데이트 장소
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {result.locationRecommendations.map((location, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-3 text-center border border-rose-200"
              >
                <span className="text-sm text-gray-700">{location}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Best Meeting Times */}
      {result.bestMeetingTimes && result.bestMeetingTimes.length > 0 && (
        <div className="bg-white/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            최적의 만남 시간
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.bestMeetingTimes.map((time, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * idx }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-full px-4 py-2 border border-blue-200"
              >
                <span className="text-sm text-gray-700">{time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
