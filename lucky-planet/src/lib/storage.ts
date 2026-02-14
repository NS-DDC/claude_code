/**
 * LocalStorage 기반 CRUD 유틸리티
 * DB 없이 모든 데이터를 브라우저에 저장/관리
 */

export interface LottoRecord {
  id: string;
  numbers: number[];
  bonusNumber?: number;
  createdAt: string;
  memo?: string;
  isFavorite: boolean;
  groupId?: string;
  lineIndex?: number;
}

export interface TicketPhoto {
  id: string;
  dataUrl: string;
  createdAt: string;
}

export interface AppSettings {
  excludeNumbers: number[];
  includeNumbers: number[];
  autoSave: boolean;
  darkMode: boolean;
  notificationEnabled: boolean;
  defaultLineCount: number;
}

const KEYS = {
  HISTORY: 'lotto_history',
  SETTINGS: 'lotto_settings',
  FORTUNE: 'lotto_fortune_date',
  FORTUNE_SCORE: 'lotto_fortune_score',
  TICKET_PHOTOS: 'lotto_ticket_photos',
} as const;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// --- History CRUD ---

export function getHistory(): LottoRecord[] {
  if (!isBrowser()) return [];
  try {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addHistory(record: Omit<LottoRecord, 'id' | 'createdAt'>): LottoRecord {
  const history = getHistory();
  const newRecord: LottoRecord = {
    ...record,
    id: crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
  };
  history.unshift(newRecord);
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  return newRecord;
}

export function updateHistory(id: string, updates: Partial<LottoRecord>): LottoRecord | null {
  const history = getHistory();
  const index = history.findIndex((r) => r.id === id);
  if (index === -1) return null;
  history[index] = { ...history[index], ...updates };
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  return history[index];
}

export function deleteHistory(id: string): boolean {
  const history = getHistory();
  const filtered = history.filter((r) => r.id !== id);
  if (filtered.length === history.length) return false;
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(filtered));
  return true;
}

export function clearHistory(): void {
  if (isBrowser()) {
    localStorage.removeItem(KEYS.HISTORY);
  }
}

export function addHistoryBatch(sets: number[][]): LottoRecord[] {
  const history = getHistory();
  const groupId = crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
  const now = new Date().toISOString();
  const newRecords: LottoRecord[] = sets.map((numbers, idx) => ({
    id: crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2) + idx,
    numbers,
    createdAt: now,
    isFavorite: false,
    groupId,
    lineIndex: idx,
  }));
  history.unshift(...newRecords);
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  return newRecords;
}

export function toggleFavorite(id: string): boolean {
  const history = getHistory();
  const record = history.find((r) => r.id === id);
  if (!record) return false;
  record.isFavorite = !record.isFavorite;
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  return record.isFavorite;
}

// --- Settings CRUD ---

const DEFAULT_SETTINGS: AppSettings = {
  excludeNumbers: [],
  includeNumbers: [],
  autoSave: true,
  darkMode: false,
  notificationEnabled: false,
  defaultLineCount: 1,
};

export function getSettings(): AppSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...updates };
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}

export function resetSettings(): AppSettings {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  return DEFAULT_SETTINGS;
}

// --- Fortune ---

export function getTodayFortune(): { score: number; date: string } | null {
  if (!isBrowser()) return null;
  const today = new Date().toISOString().slice(0, 10);
  const savedDate = localStorage.getItem(KEYS.FORTUNE);
  if (savedDate === today) {
    const score = Number(localStorage.getItem(KEYS.FORTUNE_SCORE) ?? 0);
    return { score, date: today };
  }
  return null;
}

export function saveTodayFortune(score: number): void {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(KEYS.FORTUNE, today);
  localStorage.setItem(KEYS.FORTUNE_SCORE, String(score));
}

// --- Statistics helpers ---

export function getNumberFrequency(): Map<number, number> {
  const history = getHistory();
  const freq = new Map<number, number>();
  for (let i = 1; i <= 45; i++) freq.set(i, 0);
  history.forEach((record) => {
    record.numbers.forEach((num) => {
      freq.set(num, (freq.get(num) ?? 0) + 1);
    });
  });
  return freq;
}

export function getNumberFrequencyFiltered(favoritesOnly: boolean): { freq: Map<number, number>; totalSets: number } {
  const history = getHistory();
  const filtered = favoritesOnly ? history.filter((r) => r.isFavorite) : history;
  const freq = new Map<number, number>();
  for (let i = 1; i <= 45; i++) freq.set(i, 0);
  filtered.forEach((record) => {
    record.numbers.forEach((num) => {
      freq.set(num, (freq.get(num) ?? 0) + 1);
    });
  });
  return { freq, totalSets: filtered.length };
}

