import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import { KAKAO_SDK_URL } from '@/lib/kakao';

export const metadata: Metadata = {
  title: 'Lucky Planet - 로또 번호 추출기',
  description: '스마트한 로또 번호 생성, QR 당첨 확인, 통계 분석까지! 행운의 행성에서 당신의 번호를 뽑아보세요.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#E0F2F1',
};

const darkModeScript = `
(function() {
  try {
    var s = JSON.parse(localStorage.getItem('lotto_settings') || '{}');
    if (s.darkMode) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
        {/* 카카오 SDK */}
        <Script src={KAKAO_SDK_URL} strategy="afterInteractive" />
      </head>
      <body className="font-sans antialiased">
        <div className="mx-auto max-w-lg min-h-dvh relative">
          <main className="safe-area-top safe-area-bottom px-4 pb-4">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
