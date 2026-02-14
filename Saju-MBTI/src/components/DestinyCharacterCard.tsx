'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DestinyCharacter, Element } from '@/types';
import { Star, Heart, AlertCircle, Sparkles } from 'lucide-react';

interface DestinyCharacterCardProps {
  character: DestinyCharacter;
  showFlipHint?: boolean;
}

const ELEMENT_COLORS: Record<Element, { bg: string; border: string; text: string }> = {
  '목': { bg: 'bg-gradient-to-br from-green-400/30 to-emerald-500/30', border: 'border-green-500', text: 'text-green-700' },
  '화': { bg: 'bg-gradient-to-br from-red-400/30 to-rose-500/30', border: 'border-red-500', text: 'text-red-700' },
  '토': { bg: 'bg-gradient-to-br from-yellow-400/30 to-amber-500/30', border: 'border-yellow-600', text: 'text-yellow-700' },
  '금': { bg: 'bg-gradient-to-br from-gray-300/30 to-slate-400/30', border: 'border-gray-500', text: 'text-gray-700' },
  '수': { bg: 'bg-gradient-to-br from-blue-400/30 to-cyan-500/30', border: 'border-blue-500', text: 'text-blue-700' }
};

const ELEMENT_NAMES: Record<Element, string> = {
  '목': '木',
  '화': '火',
  '토': '土',
  '금': '金',
  '수': '水'
};

export default function DestinyCharacterCard({ character, showFlipHint = true }: DestinyCharacterCardProps) {
  const [showFront, setShowFront] = useState(true);
  const elementColor = ELEMENT_COLORS[character.element];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative mb-6"
    >
      {showFlipHint && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-600 mb-2"
        >
          카드를 클릭하여 뒤집어보세요 ✨
        </motion.p>
      )}

      <motion.div
        className="relative cursor-pointer"
        style={{ perspective: 1000 }}
        onClick={() => setShowFront(!showFront)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="relative w-full"
          initial={false}
          animate={{ rotateY: showFront ? 0 : 180 }}
          transition={{ duration: 0.6 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of Card */}
          <div
            className={`${elementColor.bg} backdrop-blur-md rounded-2xl shadow-xl border-2 ${elementColor.border} p-6`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            {/* Badges */}
            <div className="flex gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/50 ${elementColor.text}`}>
                {ELEMENT_NAMES[character.element]} {character.element}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/50 text-purple-700">
                {character.mbti}
              </span>
            </div>

            {/* Character Emoji and Name */}
            <div className="text-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-7xl mb-3"
              >
                {character.emoji}
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {character.name}
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                {character.description}
              </p>
            </div>

            {/* Category Badge */}
            <div className="flex justify-center">
              <span className="px-4 py-2 rounded-full text-xs font-semibold bg-white/60 text-gray-700 capitalize">
                {character.category === 'analyst' && '분석가'}
                {character.category === 'diplomat' && '외교관'}
                {character.category === 'sentinel' && '관리자'}
                {character.category === 'explorer' && '탐험가'}
              </span>
            </div>

            {/* Flip hint */}
            <div className="text-center mt-4 text-xs text-gray-600 opacity-70">
              카드를 탭하여 자세히 보기 →
            </div>
          </div>

          {/* Back of Card */}
          <div
            className={`absolute top-0 left-0 w-full ${elementColor.bg} backdrop-blur-md rounded-2xl shadow-xl border-2 ${elementColor.border} p-6`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="space-y-4">
              {/* Strengths */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-bold text-gray-800">강점</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {character.strengths.map((strength, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/60 rounded-full text-xs text-gray-700"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-gray-800">약점</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {character.weaknesses.map((weakness, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/60 rounded-full text-xs text-gray-700"
                    >
                      {weakness}
                    </span>
                  ))}
                </div>
              </div>

              {/* Charm Points */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-pink-600" />
                  <h3 className="font-bold text-gray-800">매력 포인트</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {character.charmPoints.map((charm, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/60 rounded-full text-xs text-gray-700"
                    >
                      {charm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Character Info */}
              <div className="pt-2 border-t border-white/30">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">{character.name}</span>
                  <span>({character.mbti}/{character.element})</span>
                </div>
              </div>
            </div>

            {/* Flip hint */}
            <div className="text-center mt-4 text-xs text-gray-600 opacity-70">
              ← 카드를 다시 탭하여 돌아가기
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
