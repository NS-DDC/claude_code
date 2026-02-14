'use client';

import { motion } from 'framer-motion';
import { ScanLine } from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import TicketCamera from '@/components/TicketCamera';
import AdBanner from '@/components/AdBanner';

export default function ScanPage() {
  return (
    <div className="space-y-6 py-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1"
      >
        <div className="flex items-center justify-center gap-2">
          <ScanLine className="text-mint-500" size={24} />
          <h1 className="text-xl font-bold text-gray-800">QR 당첨 확인</h1>
        </div>
        <p className="text-xs text-gray-400">복권 QR 코드를 스캔하여 당첨을 확인하세요</p>
      </motion.div>

      {/* QR 스캐너 */}
      <QRScanner />

      {/* 복권 사진 보관 */}
      <TicketCamera />

      {/* 광고 영역 */}
      <AdBanner type="banner" />
    </div>
  );
}
