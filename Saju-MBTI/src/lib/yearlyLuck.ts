import { Element } from '@/types';

// 천간 (10개)
const heavenlyStems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const heavenlyStemsElement: Element[] = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];

// 지지 (12개)
const earthlyBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const earthlyBranchesAnimal = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
const earthlyBranchesElement: Element[] = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'];

export interface YearlyLuckInfo {
  year: number;
  stem: string;
  branch: string;
  animal: string;
  element: Element;
  color: string;
  description: string;
  keyword: string;
}

/**
 * 특정 연도의 세운 정보 가져오기
 */
export function getYearlyLuck(year: number): YearlyLuckInfo {
  const stemIndex = (year - 4) % 10;
  const branchIndex = (year - 4) % 12;

  const stem = heavenlyStems[stemIndex];
  const branch = earthlyBranches[branchIndex];
  const animal = earthlyBranchesAnimal[branchIndex];
  const element = heavenlyStemsElement[stemIndex];

  const colorMap: Record<Element, string> = {
    '목': '푸른',
    '화': '붉은',
    '토': '노란',
    '금': '하얀',
    '수': '검은'
  };

  const color = colorMap[element];

  const descriptions: Record<string, string> = {
    '2024': `2024년은 갑진년(甲辰年), ${color} 용의 해입니다. 목(木)의 기운이 강하게 작용하여 새로운 시작과 성장의 에너지가 넘칩니다. 용의 기운은 변화와 도약을 상징하며, 과감한 도전이 길운을 부릅니다.`,
    '2025': `2025년은 을사년(乙巳年), ${color} 뱀의 해입니다. 목(木)과 화(火)의 조화로 지혜와 열정이 만나는 한 해입니다. 뱀의 신중함과 통찰력이 당신의 결정에 깊이를 더해줄 것입니다.`,
    '2026': `2026년은 병오년(丙午年), ${color} 말의 해입니다. 화(火)의 기운이 최고조에 달해 열정과 추진력이 폭발하는 한 해입니다. 말처럼 전력질주하는 한 해가 될 것입니다.`
  };

  const description = descriptions[year.toString()] ||
    `${year}년은 ${stem}${branch}년, ${color} ${animal}의 해입니다. ${element}(${getElementKorean(element)})의 기운이 한 해를 주도합니다.`;

  const keywordMap: Record<Element, string> = {
    '목': '성장과 확장',
    '화': '열정과 변화',
    '토': '안정과 수확',
    '금': '결실과 정리',
    '수': '지혜와 준비'
  };

  return {
    year,
    stem,
    branch,
    animal,
    element,
    color,
    description,
    keyword: keywordMap[element]
  };
}

function getElementKorean(element: Element): string {
  const map: Record<Element, string> = {
    '목': '木',
    '화': '火',
    '토': '土',
    '금': '金',
    '수': '水'
  };
  return map[element];
}

/**
 * 연도 오행과 개인 오행의 상생상극 분석
 */
export function analyzeYearElementCompatibility(
  yearElement: Element,
  personalElement: Element
): { relationship: string; message: string } {
  // 상생 관계
  const sheng: Record<Element, Element> = {
    '목': '화',
    '화': '토',
    '토': '금',
    '금': '수',
    '수': '목'
  };

  // 상극 관계
  const ke: Record<Element, Element> = {
    '목': '토',
    '화': '금',
    '토': '수',
    '금': '목',
    '수': '화'
  };

  if (sheng[yearElement] === personalElement) {
    return {
      relationship: '상생(生)',
      message: `올해의 ${yearElement} 기운이 당신의 ${personalElement} 기운을 키워줍니다. 도움을 받는 한 해가 될 것입니다.`
    };
  }

  if (sheng[personalElement] === yearElement) {
    return {
      relationship: '배출(泄)',
      message: `당신의 ${personalElement} 기운이 올해 ${yearElement} 기운을 만들어냅니다. 주는 것이 많은 한 해가 될 수 있습니다.`
    };
  }

  if (ke[yearElement] === personalElement) {
    return {
      relationship: '상극(剋)',
      message: `올해 ${yearElement} 기운이 당신의 ${personalElement} 기운과 충돌합니다. 조심스럽게 행동하는 지혜가 필요합니다.`
    };
  }

  if (ke[personalElement] === yearElement) {
    return {
      relationship: '극제(制)',
      message: `당신의 ${personalElement} 기운이 올해 ${yearElement} 기운을 제압합니다. 주도적인 한 해가 될 것입니다.`
    };
  }

  return {
    relationship: '비화(比和)',
    message: `올해와 당신의 기운이 같아 편안하고 안정적인 한 해가 될 것입니다.`
  };
}

