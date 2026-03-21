'use client';

import { useState, useEffect } from 'react';
import { getDailyCard } from '@/lib/tarotCards';
import type { TarotCard } from '@/lib/tarotCards';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type Tab = 'basic' | 'love' | 'career';

export default function TarotPage() {
  const [hasDrawnToday, setHasDrawnToday] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCard, setCurrentCard] = useState<{ card: TarotCard; isReversed: boolean } | null>(null);
  const [yesterdayCard, setYesterdayCard] = useState<{ card: TarotCard; isReversed: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [showYesterday, setShowYesterday] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('tarot_date');
    if (stored === today) {
      setHasDrawnToday(true);
      setIsFlipped(true);
      const card = getDailyCard(today);
      setCurrentCard(card);
    } else {
      const card = getDailyCard(today);
      setCurrentCard(card);
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    setYesterdayCard(getDailyCard(yesterdayStr));
  }, []);

  function handleDraw() {
    if (hasDrawnToday || isFlipping) return;
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('tarot_date', today);
    setIsFlipping(true);
    setTimeout(() => {
      setIsFlipped(true);
      setHasDrawnToday(true);
      setIsFlipping(false);
    }, 700);
  }

  function handleShare() {
    if (!currentCard) return;
    const { card, isReversed } = currentCard;
    const text = `오늘의 타로 카드: ${card.emoji} ${card.name}${isReversed ? ' (역방향)' : ''}\n${isReversed ? card.reversedMeaning : card.uprightMeaning}`;
    if (navigator.share) {
      navigator.share({ title: '오늘의 타로', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success('클립보드에 복사되었습니다!')).catch(() => {});
    }
  }

  const displayCard = showYesterday ? yesterdayCard : currentCard;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0d0d2b 0%, #1a0040 50%, #0d0d2b 100%)' }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">✨ 오늘의 타로</h1>
          <p className="text-purple-300 text-sm">
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Yesterday toggle */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={() => setShowYesterday(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !showYesterday
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-purple-300 hover:bg-white/20'
            }`}
          >
            오늘의 카드
          </button>
          <button
            onClick={() => setShowYesterday(true)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              showYesterday
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-purple-300 hover:bg-white/20'
            }`}
          >
            어제의 카드 보기
          </button>
        </div>

        {/* Card area */}
        <div className="flex flex-col items-center gap-6">
          {/* 3D Flip Card */}
          <div
            style={{
              perspective: '1000px',
              width: '192px',
              height: '288px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.7s ease',
                transform: (isFlipped || showYesterday) ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Card Back */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, #1a1a4e, #4a0080)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(100, 0, 200, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  border: '2px solid rgba(150, 100, 255, 0.3)',
                }}
              >
                <div style={{ fontSize: '48px' }}>✨</div>
                <div style={{ fontSize: '24px', opacity: 0.5 }}>🌟</div>
                <div style={{ fontSize: '16px', color: 'rgba(200, 150, 255, 0.6)', letterSpacing: '4px' }}>• • •</div>
                <div
                  style={{
                    position: 'absolute',
                    inset: '8px',
                    border: '1px solid rgba(150, 100, 255, 0.2)',
                    borderRadius: '12px',
                    backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(100,50,200,0.2) 0%, transparent 70%)',
                  }}
                />
              </div>

              {/* Card Front */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: displayCard?.isReversed
                    ? 'linear-gradient(135deg, #2d0040, #000d2e)'
                    : 'linear-gradient(135deg, #1a0040, #0d2060)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(100, 0, 200, 0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '2px solid rgba(150, 100, 255, 0.5)',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: '64px',
                    transform: displayCard?.isReversed ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s',
                  }}
                >
                  {displayCard?.card.emoji}
                </div>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
                  {displayCard?.card.name}
                </div>
                <div style={{ color: 'rgba(180, 140, 255, 0.7)', fontSize: '11px' }}>
                  {displayCard?.card.nameEn}
                </div>
                {displayCard?.isReversed && (
                  <div
                    style={{
                      background: 'rgba(200, 0, 100, 0.3)',
                      border: '1px solid rgba(200, 50, 100, 0.5)',
                      borderRadius: '8px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      color: '#ff80b0',
                    }}
                  >
                    역방향
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Draw button */}
          {!showYesterday && (
            <button
              onClick={handleDraw}
              disabled={hasDrawnToday || isFlipping}
              style={{
                background: hasDrawnToday
                  ? 'rgba(100, 100, 120, 0.4)'
                  : 'linear-gradient(135deg, #7c3aed, #4c1d95)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '14px 36px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: hasDrawnToday ? 'default' : 'pointer',
                boxShadow: hasDrawnToday ? 'none' : '0 8px 30px rgba(124, 58, 237, 0.5)',
                transition: 'all 0.3s',
                opacity: isFlipping ? 0.7 : 1,
              }}
            >
              {hasDrawnToday ? '오늘 이미 뽑았습니다' : isFlipping ? '카드 뽑는 중...' : '🃏 카드 뽑기'}
            </button>
          )}
        </div>

        {/* Result panel */}
        {(isFlipped || showYesterday) && displayCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              marginTop: '32px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(150, 100, 255, 0.2)',
              borderRadius: '20px',
              overflow: 'hidden',
            }}
          >
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(150, 100, 255, 0.2)' }}>
              {(['basic', 'love', 'career'] as Tab[]).map((tab) => {
                const labels: Record<Tab, string> = { basic: '기본', love: '사랑', career: '커리어' };
                const icons: Record<Tab, string> = { basic: '✨', love: '💕', career: '💼' };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: activeTab === tab ? 700 : 400,
                      color: activeTab === tab ? '#c084fc' : 'rgba(200, 150, 255, 0.5)',
                      background: activeTab === tab ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: activeTab === tab ? '2px solid #c084fc' : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    {icons[tab]} {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div style={{ padding: '20px' }}>
              {activeTab === 'basic' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginBottom: '16px',
                    }}
                  >
                    {displayCard.card.keywords.map((kw) => (
                      <span
                        key={kw}
                        style={{
                          background: 'rgba(124, 58, 237, 0.3)',
                          border: '1px solid rgba(150, 100, 255, 0.4)',
                          borderRadius: '20px',
                          padding: '4px 12px',
                          fontSize: '12px',
                          color: '#c084fc',
                        }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                  <p style={{ color: 'rgba(220, 200, 255, 0.9)', lineHeight: 1.7, fontSize: '14px', marginBottom: '16px' }}>
                    {displayCard.isReversed ? displayCard.card.reversedMeaning : displayCard.card.uprightMeaning}
                  </p>
                  <div
                    style={{
                      background: 'rgba(100, 50, 200, 0.15)',
                      border: '1px solid rgba(150, 100, 255, 0.2)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                    }}
                  >
                    <p style={{ color: '#e9d5ff', fontSize: '13px', fontStyle: 'italic' }}>
                      💡 오늘의 조언: {displayCard.card.advice}
                    </p>
                  </div>
                </div>
              )}
              {activeTab === 'love' && (
                <p style={{ color: 'rgba(220, 200, 255, 0.9)', lineHeight: 1.7, fontSize: '14px' }}>
                  {displayCard.card.loveReading}
                </p>
              )}
              {activeTab === 'career' && (
                <p style={{ color: 'rgba(220, 200, 255, 0.9)', lineHeight: 1.7, fontSize: '14px' }}>
                  {displayCard.card.careerReading}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Share button */}
        {isFlipped && !showYesterday && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleShare}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(150, 100, 255, 0.3)',
                borderRadius: '50px',
                padding: '10px 28px',
                fontSize: '14px',
                color: '#c084fc',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🔗 결과 공유하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
