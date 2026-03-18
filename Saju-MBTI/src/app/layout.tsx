import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import { ClientAuthProvider } from '@/components/ClientAuthProvider';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Fortune & MBTI - 운명과 성격',
  description: '사주, MBTI, 운세를 확인하는 하이브리드 앱',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <ClientAuthProvider>
          <ErrorBoundary>
            <main className="min-h-screen pb-16">
              {children}
            </main>
          </ErrorBoundary>
        </ClientAuthProvider>
        <BottomNav />
      </body>
    </html>
  );
}
