export type Element = '목' | '화' | '토' | '금' | '수';

export type MBTIType =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export interface SajuInput {
  gender: 'male' | 'female';
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
}

export interface SajuResult {
  id: string;
  date: string;
  input: SajuInput;
  elements: Record<Element, number>;
  description: string;
  luckyElement: Element;
  unluckyElement: Element;
  fortune?: any; // Complete fortune data
  yearlyLuck?: any; // Yearly luck info
}

export interface SajuCompatibility {
  id: string;
  date: string;
  myBirth: SajuInput;
  partnerBirth: SajuInput;
  compatibilityScore: number;
  description: string;
}

export interface MBTICompatibility {
  id: string;
  date: string;
  myMBTI: MBTIType;
  partnerMBTI: MBTIType;
  score: number;
  description: string;
}

export interface FortuneResult {
  id: string;
  date: string;
  message: string;
  luckyNumber: number;
  luckyColor: string;
}

// Destiny Character System Types
export type CharacterCategory = 'analyst' | 'diplomat' | 'sentinel' | 'explorer';

export interface DestinyCharacter {
  id: string;
  mbti: MBTIType;
  element: Element;
  category: CharacterCategory;
  name: string;
  emoji: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  charmPoints: string[];
  dailyFortuneTemplates: string[];
}

export interface DestinyResult {
  id: string;
  date: string;
  mbti: MBTIType;
  birthInfo: SajuInput;
  character: DestinyCharacter;
  element: Element;
  yearElement: Element;
  yearAdvice: string;
}

export interface DestinyCompatibilityResult {
  id: string;
  date: string;
  myCharacter: DestinyCharacter;
  partnerCharacter: DestinyCharacter;
  totalScore: number;
  mbtiScore: number;
  elementScore: number;
  compatibilityType: '천생연분' | '애증의 소울메이트' | '정신적 동반자' | '비즈니스 파트너';
  description: string;
  locationRecommendations: string[];
  bestMeetingTimes: string[];
}

export interface DailyFortuneResult {
  id: string;
  date: string;
  character: DestinyCharacter;
  fortuneMessage: string;
  luckyTime: string;
  luckyAction: string;
  avoidAction: string;
  compatibleCharacter: DestinyCharacter;
  luckyNumber: number;
  luckyColor: string;
}

export type HistoryItem = SajuResult | SajuCompatibility | MBTICompatibility | FortuneResult | DestinyResult | DestinyCompatibilityResult | DailyFortuneResult;

export interface HistoryRecord {
  type: 'saju' | 'saju-compatibility' | 'mbti' | 'fortune' | 'destiny' | 'destiny-compatibility' | 'daily-fortune';
  data: HistoryItem;
}
