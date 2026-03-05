import { MBTIType, MBTICompatibility } from '@/types';

// ============================================================================
// 1. Cognitive Functions Data
// ============================================================================

type CognitiveFunction = 'Ni' | 'Ne' | 'Si' | 'Se' | 'Ti' | 'Te' | 'Fi' | 'Fe';

interface CognitiveFunctionStack {
  dominant: CognitiveFunction;
  auxiliary: CognitiveFunction;
  tertiary: CognitiveFunction;
  inferior: CognitiveFunction;
}

const cognitiveFunctions: Record<MBTIType, CognitiveFunctionStack> = {
  INTJ: { dominant: 'Ni', auxiliary: 'Te', tertiary: 'Fi', inferior: 'Se' },
  INTP: { dominant: 'Ti', auxiliary: 'Ne', tertiary: 'Si', inferior: 'Fe' },
  ENTJ: { dominant: 'Te', auxiliary: 'Ni', tertiary: 'Se', inferior: 'Fi' },
  ENTP: { dominant: 'Ne', auxiliary: 'Ti', tertiary: 'Fe', inferior: 'Si' },
  INFJ: { dominant: 'Ni', auxiliary: 'Fe', tertiary: 'Ti', inferior: 'Se' },
  INFP: { dominant: 'Fi', auxiliary: 'Ne', tertiary: 'Si', inferior: 'Te' },
  ENFJ: { dominant: 'Fe', auxiliary: 'Ni', tertiary: 'Se', inferior: 'Ti' },
  ENFP: { dominant: 'Ne', auxiliary: 'Fi', tertiary: 'Te', inferior: 'Si' },
  ISTJ: { dominant: 'Si', auxiliary: 'Te', tertiary: 'Fi', inferior: 'Ne' },
  ISFJ: { dominant: 'Si', auxiliary: 'Fe', tertiary: 'Ti', inferior: 'Ne' },
  ESTJ: { dominant: 'Te', auxiliary: 'Si', tertiary: 'Ne', inferior: 'Fi' },
  ESFJ: { dominant: 'Fe', auxiliary: 'Si', tertiary: 'Ne', inferior: 'Ti' },
  ISTP: { dominant: 'Ti', auxiliary: 'Se', tertiary: 'Ni', inferior: 'Fe' },
  ISFP: { dominant: 'Fi', auxiliary: 'Se', tertiary: 'Ni', inferior: 'Te' },
  ESTP: { dominant: 'Se', auxiliary: 'Ti', tertiary: 'Fe', inferior: 'Ni' },
  ESFP: { dominant: 'Se', auxiliary: 'Fi', tertiary: 'Te', inferior: 'Ni' },
};

// ============================================================================
// 2. Rich Type Descriptions
// ============================================================================

interface MBTITypeDescription {
  title: string;         // Korean nickname
  core: string;          // Core personality
  loveStyle: string;     // 연애 스타일
  commStyle: string;     // 소통 방식
}

