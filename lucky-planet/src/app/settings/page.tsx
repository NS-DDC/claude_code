'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, RotateCcw, Trash2, Info, ChevronRight, ToggleLeft, ToggleRight, Hash } from 'lucide-react';
import { getSettings, updateSettings, resetSettings, clearHistory, type AppSettings } from '@/lib/storage';
import { scheduleSaturdayReminder, cancelAllReminders, checkNotificationStatus } from '@/lib/notifications';
import { Capacitor } from '@capacitor/core';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [excludeInput, setExcludeInput] = useState('');
  const [includeInput, setIncludeInput] = useState('');
  const [notifActive, setNotifActive] = useState(false);

  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    setExcludeInput(s.excludeNumbers.join(', '));
    setIncludeInput(s.includeNumbers.join(', '));

    checkNotificationStatus().then(setNotifActive);
  }, []);

  const parseNums = (input: string): number[] =>
    input
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => n >= 1 && n <= 45);

  const handleSaveFilters = () => {
    const updated = updateSettings({
      excludeNumbers: parseNums(excludeInput),
      includeNumbers: parseNums(includeInput),
    });
    setSettings(updated);
    alert('필터 설정이 저장되었습니다.');
  };

  const handleToggle = (key: 'autoSave' | 'darkMode') => {
    if (!settings) return;
    const updated = updateSettings({ [key]: !settings[key] });
    setSettings(updated);

    if (key === 'darkMode') {
      document.documentElement.classList.toggle('dark', !settings.darkMode);
    }
  };

  const handleToggleNotification = async () => {
    if (!settings) return;

    if (notifActive) {
      await cancelAllReminders();
      updateSettings({ notificationEnabled: false });
      setSettings({ ...settings, notificationEnabled: false });
      setNotifActive(false);
    } else {
      const success = await scheduleSaturdayReminder();
      if (success) {
        updateSettings({ notificationEnabled: true });
        setSettings({ ...settings, notificationEnabled: true });
        setNotifActive(true);
      } else if (isNative) {
        alert('알림 권한이 필요합니다. 기기 설정에서 알림을 허용해주세요.');
      }
    }
  };

  const handleLineCountChange = (count: number) => {
    if (!settings) return;
    const updated = updateSettings({ defaultLineCount: count });
    setSettings(updated);
  };

  const handleResetSettings = () => {
    if (window.confirm('설정을 초기화하시겠습니까?')) {
      const s = resetSettings();
      setSettings(s);
      setExcludeInput('');
      setIncludeInput('');
      document.documentElement.classList.remove('dark');
    }
  };

  const handleClearData = () => {
    if (window.confirm('모든 번호 기록을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      clearHistory();
      alert('모든 기록이 삭제되었습니다.');
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 py-4">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1"
      >
        <div className="flex items-center justify-center gap-2">
          <Settings className="text-gray-500 dark:text-gray-400" size={24} />
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">설정</h1>
        </div>
      </motion.div>

      {/* 기본 생성 줄 수 */}
      <div className="glass-card-solid p-5 space-y-3 dark:bg-gray-800/70 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Hash size={14} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">기본 생성 줄 수</h2>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">홈에서 기본으로 선택되는 줄 수입니다.</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => handleLineCountChange(n)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                settings.defaultLineCount === n
                  ? 'bg-gold-300 text-white shadow-md shadow-gold-200/50'
                  : 'bg-white/60 text-gray-500 border border-white/30 hover:bg-white/80 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
              }`}
            >
              {n}줄
            </button>
          ))}
        </div>
      </div>

      {/* 기본 번호 필터 */}
      <div className="glass-card-solid p-5 space-y-4 dark:bg-gray-800/70 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">기본 번호 필터</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">매번 번호 생성 시 자동으로 적용됩니다.</p>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block dark:text-gray-400">
            항상 포함할 번호
          </label>
          <input
            type="text"
            value={includeInput}
            onChange={(e) => setIncludeInput(e.target.value)}
            placeholder="예: 7, 14, 21"
            className="w-full px-3 py-2.5 text-sm bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block dark:text-gray-400">
            항상 제외할 번호
          </label>
          <input
            type="text"
            value={excludeInput}
            onChange={(e) => setExcludeInput(e.target.value)}
            placeholder="예: 3, 33, 43"
            className="w-full px-3 py-2.5 text-sm bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>

        <button
          onClick={handleSaveFilters}
          className="w-full py-2.5 bg-gold-300 text-white text-sm font-medium rounded-xl hover:bg-gold-400 transition-colors"
        >
          필터 저장
        </button>
      </div>

      {/* 토글 설정 */}
      <div className="glass-card-solid overflow-hidden divide-y divide-gray-100 dark:bg-gray-800/70 dark:border-gray-700 dark:divide-gray-700">
        <ToggleRow
          label="자동 저장"
          description="생성한 번호를 자동으로 기록에 저장"
          isOn={settings.autoSave}
          onToggle={() => handleToggle('autoSave')}
        />
        <ToggleRow
          label="다크 모드"
          description="어두운 테마 사용"
          isOn={settings.darkMode}
          onToggle={() => handleToggle('darkMode')}
        />
        <ToggleRow
          label="추첨일 알림"
          description={isNative ? '매주 토요일 17시 추첨 알림' : '네이티브 앱에서만 사용 가능'}
          isOn={isNative ? notifActive : false}
          onToggle={handleToggleNotification}
          disabled={!isNative}
        />
      </div>

      {/* 데이터 관리 */}
      <div className="glass-card-solid overflow-hidden divide-y divide-gray-100 dark:bg-gray-800/70 dark:border-gray-700 dark:divide-gray-700">
        <button
          onClick={handleResetSettings}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-700/50"
        >
          <div className="flex items-center gap-3">
            <RotateCcw size={18} className="text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-200">설정 초기화</span>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
        <button
          onClick={handleClearData}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-red-50/50 transition-colors dark:hover:bg-red-900/20"
        >
          <div className="flex items-center gap-3">
            <Trash2 size={18} className="text-red-400" />
            <span className="text-sm text-red-500">모든 기록 삭제</span>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      {/* 앱 정보 */}
      <div className="glass-card-solid p-5 space-y-2 dark:bg-gray-800/70 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">앱 정보</h2>
        </div>
        <div className="space-y-1 text-xs text-gray-400 dark:text-gray-500">
          <p>Lucky Planet - 로또 번호 추출기 v1.2.0</p>
          <p>모든 데이터는 기기 내 LocalStorage에 저장됩니다.</p>
          <p>이 앱은 로또 번호를 랜덤으로 생성하며, 당첨을 보장하지 않습니다.</p>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  isOn,
  onToggle,
  disabled,
}: {
  label: string;
  description: string;
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-700/50 ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="text-left">
        <p className="text-sm text-gray-700 dark:text-gray-200">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">{description}</p>
      </div>
      {isOn ? (
        <ToggleRight size={28} className="text-gold-400 flex-shrink-0" />
      ) : (
        <ToggleLeft size={28} className="text-gray-300 flex-shrink-0" />
      )}
    </button>
  );
}
