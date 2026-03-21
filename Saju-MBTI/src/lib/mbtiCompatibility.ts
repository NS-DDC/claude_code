import { MBTIType, MBTICompatibility } from '@/types';

// MBTI 궁합 점수표 (0-5점)
const compatibilityScores: Record<MBTIType, Partial<Record<MBTIType, number>>> = {
  // INTJ 궁합
  'INTJ': { 'ENTP': 5, 'ENFP': 5, 'INTP': 4, 'INFJ': 4, 'ENTJ': 4, 'INTJ': 3 },

  // INTP 궁합
  'INTP': { 'ENTJ': 5, 'ENFJ': 5, 'INTJ': 4, 'INFP': 4, 'ENTP': 4, 'INTP': 3 },

  // ENTJ 궁합
  'ENTJ': { 'INTP': 5, 'INFP': 5, 'ENTP': 4, 'INTJ': 4, 'ENFJ': 4, 'ENTJ': 3 },

  // ENTP 궁합
  'ENTP': { 'INTJ': 5, 'INFJ': 5, 'INTP': 4, 'ENTJ': 4, 'ENFP': 4, 'ENTP': 3 },

  // INFJ 궁합
  'INFJ': { 'ENTP': 5, 'ENFP': 5, 'INFP': 4, 'INTJ': 4, 'ENFJ': 4, 'INFJ': 3 },

  // INFP 궁합
  'INFP': { 'ENFJ': 5, 'ENTJ': 5, 'INFJ': 4, 'INTP': 4, 'ENFP': 4, 'INFP': 3 },

  // ENFJ 궁합
  'ENFJ': { 'INFP': 5, 'ISFP': 5, 'INTP': 5, 'INFJ': 4, 'ENTJ': 4, 'ENFJ': 3 },

  // ENFP 궁합
  'ENFP': { 'INTJ': 5, 'INFJ': 5, 'INTP': 4, 'ENTP': 4, 'INFP': 4, 'ENFP': 3 },

  // ISTJ 궁합
  'ISTJ': { 'ESTP': 5, 'ESFP': 5, 'ISFJ': 4, 'ESTJ': 4, 'ISTP': 3, 'ISTJ': 3 },

  // ISFJ 궁합
  'ISFJ': { 'ESFP': 5, 'ESTP': 5, 'ISTJ': 4, 'ESFJ': 4, 'ISFP': 3, 'ISFJ': 3 },

  // ESTJ 궁합
  'ESTJ': { 'ISTP': 5, 'ISFP': 5, 'ISTJ': 4, 'ESTP': 4, 'ESFJ': 4, 'ESTJ': 3 },

  // ESFJ 궁합
  'ESFJ': { 'ISFP': 5, 'ISTP': 5, 'ISFJ': 4, 'ESTJ': 4, 'ESFP': 4, 'ESFJ': 3 },

  // ISTP 궁합
  'ISTP': { 'ESTJ': 5, 'ESFJ': 5, 'ESTP': 4, 'ISTJ': 3, 'ISFP': 3, 'ISTP': 3 },

  // ISFP 궁합
  'ISFP': { 'ENFJ': 5, 'ESFJ': 5, 'ESTJ': 5, 'ESFP': 4, 'ISFJ': 3, 'ISFP': 3 },

  // ESTP 궁합
  'ESTP': { 'ISTJ': 5, 'ISFJ': 5, 'ISTP': 4, 'ESTJ': 4, 'ESFP': 4, 'ESTP': 3 },

  // ESFP 궁합
  'ESFP': { 'ISTJ': 5, 'ISFJ': 5, 'ISFP': 4, 'ESTP': 4, 'ESFJ': 4, 'ESFP': 3 }
};

// MBTI 설명
const mbtiDescriptions: Record<MBTIType, string> = {
  'INTJ': '전략가 - 상상력이 풍부하고 계획적이며 모든 것에 대한 전략을 가지고 있습니다.',
  'INTP': '논리학자 - 혁신적인 발명가로 끊임없는 지식에 대한 갈증을 가지고 있습니다.',
  'ENTJ': '통솔자 - 대담하고 상상력이 풍부하며 의지가 강한 지도자입니다.',
  'ENTP': '변론가 - 영리하고 호기심이 많으며 지적 도전을 즐깁니다.',
  'INFJ': '옹호자 - 이상주의적이고 원칙주의적이며 타인을 돕는 것을 목표로 합니다.',
  'INFP': '중재자 - 시적이고 친절하며 이타적인 성품을 가졌습니다.',
  'ENFJ': '선도자 - 카리스마 있고 영감을 주는 지도자입니다.',
  'ENFP': '활동가 - 열정적이고 창의적이며 긍정적인 성격입니다.',
  'ISTJ': '현실주의자 - 신뢰할 수 있고 실용적이며 사실에 기반합니다.',
  'ISFJ': '수호자 - 헌신적이고 따뜻하며 타인을 보호합니다.',
  'ESTJ': '경영자 - 뛰어난 관리자로 질서를 만듭니다.',
  'ESFJ': '집정관 - 배려심이 깊고 사교적이며 인기가 많습니다.',
  'ISTP': '장인 - 대담하고 실용적이며 도구를 다루는 데 능숙합니다.',
  'ISFP': '모험가 - 유연하고 매력적이며 예술적 감각이 있습니다.',
  'ESTP': '사업가 - 활동적이고 에너지 넘치며 위험을 감수합니다.',
  'ESFP': '연예인 - 즉흥적이고 열정적이며 사람들을 즐겁게 합니다.'
};

