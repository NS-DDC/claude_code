import { SajuInput, Element, MBTIType } from '@/types';
import { SeededRandom, createSeedFromBirthdate } from './seedRandom';
import { getYearlyLuck, analyzeYearElementCompatibility } from './yearlyLuck';
import { calculateSaju } from './sajuCalculator';

export interface CompleteFortune {
  // 기본 정보
  date: string;
  yearlyLuck: ReturnType<typeof getYearlyLuck>;

  // 1. 운명 총평
  overallSummary: string;

  // 2. 오행 그래프 (0-100)
  elementRadar: {
    목: number;
    화: number;
    토: number;
    금: number;
    수: number;
  };

  // 3. 대표 에너지 & 성격화
  dominantElement: Element;
  energyCharacter: {
    type: string; // 비겁, 식상, 재성, 관성, 인성
    description: string;
  };

  // 4. 운세 레이더 (5가지 운)
  luckRadar: {
    재물운: number;
    연애운: number;
    건강운: number;
    명예운: number;
    학업운: number;
  };

  // 5. 행운 아이템
  luckyItems: {
    color: { hex: string; name: string };
    food: string;
    numbers: number[]; // 로또 번호 6개
    place: string;
    time: string;
  };

  // 6. 피해야 할 것
  avoid: {
    time: string;
    item: string;
    action: string;
  };

  // 7. MBTI 베스트 파트너
  bestMBTIPartner?: MBTIType;
  partnerReason?: string;
}

/**
 * 완전한 운세 생성
 */
export function generateCompleteFortune(
  birthInput: SajuInput,
  mbti?: MBTIType
): CompleteFortune {
  const seed = createSeedFromBirthdate(
    birthInput.birthYear,
    birthInput.birthMonth,
    birthInput.birthDay,
    birthInput.birthHour
  );
  const rng = new SeededRandom(seed);

  // 사주 계산
  const sajuResult = calculateSaju(birthInput);

  // 올해 세운
  const currentYear = new Date().getFullYear();
  const yearlyLuck = getYearlyLuck(currentYear);

  // 가장 강한 오행 찾기
  const dominantElement = findDominantElement(sajuResult.elements);

  // 오행을 0-100으로 정규화
  const elementRadar = normalizeElements(sajuResult.elements);

  // 1. 운명 총평
  const yearCompatibility = analyzeYearElementCompatibility(
    yearlyLuck.element,
    dominantElement
  );
  const overallSummary = generateOverallSummary(
    currentYear,
    yearlyLuck,
    dominantElement,
    yearCompatibility,
    birthInput.gender
  );

  // 2. 대표 에너지 성격화
  const energyCharacter = characterizeEnergy(dominantElement, sajuResult.elements);

  // 3. 운세 레이더
  const luckRadar = generateLuckRadar(sajuResult.elements, rng);

  // 4. 행운 아이템
  const luckyItems = generateLuckyItems(dominantElement, birthInput, rng);

  // 5. 피해야 할 것
  const avoid = generateAvoidItems(dominantElement, rng);

  // 6. MBTI 베스트 파트너
  let bestMBTIPartner: MBTIType | undefined;
  let partnerReason: string | undefined;

  if (mbti) {
    const partner = findBestMBTIPartner(mbti, rng);
    bestMBTIPartner = partner.mbti;
    partnerReason = partner.reason;
  }

  return {
    date: new Date().toISOString(),
    yearlyLuck,
    overallSummary,
    elementRadar,
    dominantElement,
    energyCharacter,
    luckRadar,
    luckyItems,
    avoid,
    bestMBTIPartner,
    partnerReason
  };
}

/**
 * 가장 강한 오행 찾기
 */
function findDominantElement(elements: Record<Element, number>): Element {
  let maxElement: Element = '목';
  let maxValue = 0;

  for (const [element, value] of Object.entries(elements) as [Element, number][]) {
    if (value > maxValue) {
      maxValue = value;
      maxElement = element;
    }
  }

  return maxElement;
}

/**
 * 오행 정규화 (0-100)
 */
function normalizeElements(elements: Record<Element, number>): Record<Element, number> {
  const maxValue = Math.max(...Object.values(elements));
  const normalized: Record<Element, number> = {} as any;

  for (const [element, value] of Object.entries(elements) as [Element, number][]) {
    normalized[element as Element] = Math.round((value / maxValue) * 100);
  }

  return normalized;
}

/**
 * 운명 총평 생성
 */
function generateOverallSummary(
  year: number,
  yearlyLuck: ReturnType<typeof getYearlyLuck>,
  dominantElement: Element,
  compatibility: ReturnType<typeof analyzeYearElementCompatibility>,
  gender: 'male' | 'female'
): string {
  const pronoun = gender === 'male' ? '그대' : '당신';

  return `${yearlyLuck.description}\n\n${pronoun}의 대표 기운은 '${dominantElement}'입니다. ${compatibility.message}\n\n${yearlyLuck.keyword}의 에너지를 받아 ${compatibility.relationship === '상생(生)' ? '크게 도약할' : compatibility.relationship === '상극(剋)' ? '신중하게 나아갈' : '안정적으로 성장할'} 수 있는 한 해입니다.`;
}

