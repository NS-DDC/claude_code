import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import FramerMotionReady from '@/components/FramerMotionReady';

export const metadata: Metadata = {
  title: 'Fortune & MBTI - 운명과 성격',
  description: '사주, MBTI, 운세를 확인하는 하이브리드 앱',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          // 글로벌 에러 핸들러 - 앱 크래시 방지
          window.onerror = function(msg, url, line, col, error) {
            console.error('Global error:', msg, url, line, col);
            return false;
          };
          window.onunhandledrejection = function(event) {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
          };
        `}} />
      </head>
      <body>
        <FramerMotionReady />
        <main className="min-h-screen pb-16">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
