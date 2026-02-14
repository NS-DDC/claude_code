'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import BottomNav from '@/components/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, couple, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!couple) {
        router.push('/invite');
      }
    }
  }, [user, couple, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-heartbeat text-5xl">💕</div>
      </div>
    );
  }

  if (!user || !couple) return null;

  return (
    <div className="page-container pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
