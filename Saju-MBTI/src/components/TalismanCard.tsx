'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles } from 'lucide-react';
import { DestinyCharacter } from '@/types';
import {
  getTalismanImagePath,
  talismanImageExists,
  generateTalismanDataURL
} from '@/lib/talismanSvg';

interface TalismanCardProps {
  character: DestinyCharacter;
}

export default function TalismanCard({ character }: TalismanCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [imageSource, setImageSource] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [useSVG, setUseSVG] = useState(false);

  useEffect(() => {
    loadTalismanImage();
  }, [character.mbti, character.element]);

  const loadTalismanImage = async () => {
    setIsLoading(true);

    // Try to load PNG image first
    const imagePath = getTalismanImagePath(character.mbti, character.element);
    const exists = await talismanImageExists(character.mbti, character.element);

    if (exists) {
      setImageSource(imagePath);
      setUseSVG(false);
    } else {
      // Fallback to SVG
      const svgDataURL = generateTalismanDataURL(
        character.mbti,
        character.element,
        character.emoji,
        character.name
      );
      setImageSource(svgDataURL);
      setUseSVG(true);
    }

    setIsLoading(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageSource;
    link.download = `talisman_${character.mbti}_${character.element}.${useSVG ? 'svg' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Talisman Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        행운 부적 보기
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>

              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  행운 부적
                </h2>
                <p className="text-sm text-gray-600">
                  {character.name} ({character.mbti}/{character.element})
                </p>
              </div>

              {/* Talisman Image */}
              <div className="mb-6 flex justify-center">
                {isLoading ? (
                  <div className="w-64 h-96 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    src={imageSource}
                    alt={`${character.name} 부적`}
                    className="w-64 h-96 object-contain rounded-lg shadow-lg"
                  />
                )}
              </div>

              {/* Info */}
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-700 text-center">
                  이 부적은 {character.name}의 행운을 담고 있습니다.
                  다운로드하여 배경화면이나 프로필로 사용하세요!
                </p>
              </div>

              {/* Download Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                부적 다운로드
              </motion.button>

              {useSVG && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  * SVG 형식으로 제공됩니다
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
