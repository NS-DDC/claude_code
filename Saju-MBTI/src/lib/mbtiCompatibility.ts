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
  'INTP': '논리술사 - 혁신적인 발명가로 끊임없는 지식에 대한 갈증을 가지고 있습니다.',
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
  const rawScore = compatibilityScores[myMBTI]?.[partnerMBTI] || 2;

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
