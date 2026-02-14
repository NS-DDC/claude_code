'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function InvitePage() {
  const { user, token, refreshUser, logout } = useAuth();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyInviteCode = async () => {
    if (!user?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(user.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = user.inviteCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!inviteCode) {
      setError('상대방의 초대 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/couple/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode, startDate: startDate || undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess('커플 연결이 완료되었습니다! 🎉');
      await refreshUser();
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💌</div>
          <h1 className="text-2xl font-bold text-gray-800">커플 연결</h1>
          <p className="text-sm text-gray-400 mt-1">상대방과 연결하여 시작하세요</p>
        </div>

        {/* My Invite Code */}
        <div className="card mb-6 text-center">
          <p className="text-sm text-gray-500 mb-2">내 초대 코드</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold tracking-widest text-primary-500">
              {user?.inviteCode || '--------'}
            </span>
            <button
              onClick={copyInviteCode}
              className="text-sm text-primary-400 hover:text-primary-500 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
            >
              {copied ? '복사됨!' : '복사'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">이 코드를 상대방에게 공유해주세요</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">또는</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Enter Partner Code */}
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">상대방 초대 코드</label>
            <input
              type="text"
              className="input-field text-center tracking-widest uppercase"
              placeholder="코드 입력"
              maxLength={8}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              처음 만난 날 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="date"
              className="input-field"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm text-center bg-green-50 py-2 rounded-lg">{success}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '연결 중...' : '커플 연결하기'}
          </button>
        </form>

        <button
          onClick={logout}
          className="w-full text-center text-sm text-gray-400 mt-6 hover:text-gray-600 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
