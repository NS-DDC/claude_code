'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', nickname: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password || !form.nickname) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      await register(form.email, form.password, form.nickname);
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
          <div className="text-4xl mb-3">💕</div>
          <h1 className="text-2xl font-bold text-gray-800">회원가입</h1>
          <p className="text-sm text-gray-400 mt-1">LoveDay와 함께 시작해요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">닉네임</label>
            <input
              type="text"
              className="input-field"
              placeholder="애칭을 입력해주세요"
              maxLength={20}
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">이메일</label>
            <input
              type="email"
              className="input-field"
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">비밀번호</label>
            <input
              type="password"
              className="input-field"
              placeholder="6자 이상 입력해주세요"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">비밀번호 확인</label>
            <input
              type="password"
              className="input-field"
              placeholder="비밀번호를 다시 입력해주세요"
              value={form.passwordConfirm}
              onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary-400 font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
