'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Sparkles, Heart, Star, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: '홈', path: '/', icon: Home },
  { name: '사주', path: '/saju', icon: Sparkles },
  { name: 'MBTI', path: '/mbti', icon: Heart },
  { name: '운명', path: '/destiny', icon: Star },
  { name: '설정', path: '/settings', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/40 backdrop-blur-lg border-t border-white/20 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-col items-center justify-center flex-1 relative"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-royal-gold' : 'text-pastel-brown'
                  }`}
                />
                <span
                  className={`text-xs mt-1 transition-colors ${
                    isActive ? 'text-royal-gold font-semibold' : 'text-pastel-brown'
                  }`}
                >
                  {item.name}
                </span>
              </motion.div>

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 w-12 h-1 bg-royal-gold rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
