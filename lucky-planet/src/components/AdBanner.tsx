'use client';

/**
 * 광고 배너 자리표시자
 *
 * 실제 구글 애드센스/애드몹 적용 시:
 * 1. Google AdSense 계정에서 광고 단위 생성
 * 2. data-ad-client, data-ad-slot 값을 교체
 * 3. layout.tsx에 AdSense 스크립트 추가:
 *    <Script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX" crossOrigin="anonymous" />
 *
 * 모바일(Capacitor) 환경에서는 AdMob 플러그인 사용:
 * npm install @capacitor-community/admob
 */

interface AdBannerProps {
  type?: 'banner' | 'rectangle';
}

export default function AdBanner({ type = 'banner' }: AdBannerProps) {
  const height = type === 'banner' ? 'h-[60px]' : 'h-[250px]';

  return (
    <div
      className={`${height} w-full bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center overflow-hidden`}
    >
      <div className="text-center">
        <p className="text-[10px] text-gray-300 font-medium tracking-wide">ADVERTISEMENT</p>
        <p className="text-[9px] text-gray-300 mt-0.5">광고 영역</p>
      </div>
    </div>
  );
}