// --- Advanced Statistics ---

export function getPairFrequency(favoritesOnly: boolean): Map<string, number> {
  const history = getHistory();
  const filtered = favoritesOnly ? history.filter((r) => r.isFavorite) : history;
  const pairs = new Map<string, number>();
  filtered.forEach((record) => {
    const nums = record.numbers;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
    }
  });
  return pairs;
}

export function getRangeDistribution(favoritesOnly: boolean): { range: string; count: number; total: number }[] {
  const history = getHistory();
  const filtered = favoritesOnly ? history.filter((r) => r.isFavorite) : history;
  const ranges = [
    { range: '1~10', min: 1, max: 10, count: 0 },
    { range: '11~20', min: 11, max: 20, count: 0 },
    { range: '21~30', min: 21, max: 30, count: 0 },
    { range: '31~40', min: 31, max: 40, count: 0 },
    { range: '41~45', min: 41, max: 45, count: 0 },
  ];
  const total = filtered.length * 6;
  filtered.forEach((record) => {
    record.numbers.forEach((num) => {
      const r = ranges.find((r) => num >= r.min && num <= r.max);
      if (r) r.count++;
    });
  });
  return ranges.map(({ range, count }) => ({ range, count, total }));
}

export function getOddEvenRatio(favoritesOnly: boolean): { odd: number; even: number; total: number } {
  const history = getHistory();
  const filtered = favoritesOnly ? history.filter((r) => r.isFavorite) : history;
  let odd = 0, even = 0;
  filtered.forEach((record) => {
    record.numbers.forEach((num) => {
      if (num % 2 === 0) even++;
      else odd++;
    });
  });
  return { odd, even, total: odd + even };
}

export function getSumDistribution(favoritesOnly: boolean): { sums: number[]; avg: number } {
  const history = getHistory();
  const filtered = favoritesOnly ? history.filter((r) => r.isFavorite) : history;
  const sums = filtered.map((r) => r.numbers.reduce((a, b) => a + b, 0));
  const avg = sums.length > 0 ? Math.round(sums.reduce((a, b) => a + b, 0) / sums.length) : 0;
  return { sums, avg };
}

// --- Winning Number Check ---

export interface WinCheckResult {
  recordId: string;
  numbers: number[];
  matchCount: number;
  hasBonus: boolean;
  rank: number | null;
  groupId?: string;
  lineIndex?: number;
  isFavorite: boolean;
  createdAt: string;
}

export function checkAllRecordsAgainstWinning(
  winNumbers: number[],
  bonusNumber: number,
  favoritesOnly: boolean
): WinCheckResult[] {
  const history = getHistory();
  const filtered = favoritesOnly ? history.filter((r) => r.isFavorite) : history;
  return filtered.map((record) => {
    const matchCount = record.numbers.filter((n) => winNumbers.includes(n)).length;
    const hasBonus = record.numbers.includes(bonusNumber);
    let rank: number | null = null;
    if (matchCount === 6) rank = 1;
    else if (matchCount === 5 && hasBonus) rank = 2;
    else if (matchCount === 5) rank = 3;
    else if (matchCount === 4) rank = 4;
    else if (matchCount === 3) rank = 5;
    return {
      recordId: record.id,
      numbers: record.numbers,
      matchCount,
      hasBonus,
      rank,
      groupId: record.groupId,
      lineIndex: record.lineIndex,
      isFavorite: record.isFavorite,
      createdAt: record.createdAt,
    };
  });
}

// --- Ticket Photos CRUD ---

export function getTicketPhotos(): TicketPhoto[] {
  if (!isBrowser()) return [];
  try {
    const data = localStorage.getItem(KEYS.TICKET_PHOTOS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addTicketPhoto(dataUrl: string): TicketPhoto {
  const photos = getTicketPhotos();
  const newPhoto: TicketPhoto = {
    id: crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2),
    dataUrl,
    createdAt: new Date().toISOString(),
  };
  photos.unshift(newPhoto);
  // 최대 10장 유지
  if (photos.length > 10) photos.length = 10;
  localStorage.setItem(KEYS.TICKET_PHOTOS, JSON.stringify(photos));
  return newPhoto;
}

export function deleteTicketPhoto(id: string): boolean {
  const photos = getTicketPhotos();
  const filtered = photos.filter((p) => p.id !== id);
  if (filtered.length === photos.length) return false;
  localStorage.setItem(KEYS.TICKET_PHOTOS, JSON.stringify(filtered));
  return true;
}
