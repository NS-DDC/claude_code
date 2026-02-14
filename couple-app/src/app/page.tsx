'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user, couple, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(couple ? '/dashboard' : '/invite');
    }
  }, [user, couple, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-heartbeat text-5xl">💕</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-slide-up">
          <div className="text-7xl mb-6 animate-heartbeat">💑</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Love<span className="text-primary-400">Day</span>
          </h1>
          <p className="text-lg text-gray-500 mb-2">우리만의 특별한 공간</p>
          <p className="text-sm text-gray-400 mb-10 max-w-xs mx-auto">
            소중한 사람과 일정을 공유하고, 추억을 기록하고, 매일매일 사랑을 나눠보세요.
          </p>

          <div className="space-y-3 w-full max-w-xs mx-auto">
            <Link href="/register" className="btn-primary block w-full text-center">
              시작하기
            </Link>
            <Link href="/login" className="btn-secondary block w-full text-center">
              로그인
            </Link>
          </div>
        </div>

        {/* Features preview */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-sm animate-fade-in">
          {[
            { icon: '📅', label: '공유 캘린더' },
            { icon: '💬', label: '커플 채팅' },
            { icon: '📸', label: '사진 앨범' },
            { icon: '✅', label: '투두리스트' },
            { icon: '❤️', label: 'D-Day' },
            { icon: '🔔', label: '알림' },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/60">
              <span className="text-2xl">{f.icon}</span>
              <span className="text-xs text-gray-500">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        LoveDay &copy; 2024
      </footer>
    </div>
  );
}