const mbtiDescriptions: Record<MBTIType, MBTITypeDescription> = {
  INTJ: {
    title: '전략가',
    core: '독립적이고 분석적인 비전가로, 체계적인 계획과 깊은 통찰력으로 목표를 달성하는 유형입니다.',
    loveStyle: '지적 교감과 깊은 신뢰를 중시하며, 진정한 이해와 성장을 함께할 파트너를 원합니다.',
    commStyle: '간결하고 논리적인 대화를 선호하며, 피상적인 잡담보다 의미 있는 토론을 즐깁니다.',
  },
  INTP: {
    title: '논리술사',
    core: '끝없는 호기심과 창의적 사고의 소유자로, 복잡한 문제를 분석하고 혁신적 해결책을 찾는 유형입니다.',
    loveStyle: '지적 자극과 개인 공간을 중요시하며, 서로의 관심사를 공유하며 성장하는 관계를 추구합니다.',
    commStyle: '정확한 표현과 논리적 설명을 중시하며, 아이디어를 탐구하는 심도 깊은 대화를 즐깁니다.',
  },
  ENTJ: {
    title: '통솔자',
    core: '카리스마 넘치는 리더로, 효율성과 목표 달성을 향해 주변 사람들을 이끄는 유형입니다.',
    loveStyle: '성장 지향적 관계를 선호하며, 함께 목표를 세우고 달성해나가는 동반자를 원합니다.',
    commStyle: '직접적이고 명확한 소통을 선호하며, 문제 해결 중심의 효율적 대화를 중시합니다.',
  },
  ENTP: {
    title: '변론가',
    core: '재치 있고 도전적인 혁신가로, 새로운 가능성을 탐구하고 기존 관념에 도전하는 유형입니다.',
    loveStyle: '지적 호기심을 자극하는 파트너에게 끌리며, 재미와 성장이 공존하는 관계를 추구합니다.',
    commStyle: '토론과 아이디어 교환을 즐기며, 유머와 위트를 활용한 활발한 대화를 선호합니다.',
  },
  INFJ: {
    title: '옹호자',
    core: '깊은 통찰력과 이상주의를 가진 조용한 영감의 원천으로, 타인의 성장을 돕는 유형입니다.',
    loveStyle: '영혼의 교감을 추구하며, 깊은 이해와 진정성 있는 연결을 가장 중요시합니다.',
    commStyle: '공감적 경청과 의미 있는 대화를 선호하며, 감정과 직관을 바탕으로 소통합니다.',
  },
  INFP: {
    title: '중재자',
    core: '풍부한 내면 세계와 강한 가치관을 지닌 이상주의자로, 진정성과 의미를 추구하는 유형입니다.',
    loveStyle: '이상적인 사랑을 꿈꾸며, 자신의 가치관을 이해하고 존중하는 파트너에게 깊이 헌신합니다.',
    commStyle: '감정에 솔직하고 공감 능력이 뛰어나며, 진심어린 대화와 감성적 교류를 중시합니다.',
  },
  ENFJ: {
    title: '선도자',
    core: '따뜻한 카리스마와 뛰어난 공감력을 가진 자연스러운 리더로, 타인의 잠재력을 이끌어내는 유형입니다.',
    loveStyle: '헌신적이고 적극적인 사랑을 하며, 파트너의 꿈과 성장을 전력으로 지원합니다.',
    commStyle: '따뜻하고 격려적인 소통을 하며, 상대방의 감정을 먼저 읽고 배려하는 대화를 합니다.',
  },
  ENFP: {
    title: '활동가',
    core: '열정적이고 창의적인 자유영혼으로, 무한한 가능성과 새로운 경험을 추구하는 유형입니다.',
    loveStyle: '열정적이고 로맨틱한 연애를 하며, 함께 새로운 모험을 떠나고 꿈을 나누는 관계를 원합니다.',
    commStyle: '에너지 넘치고 감성적인 소통을 하며, 다양한 주제를 넘나드는 자유로운 대화를 즐깁니다.',
  },
  ISTJ: {
    title: '현실주의자',
    core: '책임감 있고 신뢰할 수 있는 실용주의자로, 체계적이고 꼼꼼하게 맡은 바를 완수하는 유형입니다.',
    loveStyle: '안정적이고 성실한 사랑을 하며, 약속과 신뢰를 바탕으로 한 견고한 관계를 추구합니다.',
    commStyle: '사실에 기반한 명확한 소통을 선호하며, 구체적이고 실질적인 대화를 중시합니다.',
  },
  ISFJ: {
    title: '수호자',
    core: '헌신적이고 따뜻한 보호자로, 세심한 배려와 강한 책임감으로 주변을 돌보는 유형입니다.',
    loveStyle: '조용하지만 깊은 헌신으로 사랑하며, 일상의 작은 배려와 안정감을 통해 사랑을 표현합니다.',
    commStyle: '경청을 잘하고 세심하게 반응하며, 조화롭고 따뜻한 분위기의 대화를 선호합니다.',
  },
  ESTJ: {
    title: '경영자',
    core: '결단력 있고 조직적인 관리자로, 질서와 효율을 중시하며 주도적으로 일을 추진하는 유형입니다.',
    loveStyle: '안정적이고 책임감 있는 관계를 추구하며, 함께 계획을 세우고 실행하는 동반자를 원합니다.',
    commStyle: '직접적이고 분명한 소통을 선호하며, 실용적이고 해결 중심의 대화를 합니다.',
  },
  ESFJ: {
    title: '집정관',
    core: '사교적이고 배려심 깊은 협력자로, 조화로운 관계와 공동체를 위해 헌신하는 유형입니다.',
    loveStyle: '따뜻하고 헌신적인 사랑을 하며, 서로 돌보고 지지하는 안정적인 관계를 중시합니다.',
    commStyle: '친절하고 사교적인 소통을 하며, 상대방의 감정을 배려하는 따뜻한 대화를 합니다.',
  },
  ISTP: {
    title: '장인',
    core: '냉철하고 실용적인 분석가로, 도구와 시스템을 능숙하게 다루며 논리적으로 문제를 해결하는 유형입니다.',
    loveStyle: '자유롭고 독립적인 관계를 선호하며, 말보다 행동으로 사랑을 표현합니다.',
    commStyle: '간결하고 실용적인 대화를 선호하며, 필요한 말만 정확히 하는 경향이 있습니다.',
  },
  ISFP: {
    title: '모험가',
    core: '예술적 감성과 조용한 열정을 가진 탐험가로, 자신만의 가치관에 따라 삶을 살아가는 유형입니다.',
    loveStyle: '부드럽고 감성적인 사랑을 하며, 함께 아름다운 경험을 나누는 것에서 행복을 느낍니다.',
    commStyle: '조용하지만 진심 어린 소통을 하며, 감정을 행동과 예술적 표현으로 전달합니다.',
  },
  ESTP: {
    title: '사업가',
    core: '활동적이고 대담한 현실주의자로, 순간의 기회를 포착하고 과감하게 행동하는 유형입니다.',
    loveStyle: '스릴과 재미를 추구하는 역동적 연애를 하며, 함께 활동하고 경험을 나누는 관계를 원합니다.',
    commStyle: '직설적이고 에너지 넘치는 소통을 하며, 실전적이고 즉각적인 대화를 선호합니다.',
  },
  ESFP: {
    title: '연예인',
    core: '즉흥적이고 열정 넘치는 퍼포머로, 삶을 축제처럼 즐기며 주변에 활력을 불어넣는 유형입니다.',
    loveStyle: '즐거움과 감동이 넘치는 연애를 하며, 함께 웃고 즐기는 생기 있는 관계를 추구합니다.',
    commStyle: '유쾌하고 표현력이 풍부한 소통을 하며, 분위기를 밝게 만드는 대화를 즐깁니다.',
  },
};

