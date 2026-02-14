'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Camera, Sparkles, Hand, User } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import AdBanner from '@/components/AdBanner';
import { storage } from '@/lib/storage';
import { Camera as CapCamera } from '@capacitor/camera';
import { Share } from '@capacitor/share';

const luckyMessages = [
  { message: '오늘은 행운이 가득한 날입니다!', color: '#FFD700', number: 7 },
  { message: '새로운 기회가 찾아올 것입니다.', color: '#FF6B6B', number: 3 },
  { message: '소중한 사람과 좋은 시간을 보내세요.', color: '#4ECDC4', number: 9 },
  { message: '긍정적인 에너지가 당신을 감싸고 있습니다.', color: '#95E1D3', number: 5 },
  { message: '오늘의 결정이 미래를 밝게 만들 것입니다.', color: '#F38181', number: 1 },
  { message: '당신의 노력이 빛을 발할 때입니다.', color: '#AA96DA', number: 8 },
  { message: '주변 사람들에게 사랑받는 하루가 될 것입니다.', color: '#FCBAD3', number: 2 },
];

export default function ScanPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fortune, setFortune] = useState<any>(null);
  const [scanType, setScanType] = useState<'face' | 'hand'>('face');
  const [selectedScanType, setSelectedScanType] = useState<'face' | 'hand'>('face');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleScan = async () => {
    setIsScanning(true);
    setShowResult(false);
    setScanType(selectedScanType);

    // 카메라 권한 요청 및 스트림 시작
    try {
      const permissions = await CapCamera.requestPermissions();
      if (permissions.camera === 'granted') {
        console.log('Camera permission granted');
      }
    } catch (error) {
      console.log('Camera permission error:', error);
    }

    // 실제 카메라 스트림 시작
    try {
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        setCameraStream(stream);
      }
    } catch (e) {
      console.log('Browser camera not available:', e);
    }

    // 스캔 애니메이션 (4초)
    setTimeout(() => {
      // 카메라 스트림 정리
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }

      const randomFortune = luckyMessages[Math.floor(Math.random() * luckyMessages.length)];
      const fortuneResult = {
        id: `fortune_${Date.now()}_${Math.random()}`,
        date: new Date().toISOString(),
        message: randomFortune.message,
        luckyNumber: randomFortune.number,
        luckyColor: randomFortune.color,
        scanType: selectedScanType
      };

      setFortune(fortuneResult);
      storage.add({ type: 'fortune', data: fortuneResult });
      setIsScanning(false);
      setShowResult(true);
    }, 4000);
  };

  const handleReset = () => {
    setShowResult(false);
    setFortune(null);
  };

  // 카메라 스트림을 video 요소에 연결
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <Scan className="w-12 h-12 text-royal-gold mx-auto mb-2" />
        <h1 className="text-3xl font-bold text-gray-800">운세 스캔</h1>
        <p className="text-pastel-brown mt-2">오늘의 행운을 스캔해보세요</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!isScanning && !showResult && (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="mb-4">
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="inline-block mb-6"
                >
                  <Camera className="w-24 h-24 text-royal-gold" />
                </motion.div>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  행운의 메시지를 받아보세요
                </h3>
                <p className="text-pastel-brown mb-6">
                  스캔 버튼을 눌러 오늘의 행운 메시지와<br />
                  행운의 숫자, 색상을 확인하세요
                </p>

                {/* 스캔 타입 선택 */}
                <div className="mb-6">
                  <p className="text-sm text-pastel-brown mb-3">스캔 방법 선택</p>
                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedScanType('face')}
                      className={`flex-1 max-w-[150px] py-3 rounded-xl font-semibold transition-all ${
                        selectedScanType === 'face'
                          ? 'bg-gradient-to-r from-royal-gold to-yellow-500 text-white shadow-lg'
                          : 'bg-white/50 text-pastel-brown'
                      }`}
                    >
                      <User className="inline w-5 h-5 mr-1" />
                      관상
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedScanType('hand')}
                      className={`flex-1 max-w-[150px] py-3 rounded-xl font-semibold transition-all ${
                        selectedScanType === 'hand'
                          ? 'bg-gradient-to-r from-royal-gold to-yellow-500 text-white shadow-lg'
                          : 'bg-white/50 text-pastel-brown'
                      }`}
                    >
                      <Hand className="inline w-5 h-5 mr-1" />
                      손금
                    </motion.button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleScan}
                  className="px-8 py-4 bg-gradient-to-r from-royal-gold to-yellow-500 text-white rounded-xl font-semibold text-lg shadow-lg"
                >
                  <Scan className="inline w-6 h-6 mr-2" />
                  {selectedScanType === 'face' ? '관상' : '손금'} 스캔 시작
                </motion.button>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-semibold text-gray-800 mb-2">사용 방법</h3>
              <ul className="text-sm text-pastel-brown space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-royal-gold">1.</span>
                  <span>스캔 버튼을 눌러주세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-royal-gold">2.</span>
                  <span>카메라 권한을 허용해주세요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-royal-gold">3.</span>
                  <span>스캔이 완료되면 행운의 메시지를 받습니다</span>
                </li>
              </ul>
            </GlassCard>
          </motion.div>
        )}

        {isScanning && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="mb-4">
              <div className="text-center py-8">
                <div className="relative w-full h-96 mx-auto mb-6 bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl overflow-hidden">
                  {/* 실제 카메라 비디오 */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-purple-900/10" />

                  {/* 스캔 라인 애니메이션 */}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-royal-gold shadow-lg shadow-royal-gold"
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />

                  {/* 관상 가이드라인 (얼굴 타원) */}
                  {scanType === 'face' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="relative w-48 h-60">
                        {/* 얼굴 타원 */}
                        <div className="absolute inset-0 border-4 border-royal-gold rounded-full opacity-70"
                             style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }} />

                        {/* 눈 위치 가이드 */}
                        <div className="absolute top-1/3 left-1/4 w-4 h-4 border-2 border-royal-gold rounded-full" />
                        <div className="absolute top-1/3 right-1/4 w-4 h-4 border-2 border-royal-gold rounded-full" />

                        {/* 입 위치 가이드 */}
                        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-12 h-2 border-2 border-royal-gold rounded-full" />

                        {/* 코너 마커 */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-royal-gold" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-royal-gold" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-royal-gold" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-royal-gold" />

                        <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-royal-gold/30" />
                      </div>
                    </motion.div>
                  )}

                  {/* 손금 가이드라인 (손바닥) */}
                  {scanType === 'hand' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="relative w-40 h-56">
                        {/* 손바닥 외곽선 */}
                        <div className="absolute inset-0">
                          <svg viewBox="0 0 100 140" className="w-full h-full">
                            {/* 손바닥 */}
                            <ellipse cx="50" cy="70" rx="35" ry="45" fill="none" stroke="#FFD700" strokeWidth="3" opacity="0.7" />
                            {/* 손가락들 */}
                            <rect x="42" y="10" width="16" height="30" rx="8" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.5" />
                            <rect x="30" y="5" width="12" height="25" rx="6" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.5" />
                            <rect x="58" y="5" width="12" height="25" rx="6" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.5" />
                            <rect x="18" y="15" width="10" height="20" rx="5" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.5" />
                            <rect x="72" y="15" width="10" height="20" rx="5" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.5" />
                            {/* 손금 라인 */}
                            <path d="M 20 60 Q 50 55 80 60" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.8" />
                            <path d="M 20 75 Q 50 70 80 75" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.8" />
                            <path d="M 20 90 Q 50 85 80 90" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.8" />
                          </svg>
                        </div>

                        {/* 코너 마커 */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-royal-gold" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-royal-gold" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-royal-gold" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-royal-gold" />

                        <Hand className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-royal-gold/20" />
                      </div>
                    </motion.div>
                  )}

                  {/* 스캔 진행 표시 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-4">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-center"
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-royal-gold" />
                        <p className="text-royal-gold font-bold text-lg">
                          {scanType === 'face' ? '관상 분석 중...' : '손금 분석 중...'}
                        </p>
                        <Sparkles className="w-5 h-5 text-royal-gold" />
                      </div>
                      <p className="text-white/80 text-sm">
                        운명의 기운을 읽고 있습니다
                      </p>
                    </motion.div>
                  </div>
                </div>

                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex justify-center gap-1"
                >
                  <div className="w-2 h-2 bg-royal-gold rounded-full" />
                  <div className="w-2 h-2 bg-royal-gold rounded-full" />
                  <div className="w-2 h-2 bg-royal-gold rounded-full" />
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {showResult && fortune && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <GlassCard className="mb-4">
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="inline-block mb-6"
                >
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl"
                    style={{ backgroundColor: fortune.luckyColor }}
                  >
                    <Sparkles className="w-16 h-16 text-white" />
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-800 mb-4"
                >
                  오늘의 행운 메시지
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/50 rounded-lg p-6 mb-6"
                >
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {fortune.message}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-2 gap-4 mb-6"
                >
                  <div className="bg-gradient-to-br from-royal-gold/20 to-yellow-500/20 rounded-lg p-4">
                    <p className="text-sm text-pastel-brown mb-2">행운의 숫자</p>
                    <p className="text-4xl font-bold text-royal-gold">
                      {fortune.luckyNumber}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-lg p-4">
                    <p className="text-sm text-pastel-brown mb-2">행운의 색상</p>
                    <div
                      className="w-16 h-16 rounded-full mx-auto shadow-lg"
                      style={{ backgroundColor: fortune.luckyColor }}
                    />
                  </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    className="py-3 bg-white/50 text-pastel-brown rounded-lg font-semibold"
                  >
                    다시 스캔
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try {
                        const shareText = `✨ 오늘의 운세 스캔 결과 ✨\n\n${fortune.scanType === 'face' ? '👤 관상 분석' : '✋ 손금 분석'}\n\n💬 ${fortune.message}\n\n🎲 행운의 숫자: ${fortune.luckyNumber}\n🎨 행운의 색상: ${fortune.luckyColor}\n\n📅 ${new Date(fortune.date).toLocaleDateString('ko-KR')}\n\n🔮 Saju MBTI - NAMSIK93`;

                        await Share.share({
                          title: '오늘의 운세 스캔 결과',
                          text: shareText,
                          dialogTitle: '친구에게 공유하기'
                        });
                      } catch (error) {
                        // Fallback to browser share API
                        if (navigator.share) {
                          const shareText = `✨ 오늘의 운세 스캔 결과 ✨\n\n${fortune.scanType === 'face' ? '👤 관상 분석' : '✋손금 분석'}\n\n💬 ${fortune.message}\n\n🎲 행운의 숫자: ${fortune.luckyNumber}`;
                          navigator.share({
                            title: '오늘의 운세',
                            text: shareText,
                          });
                        } else {
                          alert('공유 기능을 사용할 수 없습니다.');
                        }
                      }
                    }}
                    className="py-3 bg-gradient-to-r from-royal-gold to-yellow-500 text-white rounded-lg font-semibold"
                  >
                    공유하기
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <AdBanner />
    </div>
  );
}
