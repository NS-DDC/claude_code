'use client';

import { useState } from 'react';

interface Ad {
  id: string;
  title: string;
  description: string;
  imageColor: string;
  link: string;
}

const sampleAds: Ad[] = [
  {
    id: '1',
    title: '커플 여행 특가',
    description: '제주도 2박 3일 패키지 50% 할인',
    imageColor: 'from-pink-200 to-rose-300',
    link: '#',
  },
  {
    id: '2',
    title: '기념일 선물 추천',
    description: '특별한 날을 위한 맞춤 선물',
    imageColor: 'from-purple-200 to-indigo-300',
    link: '#',
  },
  {
    id: '3',
    title: '커플 사진관',
    description: '전문 스튜디오 촬영 20% 할인',
    imageColor: 'from-amber-200 to-orange-300',
    link: '#',
  },
];

export function BannerAd() {
  const [currentAd] = useState(() => sampleAds[Math.floor(Math.random() * sampleAds.length)]);

  const handleClick = () => {
    console.log(`Ad clicked: ${currentAd.id} - ${currentAd.title}`);
    // In production: track click event and redirect
  };

  return (
    <div
      onClick={handleClick}
      className={`card cursor-pointer bg-gradient-to-r ${currentAd.imageColor} border-0 overflow-hidden relative`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-white/70 mb-1">AD</p>
          <p className="font-bold text-white">{currentAd.title}</p>
          <p className="text-sm text-white/80 mt-0.5">{currentAd.description}</p>
        </div>
        <span className="text-3xl opacity-80">🎁</span>
      </div>
    </div>
  );
}

export function ClickAd() {
  const handleClick = () => {
    console.log('Click ad triggered');
    // In production: open ad link, track click
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-200 to-primary-300 flex items-center justify-center text-sm">
          AD
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">오늘의 데이트 추천</p>
          <p className="text-xs text-gray-400">주변 맛집 & 카페 찾기</p>
        </div>
      </div>
      <span className="text-gray-300 text-sm">›</span>
    </div>
  );
}
