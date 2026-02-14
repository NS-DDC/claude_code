'use client';

import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';

export default function DdayCounter() {
  const { couple, partner, user } = useAuth();

  const dday = useMemo(() => {
    if (!couple?.startDate) return null;
    const start = new Date(couple.startDate);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [couple?.startDate]);

  const nextAnniversary = useMemo(() => {
    if (!couple?.startDate) return null;
    const start = new Date(couple.startDate);
    const now = new Date();

    const milestones = [100, 200, 300, 365, 500, 730, 1000, 1095, 1461];
    const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    for (const m of milestones) {
      if (m > daysSinceStart) {
        const targetDate = new Date(start);
        targetDate.setDate(targetDate.getDate() + m - 1);
        return { days: m, daysLeft: m - daysSinceStart, date: targetDate };
      }
    }
    return null;
  }, [couple?.startDate]);

  if (!couple) return null;

  return (
    <div className="card bg-gradient-to-br from-primary-50 to-pastel-peach/30 border border-primary-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{couple.coupleTitle || '우리 커플'}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-primary-500">{dday}</span>
            <span className="text-lg text-primary-400">일째</span>
            <span className="animate-heartbeat inline-block ml-1">💕</span>
          </div>
          {nextAnniversary && (
            <p className="text-xs text-gray-400 mt-2">
              {nextAnniversary.days}일까지 <span className="text-primary-400 font-medium">D-{nextAnniversary.daysLeft}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-sm">
              {user?.nickname?.charAt(0) || '나'}
            </div>
            <span className="text-primary-300">❤️</span>
            <div className="w-10 h-10 rounded-full bg-warm-200 flex items-center justify-center text-sm">
              {partner?.nickname?.charAt(0) || '?'}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {user?.nickname} & {partner?.nickname || '...'}
          </p>
        </div>
      </div>
    </div>
  );
}