/**
 * Get destiny character year advice
 */
export function getDestinyYearAdvice(
  year: number,
  characterElement: Element,
  mbti: string
): string {
  const yearInfo = getYearlyLuck(year);
  const compatibility = analyzeYearElementCompatibility(yearInfo.element, characterElement);

  // MBTI category-specific advice
  const categoryAdvice: Record<string, Record<string, string>> = {
    '상생(生)': {
      'NT': '올해는 당신의 전략적 사고가 더욱 빛을 발할 것입니다. 큰 그림을 그리고 과감하게 실행하세요.',
      'NF': '올해는 당신의 이상과 비전이 현실화될 수 있는 해입니다. 타인과의 교감을 통해 더 큰 영향력을 발휘하세요.',
      'SJ': '올해는 당신의 꾸준함과 책임감이 큰 결실을 맺을 것입니다. 체계적으로 준비하고 실행하세요.',
      'SP': '올해는 당신의 실행력과 적응력이 돋보일 것입니다. 기회를 포착하고 빠르게 행동하세요.'
    },
    '배출(泄)': {
      'NT': '올해는 당신의 지혜와 전략을 아낌없이 나누는 해가 될 것입니다. 멘토링이나 리더십 역할이 적합합니다.',
      'NF': '올해는 타인을 돕고 영감을 주는 활동에 집중하세요. 당신의 에너지가 많은 이들에게 희망이 될 것입니다.',
      'SJ': '올해는 조직이나 커뮤니티에 기여하는 해가 될 것입니다. 책임감을 가지고 리더십을 발휘하세요.',
      'SP': '올해는 당신의 능력을 다양한 곳에서 발휘할 것입니다. 과도한 소진을 조심하며 에너지를 관리하세요.'
    },
    '상극(剋)': {
      'NT': '올해는 신중한 전략과 계획이 필요합니다. 성급한 결정을 피하고 충분히 분석한 후 행동하세요.',
      'NF': '올해는 이상과 현실 사이의 균형을 찾아야 하는 해입니다. 자신을 돌보며 현실적인 목표를 세우세요.',
      'SJ': '올해는 변화에 유연하게 대처하는 것이 중요합니다. 기존의 방식을 고수하기보다 새로운 접근을 시도하세요.',
      'SP': '올해는 충동을 조절하고 신중하게 행동해야 합니다. 장기적인 계획을 세우고 차근차근 실행하세요.'
    },
    '극제(制)': {
      'NT': '올해는 당신이 주도권을 쥐고 이끌어갈 수 있는 해입니다. 자신감을 가지고 큰 프로젝트를 시작하세요.',
      'NF': '올해는 당신의 비전과 이상을 실현할 수 있는 힘이 있습니다. 두려워하지 말고 앞으로 나아가세요.',
      'SJ': '올해는 당신의 체계와 원칙이 빛을 발할 것입니다. 자신의 방식을 믿고 일관되게 추진하세요.',
      'SP': '올해는 당신의 결단력과 행동력이 최고조에 달합니다. 기회를 잡고 과감하게 도전하세요.'
    },
    '비화(比和)': {
      'NT': '올해는 안정적인 가운데 전략을 다듬을 수 있는 해입니다. 기반을 다지고 장기 계획을 수립하세요.',
      'NF': '올해는 내면의 성장과 자기 이해에 집중할 수 있는 해입니다. 자신을 돌아보고 재충전하세요.',
      'SJ': '올해는 편안하게 루틴을 유지하며 꾸준히 성과를 낼 수 있습니다. 일관성을 유지하세요.',
      'SP': '올해는 자신의 페이스대로 즐기며 살 수 있는 해입니다. 무리하지 말고 균형을 유지하세요.'
    }
  };

  // Determine MBTI category
  const firstLetter = mbti[0];
  const secondLetter = mbti[1];
  let category = 'NT';
  if (secondLetter === 'F') {
    category = firstLetter === 'E' || firstLetter === 'I' ? 'NF' : 'NF';
  } else if (secondLetter === 'T') {
    category = 'NT';
  }
  if (mbti.includes('S') && mbti.includes('J')) {
    category = 'SJ';
  } else if (mbti.includes('S') && mbti.includes('P')) {
    category = 'SP';
  }

  const specificAdvice = categoryAdvice[compatibility.relationship]?.[category] || '';

  return `${yearInfo.description}\n\n${compatibility.message}\n\n${specificAdvice}`;
}

