import { MBTIType, Element } from '@/types';

export interface FusionCharacter {
  name: string;
  emoji: string;
  description: string;
  strength: string;
  weakness: string;
  charm: string;
}

/**
 * MBTI와 주요 오행을 조합한 캐릭터 생성
 */
export function createFusionCharacter(
  mbti: MBTIType,
  dominantElement: Element
): FusionCharacter {
  const key = `${mbti}_${dominantElement}`;

  const characters: Record<string, FusionCharacter> = {
    // ENFP 조합
    'ENFP_목': {
      name: '봄날의 나비',
      emoji: '🦋🌸',
      description: '끝없이 성장하고 확장하는 자유로운 영혼. 새로운 것에 대한 호기심이 넘치고, 어디든 날아갈 준비가 되어있습니다.',
      strength: '무한한 창의력과 적응력',
      weakness: '한 곳에 정착하기 어려움',
      charm: '주변을 밝게 만드는 긍정 에너지'
    },
    'ENFP_화': {
      name: '태양 아래 춤추는 골든리트리버',
      emoji: '🐕☀️',
      description: '열정과 에너지가 넘쳐흐르는 순수한 영혼. 모든 것에 진심이고, 그 진심이 주변을 감염시킵니다.',
      strength: '무한 에너지와 전염성 있는 열정',
      weakness: '감정 기복이 심할 수 있음',
      charm: '누구도 거부할 수 없는 순수함'
    },

    // INTJ 조합
    'INTJ_금': {
      name: '차갑고 날카로운 새벽의 검',
      emoji: '⚔️🌙',
      description: '냉철한 분석력과 단호한 결단력을 가진 전략가. 목표를 향해 정확하게 나아갑니다.',
      strength: '논리적 사고와 완벽한 계획',
      weakness: '감정 표현이 서툴 수 있음',
      charm: '믿음직한 신뢰감'
    },
    'INTJ_수': {
      name: '깊은 바다의 지략가',
      emoji: '🐙🌊',
      description: '깊고 넓은 사고로 모든 것을 꿰뚫어 보는 현자. 겉으로 드러나지 않지만 엄청난 지혜를 품고 있습니다.',
      strength: '통찰력과 장기적 비전',
      weakness: '외로움을 탈 수 있음',
      charm: '신비로운 카리스마'
    },

    // ESFP 조합
    'ESFP_화': {
      name: '파티장을 장악하는 불꽃놀이',
      emoji: '🎆🎉',
      description: '현재를 즐기는 데 타고난 천재. 어디를 가든 파티가 시작되고, 모든 이의 시선을 사로잡습니다.',
      strength: '순간을 즐기는 능력',
      weakness: '미래 계획이 약할 수 있음',
      charm: '타고난 엔터테이너'
    },

    // ISFJ 조합
    'ISFJ_토': {
      name: '따뜻한 대지의 수호자',
      emoji: '🏡🌾',
      description: '안정과 평화를 사랑하는 든든한 존재. 주변 사람들을 보살피며 편안함을 제공합니다.',
      strength: '헌신과 책임감',
      weakness: '변화를 두려워할 수 있음',
      charm: '믿고 의지할 수 있는 든든함'
    },

    // ENTP 조합
    'ENTP_목': {
      name: '끝없이 뻗어나가는 덩굴 발명가',
      emoji: '🧪🌿',
      description: '새로운 아이디어가 끊임없이 솟아나는 혁신가. 기존의 틀을 깨고 새로운 길을 만듭니다.',
      strength: '창의적 문제 해결',
      weakness: '마무리가 약할 수 있음',
      charm: '예측 불가능한 재미'
    },
    'ENTP_금': {
      name: '번개처럼 빠른 논리 전사',
      emoji: '⚡🤺',
      description: '날카로운 논리로 모든 것을 분석하고 반박하는 토론의 달인. 지적 자극을 즐깁니다.',
      strength: '뛰어난 논리력',
      weakness: '논쟁을 즐겨서 관계에 문제',
      charm: '지적인 매력'
    },

    // INFP 조합
    'INFP_수': {
      name: '달빛 아래 꿈꾸는 시인',
      emoji: '🌙✍️',
      description: '깊은 내면 세계를 가진 이상주의자. 감성과 상상력으로 아름다운 세계를 창조합니다.',
      strength: '풍부한 감성과 공감 능력',
      weakness: '현실 감각이 부족할 수 있음',
      charm: '순수하고 깊은 감성'
    },

    // ESTJ 조합
    'ESTJ_금': {
      name: '강철 같은 조직의 리더',
      emoji: '👔⚙️',
      description: '원칙과 질서를 중시하는 완벽한 매니저. 효율성과 결과로 말합니다.',
      strength: '체계적 관리 능력',
      weakness: '융통성이 부족할 수 있음',
      charm: '신뢰할 수 있는 리더십'
    },

    // 기본 템플릿들...
  };

  // 특정 조합이 없으면 기본 조합 생성
  return characters[key] || createDefaultCharacter(mbti, dominantElement);
}

