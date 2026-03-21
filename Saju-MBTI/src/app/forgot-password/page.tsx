'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import GlassCard from '@/components/GlassCard';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('비밀번호 재설정 이메일을 전송했습니다.');
    } catch (err: any) {
      toast.error(err.message || '이메일 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-4"
          >
            <Sparkles className="w-16 h-16 text-royal-gold" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">비밀번호 재설정</h1>
          <p className="text-pastel-brown text-sm">
            가입하신 이메일로 재설정 링크를 보내드립니다
          </p>
        </motion.div>

        <GlassCard hover={false}>
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">이메일을 전송했습니다</h2>
              <p className="text-pastel-brown text-sm mb-6">
                <span className="font-semibold text-gray-700">{email}</span> 으로<br />
                비밀번호 재설정 링크를 보냈습니다.<br />
                이메일을 확인해주세요.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-sm text-pastel-brown hover:text-royal-gold transition-colors"
              >
                다른 이메일로 다시 보내기
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 주소
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pastel-brown" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="가입하신 이메일 주소"
                    disabled={loading}
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/30 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-royal-gold/50 focus:border-royal-gold
                             disabled:opacity-50 disabled:cursor-not-allowed
                             text-gray-800 placeholder-gray-400
                             transition-all duration-200"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading || !email}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white
                         py-3 px-6 rounded-xl font-semibold
                         hover:from-purple-500 hover:to-pink-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200
                         flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    <span>전송 중...</span>
                  </>
                ) : (
                  <span>재설정 이메일 전송</span>
                )}
              </motion.button>
            </form>
          )}
        </GlassCard>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mt-6"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-pastel-brown hover:text-royal-gold transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>로그인으로 돌아가기</span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
