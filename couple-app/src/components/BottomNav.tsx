'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: '🏠', label: '홈' },
  { href: '/dashboard/questions', icon: '💌', label: '질문' },
  { href: '/dashboard/pet', icon: '🐰', label: '펫' },
  { href: '/dashboard/chat', icon: '😊', label: '기분' },
  { href: '/dashboard/calendar', icon: '📅', label: '캘린더' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                isActive
                  ? 'text-primary-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`text-xl ${isActive ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary-500' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
