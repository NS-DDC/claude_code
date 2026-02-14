'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    // 등장 애니메이션
    const enterTimer = setTimeout(() => setPhase('show'), 100);
    // 퇴장 시작
    const exitTimer = setTimeout(() => setPhase('exit'), 2200);
    // 완전히 사라짐
    const finishTimer = setTimeout(() => onFinish(), 2900);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #FFB6C1 0%, #F37896 30%, #FF6B9D 60%, #C084FC 100%)',
      }}
    >
      {/* 배경 하트 파티클 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-heart text-white/20"
            style={{
              left: `${8 + (i * 7.5) % 85}%`,
              top: `${10 + (i * 13) % 75}%`,
              fontSize: `${14 + (i % 4) * 8}px`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          >
            ♥
          </div>
        ))}
      </div>

      {/* 원형 글로우 */}
      <div
        className={`absolute w-64 h-64 rounded-full transition-all duration-1000 ${
          phase === 'enter' ? 'scale-0 opacity-0' : 'scale-100 opacity-30'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
        }}
      />

      {/* 메인 하트 아이콘 */}
      <div
        className={`relative transition-all duration-700 ease-out ${
          phase === 'enter'
            ? 'scale-0 opacity-0 rotate-[-20deg]'
            : 'scale-100 opacity-100 rotate-0'
        }`}
      >
        <div className="text-8xl animate-splash-heart drop-shadow-2xl">
          💕
        </div>
        {/* 하트 주변 반짝이 */}
        <div className="absolute -top-2 -right-2 text-2xl animate-sparkle">✨</div>
        <div className="absolute -bottom-1 -left-3 text-xl animate-sparkle" style={{ animationDelay: '0.5s' }}>✨</div>
        <div className="absolute top-0 -left-6 text-lg animate-sparkle" style={{ animationDelay: '1s' }}>💫</div>
      </div>

      {/* 앱 이름 */}
      <div
        className={`mt-8 transition-all duration-700 delay-300 ${
          phase === 'enter'
            ? 'translate-y-8 opacity-0'
            : 'translate-y-0 opacity-100'
        }`}
      >
        <h1 className="text-5xl font-bold text-white drop-shadow-lg tracking-tight">
          Love<span className="text-yellow-200">Day</span>
        </h1>
      </div>

      {/* 서브 텍스트 */}
      <div
        className={`mt-4 transition-all duration-700 delay-500 ${
          phase === 'enter'
            ? 'translate-y-6 opacity-0'
            : 'translate-y-0 opacity-100'
        }`}
      >
        <p className="text-white/80 text-lg font-light tracking-widest">
          우리만의 특별한 공간
        </p>
      </div>

      {/* 로딩 도트 */}
      <div
        className={`mt-12 flex gap-2 transition-all duration-700 delay-700 ${
          phase === 'enter' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-white/60 animate-bounce-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      {/* 하단 텍스트 */}
      <div
        className={`absolute bottom-12 transition-all duration-700 delay-700 ${
          phase === 'enter' ? 'opacity-0' : 'opacity-60'
        }`}
      >
        <p className="text-white/50 text-xs tracking-wider">
          Made with ♥
        </p>
      </div>
    </div>
  );
}
