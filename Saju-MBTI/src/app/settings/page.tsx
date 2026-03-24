'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Info, TestTube, LogOut, Moon, Sun, Download, Trash2, AlertTriangle, FileText, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import GlassCard from '@/components/GlassCard';
import AdBanner from '@/components/AdBanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, NotificationSettings } from '@/lib/notifications';
import { useTheme } from '@/hooks/useTheme';
import { historyService, preferencesService } from '@/lib/firestore';
import { deleteUser } from 'firebase/auth';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    dailyFortune: false,
    dailyFortuneTime: '09:00',
    reminders: false
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPendingNotifications();
  }, [user]);

  const loadSettings = async () => {
    const saved = await notificationService.getSettings(user);
    setSettings(saved);
  };

  const checkPendingNotifications = async () => {
    const pending = await notificationService.getPending();
    setPendingCount(pending.length);
  };

  const handleToggleNotifications = async () => {
    if (!settings.enabled) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        alert('알림 권한이 필요합니다. 설정에서 권한을 허용해주세요.');
        return;
      }
      await notificationService.initialize();
    }

    const newSettings = { ...settings, enabled: !settings.enabled };

    if (!newSettings.enabled) {
      await notificationService.cancelAll();
      newSettings.dailyFortune = false;
    }

    setSettings(newSettings);
    await notificationService.saveSettings(newSettings, user);
  };

  const handleToggleDailyFortune = async () => {
    if (!settings.enabled) {
      alert('먼저 알림을 활성화해주세요.');
      return;
    }

    const newSettings = { ...settings, dailyFortune: !settings.dailyFortune };

    if (newSettings.dailyFortune) {
      await notificationService.scheduleDailyFortune(settings.dailyFortuneTime);
    } else {
      await notificationService.cancelAll();
    }

    setSettings(newSettings);
    await notificationService.saveSettings(newSettings, user);
    await checkPendingNotifications();
  };

  const handleTimeChange = async (time: string) => {
    const newSettings = { ...settings, dailyFortuneTime: time };
    setSettings(newSettings);
    await notificationService.saveSettings(newSettings, user);

    if (settings.dailyFortune) {
      await notificationService.cancelAll();
      await notificationService.scheduleDailyFortune(time);
      await checkPendingNotifications();
    }
  };

  const handleTestNotification = async () => {
    if (!settings.enabled) {
      alert('먼저 알림을 활성화해주세요.');
      return;
    }

    await notificationService.sendTestNotification();
    alert('1초 후 테스트 알림이 전송됩니다!');
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('로그아웃되었습니다', {
        icon: '👋',
        duration: 2000,
      });
      router.push('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || '로그아웃에 실패했습니다');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleExportData = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    try {
      toast.loading('데이터를 내보내는 중...', { id: 'export' });

      // Get user data from Firestore
      const history = await historyService.getAll(user.uid);
      const preferences = await preferencesService.get(user.uid);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email,
        },
        history,
        preferences,
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saju-mbti-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('데이터를 성공적으로 내보냈습니다', { id: 'export' });
    } catch (error: any) {
      console.error('Export data error:', error);
      toast.error('데이터 내보내기에 실패했습니다', { id: 'export' });
    }
  };

  const handleClearHistory = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    setIsClearing(true);
    try {
      await historyService.clear(user.uid);
      toast.success('기록이 모두 삭제되었습니다');
      setShowClearHistoryModal(false);
    } catch (error: any) {
      console.error('Clear history error:', error);
      toast.error('기록 삭제에 실패했습니다');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    if (deleteConfirmText !== 'DELETE') {
      toast.error('DELETE를 정확히 입력해주세요');
      return;
    }

    setIsDeleting(true);
    try {
      // Delete all user data from Firestore before deleting auth
      // This ensures GDPR compliance and prevents orphaned data

      // Delete history records
      await historyService.clear(user.uid);

      // Delete user preferences
      try {
        await preferencesService.delete(user.uid);
      } catch (error) {
        // Preferences might not exist, continue with deletion
        console.log('No preferences to delete');
      }

      // Delete Firebase Auth account (must be last)
      await deleteUser(user);

      toast.success('계정이 삭제되었습니다', {
        icon: '👋',
        duration: 2000,
      });

      router.push('/');
    } catch (error: any) {
      console.error('Delete account error:', error);

      if (error.code === 'auth/requires-recent-login') {
        toast.error('보안을 위해 다시 로그인한 후 시도해주세요');
      } else {
        toast.error('계정 삭제에 실패했습니다');
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <Settings className="w-12 h-12 text-royal-gold mx-auto mb-2" />
        <h1 className="text-3xl font-bold text-gray-800">설정</h1>
        <p className="text-pastel-brown mt-2">앱 설정을 관리하세요</p>
      </motion.div>

      <GlassCard className="mb-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          {mounted && theme === 'dark' ? <Moon className="w-5 h-5 text-royal-gold" /> : <Sun className="w-5 h-5 text-royal-gold" />}
          테마
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>다크 모드</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>어두운 테마로 전환</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-14 h-8 rounded-full transition-all ${
              mounted && theme === 'dark' ? 'bg-royal-gold' : 'bg-gray-300'
            }`}
          >
            <motion.div
              animate={{ x: mounted && theme === 'dark' ? 24 : 4 }}
              className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
            >
              {mounted && theme === 'dark' ? (
                <Moon className="w-3 h-3 text-gray-800" />
              ) : (
                <Sun className="w-3 h-3 text-gray-800" />
              )}
            </motion.div>
          </button>
        </div>
      </GlassCard>

      <GlassCard className="mb-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Bell className="w-5 h-5 text-royal-gold" />
          알림 설정
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>알림 허용</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>모든 알림 기능 활성화</p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`w-14 h-8 rounded-full transition-all ${
                settings.enabled ? 'bg-royal-gold' : 'bg-gray-300'
              }`}
            >
              <motion.div
                animate={{ x: settings.enabled ? 24 : 4 }}
                className="w-6 h-6 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          <div className="border-t border-white/30 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>일일 운세 알림</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>매일 운세를 알려드립니다</p>
              </div>
              <button
                onClick={handleToggleDailyFortune}
                disabled={!settings.enabled}
                className={`w-14 h-8 rounded-full transition-all ${
                  settings.dailyFortune ? 'bg-royal-gold' : 'bg-gray-300'
                } ${!settings.enabled && 'opacity-50'}`}
              >
                <motion.div
                  animate={{ x: settings.dailyFortune ? 24 : 4 }}
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                />
              </button>
            </div>

            {settings.dailyFortune && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white/30 rounded-lg p-3"
              >
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  알림 시간
                </label>
                <input
                  type="time"
                  value={settings.dailyFortuneTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-royal-gold"
                />
                {pendingCount > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ {pendingCount}개의 알림이 예약되어 있습니다
                  </p>
                )}
              </motion.div>
            )}
          </div>

          <div className="border-t border-white/30 pt-4">
            <button
              onClick={handleTestNotification}
              disabled={!settings.enabled}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                settings.enabled
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              <TestTube className="inline w-5 h-5 mr-2" />
              테스트 알림 보내기
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="mb-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Download className="w-5 h-5 text-royal-gold" />
          데이터 관리
        </h3>

        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white
                     py-3 px-6 rounded-xl font-semibold
                     hover:from-cyan-500 hover:to-blue-500
                     transition-all duration-200
                     flex items-center justify-center gap-2
                     shadow-lg hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            데이터 내보내기
          </button>

          <button
            onClick={() => setShowClearHistoryModal(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white
                     py-3 px-6 rounded-xl font-semibold
                     hover:from-amber-500 hover:to-orange-500
                     transition-all duration-200
                     flex items-center justify-center gap-2
                     shadow-lg hover:shadow-xl"
          >
            <Trash2 className="w-5 h-5" />
            기록 삭제
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white
                     py-3 px-6 rounded-xl font-semibold
                     hover:from-rose-500 hover:to-red-500
                     transition-all duration-200
                     flex items-center justify-center gap-2
                     shadow-lg hover:shadow-xl"
          >
            <AlertTriangle className="w-5 h-5" />
            계정 삭제
          </button>
        </div>
      </GlassCard>

      <GlassCard className="mb-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Info className="w-5 h-5 text-royal-gold" />
          앱 정보
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>버전</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>1.0.3</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>개발자</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>NAMSIK93</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>플랫폼</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Next.js + Capacitor</span>
          </div>

          <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--card-border)' }}>
            <a
              href="/privacy"
              className="flex items-center gap-2 py-2 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-primary)' }}
            >
              <ShieldCheck className="w-4 h-4 text-royal-gold" />
              개인정보 처리방침
            </a>
            <a
              href="/terms"
              className="flex items-center gap-2 py-2 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-primary)' }}
            >
              <FileText className="w-4 h-4 text-royal-gold" />
              서비스 이용약관
            </a>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold text-gray-800 mb-2">알림 사용 가이드</h3>
        <ul className="text-sm text-pastel-brown space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-royal-gold">1.</span>
            <span>알림 허용을 켜주세요</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-royal-gold">2.</span>
            <span>일일 운세 알림을 활성화하세요</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-royal-gold">3.</span>
            <span>원하는 시간을 설정하세요</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-royal-gold">4.</span>
            <span>매일 설정된 시간에 운세를 받아보세요!</span>
          </li>
        </ul>
      </GlassCard>

      <GlassCard className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <LogOut className="w-5 h-5 text-royal-gold" />
          계정
        </h3>
        <motion.button
          onClick={handleLogout}
          disabled={loggingOut}
          whileHover={{ scale: loggingOut ? 1 : 1.02 }}
          whileTap={{ scale: loggingOut ? 1 : 0.98 }}
          className="w-full bg-gradient-to-r from-royal-gold to-amber-500 text-white
                   py-3 px-6 rounded-xl font-semibold
                   hover:from-amber-500 hover:to-royal-gold
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200
                   flex items-center justify-center gap-2
                   shadow-lg hover:shadow-xl"
        >
          {loggingOut ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <LogOut className="w-5 h-5" />
              </motion.div>
              <span>로그아웃 중...</span>
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              <span>로그아웃</span>
            </>
          )}
        </motion.button>
      </GlassCard>

      <AdBanner />

      {/* Clear History Confirmation Modal */}
      {showClearHistoryModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowClearHistoryModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">기록 삭제</h3>
              <p className="text-gray-600">
                모든 사주/MBTI 기록이 삭제됩니다.
                <br />
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearHistoryModal(false)}
                disabled={isClearing}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-xl font-semibold
                         hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleClearHistory}
                disabled={isClearing}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold
                         hover:from-amber-500 hover:to-orange-500 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.div>
                    <span>삭제 중...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>삭제</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">계정 삭제</h3>
              <p className="text-gray-600 mb-4">
                계정과 모든 데이터가 영구적으로 삭제됩니다.
                <br />
                <strong className="text-red-600">이 작업은 되돌릴 수 없습니다.</strong>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                계속하려면 아래에 <strong>DELETE</strong>를 입력하세요
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE 입력"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl
                         focus:outline-none focus:border-red-500 text-center font-mono"
                disabled={isDeleting}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-xl font-semibold
                         hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold
                         hover:from-rose-500 hover:to-red-500 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </motion.div>
                    <span>삭제 중...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    <span>영구 삭제</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </div>
    </ProtectedRoute>
  );
}
