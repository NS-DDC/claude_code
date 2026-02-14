'use client';

import { motion } from 'framer-motion';
import { getBallColor, getBallTextColor } from '@/lib/lotto';

interface LottoBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  animate?: boolean;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
};

export default function LottoBall({ number, size = 'md', delay = 0, animate = true }: LottoBallProps) {
  const bgColor = getBallColor(number);
  const textColor = getBallTextColor(number);

  const ball = (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold shadow-lg relative overflow-hidden`}
      style={{
        background: `radial-gradient(circle at 35% 35%, ${bgColor}ee, ${bgColor})`,
        color: textColor,
      }}
    >
      {/* 광택 효과 */}
      <div
        className="absolute top-[15%] left-[20%] w-[30%] h-[25%] rounded-full opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8), transparent)' }}
      />
      <span className="relative z-10 drop-shadow-sm">{number}</span>
    </div>
  );

  if (!animate) return ball;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: delay * 0.15,
      }}
    >
      {ball}
    </motion.div>
  );
}
