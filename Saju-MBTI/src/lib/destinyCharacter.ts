import { MBTIType, Element, DestinyCharacter, CharacterCategory } from '@/types';
import { sentinelCharacters } from './sentinelCharacters';
import { explorerCharacters } from './explorerCharacters';

// 40 Hardcoded Characters for NT (Analysts) and NF (Diplomats)
const hardcodedCharacters: DestinyCharacter[] = [
  // INTJ Characters (Analysts)
  {
    id: 'INTJ_목',
    mbti: 'INTJ',
    element: '목',
    category: 'analyst',
    name: '숲의 전략가',
    emoji: '🌲🎯',
    description: '깊은 숲처럼 차분하면서도 끊임없이 성장하는 전략적 사고의 소유자. 장기적 비전과 체계적 계획으로 미래를 설계합니다.',
    strengths: ['장기 전략 수립', '체계적 사고', '독립적 성장', '목표 지향적'],
    weaknesses: ['과도한 완벽주의', '감정 표현 미숙', '융통성 부족'],
    charmPoints: ['조용한 카리스마', '신뢰할 수 있는 계획', '깊이 있는 통찰'],
    dailyFortuneTemplates: [
      '오늘은 장기 계획을 세우기 좋은 날입니다. 차분히 미래를 그려보세요.',
      '새로운 지식을 흡수하기 완벽한 타이밍입니다. 독서나 학습에 집중하세요.',
      '당신의 전략적 사고가 빛을 발할 날입니다. 중요한 결정을 내려보세요.',
      '자연 속에서 산책하며 아이디어를 정리해보세요. 숲의 기운이 영감을 줍니다.',
      '꾸준히 키워온 프로젝트가 결실을 맺기 시작하는 날입니다. 인내가 보상받습니다.'
    ]
  },
  {
    id: 'INTJ_화',
    mbti: 'INTJ',
    element: '화',
    category: 'analyst',
    name: '불꽃의 지략가',
    emoji: '🔥🧠',
    description: '타오르는 열정과 냉철한 이성이 공존하는 모순적 매력의 소유자. 강렬한 추진력으로 혁신을 이끌어냅니다.',
    strengths: ['열정적 실행력', '빠른 의사결정', '혁신적 사고', '강한 추진력'],
    weaknesses: ['성급한 판단', '번아웃 위험', '타인 배려 부족'],
    charmPoints: ['카리스마 넘치는 리더십', '불가능을 가능으로', '강렬한 존재감'],
    dailyFortuneTemplates: [
      '당신의 열정이 최고조에 달하는 날입니다. 큰 도전을 시작하세요.',
      '빠른 결단이 필요한 순간입니다. 직관을 믿고 행동하세요.',
      '혁신적인 아이디어가 떠오를 것입니다. 메모를 준비하세요.',
      '에너지를 집중하면 불가능해 보이는 일도 해낼 수 있는 날입니다.',
      '번아웃에 주의하세요. 잠시 멈추고 재충전하는 것도 전략입니다.'
    ]
  },
  {
    id: 'INTJ_토',
    mbti: 'INTJ',
    element: '토',
    category: 'analyst',
    name: '대지의 설계자',
    emoji: '🏔️📐',
    description: '산처럼 흔들리지 않는 의지와 대지처럼 안정적인 계획력을 가진 완벽주의자. 실용적이면서도 장기적인 비전을 추구합니다.',
    strengths: ['안정적 계획', '실용적 사고', '흔들리지 않는 의지', '신뢰성'],
    weaknesses: ['변화 거부', '지나친 신중함', '완고함'],
    charmPoints: ['믿음직한 리더', '체계적 접근', '끈기 있는 실행'],
    dailyFortuneTemplates: [
      '견고한 기반을 다지기 좋은 날입니다. 차근차근 준비하세요.',
      '당신의 신중함이 빛을 발할 것입니다. 세심한 검토가 성공을 부릅니다.',
      '안정적인 루틴이 최고의 성과를 가져올 날입니다.',
      '토대가 튼튼해야 높이 쌓을 수 있습니다. 기본에 충실하세요.',
      '오랫동안 준비해온 일이 마침내 움직이기 시작합니다. 흔들리지 마세요.'
    ]
  },
  {
    id: 'INTJ_금',
    mbti: 'INTJ',
    element: '금',
    category: 'analyst',
    name: '날카로운 지성',
    emoji: '⚔️💎',
    description: '검처럼 날카로운 분석력과 다이아몬드처럼 단단한 논리를 가진 지성인. 정확하고 예리한 판단으로 본질을 꿰뚫습니다.',
    strengths: ['예리한 분석', '논리적 사고', '정확한 판단', '원칙주의'],
    weaknesses: ['냉정함', '비판적 태도', '감정 무시'],
    charmPoints: ['탁월한 통찰력', '정확한 예측', '흔들림 없는 원칙'],
    dailyFortuneTemplates: [
      '당신의 분석력이 최고조입니다. 중요한 결정을 내리세요.',
      '날카로운 직관이 진실을 밝혀낼 것입니다. 의심스러운 것을 조사하세요.',
      '논리적 접근이 모든 문제를 해결할 날입니다.',
      '원칙을 세우고 그에 따라 행동하세요. 흔들림 없는 자세가 존경을 받습니다.',
      '불필요한 것을 과감히 정리하세요. 핵심에 집중할 때 최고의 결과가 나옵니다.'
    ]
  },
  {
    id: 'INTJ_수',
    mbti: 'INTJ',
    element: '수',
    category: 'analyst',
    name: '심연의 전략가',
    emoji: '🌊🔮',
    description: '깊은 바다처럼 끝없는 사고의 깊이를 가진 신비로운 전략가. 겉으로 드러나지 않는 깊은 통찰로 세상을 읽습니다.',
    strengths: ['깊은 통찰', '유연한 전략', '적응력', '신비로운 매력'],
    weaknesses: ['과도한 사색', '우유부단', '현실 회피'],
    charmPoints: ['예측 불가능한 천재성', '깊은 이해력', '신비로운 분위기'],
    dailyFortuneTemplates: [
      '깊은 사색이 답을 줄 것입니다. 조용한 시간을 가지세요.',
      '직관과 논리가 완벽하게 조화를 이루는 날입니다.',
      '숨겨진 패턴을 발견할 수 있습니다. 관찰에 집중하세요.',
      '물처럼 유연하게 상황에 적응하세요. 변화 속에 기회가 있습니다.',
      '혼자만의 시간이 최고의 전략을 만들어냅니다. 명상이나 산책을 추천합니다.'
    ]
  },

  // INTP Characters
  {
    id: 'INTP_목',
    mbti: 'INTP',
    element: '목',
    category: 'analyst',
    name: '신록의 논리학자',
    emoji: '🌿🧩',
    description: '새싹처럼 끊임없이 성장하는 지적 호기심의 소유자. 논리적 사고와 창의적 아이디어가 자연스럽게 자라납니다.',
    strengths: ['창의적 사고', '논리적 분석', '지적 호기심', '유연한 사고'],
    weaknesses: ['실행력 부족', '산만함', '현실 감각 부족'],
    charmPoints: ['독특한 관점', '엉뚱한 아이디어', '순수한 지적 열정'],
    dailyFortuneTemplates: [
      '새로운 이론이나 아이디어가 떠오를 것입니다. 기록하세요.',
      '지적 토론이 즐거운 하루가 될 것입니다.',
      '복잡한 문제를 창의적으로 해결할 수 있는 날입니다.',
      '호기심을 따라가세요. 예상치 못한 지식의 보물을 발견할 것입니다.',
      '사고의 성장이 일어나는 날입니다. 새로운 분야에 도전해보세요.'
    ]
  },
  {
    id: 'INTP_화',
    mbti: 'INTP',
    element: '화',
    category: 'analyst',
    name: '폭발하는 발명가',
    emoji: '💥🔬',
    description: '불꽃처럼 튀는 아이디어와 실험 정신으로 가득한 혁신가. 순간적인 영감으로 세상을 놀라게 합니다.',
    strengths: ['혁신적 발상', '실험 정신', '빠른 학습', '열정적 탐구'],
    weaknesses: ['충동적 결정', '일관성 부족', '끈기 부족'],
    charmPoints: ['예측 불가능한 천재성', '재미있는 실험', '즉흥적 창의성'],
    dailyFortuneTemplates: [
      '혁신적인 아이디어가 폭발하는 날입니다. 실험을 두려워하지 마세요.',
      '빠른 프로토타이핑이 성공을 가져올 것입니다.',
      '당신의 열정이 주변을 감염시킬 날입니다.',
      '실패를 두려워하지 마세요. 모든 실험은 데이터가 됩니다.',
      '불꽃같은 영감이 지나간 자리에 놀라운 발명이 남을 것입니다.'
    ]
  },
  {
    id: 'INTP_토',
    mbti: 'INTP',
    element: '토',
    category: 'analyst',
    name: '안정된 이론가',
    emoji: '🏛️📚',
    description: '견고한 기반 위에 논리적 체계를 쌓아가는 학자. 실용적이면서도 깊이 있는 이론을 만들어냅니다.',
    strengths: ['체계적 이론', '실용적 논리', '꾸준한 연구', '신뢰성'],
    weaknesses: ['지나친 신중함', '느린 결정', '변화 저항'],
    charmPoints: ['믿을 수 있는 논리', '깊이 있는 지식', '안정적인 분석'],
    dailyFortuneTemplates: [
      '체계적인 접근이 성공을 가져올 날입니다.',
      '꾸준한 연구가 결실을 맺을 것입니다.',
      '당신의 논리가 모두를 설득할 수 있는 날입니다.',
      '기초를 탄탄히 다지면 어떤 이론도 무너지지 않습니다.',
      '조급해하지 마세요. 당신의 페이스가 가장 정확한 답을 만듭니다.'
    ]
  },
  {
    id: 'INTP_금',
    mbti: 'INTP',
    element: '금',
    category: 'analyst',
    name: '정밀한 사고자',
    emoji: '⚙️🔍',
    description: '시계처럼 정밀한 논리와 금속처럼 단단한 이성을 가진 분석가. 완벽한 체계로 세상을 이해합니다.',
    strengths: ['정밀한 분석', '완벽한 논리', '세심한 관찰', '객관성'],
    weaknesses: ['감정 부족', '융통성 없음', '비판적'],
    charmPoints: ['완벽한 논증', '정확한 예측', '흔들림 없는 이성'],
    dailyFortuneTemplates: [
      '정밀한 분석이 필요한 날입니다. 디테일에 집중하세요.',
      '당신의 논리가 완벽하게 작동할 것입니다.',
      '복잡한 시스템을 이해할 수 있는 날입니다.',
      '잘못된 부분을 정확히 짚어낼 수 있는 날입니다. 검증에 집중하세요.',
      '완벽한 답이 아니어도 괜찮습니다. 때로는 충분히 좋은 것이 최선입니다.'
    ]
  },
  {
    id: 'INTP_수',
    mbti: 'INTP',
    element: '수',
    category: 'analyst',
    name: '흐르는 지혜',
    emoji: '💧🎭',
    description: '물처럼 유연하게 흐르며 모든 것을 이해하는 지혜의 소유자. 고정관념 없이 진리를 탐구합니다.',
    strengths: ['유연한 사고', '깊은 통찰', '적응력', '개방적 태도'],
    weaknesses: ['우유부단', '방향성 부족', '실행 미루기'],
    charmPoints: ['독특한 철학', '자유로운 사고', '깊은 이해'],
    dailyFortuneTemplates: [
      '유연한 사고가 돌파구를 열어줄 것입니다.',
      '다양한 관점에서 문제를 바라보세요.',
      '직관과 논리가 조화를 이루는 날입니다.',
      '물처럼 흘러가면 자연스럽게 답을 찾게 됩니다.',
      '깊은 곳에서 솟아나는 영감을 놓치지 마세요. 조용한 시간이 필요합니다.'
    ]
  },

  // ENTJ Characters
  {
    id: 'ENTJ_목',
    mbti: 'ENTJ',
    element: '목',
    category: 'analyst',
    name: '성장의 리더',
    emoji: '🌳👑',
    description: '큰 나무처럼 위로 뻗어 성장하며 많은 이들에게 그늘을 제공하는 리더. 조직을 키우고 사람을 성장시킵니다.',
    strengths: ['탁월한 리더십', '성장 지향', '전략적 사고', '포용력'],
    weaknesses: ['과도한 간섭', '통제욕', '완벽 추구'],
    charmPoints: ['카리스마', '성장 동기 부여', '비전 제시'],
    dailyFortuneTemplates: [
      '리더십을 발휘하기 좋은 날입니다. 팀을 이끌어보세요.',
      '장기적 성장 계획을 세우기 완벽한 타이밍입니다.',
      '당신의 비전이 모두를 고무시킬 것입니다.',
      '사람을 키우는 것이 가장 위대한 리더십입니다. 후배를 격려하세요.',
      '뿌리가 깊은 나무가 높이 자랍니다. 기본기를 다시 점검하세요.'
    ]
  },
  {
    id: 'ENTJ_화',
    mbti: 'ENTJ',
    element: '화',
    category: 'analyst',
    name: '불타는 정복자',
    emoji: '🔥⚡',
    description: '열정과 야망으로 모든 것을 이루어내는 강력한 리더. 불가능을 두려워하지 않고 목표를 향해 돌진합니다.',
    strengths: ['강력한 추진력', '빠른 실행', '대담한 결정', '열정적 리더십'],
    weaknesses: ['독단적', '성급함', '타인 배려 부족'],
    charmPoints: ['압도적 카리스마', '불굴의 의지', '결과 중심'],
    dailyFortuneTemplates: [
      '대담한 도전이 성공을 부를 것입니다. 주저하지 마세요.',
      '당신의 열정이 모든 장애물을 녹일 날입니다.',
      '빠른 결단이 기회를 잡게 할 것입니다.',
      '불같은 의지로 밀어붙이면 오늘 큰 성과를 거둘 수 있습니다.',
      '때로는 한 발 물러서야 두 발 나아갈 수 있습니다. 전략적 후퇴도 실력입니다.'
    ]
  },
  {
    id: 'ENTJ_토',
    mbti: 'ENTJ',
    element: '토',
    category: 'analyst',
    name: '제국의 건설자',
    emoji: '🏰👔',
    description: '견고한 조직을 만들고 시스템을 구축하는 경영의 달인. 안정적이면서도 효율적인 구조를 설계합니다.',
    strengths: ['조직 관리', '시스템 구축', '안정적 리더십', '실용성'],
    weaknesses: ['경직성', '변화 저항', '관료적'],
    charmPoints: ['신뢰할 수 있는 리더', '체계적 관리', '효율성'],
    dailyFortuneTemplates: [
      '조직을 정비하고 시스템을 개선할 날입니다.',
      '당신의 경영 능력이 빛을 발할 것입니다.',
      '장기적 안정성을 위한 투자를 고려하세요.',
      '체계적인 정리가 효율을 극대화하는 날입니다.',
      '견고한 시스템 위에 세운 계획은 반드시 성과로 돌아옵니다.'
    ]
  },
  {
    id: 'ENTJ_금',
    mbti: 'ENTJ',
    element: '금',
    category: 'analyst',
    name: '철의 통솔자',
    emoji: '⚔️🛡️',
    description: '강철같은 의지와 원칙으로 조직을 이끄는 엄격한 리더. 정확한 판단과 단호한 실행력을 가졌습니다.',
    strengths: ['강력한 실행력', '원칙주의', '명확한 목표', '결단력'],
    weaknesses: ['융통성 부족', '냉정함', '지나친 엄격함'],
    charmPoints: ['흔들림 없는 리더십', '공정한 판단', '강한 책임감'],
    dailyFortuneTemplates: [
      '원칙을 지키는 것이 성공의 열쇠입니다.',
      '단호한 결정이 필요한 순간입니다.',
      '당신의 리더십이 조직을 바로 세울 것입니다.',
      '쇠는 달궈져야 쓸모가 있습니다. 준비된 만큼 기회를 잡을 수 있습니다.',
      '공정한 판단이 장기적으로 가장 큰 존경을 받습니다.'
    ]
  },
  {
    id: 'ENTJ_수',
    mbti: 'ENTJ',
    element: '수',
    category: 'analyst',
    name: '유연한 전략가',
    emoji: '🌊🎲',
    description: '물처럼 상황에 맞게 변화하며 전략을 구사하는 지혜로운 리더. 강압이 아닌 설득으로 이끕니다.',
    strengths: ['전략적 유연성', '적응력', '설득력', '통찰력'],
    weaknesses: ['우유부단', '일관성 부족', '과도한 타협'],
    charmPoints: ['지혜로운 리더십', '섬세한 전략', '포용적 태도'],
    dailyFortuneTemplates: [
      '유연한 전략이 승리를 가져올 것입니다.',
      '상황에 맞게 변화하세요. 고집은 독이 됩니다.',
      '설득과 협상이 목표 달성의 열쇠입니다.',
      '물은 바위도 뚫습니다. 부드러운 접근이 강한 결과를 만듭니다.',
      '다양한 의견을 듣고 종합하면 최고의 전략이 탄생합니다.'
    ]
  },

  // ENTP Characters
  {
    id: 'ENTP_목',
    mbti: 'ENTP',
    element: '목',
    category: 'analyst',
    name: '혁신의 씨앗',
    emoji: '🌱💡',
    description: '끊임없이 새로운 아이디어를 싹 틔우는 혁신가. 창의적이고 도전적인 사고로 변화를 만들어냅니다.',
    strengths: ['창의성', '도전 정신', '빠른 학습', '변화 추구'],
    weaknesses: ['집중력 부족', '마무리 약함', '충동적'],
    charmPoints: ['재치', '유머', '독창적 아이디어'],
    dailyFortuneTemplates: [
      '새로운 프로젝트를 시작하기 좋은 날입니다.',
      '창의적인 아이디어가 샘솟을 것입니다.',
      '도전을 두려워하지 마세요. 성장의 기회입니다.',
      '작은 씨앗이 거대한 나무가 됩니다. 오늘 심은 아이디어가 미래를 바꿀 것입니다.',
      '틀에 박힌 사고를 벗어나세요. 자유로운 발상이 혁신을 만듭니다.'
    ]
  },
  {
    id: 'ENTP_화',
    mbti: 'ENTP',
    element: '화',
    category: 'analyst',
    name: '번개 같은 혁명가',
    emoji: '⚡🎆',
    description: '번개처럼 빠르고 불꽃처럼 화려한 변화를 일으키는 혁명가. 순간의 영감으로 세상을 뒤바꿉니다.',
    strengths: ['즉각적 실행', '파괴적 혁신', '열정', '카리스마'],
    weaknesses: ['과도한 충동', '안정성 부족', '지속력 약함'],
    charmPoints: ['폭발적 에너지', '예측 불가능', '매력적인 혼돈'],
    dailyFortuneTemplates: [
      '급진적인 변화를 시도할 날입니다.',
      '당신의 에너지가 모두를 압도할 것입니다.',
      '즉흥적 결정이 놀라운 결과를 가져올 것입니다.',
      '불꽃처럼 번쩍이는 영감을 놓치지 마세요. 지금 바로 행동하세요.',
      '열정을 전달하되 상대방의 속도도 존중해주세요.'
    ]
  },
  {
    id: 'ENTP_토',
    mbti: 'ENTP',
    element: '토',
    category: 'analyst',
    name: '실용적 혁신가',
    emoji: '🏗️💼',
    description: '창의성과 실용성을 결합한 균형잡힌 혁신가. 아이디어를 현실로 만드는 능력이 탁월합니다.',
    strengths: ['실행 가능한 아이디어', '현실적 접근', '프로젝트 완성', '균형감'],
    weaknesses: ['보수적 성향', '과도한 타협', '창의성 제한'],
    charmPoints: ['믿을 수 있는 혁신', '실현 가능성', '안정적 변화'],
    dailyFortuneTemplates: [
      '아이디어를 구체화할 날입니다. 계획을 세우세요.',
      '창의성과 현실의 균형을 찾을 것입니다.',
      '실용적인 혁신이 성공을 부를 날입니다.',
      '꿈을 현실로 바꾸는 데 집중하세요. 실행이 차이를 만듭니다.',
      '안정적인 환경에서 아이디어가 더 오래 살아남습니다.'
    ]
  },
  {
    id: 'ENTP_금',
    mbti: 'ENTP',
    element: '금',
    category: 'analyst',
    name: '날카로운 변론가',
    emoji: '⚖️🗡️',
    description: '논리와 수사로 무장한 완벽한 토론가. 날카로운 논증으로 어떤 주장도 방어하거나 공격할 수 있습니다.',
    strengths: ['탁월한 논리', '설득력', '비판적 사고', '분석력'],
    weaknesses: ['논쟁 집착', '감정 무시', '공격적'],
    charmPoints: ['지적 매력', '완벽한 논증', '카리스마'],
    dailyFortuneTemplates: [
      '토론이나 논쟁에서 승리할 날입니다.',
      '당신의 논리가 모두를 설득할 것입니다.',
      '비판적 분석이 진실을 밝혀낼 것입니다.',
      '날카로운 논리로 핵심을 찌르세요. 진실은 단순합니다.',
      '때로는 이기는 것보다 상대를 이해하는 것이 더 큰 승리입니다.'
    ]
  },
  {
    id: 'ENTP_수',
    mbti: 'ENTP',
    element: '수',
    category: 'analyst',
    name: '자유로운 영혼',
    emoji: '🌊🎨',
    description: '물처럼 자유롭게 흐르며 모든 것을 탐험하는 모험가. 고정관념을 거부하고 새로운 가능성을 탐색합니다.',
    strengths: ['자유로운 사고', '적응력', '다재다능', '개방성'],
    weaknesses: ['방향성 부족', '일관성 없음', '책임 회피'],
    charmPoints: ['예측 불가능한 매력', '자유분방함', '유연성'],
    dailyFortuneTemplates: [
      '자유롭게 탐험하세요. 새로운 발견이 기다립니다.',
      '틀을 깨는 사고가 답을 줄 것입니다.',
      '유연한 접근이 모든 문제를 해결할 날입니다.',
      '흐르는 물처럼 자유롭게 이동하세요. 고여 있으면 기회를 놓칩니다.',
      '깊이 들어가보세요. 표면 아래 더 큰 세계가 있습니다.'
    ]
  },

  // INFJ Characters (Diplomats)
  {
    id: 'INFJ_목',
    mbti: 'INFJ',
    element: '목',
    category: 'diplomat',
    name: '새싹 치유자',
    emoji: '🌿💚',
    description: '새싹처럼 부드럽고 따뜻하게 타인을 성장시키는 치유자. 깊은 공감과 이해로 상처를 어루만집니다.',
    strengths: ['깊은 공감', '치유력', '성장 촉진', '따뜻함'],
    weaknesses: ['과도한 희생', '경계 부족', '자기 소진'],
    charmPoints: ['안전한 분위기', '진정한 이해', '성장 지원'],
    dailyFortuneTemplates: [
      '누군가를 돕거나 위로할 기회가 올 것입니다.',
      '당신의 공감이 큰 변화를 만들어낼 날입니다.',
      '치유의 에너지가 강한 날입니다. 자신도 돌보세요.',
      '새싹이 자라듯 당신의 영향력도 조용히 커지고 있습니다.',
      '자연 속에서 힐링의 시간을 가지세요. 숲의 기운이 당신을 채워줍니다.'
    ]
  },
  {
    id: 'INFJ_화',
    mbti: 'INFJ',
    element: '화',
    category: 'diplomat',
    name: '따뜻한 빛',
    emoji: '🔥❤️',
    description: '촛불처럼 따뜻한 빛으로 어둠을 밝히는 영혼. 열정적인 공감과 강한 신념으로 세상을 변화시킵니다.',
    strengths: ['열정적 공감', '강한 신념', '카리스마', '영감 제공'],
    weaknesses: ['번아웃', '극단적 감정', '과도한 몰입'],
    charmPoints: ['따뜻한 카리스마', '진정성', '영감을 주는 존재'],
    dailyFortuneTemplates: [
      '당신의 열정이 타인에게 영감을 줄 것입니다.',
      '신념을 위해 행동할 날입니다. 두려워하지 마세요.',
      '따뜻한 에너지로 주변을 밝힐 수 있는 날입니다.',
      '당신의 진심이 사람들의 마음에 불을 지필 날입니다.',
      '열정과 공감 사이의 균형을 유지하세요. 당신도 충전이 필요합니다.'
    ]
  },
  {
    id: 'INFJ_토',
    mbti: 'INFJ',
    element: '토',
    category: 'diplomat',
    name: '마음의 안식처',
    emoji: '🏡🤗',
    description: '대지처럼 포근하고 안정적인 안식처를 제공하는 상담자. 누구나 편안함을 느끼는 따뜻한 공간을 만듭니다.',
    strengths: ['안정감 제공', '신뢰성', '포용력', '평화로움'],
    weaknesses: ['변화 두려움', '과도한 안정 추구', '감정 억압'],
    charmPoints: ['편안한 분위기', '믿을 수 있는 존재', '평화로운 에너지'],
    dailyFortuneTemplates: [
      '안정적인 환경을 만드는 데 집중하세요.',
      '당신의 존재가 누군가에게 큰 위안이 될 것입니다.',
      '평화로운 에너지로 갈등을 해소할 수 있는 날입니다.',
      '집처럼 편안한 공간을 만들어보세요. 마음의 안정이 모든 것의 시작입니다.',
      '꾸준한 배려가 깊은 신뢰를 만듭니다. 오늘도 변함없이 따뜻하세요.'
    ]
  },
  {
    id: 'INFJ_금',
    mbti: 'INFJ',
    element: '금',
    category: 'diplomat',
    name: '정의로운 이상주의자',
    emoji: '⚖️✨',
    description: '강한 원칙과 순수한 이상으로 세상을 바로잡고자 하는 개혁가. 정의와 공감이 조화를 이룹니다.',
    strengths: ['강한 원칙', '정의감', '이상 추구', '명확한 신념'],
    weaknesses: ['융통성 부족', '이상과 현실 괴리', '완벽주의'],
    charmPoints: ['고결한 품성', '확고한 신념', '정의로운 행동'],
    dailyFortuneTemplates: [
      '원칙을 지키는 것이 올바른 선택입니다.',
      '정의를 위해 목소리를 낼 날입니다.',
      '당신의 신념이 다른 이들에게 영감을 줄 것입니다.',
      '올바름을 추구하되 자신에게도 관대해지세요.',
      '단단한 원칙 안에 부드러운 마음을 담으면 최고의 영향력이 됩니다.'
    ]
  },
  {
    id: 'INFJ_수',
    mbti: 'INFJ',
    element: '수',
    category: 'diplomat',
    name: '감성의 호수',
    emoji: '💧🌙',
    description: '깊고 고요한 호수처럼 풍부한 감성과 직관을 품은 신비로운 영혼. 보이지 않는 것을 느끼고 이해합니다.',
    strengths: ['깊은 직관', '풍부한 감성', '신비로운 통찰', '예술적 감각'],
    weaknesses: ['과도한 감수성', '현실 회피', '우울 경향'],
    charmPoints: ['신비로운 매력', '깊은 이해', '예술적 영혼'],
    dailyFortuneTemplates: [
      '직관을 따르세요. 보이지 않는 것이 답을 줄 것입니다.',
      '감성적 표현이 큰 울림을 만들어낼 날입니다.',
      '깊은 성찰의 시간을 가지세요. 통찰이 올 것입니다.',
      '달빛 아래 깊은 영감이 밀려옵니다. 밤의 고요함을 즐기세요.',
      '눈에 보이지 않는 흐름을 읽는 당신의 능력이 빛을 발합니다.'
    ]
  },

  // INFP Characters
  {
    id: 'INFP_목',
    mbti: 'INFP',
    element: '목',
    category: 'diplomat',
    name: '들판의 시인',
    emoji: '🌸📜',
    description: '들꽃처럼 자유롭고 아름다운 영혼을 가진 시인. 순수한 감성으로 세상의 아름다움을 발견합니다.',
    strengths: ['순수한 감성', '창의성', '자유로운 영혼', '아름다움 추구'],
    weaknesses: ['현실 적응 어려움', '우유부단', '과도한 이상주의'],
    charmPoints: ['순수한 매력', '예술적 감각', '따뜻한 마음'],
    dailyFortuneTemplates: [
      '창의적 표현의 날입니다. 글이나 그림으로 감정을 표현하세요.',
      '자연 속에서 영감을 얻을 수 있는 날입니다.',
      '당신의 순수한 시각이 아름다움을 발견하게 할 것입니다.',
      '들꽃처럼 자유롭게 피어나세요. 비교하지 않는 것이 최고의 아름다움입니다.',
      '일기를 쓰면 마음이 정리됩니다. 오늘의 감정을 기록해보세요.'
    ]
  },
  {
    id: 'INFP_화',
    mbti: 'INFP',
    element: '화',
    category: 'diplomat',
    name: '열정의 예술가',
    emoji: '🎨🔥',
    description: '불꽃처럼 타오르는 열정으로 예술을 창조하는 영혼. 강렬한 감정을 아름다운 작품으로 승화시킵니다.',
    strengths: ['열정적 창작', '강렬한 감정 표현', '예술적 재능', '영감'],
    weaknesses: ['감정 기복', '번아웃', '충동적'],
    charmPoints: ['강렬한 작품', '열정적 표현', '독특한 개성'],
    dailyFortuneTemplates: [
      '열정적으로 창작할 날입니다. 감정을 쏟아내세요.',
      '강렬한 영감이 찾아올 것입니다.',
      '당신의 열정이 걸작을 만들어낼 날입니다.',
      '불꽃같은 감정을 예술로 승화시키세요. 작품이 당신을 치유합니다.',
      '너무 많이 태우면 재만 남습니다. 적절한 쉼이 더 큰 창작으로 이어집니다.'
    ]
  },
  {
    id: 'INFP_토',
    mbti: 'INFP',
    element: '토',
    category: 'diplomat',
    name: '대지의 몽상가',
    emoji: '🌾🌻',
    description: '풍요로운 대지처럼 따뜻하고 안정적인 꿈을 키우는 몽상가. 현실적이면서도 이상적인 삶을 추구합니다.',
    strengths: ['안정적 이상주의', '현실 감각', '꾸준함', '따뜻함'],
    weaknesses: ['느린 실행', '변화 두려움', '소극적'],
    charmPoints: ['편안한 존재', '꾸준한 성장', '실현 가능한 꿈'],
    dailyFortuneTemplates: [
      '꿈을 현실로 만들 계획을 세우세요.',
      '꾸준한 노력이 결실을 맺을 날입니다.',
      '안정적인 환경에서 창의성이 꽃필 것입니다.',
      '마음 편한 곳에서 작업하세요. 편안함이 최고의 창작 환경입니다.',
      '조금씩 쌓아가는 것의 힘을 믿으세요. 오늘 한 걸음이 미래를 만듭니다.'
    ]
  },
  {
    id: 'INFP_금',
    mbti: 'INFP',
    element: '금',
    category: 'diplomat',
    name: '순수한 기사',
    emoji: '🗡️💫',
    description: '강한 원칙과 순수한 마음으로 약자를 지키는 기사. 정의와 공감이 완벽한 조화를 이룹니다.',
    strengths: ['강한 정의감', '원칙주의', '보호 본능', '헌신'],
    weaknesses: ['이상과 현실 괴리', '완벽주의', '자기 희생'],
    charmPoints: ['고결한 품성', '순수한 마음', '용기 있는 행동'],
    dailyFortuneTemplates: [
      '정의를 위해 행동할 날입니다.',
      '당신의 원칙이 옳은 길을 보여줄 것입니다.',
      '누군가를 보호하거나 도울 기회가 올 것입니다.',
      '강한 신념은 지키되, 방법에는 유연함을 가지세요.',
      '순수한 마음이 가장 강한 무기입니다. 자신을 믿으세요.'
    ]
  },
  {
    id: 'INFP_수',
    mbti: 'INFP',
    element: '수',
    category: 'diplomat',
    name: '별빛 물결',
    emoji: '🌊⭐',
    description: '밤하늘의 별이 반짝이는 물결처럼 신비롭고 아름다운 영혼. 깊은 감성과 무한한 상상력을 가졌습니다.',
    strengths: ['풍부한 상상력', '깊은 감성', '직관', '예술성'],
    weaknesses: ['현실 도피', '과도한 몽상', '우울 경향'],
    charmPoints: ['신비로운 매력', '독특한 세계관', '깊은 감수성'],
    dailyFortuneTemplates: [
      '상상력이 최고조에 달하는 날입니다. 창작하세요.',
      '직관을 따르세요. 신비로운 경험이 기다립니다.',
      '꿈과 현실의 경계에서 영감을 얻을 것입니다.',
      '별빛 아래 떠오르는 이야기를 놓치지 마세요. 당신만의 세계가 완성됩니다.',
      '감수성은 약점이 아니라 가장 아름다운 재능입니다.'
    ]
  },

  // ENFJ Characters
  {
    id: 'ENFJ_목',
    mbti: 'ENFJ',
    element: '목',
    category: 'diplomat',
    name: '성장 촉진자',
    emoji: '🌳🌟',
    description: '큰 나무처럼 많은 이들에게 그늘과 성장의 기회를 제공하는 멘토. 타인의 잠재력을 끌어냅니다.',
    strengths: ['타인 성장 촉진', '멘토링', '영감 제공', '포용력'],
    weaknesses: ['과도한 간섭', '자기 희생', '경계 부족'],
    charmPoints: ['따뜻한 리더십', '성장 지원', '카리스마'],
    dailyFortuneTemplates: [
      '누군가의 성장을 도울 기회가 올 것입니다.',
      '당신의 조언이 큰 변화를 만들어낼 날입니다.',
      '리더십을 발휘하여 팀을 성장시키세요.',
      '나무처럼 뿌리 깊은 관계를 만드세요. 오래 가는 인연이 됩니다.',
      '남을 키우기 전에 자신도 돌보세요. 건강한 나무가 좋은 열매를 맺습니다.'
    ]
  },
  {
    id: 'ENFJ_화',
    mbti: 'ENFJ',
    element: '화',
    category: 'diplomat',
    name: '태양의 선도자',
    emoji: '☀️👥',
    description: '태양처럼 밝은 에너지로 모두를 밝게 만드는 리더. 열정과 카리스마로 사람들을 하나로 모읍니다.',
    strengths: ['강력한 카리스마', '열정적 리더십', '영감 제공', '동기 부여'],
    weaknesses: ['번아웃', '과도한 책임감', '휴식 부족'],
    charmPoints: ['밝은 에너지', '긍정적 영향력', '감염되는 열정'],
    dailyFortuneTemplates: [
      '당신의 에너지가 모두를 고무시킬 날입니다.',
      '열정적으로 이끌면 큰 성과를 얻을 것입니다.',
      '밝은 에너지로 분위기를 바꿀 수 있는 날입니다.',
      '태양처럼 따뜻하게 비추되, 자신을 태우지는 마세요.',
      '진심을 담은 격려 한마디가 누군가의 인생을 바꿀 수 있습니다.'
    ]
  },
  {
    id: 'ENFJ_토',
    mbti: 'ENFJ',
    element: '토',
    category: 'diplomat',
    name: '공동체의 기둥',
    emoji: '🏛️💕',
    description: '대지처럼 견고하고 안정적인 공동체의 중심. 모두를 포용하며 조화로운 환경을 만듭니다.',
    strengths: ['안정적 리더십', '조화 추구', '신뢰성', '포용력'],
    weaknesses: ['변화 저항', '갈등 회피', '과도한 타협'],
    charmPoints: ['믿음직함', '안정감 제공', '조화로운 분위기'],
    dailyFortuneTemplates: [
      '갈등을 조정하고 화합을 만들어낼 날입니다.',
      '안정적인 환경을 조성하는 데 집중하세요.',
      '당신의 중재가 평화를 가져올 것입니다.',
      '공동체를 위한 작은 행동이 큰 변화를 만듭니다.',
      '안정감을 주는 당신의 존재 자체가 축복입니다.'
    ]
  },
  {
    id: 'ENFJ_금',
    mbti: 'ENFJ',
    element: '금',
    category: 'diplomat',
    name: '정의의 선봉',
    emoji: '⚖️🎖️',
    description: '강한 원칙과 뜨거운 마음으로 정의를 실현하는 리더. 공정함과 공감이 조화를 이룹니다.',
    strengths: ['강한 정의감', '원칙적 리더십', '공정함', '결단력'],
    weaknesses: ['융통성 부족', '완벽주의', '비타협적'],
    charmPoints: ['고결한 리더십', '명확한 신념', '정의로운 행동'],
    dailyFortuneTemplates: [
      '원칙을 지키면서 리더십을 발휘하세요.',
      '정의로운 결정이 존경을 받을 것입니다.',
      '공정한 판단이 신뢰를 쌓을 날입니다.',
      '올바른 것을 위해 목소리를 내되, 상대의 마음도 헤아리세요.',
      '강한 원칙과 따뜻한 마음의 조화가 최고의 리더를 만듭니다.'
    ]
  },
  {
    id: 'ENFJ_수',
    mbti: 'ENFJ',
    element: '수',
    category: 'diplomat',
    name: '유연한 조화자',
    emoji: '🌊🤝',
    description: '물처럼 유연하게 흐르며 모두를 연결하는 조화의 달인. 감성과 지혜로 관계를 조율합니다.',
    strengths: ['뛰어난 적응력', '감성 지능', '관계 조율', '유연성'],
    weaknesses: ['우유부단', '과도한 타협', '자기주장 부족'],
    charmPoints: ['조화로운 리더십', '깊은 공감', '유연한 대응'],
    dailyFortuneTemplates: [
      '유연한 접근으로 관계를 개선할 수 있는 날입니다.',
      '감성적 소통이 큰 성과를 가져올 것입니다.',
      '적응력을 발휘하여 난관을 돌파하세요.',
      '물처럼 부드럽게 다가가면 어떤 마음도 열립니다.',
      '모든 것을 감싸안으려 하지 마세요. 자신의 감정도 소중합니다.'
    ]
  },

  // ENFP Characters
  {
    id: 'ENFP_목',
    mbti: 'ENFP',
    element: '목',
    category: 'diplomat',
    name: '봄바람 모험가',
    emoji: '🌸🦋',
    description: '봄바람처럼 상쾌하고 자유로운 에너지로 가득한 모험가. 새로운 가능성을 발견하고 즐깁니다.',
    strengths: ['자유로운 영혼', '창의성', '긍정 에너지', '적응력'],
    weaknesses: ['산만함', '일관성 부족', '충동적'],
    charmPoints: ['매력적인 에너지', '즐거운 분위기', '신선한 관점'],
    dailyFortuneTemplates: [
      '새로운 경험을 시도하기 좋은 날입니다.',
      '당신의 긍정 에너지가 모두를 밝게 만들 것입니다.',
      '자유롭게 탐험하세요. 멋진 발견이 기다립니다.',
      '봄바람처럼 가볍게 움직이세요. 무거운 짐은 내려놓을 때입니다.',
      '호기심을 따라가면 뜻밖의 행운과 만나게 됩니다.'
    ]
  },
  {
    id: 'ENFP_화',
    mbti: 'ENFP',
    element: '화',
    category: 'diplomat',
    name: '불꽃 축제',
    emoji: '🎆💃',
    description: '불꽃놀이처럼 화려하고 즐거운 에너지로 파티의 중심이 되는 열정가. 삶 자체가 축제입니다.',
    strengths: ['폭발적 에너지', '사교성', '열정', '즉흥성'],
    weaknesses: ['과도한 충동', '번아웃', '책임 회피'],
    charmPoints: ['파티의 영혼', '감염되는 즐거움', '화려한 개성'],
    dailyFortuneTemplates: [
      '즐거운 만남과 이벤트가 기다리는 날입니다.',
      '당신의 에너지가 분위기를 폭발시킬 것입니다.',
      '즉흥적인 계획이 최고의 추억을 만들어낼 날입니다.',
      '함께하는 사람들에게 감사를 표현하세요. 관계가 더 깊어집니다.',
      '너무 많이 태우면 재만 남습니다. 에너지 조절도 능력입니다.'
    ]
  },
  {
    id: 'ENFP_토',
    mbti: 'ENFP',
    element: '토',
    category: 'diplomat',
    name: '들판의 자유인',
    emoji: '🌾🎈',
    description: '넓은 들판처럼 자유로우면서도 편안한 에너지를 가진 낙관주의자. 현실적이면서도 즐겁게 삽니다.',
    strengths: ['현실적 낙관', '편안한 에너지', '꾸준함', '균형감'],
    weaknesses: ['야망 부족', '안주', '도전 회피'],
    charmPoints: ['편안한 매력', '긍정적 태도', '안정적 즐거움'],
    dailyFortuneTemplates: [
      '편안하게 즐기는 것이 최고의 선택입니다.',
      '작은 행복을 발견할 수 있는 날입니다.',
      '균형잡힌 삶을 누리세요. 무리하지 마세요.',
      '넓은 들판에서 심호흡하듯 여유를 가지세요. 마음이 가벼워집니다.',
      '소소한 일상 속에서 진정한 행복을 발견하는 날입니다.'
    ]
  },
  {
    id: 'ENFP_금',
    mbti: 'ENFP',
    element: '금',
    category: 'diplomat',
    name: '반짝이는 이상가',
    emoji: '✨💎',
    description: '다이아몬드처럼 반짝이는 이상과 열정을 가진 활동가. 원칙 있으면서도 즐겁게 세상을 바꿉니다.',
    strengths: ['원칙 있는 열정', '카리스마', '영감 제공', '활동력'],
    weaknesses: ['이상과 현실 괴리', '완벽주의', '과도한 간섭'],
    charmPoints: ['빛나는 개성', '확고한 신념', '매력적인 활력'],
    dailyFortuneTemplates: [
      '이상을 향해 행동할 날입니다.',
      '당신의 열정이 변화를 만들어낼 것입니다.',
      '원칙을 지키면서도 즐겁게 나아가세요.',
      '빛나는 목표를 향해 달리되, 과정도 즐기세요.',
      '당신의 확고한 신념이 다른 이들에게 용기를 줍니다.'
    ]
  },
  {
    id: 'ENFP_수',
    mbti: 'ENFP',
    element: '수',
    category: 'diplomat',
    name: '무지개 물방울',
    emoji: '🌈💧',
    description: '물방울 속 무지개처럼 다채롭고 신비로운 영혼. 자유롭고 창의적이며 예측할 수 없는 매력을 가졌습니다.',
    strengths: ['다재다능', '창의성', '적응력', '독특한 매력'],
    weaknesses: ['일관성 부족', '방향성 불명확', '현실 회피'],
    charmPoints: ['예측 불가능한 매력', '다채로운 개성', '자유로운 영혼'],
    dailyFortuneTemplates: [
      '자유롭게 흐르세요. 새로운 색깔을 발견할 것입니다.',
      '다양한 시도가 멋진 결과를 만들어낼 날입니다.',
      '예술적 영감이 넘치는 날입니다. 창작하세요.',
      '물방울 하나가 무지개를 만듭니다. 작은 시도가 큰 변화로 이어집니다.',
      '감성을 자유롭게 풀어놓으세요. 오늘은 당신이 주인공인 날입니다.'
    ]
  }
];

// Main character database: 40 NT/NF hardcoded + 20 Sentinel + 20 Explorer = 80 total
const allCharacters: DestinyCharacter[] = [
  ...hardcodedCharacters,
  ...sentinelCharacters,
  ...explorerCharacters
];

/**
 * Get destiny character by MBTI and Element
 */
export function getDestinyCharacter(mbti: MBTIType, element: Element): DestinyCharacter {
  const character = allCharacters.find(c => c.mbti === mbti && c.element === element);
  if (!character) {
    throw new Error(`Character not found for ${mbti} + ${element}`);
  }
  return character;
}

/**
 * Get all 80 destiny characters
 */
export function getAllCharacters(): DestinyCharacter[] {
  return [...allCharacters];
}

/**
 * Get characters by category
 */
export function getCharactersByCategory(category: CharacterCategory): DestinyCharacter[] {
  return allCharacters.filter(c => c.category === category);
}

/**
 * Get characters by MBTI type
 */
export function getCharactersByMBTI(mbti: MBTIType): DestinyCharacter[] {
  return allCharacters.filter(c => c.mbti === mbti);
}

/**
 * Get characters by element
 */
export function getCharactersByElement(element: Element): DestinyCharacter[] {
  return allCharacters.filter(c => c.element === element);
}
