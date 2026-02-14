'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DdayCounter from '@/components/DdayCounter';
import { BannerAd, ClickAd } from '@/components/AdBanner';

export default function DashboardPage() {
  const { user, couple, partner, token } = useAuth();
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  const [recentTodos, setRecentTodos] = useState<any[]>([]);
  const [petInfo, setPetInfo] = useState<any>(null);
  const [questionStatus, setQuestionStatus] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const now = new Date();

    // Fetch today's events
    fetch(`/api/events?year=${now.getFullYear()}&month=${now.getMonth() + 1}`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.events) {
          const today = now.toISOString().split('T')[0];
          setTodayEvents(
            data.events.filter((e: any) => e.date.split('T')[0] === today).slice(0, 3)
          );
        }
      })
      .catch(() => {});

    // Fetch recent todos
    fetch('/api/todos', { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.todos) {
          setRecentTodos(data.todos.filter((t: any) => !t.completed).slice(0, 3));
        }
      })
      .catch(() => {});

    // Fetch pet info
    fetch('/api/pet', { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.pet) setPetInfo(data.pet);
      })
      .catch(() => {});

    // Fetch question status
    fetch('/api/questions', { headers })
      .then((r) => r.json())
      .then((data) => {
        setQuestionStatus(data);
      })
      .catch(() => {});
  }, [token]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return '좋은 밤이에요';
    if (h < 12) return '좋은 아침이에요';
    if (h < 18) return '좋은 오후에요';
    return '좋은 저녁이에요';
  })();

  return (
    <div className="px-4 pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{greeting}</p>
          <h1 className="text-xl font-bold text-gray-800">{user?.nickname}님 💕</h1>
        </div>
        <Link
          href="/dashboard/settings"
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
        >
          ⚙️
        </Link>
      </div>

      {/* D-Day Counter */}
      <DdayCounter />

      {/* Daily Question Card */}
      {questionStatus && (
        <Link href="/dashboard/questions" className="block">
          <div className={`card ${!questionStatus.myAnswer ? 'bg-gradient-to-r from-primary-50 to-pastel-lavender/30 border border-primary-100' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">💌</span>
                  <span className="text-xs font-medium text-primary-400">
                    {!questionStatus.myAnswer ? '오늘의 질문이 도착했어요!' : questionStatus.bothAnswered ? '답변 완료' : '상대방 답변 대기 중'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {questionStatus.question?.text}
                </p>
              </div>
              <span className="text-gray-300 text-sm ml-2">›</span>
            </div>
          </div>
        </Link>
      )}

      {/* Pet Mini Card */}
      {petInfo && (
        <Link href="/dashboard/pet" className="block">
          <div className="card bg-gradient-to-r from-pastel-cream to-pastel-mint/30">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{
                { bunny: '🐰', cat: '🐱', dog: '🐶', bear: '🧸' }[petInfo.species as string] || '🐰'
              }</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700">{petInfo.name}</span>
                  <span className="text-xs text-primary-400">Lv.{petInfo.level}</span>
                </div>
                <div className="h-1.5 bg-white rounded-full mt-1 overflow-hidden w-24">
                  <div
                    className="h-full bg-gradient-to-r from-primary-300 to-primary-400 rounded-full"
                    style={{ width: `${petInfo.expProgress || 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {{happy: '행복해요!', normal: '평범해요', sad: '슬퍼요...', love: '사랑에 빠졌어요!', sulky: '서운해요...'}[petInfo.mood as string] || ''}
                </p>
              </div>
              <span className="text-gray-300 text-sm">›</span>
            </div>
          </div>
        </Link>
      )}

      {/* Banner Ad */}
      <BannerAd />

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { href: '/dashboard/calendar', icon: '📅', label: '캘린더' },
          { href: '/dashboard/todos', icon: '✅', label: '할 일' },
          { href: '/dashboard/album', icon: '📸', label: '앨범' },
          { href: '/dashboard/shop', icon: '🛍️', label: '샵' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card flex flex-col items-center gap-1 py-4 hover:shadow-md transition-shadow relative"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs text-gray-500">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Today's Events */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-700">오늘의 일정</h2>
          <Link href="/dashboard/calendar" className="text-xs text-primary-400">전체보기 ›</Link>
        </div>
        {todayEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">오늘 등록된 일정이 없어요</p>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div key={event._id} className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: event.color }} />
                <div>
                  <p className="text-sm font-medium text-gray-700">{event.title}</p>
                  {event.description && (
                    <p className="text-xs text-gray-400">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Todos */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-700">할 일 목록</h2>
          <Link href="/dashboard/todos" className="text-xs text-primary-400">전체보기 ›</Link>
        </div>
        {recentTodos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">완료하지 않은 할 일이 없어요</p>
        ) : (
          <div className="space-y-2">
            {recentTodos.map((todo) => (
              <div key={todo._id} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-primary-300 flex-shrink-0" />
                <p className="text-sm text-gray-600">{todo.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click Ad */}
      <ClickAd />

      <div className="bottom-nav-spacer" />
    </div>
  );
}
