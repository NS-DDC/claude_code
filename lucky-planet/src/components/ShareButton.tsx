'use client';

import { Share2, MessageCircle, Copy, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { shareLottoNumbers } from '@/lib/kakao';

const LINE_LABELS = ['A', 'B', 'C', 'D', 'E'];

interface ShareButtonProps {
  numberSets: number[][];
}

function formatShareText(sets: number[][]): string {
  if (sets.length === 1) {
    return `오늘의 행운 번호: ${sets[0].join(', ')}`;
  }
  return sets
    .map((nums, i) => `${LINE_LABELS[i]}: ${nums.join(', ')}`)
    .join('\n');
}

export default function ShareButton({ numberSets }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKakaoShare = () => {
    // 카카오 공유는 첫 번째 줄 기반
    shareLottoNumbers(numberSets[0]);
    setShowMenu(false);
  };

  const handleCopy = async () => {
    const text = `🍀 로또 번호 추출기\n${formatShareText(numberSets)}\nhttps://luckyplanet.app`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '로또 번호 추출기',
          text: formatShareText(numberSets),
          url: 'https://luckyplanet.app',
        });
      } catch {
        // 사용자 취소
      }
    }
    setShowMenu(false);
  };

  return (
    <div className="relative flex-1" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-full py-3 bg-white/60 text-gray-600 border border-white/30 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-white/80 transition-all"
      >
        <Share2 size={16} />
        공유하기
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 right-0 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden z-50"
          >
            <button
              onClick={handleKakaoShare}
              className="w-full px-4 py-3 text-sm text-left flex items-center gap-3 hover:bg-yellow-50 transition-colors"
            >
              <div className="w-8 h-8 bg-[#FEE500] rounded-lg flex items-center justify-center">
                <MessageCircle size={16} className="text-[#391B1B]" />
              </div>
              카카오톡 공유
            </button>
            <button
              onClick={handleCopy}
              className="w-full px-4 py-3 text-sm text-left flex items-center gap-3 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500" />}
              </div>
              {copied ? '복사됨!' : '번호 복사'}
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-full px-4 py-3 text-sm text-left flex items-center gap-3 hover:bg-gray-50 transition-colors border-t border-gray-100"
              >
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Share2 size={16} className="text-blue-500" />
                </div>
                다른 앱으로 공유
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
