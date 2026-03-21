'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Sparkles, Heart, Moon, User } from 'lucide-react';
import { motion } from 'framer-motion';

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password'];

const navItems = [
  { name: '홈', path: '/', icon: Home },
  { name: '사주', path: '/saju', icon: Sparkles },
  { name: 'MBTI', path: '/mbti', icon: Heart },
  { name: '타로', path: '/tarot', icon: Moon },
  { name: '프로필', path: '/profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (AUTH_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-mystical border-t border-white/10 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
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
                  className={`w-5 h-5 transition-colors ${
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
                  className="absolute -top-1 w-10 h-0.5 bg-royal-gold rounded-full"
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
