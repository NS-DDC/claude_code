'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught:', error);
    }
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="bg-white/30 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 text-center">
          {/* Animated Error Icon */}
          <motion.div
            initial={{ rotate: 0, scale: 0 }}
            animate={{ rotate: 360, scale: 1 }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 200,
              damping: 10
            }}
            className="inline-block mb-6"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="p-4 rounded-full bg-gradient-to-br from-red-400 to-orange-400 shadow-lg">
                <AlertTriangle className="w-16 h-16 text-white" />
              </div>
            </motion.div>
          </motion.div>

          {/* Error Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-gray-800 mb-3"
          >
            문제가 발생했습니다
          </motion.h1>

          {/* Error Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-pastel-brown text-lg mb-6"
          >
            일시적인 오류가 발생했습니다.
            <br />
            잠시 후 다시 시도해주세요.
          </motion.p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 p-4 bg-red-50/50 backdrop-blur-sm rounded-xl border border-red-200/50 text-left"
            >
              <p className="text-sm font-mono text-red-800 break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={reset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-royal-gold to-amber-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <RefreshCw className="w-5 h-5" />
              다시 시도
            </motion.button>

            <Link href="/">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/50 backdrop-blur-sm text-gray-800 font-semibold rounded-xl border border-white/40 shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto"
              >
                <Home className="w-5 h-5" />
                홈으로 가기
              </motion.button>
            </Link>
          </div>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 pt-6 border-t border-white/20"
          >
            <p className="text-sm text-pastel-brown/70">
              문제가 계속되면 페이지를 새로고침하거나
              <br />
              잠시 후 다시 방문해주세요.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
