'use client';

import { motion } from 'framer-motion';
import { Element } from '@/types';

interface FloatingOrbsProps {
  elements?: Record<Element, number>;
}

export default function FloatingOrbs({ elements }: FloatingOrbsProps) {
  const orbs = [
    { element: '목', color: '#00C851', emoji: '🌳', size: 60 },
    { element: '화', color: '#FF4444', emoji: '🔥', size: 50 },
    { element: '토', color: '#F4A460', emoji: '🏔️', size: 70 },
    { element: '금', color: '#C0C0C0', emoji: '⚔️', size: 55 },
    { element: '수', color: '#4A90E2', emoji: '💧', size: 65 }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 opacity-30">
      {orbs.map((orb, index) => {
        const size = elements ? orb.size * (1 + (elements[orb.element as Element] || 0) / 10) : orb.size;

        return (
          <motion.div
            key={orb.element}
            className="absolute rounded-full flex items-center justify-center"
            style={{
              width: size,
              height: size,
              background: `radial-gradient(circle at 30% 30%, ${orb.color}88, ${orb.color}44)`,
              boxShadow: `0 0 30px ${orb.color}66`,
              left: `${10 + index * 18}%`,
              top: `${20 + (index % 3) * 25}%`
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.sin(index) * 20, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: 8 + index * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.5
            }}
          >
            <span className="text-2xl">{orb.emoji}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
