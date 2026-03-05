import { SajuInput, SajuResult, Element, SajuCompatibility } from '@/types';

// ============================================================
// 기초 데이터 (Fundamental Data)
// ============================================================

/** 천간(天干) - 10 Heavenly Stems */
export const heavenlyStems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;

/** 지지(地支) - 12 Earthly Branches */
export const earthlyBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;

/** 천간 → 오행 매핑 */
export const stemElementMap: Record<string, Element> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
};

/** 지지 → 오행 매핑 */
export const branchElementMap: Record<string, Element> = {
  '자': '수', '축': '토',
  '인': '목', '묘': '목',
  '진': '토', '사': '화',
  '오': '화', '미': '토',
  '신': '금', '유': '금',
  '술': '토', '해': '수',
};

/** 천간 음양: 양(+) = true, 음(-) = false */
const stemPolarity: Record<string, boolean> = {
  '갑': true, '을': false,
  '병': true, '정': false,
  '무': true, '기': false,
  '경': true, '신': false,
  '임': true, '계': false,
};

/** 지지 → 띠 이름 매핑 */
const zodiacAnimalMap: Record<string, string> = {
  '자': '쥐', '축': '소', '인': '호랑이', '묘': '토끼',
  '진': '용', '사': '뱀', '오': '말', '미': '양',
  '신': '원숭이', '유': '닭', '술': '개', '해': '돼지',
};

// ============================================================
// 오행 관계 (Five Element Relationships)
// ============================================================

/** 상생(相生) - Generation cycle: 목→화→토→금→수→목 */
const generationCycle: Record<Element, Element> = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
};

/** 상극(相剋) - Overcoming cycle: 목→토, 토→수, 수→화, 화→금, 금→목 */
const overcomingCycle: Record<Element, Element> = {
  '목': '토', '토': '수', '수': '화', '화': '금', '금': '목',
};

/** 비화(比和) - same element relationship */
function isSameElement(a: Element, b: Element): boolean {
  return a === b;
}

/** Check if a generates b (a가 b를 생함) */
function isGenerating(a: Element, b: Element): boolean {
  return generationCycle[a] === b;
}

/** Check if a overcomes b (a가 b를 극함) */
function isOvercoming(a: Element, b: Element): boolean {
  return overcomingCycle[a] === b;
}

// ============================================================
// 천간합(天干合) - Heavenly Stem Combinations
// ============================================================

/** 천간합 pairs: 갑-기(토), 을-경(금), 병-신(수), 정-임(목), 무-계(화) */
const stemCombinations: [number, number, Element][] = [
  [0, 5, '토'], // 갑-기 → 토
  [1, 6, '금'], // 을-경 → 금
  [2, 7, '수'], // 병-신 → 수
  [3, 8, '목'], // 정-임 → 목
  [4, 9, '화'], // 무-계 → 화
];

function getStemCombination(stemIdx1: number, stemIdx2: number): Element | null {
  for (const [a, b, element] of stemCombinations) {
    if ((stemIdx1 === a && stemIdx2 === b) || (stemIdx1 === b && stemIdx2 === a)) {
      return element;
    }
  }
  return null;
}

// ============================================================
// 지지육합(地支六合) - Earthly Branch Six Harmonies
// ============================================================

/** 지지육합 pairs: 자-축(토), 인-해(목), 묘-술(화), 진-유(금), 사-신(수), 오-미(화) */
const branchSixHarmonies: [number, number, Element][] = [
  [0, 1, '토'],   // 자-축 → 토
  [2, 11, '목'],  // 인-해 → 목
  [3, 10, '화'],  // 묘-술 → 화
  [4, 9, '금'],   // 진-유 → 금
  [5, 8, '수'],   // 사-신 → 수
  [6, 7, '화'],   // 오-미 → 화
];

function getBranchSixHarmony(branchIdx1: number, branchIdx2: number): Element | null {
  for (const [a, b, element] of branchSixHarmonies) {
    if ((branchIdx1 === a && branchIdx2 === b) || (branchIdx1 === b && branchIdx2 === a)) {
      return element;
    }
  }
  return null;
}

// ============================================================
// 지지삼합(地支三合) - Earthly Branch Triple Harmonies
// ============================================================

/** 지지삼합 groups: 신-자-진(수), 해-묘-미(목), 인-오-술(화), 사-유-축(금) */
const branchTripleHarmonies: [number, number, number, Element][] = [
  [8, 0, 4, '수'],   // 신-자-진 → 수
  [11, 3, 7, '목'],  // 해-묘-미 → 목
  [2, 6, 10, '화'],  // 인-오-술 → 화
  [5, 9, 1, '금'],   // 사-유-축 → 금
];

function getTripleHarmonyCount(branches: number[]): { element: Element; count: number }[] {
  const results: { element: Element; count: number }[] = [];
  for (const [a, b, c, element] of branchTripleHarmonies) {
    let count = 0;
    if (branches.includes(a)) count++;
    if (branches.includes(b)) count++;
    if (branches.includes(c)) count++;
    if (count >= 2) {
      results.push({ element, count });
    }
  }
  return results;
}

// ============================================================
// 지지방합(地支方合) - Directional Combinations
// ============================================================

/** 방합: 인-묘-진(목), 사-오-미(화), 신-유-술(금), 해-자-축(수) */
const directionalCombinations: [number, number, number, Element][] = [
  [2, 3, 4, '목'],   // 인-묘-진 → 목
  [5, 6, 7, '화'],   // 사-오-미 → 화
  [8, 9, 10, '금'],  // 신-유-술 → 금
  [11, 0, 1, '수'],  // 해-자-축 → 수
];

// ============================================================
// 지지충(地支冲) - Earthly Branch Clashes
// ============================================================

