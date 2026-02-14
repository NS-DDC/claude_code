import { SajuInput, SajuResult, Element, SajuCompatibility } from '@/types';

// 천간(天干) - 10개
const heavenlyStems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];

// 지지(地支) - 12개
const earthlyBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 오행 매핑
const stemElementMap: Record<string, Element> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수'
};

const branchElementMap: Record<string, Element> = {
  '자': '수', '축': '토',
  '인': '목', '묘': '목',
  '진': '토', '사': '화',
  '오': '화', '미': '토',
  '신': '금', '유': '금',
  '술': '토', '해': '수'
};

// 사주 계산 함수
export function calculateSaju(input: SajuInput): SajuResult {
  const { birthYear, birthMonth, birthDay, birthHour } = input;

  // 간단한 사주 계산 (실제로는 더 복잡한 역법 계산이 필요)
  const yearStem = heavenlyStems[(birthYear - 4) % 10];
  const yearBranch = earthlyBranches[(birthYear - 4) % 12];

  const monthStem = heavenlyStems[birthMonth % 10];
  const monthBranch = earthlyBranches[birthMonth % 12];

  const dayStem = heavenlyStems[birthDay % 10];
  const dayBranch = earthlyBranches[birthDay % 12];

  const hourStem = heavenlyStems[Math.floor(birthHour / 2) % 10];
  const hourBranch = earthlyBranches[Math.floor(birthHour / 2) % 12];

  // 오행 분포 계산
  const elements: Record<Element, number> = {
    '목': 0,
    '화': 0,
    '토': 0,
    '금': 0,
    '수': 0
  };

  // 천간 처리
  [yearStem, monthStem, dayStem, hourStem].forEach(stem => {
    const element = stemElementMap[stem];
    if (element) {
      elements[element]++;
    }
  });

  // 지지 처리
  [yearBranch, monthBranch, dayBranch, hourBranch].forEach(branch => {
    const element = branchElementMap[branch];
    if (element) {
      elements[element]++;
    }
  });

  // 가장 강한 오행과 약한 오행 찾기
  const sortedElements = (Object.entries(elements) as [Element, number][])
    .sort((a, b) => b[1] - a[1]);

  const luckyElement = sortedElements[sortedElements.length - 1][0]; // 가장 약한 오행이 보완이 필요
  const unluckyElement = sortedElements[0][0]; // 가장 강한 오행은 조심

  // 설명 생성
  const description = generateDescription(elements, luckyElement, unluckyElement, input.gender);

  return {
    id: `saju_${Date.now()}_${Math.random()}`,
    date: new Date().toISOString(),
    input,
    elements,
    description,
    luckyElement,
    unluckyElement
  };
}

function generateDescription(
  elements: Record<Element, number>,
  luckyElement: Element,
  unluckyElement: Element,
  gender: 'male' | 'female'
): string {
  const dominant = (Object.entries(elements) as [Element, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  const descriptions: Record<Element, string> = {
    '목': `${gender === 'male' ? '그대는' : '당신은'} 나무처럼 성장하고 발전하는 에너지가 강합니다. 창의적이고 진취적인 성향을 지녔으며, 새로운 것에 도전하는 것을 즐깁니다.`,
    '화': `${gender === 'male' ? '그대는' : '당신은'} 불처럼 열정적이고 활발한 에너지를 지녔습니다. 리더십이 강하고 주변을 밝게 만드는 카리스마가 있습니다.`,
    '토': `${gender === 'male' ? '그대는' : '당신은'} 대지처럼 안정적이고 신뢰할 수 있는 성품을 가졌습니다. 포용력이 크고 중재 능력이 뛰어납니다.`,
    '금': `${gender === 'male' ? '그대는' : '당신은'} 금속처럼 단단하고 의지가 강합니다. 원칙을 중요시하며 정의롭고 공정한 판단력을 지녔습니다.`,
    '수': `${gender === 'male' ? '그대는' : '당신은'} 물처럼 유연하고 지혜로운 에너지를 가졌습니다. 적응력이 뛰어나고 깊이 있는 사고를 합니다.`
  };

  return `${descriptions[dominant]}\n\n행운의 오행은 '${luckyElement}'입니다. ${luckyElement} 기운을 보완하면 더욱 균형잡힌 삶을 살 수 있습니다.\n반면 '${unluckyElement}' 기운이 과하니 조절이 필요합니다.`;
}

// 사주 궁합 계산
export function calculateSajuCompatibility(
  myBirth: SajuInput,
  partnerBirth: SajuInput
): SajuCompatibility {
  const mySaju = calculateSaju(myBirth);
  const partnerSaju = calculateSaju(partnerBirth);

  // 오행 상생상극 계산
  let compatibilityScore = 50; // 기본 점수

  // 각 오행의 차이를 계산하여 궁합 점수 산출
  const elements: Element[] = ['목', '화', '토', '금', '수'];
  elements.forEach(element => {
    const diff = Math.abs(mySaju.elements[element] - partnerSaju.elements[element]);
    // 차이가 적을수록 좋음
    compatibilityScore += (3 - diff) * 5;
  });

  // 0-100 범위로 조정
  compatibilityScore = Math.max(0, Math.min(100, compatibilityScore));

  const description = generateCompatibilityDescription(compatibilityScore, mySaju, partnerSaju);

  return {
    id: `saju_compat_${Date.now()}_${Math.random()}`,
    date: new Date().toISOString(),
    myBirth,
    partnerBirth,
    compatibilityScore,
    description
  };
}

function generateCompatibilityDescription(
  score: number,
  mySaju: SajuResult,
  partnerSaju: SajuResult
): string {
  let level = '';
  let advice = '';

  if (score >= 80) {
    level = '최상의 궁합';
    advice = '두 분은 천생연분입니다. 서로의 부족한 부분을 완벽하게 채워주는 관계입니다.';
  } else if (score >= 60) {
    level = '좋은 궁합';
    advice = '서로를 이해하고 존중한다면 좋은 관계를 유지할 수 있습니다.';
  } else if (score >= 40) {
    level = '보통 궁합';
    advice = '노력이 필요하지만 충분히 좋은 관계를 만들 수 있습니다.';
  } else {
    level = '노력이 필요한 궁합';
    advice = '서로의 차이를 인정하고 배려한다면 발전할 수 있는 관계입니다.';
  }

  return `궁합 점수: ${score}점 (${level})\n\n${advice}\n\n본인의 행운 오행은 '${mySaju.luckyElement}', 상대방의 행운 오행은 '${partnerSaju.luckyElement}'입니다.`;
}
