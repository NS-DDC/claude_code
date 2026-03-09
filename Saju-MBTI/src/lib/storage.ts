import { HistoryRecord, UserProfile } from '@/types';

const STORAGE_KEY = 'fortune_mbti_history';
const PROFILE_KEY = 'user_profile';

export const storage = {
  // 모든 히스토리 가져오기
  getAll(): HistoryRecord[] {
    if (typeof window === 'undefined') return [];

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  },

  // 새 항목 추가
  add(record: HistoryRecord): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getAll();
      history.unshift(record); // 최신 항목을 앞에 추가
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to add history:', error);
    }
  },

  // ID로 항목 삭제
  delete(id: string): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getAll();
      const filtered = history.filter(record => record.data.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete history:', error);
    }
  },

  // 모든 히스토리 삭제
  clear(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },

  // ID로 특정 항목 가져오기
  getById(id: string): HistoryRecord | null {
    const history = this.getAll();
    return history.find(record => record.data.id === id) || null;
  },

  // 타입별 히스토리 가져오기
  getByType(type: HistoryRecord['type']): HistoryRecord[] {
    const history = this.getAll();
    return history.filter(record => record.type === type);
  },

  // 사용자 선호 정보 가져오기 (MBTI + 생년월일)
  getUserPreferences(): { mbti?: string; element?: string; birthInfo?: any } | null {
    if (typeof window === 'undefined') return null;

    try {
      const mbti = localStorage.getItem('userMBTI');
      const element = localStorage.getItem('userElement');
      const birthInfo = localStorage.getItem('userBirthInfo');

      return {
        mbti: mbti || undefined,
        element: element || undefined,
        birthInfo: birthInfo ? JSON.parse(birthInfo) : undefined
      };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  },

  // 사용자 선호 정보 저장
  saveUserPreferences(mbti: string, element: string, birthInfo: any): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('userMBTI', mbti);
      localStorage.setItem('userElement', element);
      localStorage.setItem('userBirthInfo', JSON.stringify(birthInfo));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  },

  // 프로필 존재 여부 확인
  hasProfile(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PROFILE_KEY) !== null;
  },

  // 프로필 가져오기
  getProfile(): UserProfile | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  },

  // 프로필 저장 (하위호환 유지)
  saveProfile(profile: UserProfile): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      // 하위호환: 기존 키에도 저장
      localStorage.setItem('userMBTI', profile.mbti);
      localStorage.setItem('userElement', profile.element);
      localStorage.setItem('userBirthInfo', JSON.stringify(profile.birthInfo));
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  },

  // 프로필 삭제
  deleteProfile(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem('userMBTI');
      localStorage.removeItem('userElement');
      localStorage.removeItem('userBirthInfo');
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  }
};