function createDefaultCharacter(mbti: MBTIType, element: Element): FusionCharacter {
  const mbtiDescriptions: Record<string, string> = {
    'E': '외향적이고 활발한',
    'I': '내향적이고 신중한',
    'N': '직관적이고 창의적인',
    'S': '현실적이고 실용적인',
    'F': '감성적이고 공감적인',
    'T': '논리적이고 분석적인',
    'J': '계획적이고 체계적인',
    'P': '유연하고 즉흥적인'
  };

  const elementNames: Record<Element, { name: string; emoji: string; trait: string }> = {
    '목': { name: '성장하는 나무', emoji: '🌳', trait: '확장과 발전' },
    '화': { name: '타오르는 불꽃', emoji: '🔥', trait: '열정과 변화' },
    '토': { name: '든든한 대지', emoji: '🏔️', trait: '안정과 포용' },
    '금': { name: '빛나는 금속', emoji: '⚔️', trait: '날카로움과 정의' },
    '수': { name: '흐르는 물', emoji: '💧', trait: '지혜와 유연함' }
  };

  const elementInfo = elementNames[element];
  const e = mbti[0];
  const n = mbti[1];
  const f = mbti[2];
  const j = mbti[3];

  return {
    name: `${elementInfo.name}의 ${mbti} 전사`,
    emoji: `${elementInfo.emoji}✨`,
    description: `${mbtiDescriptions[e]} ${mbtiDescriptions[n]} 성향과 ${element}의 ${elementInfo.trait} 에너지가 결합된 독특한 존재입니다.`,
    strength: `${mbtiDescriptions[f]} 판단력과 ${mbtiDescriptions[j]} 태도`,
    weakness: '아직 발견되지 않은 숨겨진 면모',
    charm: `${element} 기운이 주는 특별한 매력`
  };
}

/**
 * 퓨전 궁합 분석
 */
export function analyzeFusionCompatibility(
  myMBTI: MBTIType,
  myElement: Element,
  partnerMBTI: MBTIType,
  partnerElement: Element
): { score: number; message: string; type: string } {
  // MBTI 궁합 점수
  const mbtiScore = calculateMBTIScore(myMBTI, partnerMBTI);

  // 오행 궁합 점수
  const elementScore = calculateElementScore(myElement, partnerElement);

  // 평균 점수
  const totalScore = Math.round((mbtiScore + elementScore) / 2);

  // 궁합 타입 결정
  let type = '';
  let message = '';

  if (mbtiScore >= 70 && elementScore >= 70) {
    type = '천생연분';
    message = '성격도 잘 맞고 오행도 완벽! 이보다 더 좋을 순 없습니다.';
  } else if (mbtiScore >= 70 && elementScore < 50) {
    type = '애증의 관계';
    message = 'MBTI는 찰떡이지만 오행이 충돌... 끌리지만 힘든 관계일 수 있습니다.';
  } else if (mbtiScore < 50 && elementScore >= 70) {
    type = '운명적 끌림';
    message: '성격은 안 맞아도 운명적으로 서로를 보완하는 관계입니다.';
  } else if (mbtiScore >= 50 && elementScore >= 50) {
    type = '좋은 파트너';
    message = '서로 보완하며 함께 성장할 수 있는 좋은 관계입니다.';
  } else {
    type = '노력이 필요';
    message = '차이를 인정하고 서로 배우는 자세가 필요합니다.';
  }

  return { score: totalScore, message, type };
}

function calculateMBTIScore(mbti1: MBTIType, mbti2: MBTIType): number {
  // 간단한 MBTI 궁합 로직 (기존 mbtiCompatibility.ts 활용)
  const compatibilityMap: Record<string, number> = {
    'ENFP_INTJ': 90, 'ENTP_INFJ': 90, 'ESFP_ISTJ': 85,
    'ENFJ_INFP': 88, 'ESTJ_ISTP': 80
  };

  const key1 = `${mbti1}_${mbti2}`;
  const key2 = `${mbti2}_${mbti1}`;

  return compatibilityMap[key1] || compatibilityMap[key2] || 60;
}

function calculateElementScore(element1: Element, element2: Element): number {
  // 상생 관계
  const sheng: Record<Element, Element> = {
    '목': '화', '화': '토', '토': '금', '금': '수', '수': '목'
  };

  // 상극 관계
  const ke: Record<Element, Element> = {
    '목': '토', '화': '금', '토': '수', '금': '목', '수': '화'
  };

  if (element1 === element2) return 70; // 같은 오행
  if (sheng[element1] === element2) return 90; // 상생
  if (sheng[element2] === element1) return 85; // 역상생
  if (ke[element1] === element2) return 40; // 상극
  if (ke[element2] === element1) return 45; // 역상극

  return 60; // 기타
}
