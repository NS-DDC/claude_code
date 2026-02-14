'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashWrapper({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 세션 중 이미 본 경우 스킵
    const seen = sessionStorage.getItem('splash_seen');
    if (seen) {
      setShowSplash(false);
    }
  }, []);

  const handleFinish = useCallback(() => {
    sessionStorage.setItem('splash_seen', '1');
    setShowSplash(false);
  }, []);

  // SSR 중에는 children만 렌더
  if (!mounted) return <>{children}</>;

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleFinish} />}
      <div className={showSplash ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        {children}
      </div>
    </>
  );
}