// ============================================================================
// 3. Complete 16x16 Compatibility Score Matrix (0-5 scale)
// ============================================================================
// Based on cognitive function theory:
//   5 = Complementary functions / ideal pairing
//   4 = Strong shared or complementary dynamics
//   3 = Balanced / same type / moderate overlap
//   2 = Significant function conflicts
//   1 = Opposing dominant functions and values

const compatibilityScores: Record<MBTIType, Record<MBTIType, number>> = {
  //              INTJ INTP ENTJ ENTP INFJ INFP ENFJ ENFP ISTJ ISFJ ESTJ ESFJ ISTP ISFP ESTP ESFP
  INTJ: {
    INTJ: 3, INTP: 4, ENTJ: 4, ENTP: 5,
    INFJ: 4, INFP: 4, ENFJ: 3, ENFP: 5,
    ISTJ: 3, ISFJ: 2, ESTJ: 3, ESFJ: 2,
    ISTP: 3, ISFP: 2, ESTP: 2, ESFP: 1,
  },
  INTP: {
    INTJ: 4, INTP: 3, ENTJ: 5, ENTP: 4,
    INFJ: 4, INFP: 4, ENFJ: 5, ENFP: 4,
    ISTJ: 2, ISFJ: 2, ESTJ: 3, ESFJ: 2,
    ISTP: 3, ISFP: 2, ESTP: 3, ESFP: 2,
  },
  ENTJ: {
    INTJ: 4, INTP: 5, ENTJ: 3, ENTP: 4,
    INFJ: 3, INFP: 5, ENFJ: 4, ENFP: 4,
    ISTJ: 3, ISFJ: 2, ESTJ: 3, ESFJ: 2,
    ISTP: 3, ISFP: 3, ESTP: 3, ESFP: 2,
  },
  ENTP: {
    INTJ: 5, INTP: 4, ENTJ: 4, ENTP: 3,
    INFJ: 5, INFP: 4, ENFJ: 4, ENFP: 4,
    ISTJ: 2, ISFJ: 2, ESTJ: 2, ESFJ: 2,
    ISTP: 3, ISFP: 2, ESTP: 3, ESFP: 3,
  },
  INFJ: {
    INTJ: 4, INTP: 4, ENTJ: 3, ENTP: 5,
    INFJ: 3, INFP: 4, ENFJ: 4, ENFP: 5,
    ISTJ: 2, ISFJ: 3, ESTJ: 2, ESFJ: 3,
    ISTP: 2, ISFP: 3, ESTP: 1, ESFP: 2,
  },
  INFP: {
    INTJ: 4, INTP: 4, ENTJ: 5, ENTP: 4,
    INFJ: 4, INFP: 3, ENFJ: 5, ENFP: 4,
    ISTJ: 2, ISFJ: 3, ESTJ: 2, ESFJ: 3,
    ISTP: 2, ISFP: 3, ESTP: 1, ESFP: 2,
  },
  ENFJ: {
    INTJ: 3, INTP: 5, ENTJ: 4, ENTP: 4,
    INFJ: 4, INFP: 5, ENFJ: 3, ENFP: 4,
    ISTJ: 2, ISFJ: 3, ESTJ: 2, ESFJ: 3,
    ISTP: 2, ISFP: 5, ESTP: 2, ESFP: 3,
  },
  ENFP: {
    INTJ: 5, INTP: 4, ENTJ: 4, ENTP: 4,
    INFJ: 5, INFP: 4, ENFJ: 4, ENFP: 3,
    ISTJ: 2, ISFJ: 2, ESTJ: 2, ESFJ: 2,
    ISTP: 2, ISFP: 3, ESTP: 3, ESFP: 3,
  },
  ISTJ: {
    INTJ: 3, INTP: 2, ENTJ: 3, ENTP: 2,
    INFJ: 2, INFP: 2, ENFJ: 2, ENFP: 2,
    ISTJ: 3, ISFJ: 4, ESTJ: 4, ESFJ: 4,
    ISTP: 3, ISFP: 3, ESTP: 5, ESFP: 5,
  },
  ISFJ: {
    INTJ: 2, INTP: 2, ENTJ: 2, ENTP: 2,
    INFJ: 3, INFP: 3, ENFJ: 3, ENFP: 2,
    ISTJ: 4, ISFJ: 3, ESTJ: 4, ESFJ: 4,
    ISTP: 3, ISFP: 3, ESTP: 5, ESFP: 5,
  },
  ESTJ: {
    INTJ: 3, INTP: 3, ENTJ: 3, ENTP: 2,
    INFJ: 2, INFP: 2, ENFJ: 2, ENFP: 2,
    ISTJ: 4, ISFJ: 4, ESTJ: 3, ESFJ: 4,
    ISTP: 5, ISFP: 5, ESTP: 4, ESFP: 4,
  },
  ESFJ: {
    INTJ: 2, INTP: 2, ENTJ: 2, ENTP: 2,
    INFJ: 3, INFP: 3, ENFJ: 3, ENFP: 2,
    ISTJ: 4, ISFJ: 4, ESTJ: 4, ESFJ: 3,
    ISTP: 5, ISFP: 5, ESTP: 4, ESFP: 4,
  },
  ISTP: {
    INTJ: 3, INTP: 3, ENTJ: 3, ENTP: 3,
    INFJ: 2, INFP: 2, ENFJ: 2, ENFP: 2,
    ISTJ: 3, ISFJ: 3, ESTJ: 5, ESFJ: 5,
    ISTP: 3, ISFP: 3, ESTP: 4, ESFP: 4,
  },
  ISFP: {
    INTJ: 2, INTP: 2, ENTJ: 3, ENTP: 2,
    INFJ: 3, INFP: 3, ENFJ: 5, ENFP: 3,
    ISTJ: 3, ISFJ: 3, ESTJ: 5, ESFJ: 5,
    ISTP: 3, ISFP: 3, ESTP: 4, ESFP: 4,
  },
  ESTP: {
    INTJ: 2, INTP: 3, ENTJ: 3, ENTP: 3,
    INFJ: 1, INFP: 1, ENFJ: 2, ENFP: 3,
    ISTJ: 5, ISFJ: 5, ESTJ: 4, ESFJ: 4,
    ISTP: 4, ISFP: 4, ESTP: 3, ESFP: 4,
  },
  ESFP: {
    INTJ: 1, INTP: 2, ENTJ: 2, ENTP: 3,
    INFJ: 2, INFP: 2, ENFJ: 3, ENFP: 3,
    ISTJ: 5, ISFJ: 5, ESTJ: 4, ESFJ: 4,
    ISTP: 4, ISFP: 4, ESTP: 4, ESFP: 3,
  },
};

