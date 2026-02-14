import { MBTIType, Element, DestinyCharacter, DailyFortuneResult } from '@/types';
import { getDestinyCharacter, getAllCharacters } from './destinyCharacter';
import { SeededRandom } from './seedRandom';
import { calculateDestinyCompatibility } from './destinyCompatibility';

/**
 * Lucky time periods
 */
const LUCKY_TIMES = [
  '새벽 (5-7시)',
  '아침 (7-9시)',
  '오전 (9-11시)',
  '점심 (11-13시)',
  '오후 (13-15시)',
  '늦은 오후 (15-17시)',
  '저녁 (17-19시)',
  '밤 (19-21시)',
  '깊은 밤 (21-23시)',
  '자정 (23-1시)'
];

/**
 * Lucky colors by element
 */
const ELEMENT_COLORS: Record<Element, string[]> = {
  '목': ['초록색', '청록색', '연두색', '올리브색'],
  '화': ['빨간색', '주황색', '분홍색', '자주색'],
  '토': ['노란색', '갈색', '베이지색', '황토색'],
  '금': ['흰색', '은색', '금색', '회색'],
  '수': ['파란색', '검은색', '남색', '청색']
};

/**
 * Lucky actions by element
 */
const ELEMENT_ACTIONS: Record<Element, string[]> = {
  '목': [
    '새로운 프로젝트 시작하기',
    '독서하기',
    '식물 돌보기',
    '산책하기',
    '학습하기',
    '아이디어 기록하기',
    '계획 세우기'
  ],
  '화': [
    '운동하기',
    '사람들과 만나기',
    '파티 참석하기',
    '대담한 결정 내리기',
    '프레젠테이션하기',
    '열정적으로 일하기',
    '도전하기'
  ],
  '토': [
    '집안 정리하기',
    '휴식 취하기',
    '명상하기',
    '전통 음식 먹기',
    '가족과 시간 보내기',
    '안정적인 루틴 유지하기',
    '저축하기'
  ],
  '금': [
    '중요한 결정 내리기',
    '재정 관리하기',
    '원칙 지키기',
    '계약 체결하기',
    '정리정돈하기',
    '분석하기',
    '투자하기'
  ],
  '수': [
    '명상하기',
    '수영하기',
    '음악 듣기',
    '창의적 활동하기',
    '유연하게 대처하기',
    '물가 산책하기',
    '깊이 생각하기'
  ]
};

/**
 * Actions to avoid by element (opposite element actions)
 */
const ELEMENT_AVOID: Record<Element, string[]> = {
  '목': [
    '과도한 지출',
    '충동적 결정',
    '대립하기',
    '무리한 운동',
    '과도한 음주'
  ],
  '화': [
    '중요한 재정 결정',
    '성급한 판단',
    '과도한 열정',
    '무리한 약속',
    '감정적 대립'
  ],
  '토': [
    '급격한 변화',
    '무모한 도전',
    '충동 소비',
    '과도한 외출',
    '무리한 계획'
  ],
  '금': [
    '감정적 결정',
    '융통성 없는 태도',
    '과도한 비판',
    '완벽주의',
    '고집 부리기'
  ],
  '수': [
    '우유부단',
    '회피하기',
    '과도한 사색',
    '결정 미루기',
    '현실 도피'
  ]
};

/**
 * Create seed from date and character
 */
function createSeedFromDate(mbti: MBTIType, element: Element, dateString: string): number {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Combine date with character info for unique seed
  const mbtiValue = mbti.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const elementValue = element.charCodeAt(0);

  return year * 10000 + month * 100 + day + mbtiValue * 1000 + elementValue * 100;
}

/**
 * Generate lucky time
 */
function generateLuckyTime(rng: SeededRandom): string {
  return rng.choice(LUCKY_TIMES);
}

/**
 * Generate lucky action
 */
function generateLuckyAction(element: Element, rng: SeededRandom): string {
  const actions = ELEMENT_ACTIONS[element];
  return rng.choice(actions);
}

/**
 * Generate avoid action
 */
function generateAvoidAction(element: Element, rng: SeededRandom): string {
  const actions = ELEMENT_AVOID[element];
  return rng.choice(actions);
}

/**
 * Generate lucky color
 */
function generateLuckyColor(element: Element, rng: SeededRandom): string {
  const colors = ELEMENT_COLORS[element];
  return rng.choice(colors);
}

/**
 * Select compatible character for the day
 */
function selectCompatibleCharacter(
  mbti: MBTIType,
  element: Element,
  rng: SeededRandom
): DestinyCharacter {
  // Get all characters and filter out self
  const allChars = getAllCharacters().filter(c => !(c.mbti === mbti && c.element === element));

  // Calculate compatibility with a few random characters and pick the best
  const candidates = rng.shuffle(allChars).slice(0, 10);

  let bestChar = candidates[0];
  let bestScore = 0;

  for (const candidate of candidates) {
    const compat = calculateDestinyCompatibility(mbti, element, candidate.mbti, candidate.element);
    if (compat.totalScore > bestScore) {
      bestScore = compat.totalScore;
      bestChar = candidate;
    }
  }

  return bestChar;
}

/**
 * Get daily fortune for a character
 */
export function getDailyFortune(
  mbti: MBTIType,
  element: Element,
  dateString: string = new Date().toISOString()
): DailyFortuneResult {
  // Get character
  const character = getDestinyCharacter(mbti, element);

  // Create seeded RNG for this date and character
  const seed = createSeedFromDate(mbti, element, dateString);
  const rng = new SeededRandom(seed);

  // Select fortune message from character's templates
  const fortuneMessage = rng.choice(character.dailyFortuneTemplates);

  // Generate lucky elements
  const luckyTime = generateLuckyTime(rng);
  const luckyAction = generateLuckyAction(element, rng);
  const avoidAction = generateAvoidAction(element, rng);
  const luckyColor = generateLuckyColor(element, rng);
  const luckyNumber = rng.nextInt(1, 99);

  // Select compatible character
  const compatibleCharacter = selectCompatibleCharacter(mbti, element, rng);

  return {
    id: `daily_fortune_${Date.now()}_${Math.random()}`,
    date: dateString,
    character,
    fortuneMessage,
    luckyTime,
    luckyAction,
    avoidAction,
    compatibleCharacter,
    luckyNumber,
    luckyColor
  };
}

/**
 * Get daily fortune for today
 */
export function getTodayFortune(mbti: MBTIType, element: Element): DailyFortuneResult {
  return getDailyFortune(mbti, element, new Date().toISOString());
}
