import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import SplashWrapper from '@/components/SplashWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'LoveDay - 우리만의 커플 앱',
  description: '커플을 위한 특별한 공간. 일정 관리, 사진 공유, 채팅 등 다양한 기능을 만나보세요.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F37896',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#FFF8F0] min-h-screen">
        <AuthProvider>
          <ServiceWorkerRegistrar />
          <SplashWrapper>
            {children}
          </SplashWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
