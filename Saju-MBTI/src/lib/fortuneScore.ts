import { UserProfile, Element, MBTIType } from '@/types';
import { SeededRandom } from './seedRandom';
import { getYearlyLuck } from './yearlyLuck';

export interface FortuneScoreResult {
  totalScore: number;
  breakdown: {
    elementHarmony: number;
    mbtiEnergy: number;
    birthDayBonus: number;
    yearlyAlignment: number;
  };
  trend: 'rising' | 'stable' | 'falling';
  level: string;
  emoji: string;
}

// 요일별 주도 오행 (일~토)
const DAY_ELEMENTS: Element[] = ['토', '목', '화', '수', '목', '금', '토'];

// 오행 상생 관계 (생하는 원소 → 생받는 원소)
const ELEMENT_SHENG: Record<Element, Element> = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목'
};

// 오행 상극 관계
const ELEMENT_KE: Record<Element, Element> = {
  '목': '토', '화': '금', '토': '수', '금': '목', '수': '화'
};

function getElementHarmony(userElement: Element, dayElement: Element): number {
  if (userElement === dayElement) return 75; // 비화 - 안정
  if (ELEMENT_SHENG[userElement] === dayElement) return 90; // 상생 - 좋음
  if (ELEMENT_SHENG[dayElement] === userElement) return 85; // 피생 - 좋음
  if (ELEMENT_KE[userElement] === dayElement) return 40; // 상극 - 주의
  if (ELEMENT_KE[dayElement] === userElement) return 35; // 피극 - 주의
  return 60;
}

function getMBTIEnergy(mbti: MBTIType, rng: SeededRandom): number {
  // MBTI별 기본 에너지 변동폭
  const isExtrovert = mbti.startsWith('E');
  const isIntuitive = mbti.charAt(1) === 'N';
  const base = isExtrovert ? 55 : 50;
  const variability = isIntuitive ? 30 : 20;
  return base + rng.nextInt(0, variability);
}

function getBirthDayBonus(birthMonth: number, birthDay: number, month: number, day: number): number {
  // 생일 당일 대박 보너스
  if (birthMonth === month && birthDay === day) return 20;
  // 생일 주간 소소한 보너스
  const diff = Math.abs((month * 31 + day) - (birthMonth * 31 + birthDay));
  if (diff <= 3) return 10;
  if (diff <= 7) return 5;
  return 0;
}

function getYearlyAlignment(userElement: Element, yearElement: Element): number {
  if (userElement === yearElement) return 15;
  if (ELEMENT_SHENG[yearElement] === userElement) return 20;
  if (ELEMENT_SHENG[userElement] === yearElement) return 18;
  if (ELEMENT_KE[userElement] === yearElement) return 5;
  return 10;
}

function createDateSeed(profile: UserProfile, dateString: string): number {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const mbtiVal = profile.mbti.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const elemVal = profile.element.charCodeAt(0);
  return year * 10000 + month * 100 + day + mbtiVal * 1000 + elemVal * 100;
}

export function calculateFortuneScore(
  profile: UserProfile,
  dateString: string = new Date().toISOString()
): FortuneScoreResult {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  const dayElement = DAY_ELEMENTS[dayOfWeek];
  const yearInfo = getYearlyLuck(year);

  const seed = createDateSeed(profile, dateString);
  const rng = new SeededRandom(seed);

  // 각 요소 계산
  const elementHarmony = getElementHarmony(profile.element, dayElement);
  const mbtiEnergy = getMBTIEnergy(profile.mbti, rng);
  const birthDayBonus = getBirthDayBonus(
    profile.birthInfo.birthMonth,
    profile.birthInfo.birthDay,
    month,
    day
  );
  const yearlyAlignment = getYearlyAlignment(profile.element, yearInfo.element);

  // 가중 평균 + 보너스
  const rawScore = Math.round(
    elementHarmony * 0.35 +
    mbtiEnergy * 0.30 +
    yearlyAlignment * 0.20 +
    rng.nextInt(-5, 15) * 0.15 + // 약간의 랜덤 변동
    birthDayBonus
  );

  const totalScore = Math.max(0, Math.min(100, rawScore));

  // 트렌드 계산 (어제 점수와 비교)
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdaySeed = createDateSeed(profile, yesterday.toISOString());
  const yesterdayRng = new SeededRandom(yesterdaySeed);
  const yesterdayDayElement = DAY_ELEMENTS[yesterday.getDay()];
  const yesterdayScore = Math.round(
    getElementHarmony(profile.element, yesterdayDayElement) * 0.35 +
    getMBTIEnergy(profile.mbti, yesterdayRng) * 0.30 +
    yearlyAlignment * 0.20 +
    yesterdayRng.nextInt(-5, 15) * 0.15
  );

  let trend: 'rising' | 'stable' | 'falling' = 'stable';
  if (totalScore - yesterdayScore >= 5) trend = 'rising';
  else if (yesterdayScore - totalScore >= 5) trend = 'falling';

  // 등급
  let level: string;
  let emoji: string;
  if (totalScore >= 85) { level = '대길'; emoji = '🌟'; }
  else if (totalScore >= 70) { level = '길'; emoji = '✨'; }
  else if (totalScore >= 50) { level = '소길'; emoji = '🌤'; }
  else if (totalScore >= 30) { level = '평'; emoji = '☁️'; }
  else { level = '흉'; emoji = '🌧'; }

  return {
    totalScore,
    breakdown: {
      elementHarmony,
      mbtiEnergy,
      birthDayBonus,
      yearlyAlignment
    },
    trend,
    level,
    emoji
  };
}

export function getWeeklyScores(
  profile: UserProfile,
  startDate?: Date
): FortuneScoreResult[] {
  const start = startDate || getMonday(new Date());
  const scores: FortuneScoreResult[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    scores.push(calculateFortuneScore(profile, date.toISOString()));
  }

  return scores;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDayNames(): string[] {
  return ['월', '화', '수', '목', '금', '토', '일'];
}