export function calculateMBTICompatibility(
  myMBTI: MBTIType,
  partnerMBTI: MBTIType
): MBTICompatibility {
  // 궁합 점수 가져오기 (0-5점)
  const rawScore = compatibilityScores[myMBTI]?.[partnerMBTI] ?? compatibilityScores[partnerMBTI]?.[myMBTI] ?? 2;

  // 100점 만점으로 변환
  const score = Math.round((rawScore / 5) * 100);

  // 설명 생성
  const description = generateMBTIDescription(myMBTI, partnerMBTI, score);

  return {
    id: `mbti_${Date.now()}_${Math.random()}`,
    date: new Date().toISOString(),
    myMBTI,
    partnerMBTI,
    score,
    description
  };
}

function generateMBTIDescription(myMBTI: MBTIType, partnerMBTI: MBTIType, score: number): string {
  const myDesc = mbtiDescriptions[myMBTI];
  const partnerDesc = mbtiDescriptions[partnerMBTI];

  let compatibility = '';
  let advice = '';

  if (score >= 80) {
    compatibility = '찰떡 궁합';
    advice = '두 분은 서로를 완벽하게 보완하는 최고의 조합입니다! 서로의 차이를 존중하면서 함께 성장할 수 있는 관계입니다.';
  } else if (score >= 60) {
    compatibility = '좋은 궁합';
    advice = '서로 다른 면이 있지만 그것이 오히려 매력이 될 수 있습니다. 이해와 소통으로 멋진 관계를 만들 수 있습니다.';
  } else if (score >= 40) {
    compatibility = '보통 궁합';
    advice = '서로의 차이를 이해하고 노력한다면 충분히 좋은 관계를 만들 수 있습니다. 대화와 타협이 중요합니다.';
  } else {
    compatibility = '노력이 필요한 궁합';
    advice = '서로 많이 다르지만 그만큼 배울 점도 많습니다. 상대방을 있는 그대로 받아들이는 자세가 필요합니다.';
  }

  return `${myMBTI} (${myDesc.split(' - ')[0]}) ❤️ ${partnerMBTI} (${partnerDesc.split(' - ')[0]})\n\n궁합도: ${compatibility} (${score}점)\n\n${advice}\n\n${myMBTI}: ${myDesc}\n${partnerMBTI}: ${partnerDesc}`;
}

export const mbtiTypes: MBTIType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

// MBTI dimension descriptions
export const MBTI_DIMENSIONS: Record<string, { title: string; description: string; traits: string[] }> = {
  'E': { title: '외향형', description: '에너지를 외부에서 얻습니다', traits: ['활발함', '사교적', '표현력'] },
  'I': { title: '내향형', description: '에너지를 내부에서 얻습니다', traits: ['신중함', '깊이', '집중력'] },
  'S': { title: '감각형', description: '현실과 구체적인 것을 선호합니다', traits: ['현실적', '실용적', '세심함'] },
  'N': { title: '직관형', description: '패턴과 가능성에 집중합니다', traits: ['창의적', '미래지향', '통찰력'] },
  'T': { title: '사고형', description: '논리와 분석으로 결정합니다', traits: ['논리적', '객관적', '분석적'] },
  'F': { title: '감정형', description: '가치와 감정으로 결정합니다', traits: ['공감능력', '따뜻함', '조화'] },
  'J': { title: '판단형', description: '계획적이고 체계적입니다', traits: ['계획적', '결단력', '체계적'] },
  'P': { title: '인식형', description: '유연하고 즉흥적입니다', traits: ['유연함', '개방적', '자유로움'] },
};

