'use client';

import { motion } from 'framer-motion';
import { SearchX, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Glass card container */}
        <div className="backdrop-blur-lg bg-white/30 border border-white/40 rounded-3xl shadow-xl p-8 text-center">
          {/* Animated icon */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="p-4 rounded-full bg-gradient-to-br from-royal-gold/20 to-pastel-brown/20"
            >
              <SearchX className="w-16 h-16 text-royal-gold" />
            </motion.div>
          </motion.div>

          {/* 404 number */}
          <motion.h1
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-royal-gold to-pastel-brown mb-4"
          >
            404
          </motion.h1>

          {/* Korean message */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-gray-800 mb-3"
          >
            페이지를 찾을 수 없습니다
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-pastel-brown mb-8 leading-relaxed"
          >
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            <br />
            URL을 다시 확인해주세요.
          </motion.p>

          {/* Suggestions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3 mb-8"
          >
            <div className="backdrop-blur-sm bg-white/40 rounded-xl p-3 border border-white/50">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-royal-gold">💡 팁:</span> 주소를 직접 입력하셨다면 철자를 확인해보세요
              </p>
            </div>
            <div className="backdrop-blur-sm bg-white/40 rounded-xl p-3 border border-white/50">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-royal-gold">💡 팁:</span> 링크를 통해 오셨다면 링크가 오래되었을 수 있습니다
              </p>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-royal-gold to-amber-500 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                홈으로 가기
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="w-full py-3 px-6 rounded-xl font-semibold text-gray-700 backdrop-blur-sm bg-white/50 border border-white/60 shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              이전 페이지로
            </motion.button>
          </motion.div>
        </div>

        {/* Floating particles decoration */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-10 left-10 w-3 h-3 bg-royal-gold rounded-full blur-sm"
        />
        <motion.div
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
          className="absolute bottom-20 right-10 w-4 h-4 bg-pastel-brown rounded-full blur-sm"
        />
        <motion.div
          animate={{
            y: [0, -12, 0],
            opacity: [0.4, 0.9, 0.4]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5
          }}
          className="absolute top-1/3 right-5 w-2 h-2 bg-royal-gold rounded-full blur-sm"
        />
      </motion.div>
    </div>
  );
}