// ============================================================================
// 4. Cognitive Function Analysis Helpers
// ============================================================================

function getFunctionAxis(fn: CognitiveFunction): string {
  if (fn === 'Ni' || fn === 'Ne') return 'intuition';
  if (fn === 'Si' || fn === 'Se') return 'sensing';
  if (fn === 'Ti' || fn === 'Te') return 'thinking';
  if (fn === 'Fi' || fn === 'Fe') return 'feeling';
  return 'unknown';
}

function isExtroverted(fn: CognitiveFunction): boolean {
  return fn.endsWith('e');
}

function getComplementaryFunction(fn: CognitiveFunction): CognitiveFunction {
  const map: Record<CognitiveFunction, CognitiveFunction> = {
    Ni: 'Ne', Ne: 'Ni', Si: 'Se', Se: 'Si',
    Ti: 'Te', Te: 'Ti', Fi: 'Fe', Fe: 'Fi',
  };
  return map[fn];
}

interface FunctionAnalysis {
  sharedAxes: number;
  complementaryPairs: number;
  dominantRelation: 'same' | 'complementary' | 'different-axis';
  auxiliaryRelation: 'same' | 'complementary' | 'different-axis';
  dominantAuxMatch: boolean; // My dominant = partner's auxiliary
  summary: string;
}