/** 지지충 pairs (서로 6칸 차이): 자-오, 축-미, 인-신, 묘-유, 진-술, 사-해 */
const branchClashes: [number, number][] = [
  [0, 6],  // 자-오
  [1, 7],  // 축-미
  [2, 8],  // 인-신
  [3, 9],  // 묘-유
  [4, 10], // 진-술
  [5, 11], // 사-해
];

function isBranchClash(branchIdx1: number, branchIdx2: number): boolean {
  for (const [a, b] of branchClashes) {
    if ((branchIdx1 === a && branchIdx2 === b) || (branchIdx1 === b && branchIdx2 === a)) {
      return true;
    }
  }
  return false;
}

// ============================================================
// 지지형(地支刑) - Earthly Branch Penalties
// ============================================================

/** 지지형: 인-사-신(무례지형), 축-술-미(무은지형), 자-묘(무례지형), 진-진/오-오/유-유/해-해(자형) */
const branchPenalties: [number, number][] = [
  [2, 5],   // 인-사
  [5, 8],   // 사-신
  [2, 8],   // 인-신 (via 삼형)
  [1, 10],  // 축-술
  [10, 7],  // 술-미
  [1, 7],   // 축-미 (via 삼형)
  [0, 3],   // 자-묘
];

function isBranchPenalty(branchIdx1: number, branchIdx2: number): boolean {
  for (const [a, b] of branchPenalties) {
    if ((branchIdx1 === a && branchIdx2 === b) || (branchIdx1 === b && branchIdx2 === a)) {
      return true;
    }
  }
  return false;
}

// ============================================================
// 십신(十神) - Ten Gods
// ============================================================

type TenGod = '비견' | '겁재' | '식신' | '상관' | '편재' | '정재' | '편관' | '정관' | '편인' | '정인';

const tenGodNames: TenGod[] = [
  '비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인',
];

/**
 * Calculate the Ten God (십신) relationship between two stems.
 * Based on the day stem (일간) as the reference.
 *
 * The relationship is derived from the element relationship and yin/yang polarity:
 * - Same element, same polarity → 비견 (Parallel)
 * - Same element, different polarity → 겁재 (Rob Wealth)
 * - I generate, same polarity → 식신 (Eating God)
 * - I generate, different polarity → 상관 (Hurting Officer)
 * - Overcomes me (내가 극하는), same polarity → 편재 (Indirect Wealth)
 * - Overcomes me (내가 극하는), different polarity → 정재 (Direct Wealth)
 * - I am overcome by (나를 극하는), same polarity → 편관 (Indirect Officer / Seven Killings)
 * - I am overcome by (나를 극하는), different polarity → 정관 (Direct Officer)
 * - Generates me (나를 생하는), same polarity → 편인 (Indirect Seal)
 * - Generates me (나를 생하는), different polarity → 정인 (Direct Seal)
 */
function getTenGod(dayStemIdx: number, otherStemIdx: number): TenGod {
  const dayElement = stemElementMap[heavenlyStems[dayStemIdx]];
  const otherElement = stemElementMap[heavenlyStems[otherStemIdx]];
  const samePolarity = (dayStemIdx % 2) === (otherStemIdx % 2);

  if (isSameElement(dayElement, otherElement)) {
    return samePolarity ? '비견' : '겁재';
  }
  if (isGenerating(dayElement, otherElement)) {
    return samePolarity ? '식신' : '상관';
  }
  if (isOvercoming(dayElement, otherElement)) {
    return samePolarity ? '편재' : '정재';
  }
  if (isOvercoming(otherElement, dayElement)) {
    return samePolarity ? '편관' : '정관';
  }
  // otherElement generates dayElement
  return samePolarity ? '편인' : '정인';
}

// ============================================================
// 12운성(十二運星) - Twelve Life Stages
// ============================================================

type LifeStage = '장생' | '목욕' | '관대' | '건록' | '제왕' | '쇠' | '병' | '사' | '묘' | '절' | '태' | '양';

const lifeStageNames: LifeStage[] = [
  '장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양',
];

/**
 * 12운성 lookup table.
 * For each heavenly stem (index 0-9), the starting earthly branch index for 장생.
 * Yang stems progress forward, Yin stems progress backward.
 *
 * 갑(양목): 장생 at 해(11)
 * 을(음목): 장생 at 오(6)
 * 병(양화): 장생 at 인(2)
 * 정(음화): 장생 at 유(9)
 * 무(양토): 장생 at 인(2) (same as 병)
 * 기(음토): 장생 at 유(9) (same as 정)
 * 경(양금): 장생 at 사(5)
 * 신(음금): 장생 at 자(0)
 * 임(양수): 장생 at 신(8)
 * 계(음수): 장생 at 묘(3)
 */
const lifeStageStart: number[] = [
  11, // 갑 → 해
  6,  // 을 → 오
  2,  // 병 → 인
  9,  // 정 → 유
  2,  // 무 → 인
  9,  // 기 → 유
  5,  // 경 → 사
  0,  // 신 → 자
  8,  // 임 → 신
  3,  // 계 → 묘
];

function getLifeStage(stemIdx: number, branchIdx: number): LifeStage {
  const start = lifeStageStart[stemIdx];
  const isYang = stemIdx % 2 === 0;

  let offset: number;
  if (isYang) {
    offset = ((branchIdx - start) + 12) % 12;
  } else {
    offset = ((start - branchIdx) + 12) % 12;
  }

  return lifeStageNames[offset];
}

