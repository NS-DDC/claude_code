'use client';

import { motion } from 'framer-motion';

interface FortuneScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#00C851';
  if (score >= 60) return '#FFD700';
  if (score >= 40) return '#FF9800';
  if (score >= 20) return '#FF5722';
  return '#F44336';
}

function getScoreLevel(score: number): string {
  if (score >= 85) return '대길';
  if (score >= 70) return '길';
  if (score >= 50) return '소길';
  if (score >= 30) return '평';
  return '흉';
}

function getScoreEmoji(score: number): string {
  if (score >= 85) return '🌟';
  if (score >= 70) return '✨';
  if (score >= 50) return '🌤';
  if (score >= 30) return '☁️';
  return '🌧';
}

const SIZES = {
  sm: { width: 120, strokeWidth: 8, fontSize: 24, labelSize: 10 },
  md: { width: 180, strokeWidth: 10, fontSize: 36, labelSize: 13 },
  lg: { width: 240, strokeWidth: 12, fontSize: 48, labelSize: 16 }
};

export default function FortuneScoreGauge({
  score,
  label = '오늘의 운세',
  size = 'md',
  showLevel = true
}: FortuneScoreGaugeProps) {
  const config = SIZES[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = Math.PI * radius; // semicircle
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);
  const level = getScoreLevel(score);
  const emoji = getScoreEmoji(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.width / 2 + 20 }}>
        <svg
          width={config.width}
          height={config.width / 2 + 10}
          viewBox={`0 0 ${config.width} ${config.width / 2 + 10}`}
        >
          {/* Background arc */}
          <path
            d={`M ${config.strokeWidth / 2} ${config.width / 2} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.width / 2}`}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <motion.path
            d={`M ${config.strokeWidth / 2} ${config.width / 2} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.width / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>

        {/* Center content */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center"
          style={{ bottom: 0 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <span style={{ fontSize: config.fontSize, fontWeight: 'bold', color }}>
              {score}
            </span>
            <span className="text-gray-500" style={{ fontSize: config.labelSize }}>점</span>
          </motion.div>
        </div>
      </div>

      {showLevel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-2 -mt-1"
        >
          <span className="text-lg">{emoji}</span>
          <span
            className="font-bold text-sm px-3 py-1 rounded-full"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {level}
          </span>
        </motion.div>
      )}

      {label && (
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      )}
    </div>
  );
}