function analyzeCognitiveFunctions(type1: MBTIType, type2: MBTIType): FunctionAnalysis {
  const f1 = cognitiveFunctions[type1];
  const f2 = cognitiveFunctions[type2];

  const allFn1 = [f1.dominant, f1.auxiliary, f1.tertiary, f1.inferior];
  const allFn2 = [f2.dominant, f2.auxiliary, f2.tertiary, f2.inferior];

  // Count shared function axes
  let sharedAxes = 0;
  const axes1 = new Set(allFn1.map(getFunctionAxis));
  const axes2 = new Set(allFn2.map(getFunctionAxis));
  axes1.forEach(a => { if (axes2.has(a)) sharedAxes++; });

  // Count complementary pairs (same axis, different attitude)
  let complementaryPairs = 0;
  for (const fn1 of allFn1) {
    const comp = getComplementaryFunction(fn1);
    if (allFn2.includes(comp)) complementaryPairs++;
  }

  // Dominant relation
  let dominantRelation: 'same' | 'complementary' | 'different-axis';
  if (f1.dominant === f2.dominant) {
    dominantRelation = 'same';
  } else if (getFunctionAxis(f1.dominant) === getFunctionAxis(f2.dominant)) {
    dominantRelation = 'complementary';
  } else {
    dominantRelation = 'different-axis';
  }

  // Auxiliary relation
  let auxiliaryRelation: 'same' | 'complementary' | 'different-axis';
  if (f1.auxiliary === f2.auxiliary) {
    auxiliaryRelation = 'same';
  } else if (getFunctionAxis(f1.auxiliary) === getFunctionAxis(f2.auxiliary)) {
    auxiliaryRelation = 'complementary';
  } else {
    auxiliaryRelation = 'different-axis';
  }

  // Dominant-Auxiliary crossover
  const dominantAuxMatch = f1.dominant === f2.auxiliary || f1.auxiliary === f2.dominant;

  // Build Korean summary
  const fnLabel: Record<CognitiveFunction, string> = {
    Ni: '내향 직관(Ni)', Ne: '외향 직관(Ne)', Si: '내향 감각(Si)', Se: '외향 감각(Se)',
    Ti: '내향 사고(Ti)', Te: '외향 사고(Te)', Fi: '내향 감정(Fi)', Fe: '외향 감정(Fe)',
  };

  let summary = '';
  summary += `${type1}의 인지 기능: ${fnLabel[f1.dominant]} - ${fnLabel[f1.auxiliary]} - ${fnLabel[f1.tertiary]} - ${fnLabel[f1.inferior]}\n`;
  summary += `${type2}의 인지 기능: ${fnLabel[f2.dominant]} - ${fnLabel[f2.auxiliary]} - ${fnLabel[f2.tertiary]} - ${fnLabel[f2.inferior]}`;

  if (dominantAuxMatch) {
    summary += '\n\n서로의 주기능과 보조기능이 교차하여, 자연스러운 역할 분담과 상호 보완이 가능한 조합입니다.';
  } else if (dominantRelation === 'same') {
    summary += '\n\n같은 주기능을 공유하여 서로를 깊이 이해하지만, 비슷한 약점을 가질 수 있습니다.';
  } else if (dominantRelation === 'complementary') {
    summary += '\n\n같은 인지 축의 다른 방향을 사용하여, 비슷한 관심사를 다른 관점으로 바라봅니다.';
  } else {
    summary += '\n\n서로 다른 인지 축을 주로 사용하여, 새로운 관점을 배울 수 있지만 이해에 노력이 필요합니다.';
  }

  return { sharedAxes, complementaryPairs, dominantRelation, auxiliaryRelation, dominantAuxMatch, summary };
}

