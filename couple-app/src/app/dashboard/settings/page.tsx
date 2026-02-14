'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user, couple, partner, token, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [coupleTitle, setCoupleTitle] = useState(couple?.coupleTitle || '');
  const [startDate, setStartDate] = useState(
    couple?.startDate ? new Date(couple.startDate).toISOString().split('T')[0] : ''
  );
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/couple', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ coupleTitle, startDate }),
      });
      if (res.ok) {
        await refreshUser();
        setEditing(false);
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async () => {
    if (!pushEnabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        // In production: register service worker and send subscription to server
      }
    } else {
      setPushEnabled(false);
    }
  };

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">⚙️ 설정</h1>

      {/* Profile Card */}
      <div className="card mb-4">
        <h2 className="font-bold text-gray-700 mb-3">내 프로필</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl">
            {user?.nickname?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-bold text-gray-700">{user?.nickname}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-300 mt-1">초대 코드: {user?.inviteCode}</p>
          </div>
        </div>
      </div>

      {/* Couple Info */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-700">커플 정보</h2>
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm text-primary-400 hover:text-primary-500"
          >
            {editing ? '취소' : '수정'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">커플 이름</label>
              <input
                type="text"
                className="input-field mt-1"
                value={coupleTitle}
                onChange={(e) => setCoupleTitle(e.target.value)}
                placeholder="우리 커플"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">처음 만난 날</label>
              <input
                type="date"
                className="input-field mt-1"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <button onClick={handleSave} className="btn-primary w-full" disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">커플 이름</span>
              <span className="text-sm text-gray-700">{couple?.coupleTitle || '우리 커플'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">처음 만난 날</span>
              <span className="text-sm text-gray-700">
                {couple?.startDate
                  ? new Date(couple.startDate).toLocaleDateString('ko-KR')
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">상대방</span>
              <span className="text-sm text-gray-700">{partner?.nickname || '-'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="card mb-4">
        <h2 className="font-bold text-gray-700 mb-3">알림 설정</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">푸시 알림</p>
            <p className="text-xs text-gray-400">새 메시지, 일정 알림 받기</p>
          </div>
          <button
            onClick={handlePushToggle}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              pushEnabled ? 'bg-primary-400' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                pushEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="card mb-4">
        <h2 className="font-bold text-gray-700 mb-3">앱 정보</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">버전</span>
            <span className="text-sm text-gray-400">1.0.0</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 text-center text-red-400 hover:text-red-500 font-medium rounded-xl hover:bg-red-50 transition-colors"
      >
        로그아웃
      </button>

      <div className="bottom-nav-spacer" />
    </div>
  );
}