/**
 * 에너지 성격화 (십신)
 */
function characterizeEnergy(
  dominantElement: Element,
  elements: Record<Element, number>
): { type: string; description: string } {
  const elementCount = elements[dominantElement];

  const characters: Record<Element, { type: string; descriptions: string[] }> = {
    '목': {
      type: '인성(印星)',
      descriptions: [
        '나무가 1-2개: 당신은 차분하고 사려깊은 학자 스타일입니다. 배움을 즐기고 인내심이 강합니다.',
        '나무가 3개 이상: 성장 욕구가 강한 "무한 확장형" 인간! 새로운 것을 끊임없이 배우고 시도합니다.',
        '나무가 많음: 가끔은 욕심이 과해서 여러 일을 동시에 벌이다가 지칠 수 있으니 주의하세요.'
      ]
    },
    '화': {
      type: '식상(食傷)',
      descriptions: [
        '불이 1-2개: 따뜻하고 표현력이 좋은 커뮤니케이터입니다.',
        '불이 3개 이상: 당신은 추진력이 엄청난 "인간 다이너마이트" 스타일! 열정이 폭발합니다.',
        '불이 많음: 에너지가 너무 강해서 가끔 타인을 압도할 수 있습니다. 화상 주의!'
      ]
    },
    '토': {
      type: '비겁(比劫)',
      descriptions: [
        '흙이 1-2개: 안정적이고 신뢰할 수 있는 든든한 존재입니다.',
        '흙이 3개 이상: 대지처럼 모든 것을 포용하는 "만능 중재자"! 사람들이 당신을 찾습니다.',
        '흙이 많음: 너무 움직이지 않으려 해서 변화의 기회를 놓칠 수 있습니다.'
      ]
    },
    '금': {
      type: '관성(官星)',
      descriptions: [
        '금이 1-2개: 원칙을 중시하는 정의로운 사람입니다.',
        '금이 3개 이상: 칼처럼 날카로운 판단력의 소유자! 흑백 논리가 명확합니다.',
        '금이 많음: 너무 엄격해서 융통성이 부족할 수 있습니다. 가끔은 타협도 필요해요.'
      ]
    },
    '수': {
      type: '재성(財星)',
      descriptions: [
        '물이 1-2개: 지혜롭고 유연한 사고의 소유자입니다.',
        '물이 3개 이상: 깊고 넓은 사고를 가진 "인간 데이터베이스"! 통찰력이 뛰어납니다.',
        '물이 많음: 생각이 너무 많아 결정 장애가 올 수 있습니다. 때로는 직관도 믿어보세요.'
      ]
    }
  };

  const char = characters[dominantElement];
  let description = char.descriptions[0];

  if (elementCount >= 3) {
    description = char.descriptions[1];
  }
  if (elementCount >= 5) {
    description = char.descriptions[2];
  }

  return {
    type: char.type,
    description
  };
}

/**
 * 운세 레이더 생성
 */
function generateLuckRadar(
  elements: Record<Element, number>,
  rng: SeededRandom
): {
  재물운: number;
  연애운: number;
  건강운: number;
  명예운: number;
  학업운: number;
} {
  return {
    재물운: Math.min(100, elements['수'] * 15 + rng.nextInt(10, 30)),
    연애운: Math.min(100, elements['화'] * 15 + rng.nextInt(10, 30)),
    건강운: Math.min(100, elements['토'] * 15 + rng.nextInt(10, 30)),
    명예운: Math.min(100, elements['금'] * 15 + rng.nextInt(10, 30)),
    학업운: Math.min(100, elements['목'] * 15 + rng.nextInt(10, 30))
  };
}

/**
 * 행운 아이템 생성
 */
