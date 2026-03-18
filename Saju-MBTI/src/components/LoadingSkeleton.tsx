'use client';

import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  type?: 'radar' | 'orbs' | 'card';
  className?: string;
}

export default function LoadingSkeleton({ type = 'card', className = '' }: LoadingSkeletonProps) {
  if (type === 'radar') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-[280px] h-[280px] rounded-full border-4 border-gray-200 border-t-royal-gold"
        />
      </div>
    );
  }

  if (type === 'orbs') {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 opacity-20">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gray-300"
            style={{
              width: 60,
              height: 60,
              left: `${10 + i * 18}%`,
              top: `${20 + (i % 3) * 25}%`
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    );
  }

  // Default card skeleton
  return (
    <div className={`bg-white/50 rounded-xl p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-3" />
      <div className="h-4 bg-gray-300 rounded w-5/6" />
    </div>
  );
}
