'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Camera,
  ChevronDown,
  Save,
  Loader2,
  BarChart3,
  Calendar,
  Star,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import GlassCard from '@/components/GlassCard';
import AdBanner from '@/components/AdBanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { storageService } from '@/lib/storageService';
import { firestore } from '@/lib/firestore';
import { MBTIType, UserProfile } from '@/types';

const ALL_MBTI_TYPES: MBTIType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

const MBTI_INFO: Record<MBTIType, { emoji: string; label: string }> = {
  INTJ: { emoji: '🧠', label: '전략가' },
  INTP: { emoji: '🔬', label: '논리술사' },
  ENTJ: { emoji: '👑', label: '통솔자' },
  ENTP: { emoji: '💡', label: '변론가' },
  INFJ: { emoji: '🔮', label: '옹호자' },
  INFP: { emoji: '🌸', label: '중재자' },
  ENFJ: { emoji: '🌟', label: '선도자' },
  ENFP: { emoji: '🦋', label: '활동가' },
  ISTJ: { emoji: '📋', label: '현실주의자' },
  ISFJ: { emoji: '🛡️', label: '수호자' },
  ESTJ: { emoji: '⚖️', label: '경영자' },
  ESFJ: { emoji: '🤝', label: '외교관' },
  ISTP: { emoji: '🔧', label: '장인' },
  ISFP: { emoji: '🎨', label: '모험가' },
  ESTP: { emoji: '🏄', label: '사업가' },
  ESFP: { emoji: '🎭', label: '연예인' },
};

const ELEMENT_MAP: Record<string, string> = {
  '목': '🌳 목(木)',
  '화': '🔥 화(火)',
  '토': '🏔️ 토(土)',
  '금': '⚔️ 금(金)',
  '수': '💧 수(水)',
};

