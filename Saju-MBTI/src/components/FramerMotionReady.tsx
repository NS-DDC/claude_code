'use client';

import { useEffect } from 'react';

/**
 * framer-motion이 로드된 후 body에 fm-ready 클래스를 추가
 * CSS에서 opacity:0 강제 override를 해제하여 정상 애니메이션 동작
 */
export default function FramerMotionReady() {
  useEffect(() => {
    // React가 정상적으로 hydrate되면 fm-ready 클래스 추가
    document.body.classList.add('fm-ready');
    return () => {
      document.body.classList.remove('fm-ready');
    };
  }, []);

  return null;
}
