import { HistoryRecord } from '@/types';

const STORAGE_KEY = 'fortune_mbti_history';

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
  }
};