const DEFAULT_PROFILE: UserProfile = {
  displayName: '',
  photoURL: '',
  mbtiType: '',
  gender: '',
  birthYear: null,
  birthMonth: null,
  birthDay: null,
  birthHour: null,
  element: '',
  createdAt: '',
  updatedAt: '',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [favoriteType, setFavoriteType] = useState<string>('');
  const [mbtiDropdownOpen, setMbtiDropdownOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadProfile();
      loadStats();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user?.uid || !firestore) return;
    setLoading(true);
    try {
      const docRef = doc(firestore, 'users', user.uid, 'profile', 'default');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile({
          ...DEFAULT_PROFILE,
          ...data,
          displayName: data.displayName || user.displayName || '',
          photoURL: data.photoURL || user.photoURL || '',
        });
      } else {
        // Initialize from auth user and preferences
        const prefs = await storageService.getUserPreferences(user.uid);
        setProfile({
          ...DEFAULT_PROFILE,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          mbtiType: (prefs?.mbti as MBTIType) || '',
          element: (prefs?.element as UserProfile['element']) || '',
          gender: prefs?.birthInfo?.gender || '',
          birthYear: prefs?.birthInfo?.birthYear || null,
          birthMonth: prefs?.birthInfo?.birthMonth || null,
          birthDay: prefs?.birthInfo?.birthDay || null,
          birthHour: prefs?.birthInfo?.birthHour || null,
          createdAt: user.metadata.creationTime || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('프로필을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.uid) return;
    try {
      const history = await storageService.getAll(user.uid);
      setHistoryCount(history.length);

      if (history.length > 0) {
        const typeCounts: Record<string, number> = {};
        history.forEach((record) => {
          typeCounts[record.type] = (typeCounts[record.type] || 0) + 1;
        });
        const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
        const typeLabels: Record<string, string> = {
          'saju': '사주 분석',
          'saju-compatibility': '사주 궁합',
          'mbti': 'MBTI 궁합',
          'fortune': '운세 스캔',
          'destiny': '운명 캐릭터',
          'destiny-compatibility': '운명 궁합',
          'daily-fortune': '일일 운세',
        };
        setFavoriteType(typeLabels[sorted[0][0]] || sorted[0][0]);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSave = async () => {
    if (!user?.uid || !firestore) return;
    setSaving(true);
    try {
      const docRef = doc(firestore, 'users', user.uid, 'profile', 'default');
      const now = new Date().toISOString();
      const dataToSave = {
        ...profile,
        updatedAt: now,
        createdAt: profile.createdAt || now,
      };
      await setDoc(docRef, dataToSave);

      // Sync displayName to Firebase Auth profile
      if (user && profile.displayName !== user.displayName) {
        await updateProfile(user, { displayName: profile.displayName });
      }

      // Also sync MBTI/element/birthInfo to preferences
      if (profile.mbtiType || profile.element || profile.birthYear) {
        const birthInfo = profile.birthYear
          ? {
              gender: profile.gender || 'male',
              birthYear: profile.birthYear,
              birthMonth: profile.birthMonth || 1,
              birthDay: profile.birthDay || 1,
              birthHour: profile.birthHour || 0,
            }
          : undefined;
        await storageService.saveUserPreferences(
          profile.mbtiType || '',
          profile.element || '',
          birthInfo,
          user.uid
        );
      }

      toast.success('프로필이 저장되었습니다');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('프로필 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await CapCamera.getPhoto({
          quality: 80,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt,
          width: 256,
          height: 256,
        });
        if (photo.dataUrl) {
          setProfile((prev) => ({ ...prev, photoURL: photo.dataUrl! }));
        }
      } catch (error) {
        console.error('Camera error:', error);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('이미지는 2MB 이하만 가능합니다');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((prev) => ({ ...prev, photoURL: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const memberSince = profile.createdAt || user?.metadata.creationTime;
  const formattedMemberDate = memberSince
    ? new Date(memberSince).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-royal-gold mx-auto mb-4 animate-spin" />
              <p className="text-pastel-brown">프로필을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-lg pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <User className="w-12 h-12 text-royal-gold mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-gray-800">내 프로필</h1>
          <p className="text-pastel-brown mt-2">나의 정보를 관리하세요</p>
        </motion.div>

        {/* Account Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="mb-4" hover={false}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-royal-gold" />
              계정 정보
            </h3>

            {/* Photo */}
            <div className="flex flex-col items-center mb-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-royal-gold/30 to-amber-200/30 border-2 border-royal-gold/40 flex items-center justify-center">
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt="프로필"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-royal-gold/60" />
                  )}
                </div>
                <button
                  onClick={handlePhotoUpload}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-royal-gold rounded-full flex items-center justify-center shadow-lg hover:bg-amber-500 transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm text-pastel-brown mb-1">이메일</label>
              <div className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-600 text-sm">
                {user?.email || '-'}
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm text-pastel-brown mb-1">닉네임</label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, displayName: e.target.value }))
                }
                placeholder="닉네임을 입력하세요"
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/30
                           focus:outline-none focus:ring-2 focus:ring-royal-gold/50
                           text-gray-800 placeholder-gray-400 text-sm"
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* MBTI Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="mb-4" hover={false}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-royal-gold" />
              MBTI 유형
            </h3>

            {profile.mbtiType && MBTI_INFO[profile.mbtiType as MBTIType] && (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-center mb-4 p-4 rounded-xl bg-gradient-to-br from-royal-gold/10 to-amber-100/30"
              >
                <span className="text-4xl">
                  {MBTI_INFO[profile.mbtiType as MBTIType].emoji}
                </span>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {profile.mbtiType}
                </p>
                <p className="text-sm text-pastel-brown">
                  {MBTI_INFO[profile.mbtiType as MBTIType].label}
                </p>
              </motion.div>
            )}

            <div className="relative">
              <button
                onClick={() => setMbtiDropdownOpen(!mbtiDropdownOpen)}
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/30
                           text-left text-sm text-gray-800 flex items-center justify-between
                           focus:outline-none focus:ring-2 focus:ring-royal-gold/50"
              >
                <span>
                  {profile.mbtiType
                    ? `${MBTI_INFO[profile.mbtiType as MBTIType]?.emoji || ''} ${profile.mbtiType} - ${MBTI_INFO[profile.mbtiType as MBTIType]?.label || ''}`
                    : 'MBTI 유형을 선택하세요'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-pastel-brown transition-transform ${
                    mbtiDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {mbtiDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 mt-1 z-20
                               bg-white/95 backdrop-blur-lg rounded-xl border border-white/30
                               shadow-xl max-h-60 overflow-y-auto"
                  >
                    {ALL_MBTI_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setProfile((prev) => ({ ...prev, mbtiType: type }));
                          setMbtiDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2
                                   hover:bg-royal-gold/10 transition-colors
                                   ${profile.mbtiType === type ? 'bg-royal-gold/20 font-semibold' : ''}`}
                      >
                        <span>{MBTI_INFO[type].emoji}</span>
                        <span className="font-medium">{type}</span>
                        <span className="text-pastel-brown">{MBTI_INFO[type].label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </motion.div>

        {/* Birth Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="mb-4" hover={false}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-royal-gold" />
              사주 정보
            </h3>

            {profile.element && (
              <div className="text-center mb-4 p-3 rounded-xl bg-gradient-to-br from-royal-gold/10 to-amber-100/30">
                <p className="text-lg font-semibold text-gray-800">
                  {ELEMENT_MAP[profile.element] || profile.element}
                </p>
              </div>
            )}

            {/* Gender */}
            <div className="mb-3">
              <label className="block text-sm text-pastel-brown mb-1">성별</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setProfile((prev) => ({ ...prev, gender: 'male' }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    profile.gender === 'male'
                      ? 'bg-royal-gold text-white shadow-md'
                      : 'bg-white/50 text-pastel-brown border border-white/30'
                  }`}
                >
                  남성
                </button>
                <button
                  onClick={() => setProfile((prev) => ({ ...prev, gender: 'female' }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    profile.gender === 'female'
                      ? 'bg-royal-gold text-white shadow-md'
                      : 'bg-white/50 text-pastel-brown border border-white/30'
                  }`}
                >
                  여성
                </button>
              </div>
            </div>

            {/* Birth Date/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-pastel-brown mb-1">출생년도</label>
                <input
                  type="number"
                  value={profile.birthYear ?? ''}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      birthYear: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder="1990"
                  min={1920}
                  max={2025}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-white/30
                             focus:outline-none focus:ring-2 focus:ring-royal-gold/50
                             text-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-pastel-brown mb-1">월</label>
                <input
                  type="number"
                  value={profile.birthMonth ?? ''}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      birthMonth: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder="1"
                  min={1}
                  max={12}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-white/30
                             focus:outline-none focus:ring-2 focus:ring-royal-gold/50
                             text-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-pastel-brown mb-1">일</label>
                <input
                  type="number"
                  value={profile.birthDay ?? ''}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      birthDay: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder="1"
                  min={1}
                  max={31}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-white/30
                             focus:outline-none focus:ring-2 focus:ring-royal-gold/50
                             text-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-pastel-brown mb-1">시</label>
                <input
                  type="number"
                  value={profile.birthHour ?? ''}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      birthHour: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder="0"
                  min={0}
                  max={23}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-white/30
                             focus:outline-none focus:ring-2 focus:ring-royal-gold/50
                             text-gray-800 text-sm"
                />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="mb-4" hover={false}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-royal-gold" />
              활동 통계
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/30">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-royal-gold" />
                  <span className="text-sm text-pastel-brown">분석 횟수</span>
                </div>
                <span className="font-bold text-gray-800">{historyCount}회</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/30">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-royal-gold" />
                  <span className="text-sm text-pastel-brown">가입일</span>
                </div>
                <span className="font-bold text-gray-800 text-sm">{formattedMemberDate}</span>
              </div>
              {favoriteType && (
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/30">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-royal-gold" />
                    <span className="text-sm text-pastel-brown">자주 이용</span>
                  </div>
                  <span className="font-bold text-gray-800 text-sm">{favoriteType}</span>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            className="w-full bg-gradient-to-r from-royal-gold to-amber-500 text-white
                       py-4 px-6 rounded-2xl font-semibold text-lg
                       hover:from-amber-500 hover:to-royal-gold
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200
                       flex items-center justify-center gap-2
                       shadow-lg hover:shadow-xl mb-4"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>프로필 저장</span>
              </>
            )}
          </motion.button>
        </motion.div>

        <AdBanner />
      </div>
    </ProtectedRoute>
  );
}