const lifeStageDescriptions: Record<LifeStage, string> = {
  '장생': '새로운 시작과 탄생의 기운. 생명력이 넘치며 가능성이 무궁무진합니다.',
  '목욕': '정화와 변화의 시기. 세상과 만나며 시행착오를 겪으나 성장의 밑거름이 됩니다.',
  '관대': '성장하여 관을 쓰는 시기. 사회적 인정을 받기 시작하며 자신감이 충만합니다.',
  '건록': '왕성한 활동기. 능력이 절정에 달하며 안정적인 기반을 구축합니다.',
  '제왕': '최전성기. 권력과 영향력이 최고조에 달하나 지나침을 경계해야 합니다.',
  '쇠': '서서히 내려오는 시기. 원숙미가 있으나 체력 안배가 중요합니다.',
  '병': '아픔과 시련의 시기. 내면의 힘을 기르며 지혜를 얻습니다.',
  '사': '멈춤과 정지의 기운. 과거를 되돌아보며 새로운 방향을 모색합니다.',
  '묘': '잠복과 저장의 시기. 겉으로 드러나지 않으나 내면에 큰 잠재력을 품고 있습니다.',
  '절': '단절과 전환의 기운. 과거와 결별하고 완전히 새로운 국면으로 전환합니다.',
  '태': '잉태의 기운. 새로운 것이 싹트고 있으며 준비의 시기입니다.',
  '양': '양육과 준비의 시기. 아직 세상에 나오기 전이나 착실히 힘을 비축하고 있습니다.',
};

// ============================================================
// 입력 검증 (Input Validation)
// ============================================================

function validateInput(input: SajuInput): string | null {
  const { birthYear, birthMonth, birthDay, birthHour } = input;

  if (!Number.isFinite(birthYear) || birthYear < 1) {
    return '유효하지 않은 연도입니다.';
  }
  if (!Number.isFinite(birthMonth) || birthMonth < 1 || birthMonth > 12) {
    return '월은 1~12 사이여야 합니다.';
  }
  if (!Number.isFinite(birthDay) || birthDay < 1 || birthDay > 31) {
    return '일은 1~31 사이여야 합니다.';
  }
  if (!Number.isFinite(birthHour) || birthHour < 0 || birthHour > 23) {
    return '시간은 0~23 사이여야 합니다.';
  }

  // Month-aware day validation
  const daysInMonth = getDaysInMonth(birthYear, birthMonth);
  if (birthDay > daysInMonth) {
    return `${birthYear}년 ${birthMonth}월은 ${daysInMonth}일까지입니다.`;
  }

  return null;
}

