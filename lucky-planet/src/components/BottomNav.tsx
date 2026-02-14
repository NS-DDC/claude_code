'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ScanLine, History, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { href: '/', label: '홈', icon: Home },
  { href: '/scan', label: '스캔', icon: ScanLine },
  { href: '/history', label: '기록', icon: History },
  { href: '/stats', label: '통계', icon: BarChart3 },
  { href: '/settings', label: '설정', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-lg bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-[0_-4px_30px_rgba(0,0,0,0.05)] dark:bg-gray-900/80 dark:border-gray-800">
        <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                  isActive
                    ? 'text-gold-500 scale-105'
                    : 'text-gray-400 hover:text-gray-600 active:scale-95 dark:text-gray-500 dark:hover:text-gray-300'
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className="transition-all duration-200"
                />
                <span className={`text-[10px] font-medium ${isActive ? 'text-gold-600' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