// ============================================================================
// 5. Pair-Specific Relationship Insights (dynamically generated)
// ============================================================================

interface PairInsights {
  relationshipType: string;   // 관계 유형
  communicationTips: string;  // 소통 팁
  conflictPoints: string;     // 갈등 요인
  growthAdvice: string;       // 관계 발전 조언
}

function getPreferenceOverlap(t1: MBTIType, t2: MBTIType): { shared: string[]; different: string[] } {
  const dims = [
    { i: 0, labels: ['E', 'I'] },
    { i: 1, labels: ['S', 'N'] },
    { i: 2, labels: ['T', 'F'] },
    { i: 3, labels: ['J', 'P'] },
  ];
  const shared: string[] = [];
  const different: string[] = [];
  for (const d of dims) {
    if (t1[d.i] === t2[d.i]) {
      shared.push(t1[d.i]);
    } else {
      different.push(`${t1[d.i]}/${t2[d.i]}`);
    }
  }
  return { shared, different };
}

function generatePairInsights(type1: MBTIType, type2: MBTIType, score: number): PairInsights {
  const f1 = cognitiveFunctions[type1];
  const f2 = cognitiveFunctions[type2];
  const analysis = analyzeCognitiveFunctions(type1, type2);
  const { shared, different } = getPreferenceOverlap(type1, type2);
  const d1 = mbtiDescriptions[type1];
  const d2 = mbtiDescriptions[type2];

  // --- Relationship type ---
  let relationshipType: string;
  if (type1 === type2) {
    relationshipType = '거울 속의 나 (Mirror Pair)';
  } else if (score === 5) {
    if (analysis.dominantAuxMatch) {
      relationshipType = '영혼의 파트너 (Soulmate)';
    } else if (getFunctionAxis(f1.dominant) === getFunctionAxis(f2.dominant)) {
      relationshipType = '이상적 보완자 (Ideal Complement)';
    } else {
      relationshipType = '천생연분 (Destined Match)';
    }
  } else if (score === 4) {
    if (shared.length >= 3) {
      relationshipType = '마음이 통하는 사이 (Kindred Spirits)';
    } else if (analysis.dominantAuxMatch) {
      relationshipType = '지적 동반자 (Intellectual Partners)';
    } else {
      relationshipType = '서로를 성장시키는 관계 (Growth Partners)';
    }
  } else if (score === 3) {
    if (type1 === type2) {
      relationshipType = '거울 속의 나 (Mirror Pair)';
    } else if (shared.length >= 2) {
      relationshipType = '편안한 동반자 (Comfortable Companions)';
    } else {
      relationshipType = '균형 잡힌 관계 (Balanced Match)';
    }
  } else if (score === 2) {
    relationshipType = '도전적 성장 관계 (Challenging Growth)';
  } else {
    relationshipType = '정반대의 매력 (Opposite Attraction)';
  }

  // --- Communication tips ---
  const commTips: string[] = [];

  // E/I dimension
  if (different.some(d => d.includes('E') || d.includes('I'))) {
    const extrovert = type1[0] === 'E' ? type1 : type2;
    const introvert = type1[0] === 'I' ? type1 : type2;
    commTips.push(`${extrovert}은(는) ${introvert}에게 충분한 생각할 시간과 개인 공간을 주세요. ${introvert}은(는) 때때로 먼저 생각과 감정을 표현해주면 관계가 더 깊어집니다.`);
  }

  // S/N dimension
  if (different.some(d => d.includes('S') || d.includes('N'))) {
    commTips.push('구체적인 사실과 큰 그림 사이의 균형을 찾으세요. 현실적인 세부사항과 미래 비전을 함께 이야기하면 더 효과적으로 소통할 수 있습니다.');
  }

  // T/F dimension
  if (different.some(d => d.includes('T') || d.includes('F'))) {
    commTips.push('의견 차이가 있을 때, 사고형은 감정도 함께 고려하고, 감정형은 논리적 관점도 존중하면 더 건설적인 대화가 됩니다.');
  }

  // J/P dimension
  if (different.some(d => d.includes('J') || d.includes('P'))) {
    commTips.push('계획과 즉흥 사이의 조화를 만드세요. 큰 틀의 계획은 함께 세우되, 세부 실행에서는 유연성을 허용하면 둘 다 만족할 수 있습니다.');
  }

  if (commTips.length === 0) {
    commTips.push('같은 선호도를 공유하므로 자연스럽게 소통할 수 있지만, 비슷한 맹점이 있을 수 있으니 가끔 다른 관점을 의도적으로 탐구해보세요.');
  }

  // --- Conflict points ---
  const conflicts: string[] = [];

  if (different.some(d => d.includes('T') || d.includes('F'))) {
    conflicts.push('갈등 상황에서 한쪽은 논리적 해결을 원하고 다른 쪽은 감정적 공감을 먼저 원할 수 있습니다.');
  }
  if (different.some(d => d.includes('J') || d.includes('P'))) {
    conflicts.push('생활 방식에서 계획성과 유연성의 차이로 마찰이 생길 수 있습니다.');
  }
  if (different.some(d => d.includes('E') || d.includes('I'))) {
    conflicts.push('사교 활동의 빈도와 에너지 충전 방식의 차이가 갈등의 원인이 될 수 있습니다.');
  }
  if (different.some(d => d.includes('S') || d.includes('N'))) {
    conflicts.push('대화에서 구체적인 현실과 추상적 가능성에 대한 초점이 달라 답답함을 느낄 수 있습니다.');
  }

  if (analysis.dominantRelation === 'different-axis' && analysis.auxiliaryRelation === 'different-axis') {
    conflicts.push('인지 기능의 축이 달라 서로의 사고방식을 이해하는 데 추가적인 노력이 필요합니다.');
  }

  if (conflicts.length === 0) {
    conflicts.push('비슷한 성향 덕분에 큰 갈등은 적지만, 서로가 너무 비슷해서 성장의 자극이 부족할 수 있습니다.');
  }

  // --- Growth advice ---
  let growthAdvice: string;

  if (score >= 5) {
    growthAdvice = `${type1}와(과) ${type2}는(은) 서로에게 최고의 파트너가 될 잠재력이 있습니다. 자연스러운 조화를 당연하게 여기지 말고, 서로에 대한 감사를 꾸준히 표현하세요. 각자의 강점을 인정하고 약점을 보완해주는 관계로 발전시켜 나가면, 함께 놀라운 성장을 이룰 수 있습니다.`;
  } else if (score >= 4) {
    growthAdvice = `서로의 다른 점을 매력으로 느끼는 좋은 관계입니다. ${type1}의 ${d1.title}적 면모와 ${type2}의 ${d2.title}적 면모가 만나 시너지를 낼 수 있습니다. 서로의 관점을 적극적으로 배우려는 자세가 관계를 한 단계 더 깊게 만듭니다.`;
  } else if (score >= 3) {
    growthAdvice = `균형 잡힌 관계를 위해 서로의 차이를 인정하고 존중하는 것이 핵심입니다. 공통점을 기반으로 유대감을 쌓으면서, 다른 점에서는 서로에게 새로운 세계를 열어줄 수 있습니다. 정기적인 깊은 대화 시간을 갖는 것이 도움이 됩니다.`;
  } else if (score >= 2) {
    growthAdvice = `서로 다른 세계에 사는 것처럼 느껴질 수 있지만, 그만큼 배울 점이 많은 관계입니다. 상대방의 방식이 틀린 것이 아니라 다른 것임을 항상 기억하세요. 서로의 언어를 배우려는 꾸준한 노력이 깊은 성장으로 이어집니다.`;
  } else {
    growthAdvice = `정반대의 성향으로 소통이 어려울 수 있지만, 이 관계를 통해 자신의 약점을 보완하고 인간적으로 크게 성장할 수 있습니다. 서로를 바꾸려 하지 말고, 있는 그대로를 받아들이면서 작은 공통점부터 쌓아가세요. 인내와 이해가 가장 큰 무기입니다.`;
  }

  return {
    relationshipType,
    communicationTips: commTips.join(' '),
    conflictPoints: conflicts.join(' '),
    growthAdvice,
  };
}

