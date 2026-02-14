'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, ScanLine, X, ExternalLink, AlertCircle } from 'lucide-react';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

// 동행복권 QR 코드 URL 패턴
const DHLOTTERY_PATTERN = /dhlottery\.co\.kr/;

export default function QRScanner() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  const startScanning = useCallback(async () => {
    setStatus('scanning');
    setResult(null);
    setErrorMsg('');

    try {
      // html5-qrcode 동적 임포트
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setResult(decodedText);
          setStatus('success');
          scanner.stop().catch(() => {});
        },
        () => {
          // 스캔 진행 중 (매 프레임)
        }
      );
    } catch (err) {
      console.error('QR Scanner error:', err);
      setErrorMsg(
        '카메라에 접근할 수 없습니다.\n브라우저 설정에서 카메라 권한을 허용해주세요.'
      );
      setStatus('error');
    }
  }, []);

  const stopScanning = useCallback(() => {
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const handleOpenResult = () => {
    if (result) {
      window.open(result, '_blank', 'noopener');
    }
  };

  return (
    <div className="space-y-6">
      {/* 스캐너 뷰파인더 */}
      <div className="relative aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden bg-black/90 border-2 border-white/20 shadow-2xl">
        {status === 'scanning' && (
          <>
            <div id="qr-reader" className="w-full h-full" />
            {/* 스캔 라인 애니메이션 */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-[0_0_15px_rgba(255,215,0,0.5)]"
                animate={{ top: ['20%', '80%', '20%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* 모서리 프레임 */}
              <div className="absolute top-[15%] left-[15%] w-8 h-8 border-t-2 border-l-2 border-gold-400 rounded-tl-lg" />
              <div className="absolute top-[15%] right-[15%] w-8 h-8 border-t-2 border-r-2 border-gold-400 rounded-tr-lg" />
              <div className="absolute bottom-[15%] left-[15%] w-8 h-8 border-b-2 border-l-2 border-gold-400 rounded-bl-lg" />
              <div className="absolute bottom-[15%] right-[15%] w-8 h-8 border-b-2 border-r-2 border-gold-400 rounded-br-lg" />
            </div>
          </>
        )}

        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
              <Camera className="text-white/60" size={36} />
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              로또 복권 뒷면의<br />
              QR 코드를 스캔하세요
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-black/80">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
            >
              <ScanLine className="text-white" size={28} />
            </motion.div>
            <p className="text-white text-sm font-medium">스캔 성공!</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-black/80">
            <AlertCircle className="text-red-400" size={40} />
            <p className="text-white/80 text-sm text-center whitespace-pre-line">{errorMsg}</p>
          </div>
        )}

        {/* 닫기 버튼 */}
        {status === 'scanning' && (
          <button
            onClick={stopScanning}
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center z-10"
          >
            <X className="text-white" size={16} />
          </button>
        )}
      </div>

      {/* 시작/중지 버튼 */}
      {status !== 'scanning' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={startScanning}
          className="w-full py-4 bg-gradient-to-r from-mint-400 to-mint-500 text-white font-bold rounded-2xl shadow-lg shadow-mint-200/50 flex items-center justify-center gap-2"
        >
          <Camera size={20} />
          {status === 'idle' ? 'QR 코드 스캔 시작' : '다시 스캔하기'}
        </motion.button>
      )}

      {/* 결과 표시 */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 space-y-3"
        >
          <h3 className="text-sm font-semibold text-gray-700">스캔 결과</h3>
          <p className="text-xs text-gray-500 break-all bg-gray-50 p-3 rounded-xl">{result}</p>

          {DHLOTTERY_PATTERN.test(result) ? (
            <button
              onClick={handleOpenResult}
              className="w-full py-3 bg-blue-500 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
            >
              <ExternalLink size={16} />
              동행복권에서 결과 확인
            </button>
          ) : (
            <button
              onClick={handleOpenResult}
              className="w-full py-3 bg-gray-500 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors"
            >
              <ExternalLink size={16} />
              링크 열기
            </button>
          )}
        </motion.div>
      )}

      {/* 안내 텍스트 */}
      <div className="text-center text-xs text-gray-400 space-y-1">
        <p>로또 복권 뒷면의 QR 코드를 카메라에 비춰주세요.</p>
        <p>스캔된 URL을 통해 동행복권 당첨 결과를 확인합니다.</p>
      </div>
    </div>
  );
}