function generateLuckyItems(
  dominantElement: Element,
  birthInput: SajuInput,
  rng: SeededRandom
): CompleteFortune['luckyItems'] {
  const colors: Record<Element, { hex: string; name: string }[]> = {
    '목': [
      { hex: '#00C851', name: '에메랄드 그린' },
      { hex: '#90EE90', name: '연두색' },
      { hex: '#228B22', name: '포레스트 그린' }
    ],
    '화': [
      { hex: '#FF4444', name: '파이어 레드' },
      { hex: '#FF6B6B', name: '코랄 핑크' },
      { hex: '#FF8C00', name: '선셋 오렌지' }
    ],
    '토': [
      { hex: '#F4A460', name: '샌디 베이지' },
      { hex: '#D2691E', name: '초콜릿 브라운' },
      { hex: '#FFD700', name: '골든 옐로우' }
    ],
    '금': [
      { hex: '#C0C0C0', name: '실버 화이트' },
      { hex: '#FFD700', name: '골드' },
      { hex: '#E8E8E8', name: '펄 화이트' }
    ],
    '수': [
      { hex: '#4A90E2', name: '오션 블루' },
      { hex: '#1E3A5F', name: '미드나잇 블루' },
      { hex: '#000080', name: '네이비' }
    ]
  };

  const foods: Record<Element, string[]> = {
    '목': ['샐러드', '채소 스틱', '녹즙', '새싹 비빔밥'],
    '화': ['매운 떡볶이', '불닭볶음면', '양념 치킨', '김치찌개'],
    '토': ['감자탕', '된장찌개', '고구마', '단호박죽'],
    '금': ['삼계탕', '도가니탕', '곰탕', '흰살 생선'],
    '수': ['물회', '냉면', '해산물 파스타', '미역국']
  };

  const places: Record<Element, string[]> = {
    '목': ['숲', '공원', '식물원', '도서관'],
    '화': ['놀이공원', '클럽', '축제', '뷔페'],
    '토': ['카페', '집', '전통 시장', '박물관'],
    '금': ['은행', '병원', '관공서', '보석상'],
    '수': ['바다', '강', '수족관', '온천']
  };

  const color = rng.choice(colors[dominantElement]);
  const food = rng.choice(foods[dominantElement]);
  const place = rng.choice(places[dominantElement]);

  // 로또 번호 6개 (생년월일 기반)
  const numbers = [
    (birthInput.birthYear % 45) + 1,
    (birthInput.birthMonth * 3) % 45 + 1,
    (birthInput.birthDay * 2) % 45 + 1,
    (birthInput.birthHour * 2) % 45 + 1,
    rng.nextInt(1, 45),
    rng.nextInt(1, 45)
  ].sort((a, b) => a - b);

  const times: Record<Element, string> = {
    '목': '오전 7시~9시 (묘시)',
    '화': '오전 11시~오후 1시 (오시)',
    '토': '오후 1시~3시 (미시)',
    '금': '오후 3시~5시 (신시)',
    '수': '오후 9시~11시 (해시)'
  };

  return {
    color,
    food: `${food} (${dominantElement}의 기운 보충)`,
    numbers,
    place,
    time: times[dominantElement]
  };
}

/**
 * 피해야 할 것 생성
 */
function generateAvoidItems(
  dominantElement: Element,
  rng: SeededRandom
): CompleteFortune['avoid'] {
  const avoidMap: Record<Element, { time: string; item: string; action: string }> = {
    '목': {
      time: '오후 3시~5시 (금 기운)',
      item: '날카로운 금속 액세서리',
      action: '큰 결정은 신중하게'
    },
    '화': {
      time: '오후 9시~11시 (수 기운)',
      item: '검은색 계열 의상',
      action: '물가에서의 과격한 활동'
    },
    '토': {
      time: '오전 7시~9시 (목 기운)',
      item: '녹색 계열 소품',
      action: '무리한 확장이나 투자'
    },
    '금': {
      time: '오전 11시~오후 1시 (화 기운)',
      item: '붉은색 계열 의상',
      action: '감정적인 대화나 논쟁'
    },
    '수': {
      time: '오후 1시~3시 (토 기운)',
      item: '노란색 계열 소품',
      action: '과도한 저축이나 움츠림'
    }
  };

  return avoidMap[dominantElement];
}

/**
 * MBTI 베스트 파트너 찾기
 */
function findBestMBTIPartner(
  myMBTI: MBTIType,
  rng: SeededRandom
): { mbti: MBTIType; reason: string } {
  const bestPartners: Record<MBTIType, MBTIType[]> = {
    'ENFP': ['INTJ', 'INFJ'],
    'INFP': ['ENFJ', 'ENTJ'],
    'ENTP': ['INFJ', 'INTJ'],
    'INTP': ['ENTJ', 'ENFJ'],
    'ENFJ': ['INFP', 'ISFP'],
    'INFJ': ['ENTP', 'ENFP'],
    'ENTJ': ['INTP', 'INFP'],
    'INTJ': ['ENFP', 'ENTP'],
    'ESFP': ['ISTJ', 'ISFJ'],
    'ISFP': ['ENFJ', 'ESFJ'],
    'ESTP': ['ISTJ', 'ISFJ'],
    'ISTP': ['ESTJ', 'ESFJ'],
    'ESFJ': ['ISFP', 'ISTP'],
    'ISFJ': ['ESFP', 'ESTP'],
    'ESTJ': ['ISTP', 'ISFP'],
    'ISTJ': ['ESFP', 'ESTP']
  };

  const partners = bestPartners[myMBTI] || ['ENFP'];
  const selectedPartner = rng.choice(partners);

  const reasons: string[] = [
    `${selectedPartner}는 당신의 부족한 면을 완벽하게 채워주는 파트너입니다.`,
    `오늘은 ${selectedPartner}와의 만남이 특별한 행운을 가져다 줄 것입니다.`,
    `${selectedPartner}의 에너지가 당신의 잠재력을 깨워줄 것입니다.`,
    `운명의 실타래가 ${selectedPartner}를 향하고 있습니다.`
  ];

  return {
    mbti: selectedPartner,
    reason: rng.choice(reasons)
  };
}