// ============================================================================
// 6. Score-to-Text Conversion (6 tiers)
// ============================================================================

interface CompatibilityTier {
  name: string;
  emoji: string;
}

function getCompatibilityTier(score: number): CompatibilityTier {
  if (score >= 95) return { name: '운명적 궁합', emoji: '💫' };
  if (score >= 80) return { name: '찰떡 궁합', emoji: '💕' };
  if (score >= 65) return { name: '좋은 궁합', emoji: '💛' };
  if (score >= 50) return { name: '성장하는 궁합', emoji: '🌱' };
  if (score >= 35) return { name: '노력이 필요한 궁합', emoji: '💪' };
  return { name: '도전적 궁합', emoji: '🔥' };
}

// ============================================================================
// 7. Rich Description Generator
// ============================================================================

function generateMBTIDescription(myMBTI: MBTIType, partnerMBTI: MBTIType, score: number): string {
  const myDesc = mbtiDescriptions[myMBTI];
  const partnerDesc = mbtiDescriptions[partnerMBTI];
  const tier = getCompatibilityTier(score);
  const rawScore = compatibilityScores[myMBTI][partnerMBTI];
  const insights = generatePairInsights(myMBTI, partnerMBTI, rawScore);
  const fnAnalysis = analyzeCognitiveFunctions(myMBTI, partnerMBTI);

  const lines: string[] = [];

  // Header
  lines.push(`${myMBTI} (${myDesc.title}) ${tier.emoji} ${partnerMBTI} (${partnerDesc.title})`);
  lines.push('');

  // Score and tier
  lines.push(`궁합도: ${tier.name} (${score}점)`);
  lines.push(`관계 유형: ${insights.relationshipType}`);
  lines.push('');

  // Separator
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  // Type descriptions
  lines.push(`[${myMBTI} - ${myDesc.title}]`);
  lines.push(`성격: ${myDesc.core}`);
  lines.push(`연애 스타일: ${myDesc.loveStyle}`);
  lines.push(`소통 방식: ${myDesc.commStyle}`);
  lines.push('');

  lines.push(`[${partnerMBTI} - ${partnerDesc.title}]`);
  lines.push(`성격: ${partnerDesc.core}`);
  lines.push(`연애 스타일: ${partnerDesc.loveStyle}`);
  lines.push(`소통 방식: ${partnerDesc.commStyle}`);
  lines.push('');

  // Separator
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  // Cognitive function analysis
  lines.push('[인지 기능 분석]');
  lines.push(fnAnalysis.summary);
  lines.push('');

  // Separator
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  // Communication tips
  lines.push('[소통 팁]');
  lines.push(insights.communicationTips);
  lines.push('');

  // Conflict points
  lines.push('[갈등 요인]');
  lines.push(insights.conflictPoints);
  lines.push('');

  // Growth advice
  lines.push('[관계 발전 조언]');
  lines.push(insights.growthAdvice);

  return lines.join('\n');
}

// ============================================================================
// 8. Public API (same exports as before)
// ============================================================================

export function calculateMBTICompatibility(
  myMBTI: MBTIType,
  partnerMBTI: MBTIType
): MBTICompatibility {
  // Get raw score (0-5) from the complete matrix
  const rawScore = compatibilityScores[myMBTI][partnerMBTI];

  // Convert to 100-point scale
  const score = Math.round((rawScore / 5) * 100);

  // Generate rich description
  const description = generateMBTIDescription(myMBTI, partnerMBTI, score);

  return {
    id: `mbti_${Date.now()}_${Math.random()}`,
    date: new Date().toISOString(),
    myMBTI,
    partnerMBTI,
    score,
    description,
  };
}

export const mbtiTypes: MBTIType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];