// Love compatibility tips
export const LOVE_TIPS: Record<string, string> = {
  'INFJ-ENFP': '서로의 이상을 공유하며 깊은 유대감을 형성합니다. 감정적 지지와 지적 자극이 완벽한 조화를 이룹니다.',
  'INTJ-ENFP': '차이점이 오히려 매력이 됩니다. INTJ는 ENFP에게 안정감을, ENFP는 INTJ에게 새로운 관점을 줍니다.',
  'ENTP-INTJ': 'ENTP의 창의성과 INTJ의 전략이 만나 최강의 파트너가 됩니다. 지적 토론이 관계의 불꽃을 피웁니다.',
  'INFP-ENFJ': '깊은 감정적 이해와 공감이 특징입니다. ENFJ는 INFP가 꿈을 펼칠 수 있도록 든든히 지원합니다.',
  'INTP-ENTJ': '논리와 리더십의 완벽한 조화입니다. 서로의 지적 능력을 존중하며 함께 성장합니다.',
  'ISFJ-ESTP': '안정감과 활력의 균형잡힌 조합입니다. ISFJ의 헌신이 ESTP에게 든든한 기반이 됩니다.',
  'ISTJ-ESTP': 'ISTJ의 신뢰성과 ESTP의 활동성이 시너지를 냅니다. 서로 부족한 부분을 채워줍니다.',
  'ISFP-ENFJ': 'ENFJ의 따뜻한 이끔 아래 ISFP의 예술성이 꽃핍니다. 서로를 진심으로 아끼는 관계입니다.',
  'ESFP-ISTJ': '자유분방한 ESFP와 안정적인 ISTJ가 만나 균형을 이룹니다. 일상의 소소한 행복을 함께 나눕니다.',
  'ESTJ-ISFP': 'ESTJ의 리더십과 ISFP의 감수성이 보완됩니다. 서로의 다름을 인정할 때 아름다운 관계가 됩니다.',
  'INFJ-INFJ': '두 사람 모두 깊이 있는 내면세계를 가져 서로를 완벽히 이해합니다. 드물지만 소울메이트 같은 관계입니다.',
  'ENFP-INFJ': '서로의 이상을 공유하며 깊은 유대감을 형성합니다. 감정적 지지와 지적 자극이 완벽한 조화를 이룹니다.',
  'ENFP-INTJ': '차이점이 오히려 매력이 됩니다. INTJ는 ENFP에게 안정감을, ENFP는 INTJ에게 새로운 관점을 줍니다.',
};

export function getLoveTip(mbti1: MBTIType, mbti2: MBTIType): string {
  const key1 = `${mbti1}-${mbti2}`;
  const key2 = `${mbti2}-${mbti1}`;
  return LOVE_TIPS[key1] || LOVE_TIPS[key2] ||
    (() => {
      const sameCount = mbti1.split('').filter((c, i) => c === mbti2[i]).length;
      const tips = [
        `${mbti1}와 ${mbti2}의 만남, 서로 다른 세계를 가진 두 사람이에요. 차이를 이해하려는 노력이 깊은 연결을 만들어줄 거예요. 💫`,
        `${mbti1}와 ${mbti2}, 완전히 다른 듯 하지만 서로가 가진 것을 보완해주는 조합이에요. 상대방의 강점을 인정해보세요. 🌙`,
        `${mbti1}와 ${mbti2}는 비슷한 가치관을 공유해요. 서로를 이해하는 데 시간이 많이 들지 않을 수 있어요. ✨`,
        `${mbti1}와 ${mbti2}의 조합은 성장의 기회가 많아요. 서로에게서 새로운 시각을 배울 수 있을 거예요. 🔮`,
      ];
      return tips[sameCount % tips.length];
    })();
}

// MBTI dimension compatibility analysis
export function analyzeDimensions(mbti1: MBTIType, mbti2: MBTIType): Array<{
  dimension: string;
  type1: string;
  type2: string;
  match: boolean;
  insight: string;
}> {
  const dims = [
    { dim: 'EI', t1: mbti1[0], t2: mbti2[0], match: mbti1[0] !== mbti2[0], insight: mbti1[0] !== mbti2[0] ? '보완적 에너지 - 서로의 부족한 점을 채워줍니다' : '같은 에너지 스타일 - 자연스럽게 어울립니다' },
    { dim: 'SN', t1: mbti1[1], t2: mbti2[1], match: mbti1[1] === mbti2[1], insight: mbti1[1] === mbti2[1] ? '같은 정보처리 방식 - 대화가 잘 통합니다' : '다른 관점 - 서로에게 새로운 시각을 줍니다' },
    { dim: 'TF', t1: mbti1[2], t2: mbti2[2], match: mbti1[2] !== mbti2[2], insight: mbti1[2] !== mbti2[2] ? '논리와 감성의 균형 - 이상적인 조합' : '같은 의사결정 방식 - 갈등이 적습니다' },
    { dim: 'JP', t1: mbti1[3], t2: mbti2[3], match: mbti1[3] === mbti2[3], insight: mbti1[3] === mbti2[3] ? '같은 생활 패턴 - 일상이 편안합니다' : '계획과 즉흥의 조화 - 활력 있는 관계' },
  ];
  return dims.map(d => ({ dimension: d.dim, type1: d.t1, type2: d.t2, match: d.match, insight: d.insight }));
}