function getDaysInMonth(year: number, month: number): number {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return days[month - 1];
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// ============================================================
// Julian Day Number (JDN) Calculation
// ============================================================

/**
 * Calculate Julian Day Number for a given Gregorian calendar date.
 * Uses the standard astronomical algorithm.
 */
function calculateJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

// ============================================================
// 사주 팔자 계산 (Four Pillars Calculation)
// ============================================================

interface FourPillars {
  yearStemIdx: number;
  yearBranchIdx: number;
  monthStemIdx: number;
  monthBranchIdx: number;
  dayStemIdx: number;
  dayBranchIdx: number;
  hourStemIdx: number;
  hourBranchIdx: number;
}

function calculateFourPillars(input: SajuInput): FourPillars {
  const { birthYear, birthMonth, birthDay, birthHour } = input;

  // ── Year Pillar (연주) ──
  // Standard formula: (year - 4) mod 10/12
  // Year 4 CE = 갑자년
  const yearStemIdx = ((birthYear - 4) % 10 + 10) % 10;
  const yearBranchIdx = ((birthYear - 4) % 12 + 12) % 12;

  // ── Month Pillar (월주) ──
  // 오호둔법(五虎遁法): Determines the starting stem for the first month based on year stem.
  //
  // Year stem group → 인월(寅月, month 1 of lunar calendar) starting stem:
  //   갑(0)/기(5) → 병(2)
  //   을(1)/경(6) → 무(4)
  //   병(2)/신(7) → 경(6)
  //   정(3)/임(8) → 임(8)
  //   무(4)/계(9) → 갑(0)
  //
  // Formula: monthStemBase = ((yearStemIdx % 5) * 2 + 2) % 10

  const monthStemBase = ((yearStemIdx % 5) * 2 + 2) % 10;

  // Month branch mapping (solar calendar to earthly branch):
  // Solar month 1 (Jan) → 축(丑) = index 1 (Note: In strict traditional practice,
  // 입춘 determines the year/month boundary, but we use simplified solar mapping here)
  // Solar month 2 (Feb) → 인(寅) = index 2
  // Solar month 3 (Mar) → 묘(卯) = index 3
  // ...
  // Solar month 11 (Nov) → 자(子) = index 0
  // Solar month 12 (Dec) → 축(丑) = index 1
  //
  // General formula: monthBranchIdx = birthMonth % 12
  // This yields: 1→1(축), 2→2(인), ..., 11→11(해), 12→0(자)
  // Wait - let's verify: month 11 should be 자(子)=0, month 12=축(丑)=1
  // Actually the correct mapping:
  //   month 1 → 축(1), month 2 → 인(2), ..., month 11 → 자(0), month 12 → 축(1)
  // Hmm, that gives Jan=축 and Dec=축 which doesn't make sense for a unique mapping.
  //
  // The correct traditional mapping (solar):
  //   Solar month 1 (Jan, 대한~입춘 사이) → 축(丑) = index 1
  //   Solar month 2 (Feb, 입춘~경칩 사이) → 인(寅) = index 2
  //   Solar month 3 (Mar) → 묘(卯) = index 3
  //   Solar month 4 (Apr) → 진(辰) = index 4
  //   Solar month 5 (May) → 사(巳) = index 5
  //   Solar month 6 (Jun) → 오(午) = index 6
  //   Solar month 7 (Jul) → 미(未) = index 7
  //   Solar month 8 (Aug) → 신(申) = index 8
  //   Solar month 9 (Sep) → 유(酉) = index 9
  //   Solar month 10 (Oct) → 술(戌) = index 10
  //   Solar month 11 (Nov) → 해(亥) = index 11
  //   Solar month 12 (Dec) → 자(子) = index 0
  //
  // Formula: monthBranchIdx = birthMonth % 12
  //   month 1 → 1, month 2 → 2, ..., month 11 → 11, month 12 → 0 ✓

  const monthBranchIdx = birthMonth % 12;

  // Month stem: offset from 인월(index 2) base
  // monthStemIdx = (monthStemBase + (monthBranchIdx - 2 + 12) % 12) % 10
  const monthStemIdx = (monthStemBase + ((monthBranchIdx - 2 + 12) % 12)) % 10;

  // ── Day Pillar (일주) ──
  // Use Julian Day Number for accurate calculation.
  const jdn = calculateJDN(birthYear, birthMonth, birthDay);

  // Day stem and branch from JDN:
  // JDN 0 (Jan 1, 4713 BCE) corresponds to a known stem/branch.
  // The commonly used offsets:
  //   dayStemIdx = (JDN + 9) % 10
  //   dayBranchIdx = (JDN + 1) % 12
  const dayStemIdx = ((jdn + 9) % 10 + 10) % 10;
  const dayBranchIdx = ((jdn + 1) % 12 + 12) % 12;

  // ── Hour Pillar (시주) ──
  // Hour branch: Each 시진(時辰) covers 2 hours.
  //   23:00-00:59 → 자시(子) = 0
  //   01:00-02:59 → 축시(丑) = 1
  //   03:00-04:59 → 인시(寅) = 2
  //   ...
  //   21:00-22:59 → 해시(亥) = 11
  //
  // Formula: hourBranchIdx = floor((birthHour + 1) / 2) % 12
  const hourBranchIdx = Math.floor((birthHour + 1) / 2) % 12;

  // 오서둔법(五鼠遁法): Determines the starting stem for 자시 based on day stem.
  //
  // Day stem group → 자시(子時) starting stem:
  //   갑(0)/기(5) → 갑(0)
  //   을(1)/경(6) → 병(2)
  //   병(2)/신(7) → 무(4)
  //   정(3)/임(8) → 경(6)
  //   무(4)/계(9) → 임(8)
  //
  // Formula: hourStemBase = ((dayStemIdx % 5) * 2) % 10
  const hourStemBase = ((dayStemIdx % 5) * 2) % 10;
  const hourStemIdx = (hourStemBase + hourBranchIdx) % 10;

  return {
    yearStemIdx,
    yearBranchIdx,
    monthStemIdx,
    monthBranchIdx,
    dayStemIdx,
    dayBranchIdx,
    hourStemIdx,
    hourBranchIdx,
  };
}

// ============================================================
// 띠(Zodiac Animal) Utility
// ============================================================

/**
 * Get the Korean zodiac animal (띠) from the year's earthly branch.
 */
export function getZodiacAnimal(yearBranch: string): string {
  return zodiacAnimalMap[yearBranch] || '알 수 없음';
}

/**
 * Get the zodiac animal for a given birth year.
 */
export function getZodiacAnimalByYear(birthYear: number): string {
  const branchIdx = ((birthYear - 4) % 12 + 12) % 12;
  return zodiacAnimalMap[earthlyBranches[branchIdx]] || '알 수 없음';
}

// ============================================================
// 오행 분포 계산 (Element Distribution)
// ============================================================

function calculateElementDistribution(pillars: FourPillars): Record<Element, number> {
  const elements: Record<Element, number> = {
    '목': 0, '화': 0, '토': 0, '금': 0, '수': 0,
  };

  // Count from all 4 stems
  const stemIndices = [
    pillars.yearStemIdx,
    pillars.monthStemIdx,
    pillars.dayStemIdx,
    pillars.hourStemIdx,
  ];
  for (const idx of stemIndices) {
    const element = stemElementMap[heavenlyStems[idx]];
    if (element) elements[element]++;
  }

  // Count from all 4 branches
  const branchIndices = [
    pillars.yearBranchIdx,
    pillars.monthBranchIdx,
    pillars.dayBranchIdx,
    pillars.hourBranchIdx,
  ];
  for (const idx of branchIndices) {
    const element = branchElementMap[earthlyBranches[idx]];
    if (element) elements[element]++;
  }

  return elements;
}

// ============================================================
// 용신(用神) 추정 - Determining Lucky/Unlucky Elements
// ============================================================

/**
 * Determine the lucky element (용신) and unlucky element (기신).
 * The lucky element is the one that best balances the saju.
 * Simple approach: the weakest element that supports or balances the day master.
 */
function determineLuckyUnlucky(
  elements: Record<Element, number>,
  dayStemIdx: number
): { luckyElement: Element; unluckyElement: Element } {
  const dayElement = stemElementMap[heavenlyStems[dayStemIdx]];

  // Count day master strength (비겁 = same element as day master)
  const dayMasterStrength = elements[dayElement];

  // Elements that support day master: 인성 (generates day master)
  const supportElement = Object.entries(generationCycle).find(
    ([, target]) => target === dayElement
  )?.[0] as Element | undefined;

  const totalDayMasterSupport =
    dayMasterStrength + (supportElement ? elements[supportElement] : 0);

  // Total of all elements
  const totalElements = Object.values(elements).reduce((a, b) => a + b, 0);

  // If day master is weak (support < half of total), lucky element should strengthen it
  // If day master is strong, lucky element should weaken it
  const isWeak = totalDayMasterSupport < totalElements / 2;

  const sortedElements = (Object.entries(elements) as [Element, number][]).sort(
    (a, b) => a[1] - b[1]
  );

  let luckyElement: Element;
  let unluckyElement: Element;

  if (isWeak) {
    // Day master is weak → need elements that support it
    // Lucky: same element or element that generates day master (인성)
    // Find the weakest supportive element to recommend
    const supportiveElements = [dayElement];
    if (supportElement) supportiveElements.push(supportElement);

    luckyElement =
      sortedElements.find(([el]) => supportiveElements.includes(el))?.[0] || sortedElements[0][0];

    // Unlucky: element that day master must overcome (재성 - drains energy) or element that overcomes day master (관성)
    const drainingElement = overcomingCycle[dayElement]; // 내가 극하는 것 = 재성
    const controllingEntries = Object.entries(overcomingCycle).find(
      ([, target]) => target === dayElement
    );
    const controllingElement = controllingEntries?.[0] as Element | undefined;

    unluckyElement =
      sortedElements
        .reverse()
        .find(([el]) => el === drainingElement || el === controllingElement)?.[0] ||
      sortedElements[0][0];
  } else {
    // Day master is strong → need elements that weaken it
    // Lucky: element that overcomes day master (관성) or element day master generates (식상 - exhaust energy)
    const exhaustElement = generationCycle[dayElement]; // 내가 생하는 것 = 식상
    const controllingEntries = Object.entries(overcomingCycle).find(
      ([, target]) => target === dayElement
    );
    const controllingElement = controllingEntries?.[0] as Element | undefined;

    const weakeningElements = [exhaustElement];
    if (controllingElement) weakeningElements.push(controllingElement);

    luckyElement =
      sortedElements.find(([el]) => weakeningElements.includes(el))?.[0] || sortedElements[0][0];

    // Unlucky: same element or element that generates day master
    const strengthenElements = [dayElement];
    if (supportElement) strengthenElements.push(supportElement);

    unluckyElement =
      sortedElements
        .reverse()
        .find(([el]) => strengthenElements.includes(el))?.[0] ||
      sortedElements[sortedElements.length - 1][0];
  }

  return { luckyElement, unluckyElement };
}

// ============================================================
// 설명 생성 (Description Generation)
// ============================================================

function generateDescription(
  pillars: FourPillars,
  elements: Record<Element, number>,
  luckyElement: Element,
  unluckyElement: Element,
  gender: 'male' | 'female'
): string {
  const pronoun = gender === 'male' ? '그대' : '당신';
  const dayElement = stemElementMap[heavenlyStems[pillars.dayStemIdx]];
  const dayStem = heavenlyStems[pillars.dayStemIdx];
  const dayBranch = earthlyBranches[pillars.dayBranchIdx];

  // 일주 (Day Pillar) description
  const dayPillarDesc = getDayPillarDescription(pillars.dayStemIdx);

  // 십신 분석
  const yearTenGod = getTenGod(pillars.dayStemIdx, pillars.yearStemIdx);
  const monthTenGod = getTenGod(pillars.dayStemIdx, pillars.monthStemIdx);
  const hourTenGod = getTenGod(pillars.dayStemIdx, pillars.hourStemIdx);

  // 12운성 분석
  const dayLifeStage = getLifeStage(pillars.dayStemIdx, pillars.dayBranchIdx);
  const dayLifeStageDesc = lifeStageDescriptions[dayLifeStage];

  // 오행 분포 분석
  const sortedElements = (Object.entries(elements) as [Element, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  const dominant = sortedElements[0][0];
  const weakest = sortedElements[sortedElements.length - 1][0];
  const missingElements = sortedElements.filter(([, count]) => count === 0).map(([el]) => el);

  // Zodiac animal
  const zodiac = getZodiacAnimal(earthlyBranches[pillars.yearBranchIdx]);

  // Build description
  const lines: string[] = [];

  lines.push(`[사주 팔자 분석]`);
  lines.push('');
  lines.push(
    `연주: ${heavenlyStems[pillars.yearStemIdx]}${earthlyBranches[pillars.yearBranchIdx]} (${zodiac}띠)` +
    ` | 월주: ${heavenlyStems[pillars.monthStemIdx]}${earthlyBranches[pillars.monthBranchIdx]}` +
    ` | 일주: ${dayStem}${dayBranch}` +
    ` | 시주: ${heavenlyStems[pillars.hourStemIdx]}${earthlyBranches[pillars.hourBranchIdx]}`
  );
  lines.push('');

  // Day master analysis
  lines.push(`[일간 분석 - ${dayStem}(${dayElement})]`);
  lines.push(dayPillarDesc);
  lines.push('');

  // 12운성
  lines.push(`[12운성: ${dayLifeStage}]`);
  lines.push(dayLifeStageDesc);
  lines.push('');

  // 십신 배치
  lines.push(`[십신 배치]`);
  lines.push(`연주(조상/사회): ${yearTenGod} | 월주(부모/직장): ${monthTenGod} | 시주(자녀/노년): ${hourTenGod}`);
  lines.push(getTenGodSummary(yearTenGod, monthTenGod, hourTenGod));
  lines.push('');

  // Element balance
  lines.push(`[오행 분포]`);
  lines.push(`목(${elements['목']}) 화(${elements['화']}) 토(${elements['토']}) 금(${elements['금']}) 수(${elements['수']})`);

  if (missingElements.length > 0) {
    lines.push(`부족한 오행: ${missingElements.join(', ')} — 이 기운을 보충하면 균형이 좋아집니다.`);
  }
  lines.push(`가장 강한 오행: ${dominant} | 가장 약한 오행: ${weakest}`);
  lines.push('');

  // Lucky/Unlucky element
  lines.push(`[용신(用神) 분석]`);
  lines.push(
    `${pronoun}의 일간 ${dayStem}(${dayElement})을 기준으로, ` +
    `행운의 오행은 '${luckyElement}'입니다. ${luckyElement}의 기운을 가까이하면 운이 상승합니다.`
  );
  lines.push(`반면 '${unluckyElement}' 기운은 과하니 주의가 필요합니다.`);

  return lines.join('\n');
}

function getDayPillarDescription(dayStemIdx: number): string {
  const descriptions: Record<number, string> = {
    0: '갑목(甲木) 일간: 큰 나무처럼 곧고 진취적입니다. 리더십이 강하며 목표를 향해 꿋꿋이 나아갑니다. 자존심이 강하고 독립적입니다.',
    1: '을목(乙木) 일간: 풀과 덩굴처럼 유연하고 적응력이 뛰어납니다. 부드러우나 끈기가 있으며, 사람 사이에서 조화를 이룹니다.',
    2: '병화(丙火) 일간: 태양처럼 밝고 따뜻합니다. 카리스마가 넘치고 솔직하며, 주변 사람들에게 에너지를 줍니다.',
    3: '정화(丁火) 일간: 촛불처럼 은은하고 섬세합니다. 내면이 따뜻하며 집중력과 통찰력이 뛰어납니다.',
    4: '무토(戊土) 일간: 큰 산처럼 듬직하고 포용력이 있습니다. 신뢰감을 주며 중심을 잘 잡습니다.',
    5: '기토(己土) 일간: 기름진 밭처럼 모든 것을 품어줍니다. 섬세하고 현실적이며, 실리를 중시합니다.',
    6: '경금(庚金) 일간: 큰 바위나 강철처럼 강인합니다. 의지가 굳세고 정의감이 넘치며 결단력이 있습니다.',
    7: '신금(辛金) 일간: 보석처럼 아름답고 예리합니다. 완벽주의 성향이 있으며 심미안이 뛰어납니다.',
    8: '임수(壬水) 일간: 바다나 큰 강처럼 깊고 넓습니다. 지혜롭고 포용력이 크며 대범합니다.',
    9: '계수(癸水) 일간: 이슬이나 빗물처럼 맑고 순수합니다. 감수성이 풍부하고 직관력이 뛰어납니다.',
  };
  return descriptions[dayStemIdx] || '';
}

function getTenGodSummary(year: TenGod, month: TenGod, hour: TenGod): string {
  const summaries: Record<TenGod, string> = {
    '비견': '독립심과 추진력이 강합니다. 경쟁심이 있으나 동료와의 협력도 중요합니다.',
    '겁재': '적극적이고 활동적이나 재물의 출입이 잦을 수 있습니다.',
    '식신': '먹복이 있고 표현력이 뛰어납니다. 안정적이고 여유로운 성격입니다.',
    '상관': '창의적이고 재능이 넘치나 기존 질서에 도전하는 성향이 있습니다.',
    '편재': '활동적이고 사교적이며 재물운이 유동적입니다. 투자와 사업에 관심이 많습니다.',
    '정재': '꾸준하고 성실하게 재물을 모읍니다. 안정적인 경제생활을 추구합니다.',
    '편관': '카리스마와 권위가 있으나 압박감을 느낄 수 있습니다. 결단력이 뛰어납니다.',
    '정관': '사회적 명예와 지위를 중시합니다. 규칙을 잘 따르며 책임감이 강합니다.',
    '편인': '독창적인 사고방식을 가지고 있습니다. 학문과 예술에 재능이 있습니다.',
    '정인': '학식이 풍부하고 덕이 있습니다. 어른의 도움과 보살핌을 받기 쉽습니다.',
  };

  // Highlight the month pillar ten god as it represents career/social life
  return `월주의 ${month}이(가) 직장/사회운을 크게 좌우합니다. ${summaries[month]}`;
}

// ============================================================
// Main Saju Calculation
// ============================================================

/**
 * Calculate the Four Pillars of Destiny (사주팔자).
 */
export function calculateSaju(input: SajuInput): SajuResult {
  // Input validation
  const validationError = validateInput(input);
  if (validationError) {
    // Return a safe fallback result with error description
    return {
      id: `saju_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      date: new Date().toISOString(),
      input,
      elements: { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 },
      description: `입력 오류: ${validationError}`,
      luckyElement: '목',
      unluckyElement: '금',
    };
  }

  // Calculate four pillars
  const pillars = calculateFourPillars(input);

  // Calculate element distribution
  const elements = calculateElementDistribution(pillars);

  // Determine lucky/unlucky elements
  const { luckyElement, unluckyElement } = determineLuckyUnlucky(elements, pillars.dayStemIdx);

  // Generate description
  const description = generateDescription(
    pillars,
    elements,
    luckyElement,
    unluckyElement,
    input.gender
  );

  return {
    id: `saju_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    date: new Date().toISOString(),
    input,
    elements,
    description,
    luckyElement,
    unluckyElement,
  };
}

// ============================================================
// 사주 궁합 (Compatibility) - Enhanced
// ============================================================

/**
 * Calculate detailed Saju compatibility between two people.
 */
export function calculateSajuCompatibility(
  myBirth: SajuInput,
  partnerBirth: SajuInput
): SajuCompatibility {
  const mySaju = calculateSaju(myBirth);
  const partnerSaju = calculateSaju(partnerBirth);

  const myPillars = calculateFourPillars(myBirth);
  const partnerPillars = calculateFourPillars(partnerBirth);

  let score = 50; // Base score
  const details: string[] = [];

  // ── 1. 천간합(天干合) Check ── (+12 per combination found)
  const myStemIndices = [myPillars.yearStemIdx, myPillars.monthStemIdx, myPillars.dayStemIdx, myPillars.hourStemIdx];
  const partnerStemIndices = [partnerPillars.yearStemIdx, partnerPillars.monthStemIdx, partnerPillars.dayStemIdx, partnerPillars.hourStemIdx];
  const pillarNames = ['연주', '월주', '일주', '시주'];

  let stemCombinationCount = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const combo = getStemCombination(myStemIndices[i], partnerStemIndices[j]);
      if (combo) {
        stemCombinationCount++;
        if (i === 2 && j === 2) {
          // Day stem combination is especially significant
          details.push(
            `일간합(日干合): ${heavenlyStems[myStemIndices[i]]}과 ${heavenlyStems[partnerStemIndices[j]]}이(가) 합하여 ${combo}으로 변합니다. 두 사람이 깊이 끌리는 인연입니다.`
          );
          score += 18;
        } else {
          details.push(
            `${pillarNames[i]}-${pillarNames[j]} 천간합: ${heavenlyStems[myStemIndices[i]]}-${heavenlyStems[partnerStemIndices[j]]} → ${combo}`
          );
          score += 8;
        }
      }
    }
  }

  // ── 2. 지지육합(地支六合) Check ── (+10 per harmony found)
  const myBranchIndices = [myPillars.yearBranchIdx, myPillars.monthBranchIdx, myPillars.dayBranchIdx, myPillars.hourBranchIdx];
  const partnerBranchIndices = [partnerPillars.yearBranchIdx, partnerPillars.monthBranchIdx, partnerPillars.dayBranchIdx, partnerPillars.hourBranchIdx];

  let sixHarmonyCount = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const harmony = getBranchSixHarmony(myBranchIndices[i], partnerBranchIndices[j]);
      if (harmony) {
        sixHarmonyCount++;
        details.push(
          `${pillarNames[i]}-${pillarNames[j]} 지지육합: ${earthlyBranches[myBranchIndices[i]]}-${earthlyBranches[partnerBranchIndices[j]]} → ${harmony}`
        );
        score += 10;
      }
    }
  }

  // ── 3. 지지삼합(地支三合) Check ── (+8 per shared triple harmony)
  const allBranches = [...myBranchIndices, ...partnerBranchIndices];
  const tripleHarmonies = getTripleHarmonyCount(allBranches);
  for (const { element, count } of tripleHarmonies) {
    if (count >= 3) {
      details.push(`지지삼합 완성: ${element}국(局)이 이루어져 ${element}의 기운이 크게 강화됩니다.`);
      score += 8;
    }
  }

  // ── 4. 지지충(地支冲) Check ── (-8 per clash)
  let clashCount = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (isBranchClash(myBranchIndices[i], partnerBranchIndices[j])) {
        clashCount++;
        details.push(
          `${pillarNames[i]}-${pillarNames[j]} 지지충: ${earthlyBranches[myBranchIndices[i]]}-${earthlyBranches[partnerBranchIndices[j]]} (충돌)`
        );
        score -= 8;
      }
    }
  }

  // ── 5. 지지형(地支刑) Check ── (-5 per penalty)
  let penaltyCount = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (isBranchPenalty(myBranchIndices[i], partnerBranchIndices[j])) {
        penaltyCount++;
        score -= 5;
      }
    }
  }
  if (penaltyCount > 0) {
    details.push(`지지형(刑) ${penaltyCount}개 발견: 오해나 갈등이 생기기 쉬운 부분이 있습니다.`);
  }

  // ── 6. 오행 상생/상극 (Element Generation/Overcoming) ──
  const myDayElement = stemElementMap[heavenlyStems[myPillars.dayStemIdx]];
  const partnerDayElement = stemElementMap[heavenlyStems[partnerPillars.dayStemIdx]];

  if (isSameElement(myDayElement, partnerDayElement)) {
    details.push(
      `일간 오행 비화: 두 사람 모두 ${myDayElement}으로 동질감이 강합니다. 서로를 잘 이해하지만 경쟁 관계가 될 수 있습니다.`
    );
    score += 5;
  } else if (isGenerating(myDayElement, partnerDayElement)) {
    details.push(
      `일간 상생 관계: ${myDayElement}이(가) ${partnerDayElement}을(를) 생합니다. 본인이 상대를 도와주는 관계입니다.`
    );
    score += 10;
  } else if (isGenerating(partnerDayElement, myDayElement)) {
    details.push(
      `일간 상생 관계: ${partnerDayElement}이(가) ${myDayElement}을(를) 생합니다. 상대가 본인을 도와주는 관계입니다.`
    );
    score += 10;
  } else if (isOvercoming(myDayElement, partnerDayElement)) {
    details.push(
      `일간 상극 관계: ${myDayElement}이(가) ${partnerDayElement}을(를) 극합니다. 본인이 상대를 제어하려는 경향이 있습니다.`
    );
    score -= 5;
  } else if (isOvercoming(partnerDayElement, myDayElement)) {
    details.push(
      `일간 상극 관계: ${partnerDayElement}이(가) ${myDayElement}을(를) 극합니다. 상대가 본인에게 부담을 줄 수 있습니다.`
    );
    score -= 5;
  }

  // ── 7. 오행 균형 보완 ── (+0~10)
  const allElements: Element[] = ['목', '화', '토', '금', '수'];
  let complementCount = 0;
  for (const el of allElements) {
    const myCount = mySaju.elements[el];
    const partnerCount = partnerSaju.elements[el];
    // If one is weak and the other is strong, they complement
    if ((myCount === 0 && partnerCount >= 2) || (partnerCount === 0 && myCount >= 2)) {
      complementCount++;
    }
  }
  if (complementCount > 0) {
    details.push(
      `오행 보완: ${complementCount}개의 오행에서 서로 부족한 부분을 채워줍니다.`
    );
    score += complementCount * 4;
  }

  // ── 8. 용신 상성 ── (+5 if partner's dominant helps my lucky element)
  if (
    partnerSaju.luckyElement === mySaju.luckyElement ||
    isGenerating(
      stemElementMap[heavenlyStems[partnerPillars.dayStemIdx]],
      mySaju.luckyElement
    )
  ) {
    details.push(`용신 상성: 상대의 기운이 본인의 용신(${mySaju.luckyElement})에 도움이 됩니다.`);
    score += 5;
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Generate comprehensive description
  const description = generateCompatibilityDescription(
    score,
    mySaju,
    partnerSaju,
    myPillars,
    partnerPillars,
    details
  );

  return {
    id: `saju_compat_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    date: new Date().toISOString(),
    myBirth,
    partnerBirth,
    compatibilityScore: score,
    description,
  };
}

function generateCompatibilityDescription(
  score: number,
  mySaju: SajuResult,
  partnerSaju: SajuResult,
  myPillars: FourPillars,
  partnerPillars: FourPillars,
  details: string[]
): string {
  let level = '';
  let advice = '';

  if (score >= 85) {
    level = '천생연분(天生緣分)';
    advice =
      '두 분은 하늘이 맺어준 인연입니다. 천간합과 지지합이 잘 어울려 서로에게 큰 힘이 됩니다. ' +
      '서로의 부족한 기운을 자연스럽게 채워주므로 함께할수록 운이 상승합니다.';
  } else if (score >= 70) {
    level = '상생지합(相生之合)';
    advice =
      '서로의 기운이 잘 어울리는 좋은 궁합입니다. 사소한 갈등은 있을 수 있으나 ' +
      '근본적으로 서로를 성장시키는 관계입니다. 서로의 장점을 인정해주세요.';
  } else if (score >= 55) {
    level = '중화지연(中和之緣)';
    advice =
      '보통의 궁합이지만 노력에 따라 좋아질 수 있습니다. 서로 다른 점이 있기에 ' +
      '배움의 기회가 많습니다. 대화와 양보로 관계를 발전시킬 수 있습니다.';
  } else if (score >= 40) {
    level = '극복지연(克服之緣)';
    advice =
      '일부 상극 요소가 있어 갈등이 생기기 쉽습니다. 하지만 서로를 이해하려는 노력이 있다면 ' +
      '오히려 강한 유대감을 형성할 수 있습니다. 상대방의 입장에서 생각하는 연습이 중요합니다.';
  } else {
    level = '수련지연(修練之緣)';
    advice =
      '기운의 충돌이 많아 서로에게 시련이 될 수 있습니다. 하지만 전생의 인연으로 만난 것이니 ' +
      '서로를 통해 크게 성장할 수 있는 관계입니다. 인내와 이해가 필요합니다.';
  }

  const myDayStem = heavenlyStems[myPillars.dayStemIdx];
  const partnerDayStem = heavenlyStems[partnerPillars.dayStemIdx];
  const myDayBranch = earthlyBranches[myPillars.dayBranchIdx];
  const partnerDayBranch = earthlyBranches[partnerPillars.dayBranchIdx];

  const lines: string[] = [];
  lines.push(`[사주 궁합 분석]`);
  lines.push(`궁합 점수: ${score}점 — ${level}`);
  lines.push('');
  lines.push(`본인 일주: ${myDayStem}${myDayBranch} | 상대 일주: ${partnerDayStem}${partnerDayBranch}`);
  lines.push('');

  if (details.length > 0) {
    lines.push(`[상세 분석]`);
    for (const detail of details) {
      lines.push(`- ${detail}`);
    }
    lines.push('');
  }

  lines.push(`[종합 조언]`);
  lines.push(advice);
  lines.push('');
  lines.push(
    `본인의 용신: ${mySaju.luckyElement} | 상대의 용신: ${partnerSaju.luckyElement}`
  );

  // Specific advice based on element relationship
  const myDayElement = stemElementMap[myDayStem];
  const partnerDayElement = stemElementMap[partnerDayStem];

  if (isGenerating(myDayElement, partnerDayElement) || isGenerating(partnerDayElement, myDayElement)) {
    lines.push(`상생 관계이므로 함께 ${generationCycle[myDayElement] === partnerDayElement ? partnerDayElement : myDayElement} 관련 활동을 하면 좋습니다.`);
  }

  if (isOvercoming(myDayElement, partnerDayElement) || isOvercoming(partnerDayElement, myDayElement)) {
    const mediatingElement = findMediatingElement(myDayElement, partnerDayElement);
    if (mediatingElement) {
      lines.push(
        `상극을 완화하기 위해 ${mediatingElement} 기운의 활동이나 장소를 함께하면 관계가 부드러워집니다.`
      );
    }
  }

  return lines.join('\n');
}

/**
 * Find the element that mediates between two clashing elements.
 * In the cycle A → B (A overcomes B), the mediator is the element that
 * A generates and that generates B. (통관용신)
 */
function findMediatingElement(a: Element, b: Element): Element | null {
  // If a overcomes b, find C where a→C→b (a generates C, C generates b)
  if (isOvercoming(a, b)) {
    // a generates generationCycle[a], check if generationCycle[a] generates b
    const candidate = generationCycle[a];
    if (isGenerating(candidate, b)) {
      return candidate;
    }
  }
  if (isOvercoming(b, a)) {
    const candidate = generationCycle[b];
    if (isGenerating(candidate, a)) {
      return candidate;
    }
  }
  return null;
}
