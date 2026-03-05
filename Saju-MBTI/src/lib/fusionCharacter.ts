import { MBTIType, Element } from '@/types';

export interface FusionCharacter {
  name: string;
  emoji: string;
  description: string;
  strength: string;
  weakness: string;
  charm: string;
}

// 80개 MBTI × 오행 전체 조합 하드코딩
const FUSION_CHARACTERS: Record<string, FusionCharacter> = {
  // ═══════════════════ INTJ (전략가) ═══════════════════
  'INTJ_목': {
    name: '고요한 숲의 군사',
    emoji: '🌲🎯',
    description: '깊은 숲처럼 고요하지만 그 안에 치밀한 전략이 소용돌이치는 전략가. 장기적 비전으로 승리를 설계합니다.',
    strength: '장기 전략 수립과 체계적 사고',
    weakness: '타인의 감정을 간과하는 경향',
    charm: '조용하지만 확실한 카리스마'
  },
  'INTJ_화': {
    name: '불꽃 속 냉철한 두뇌',
    emoji: '🔥🧠',
    description: '타오르는 열정 속에 냉철한 이성을 숨긴 모순의 천재. 뜨겁게 달리되 차갑게 계산합니다.',
    strength: '열정과 냉철함의 완벽한 조화',
    weakness: '번아웃 위험이 높음',
    charm: '불꽃같은 추진력과 예리한 판단'
  },
  'INTJ_토': {
    name: '산 위의 설계자',
    emoji: '🏔️📐',
    description: '산처럼 흔들리지 않는 의지로 원대한 청사진을 그리는 건축가. 현실적이면서 비전이 넓습니다.',
    strength: '실용적 계획과 흔들림 없는 실행',
    weakness: '지나치게 신중하여 기회를 놓침',
    charm: '돌처럼 단단한 신뢰감'
  },
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

  // ═══════════════════ INTP (논리술사) ═══════════════════
  'INTP_목': {
    name: '지식의 씨앗을 뿌리는 학자',
    emoji: '🌿📚',
    description: '끝없이 뻗어가는 지적 호기심의 뿌리. 하나의 질문에서 수십 갈래의 탐구가 피어납니다.',
    strength: '무한한 지적 호기심과 창의적 사고',
    weakness: '실행보다 사고에 치우침',
    charm: '엉뚱하지만 깊이 있는 관점'
  },
  'INTP_화': {
    name: '번뜩이는 아이디어의 불꽃',
    emoji: '💥🔬',
    description: '순간적 영감이 폭발처럼 터져나오는 발명가. 실험 정신으로 가득 찬 두뇌입니다.',
    strength: '혁신적 발상과 빠른 이론 구축',
    weakness: '충동적 실험으로 자원 낭비',
    charm: '예측 불가능한 천재성'
  },
  'INTP_토': {
    name: '묵묵히 연구하는 고고학자',
    emoji: '🏛️🔍',
    description: '견고한 논리 위에 체계적 이론을 쌓아가는 학자. 꾸준하고 깊이 있는 연구가 강점입니다.',
    strength: '체계적 이론과 실용적 논리',
    weakness: '변화에 느린 대응',
    charm: '깊이 있는 지식과 꾸준함'
  },
  'INTP_금': {
    name: '정밀 시계태엽의 두뇌',
    emoji: '⚙️🧩',
    description: '시계처럼 정밀한 논리와 완벽한 체계로 세상을 분석하는 사고자. 빈틈없는 논증의 달인입니다.',
    strength: '정밀한 분석과 완벽한 논리 체계',
    weakness: '감정 교류의 어려움',
    charm: '흠잡을 데 없는 논증력'
  },
  'INTP_수': {
    name: '흐르는 의식의 철학자',
    emoji: '💧🎭',
    description: '물처럼 유연하게 사고하며 진리를 탐구하는 자유로운 지성. 틀에 갇히지 않는 사고가 매력입니다.',
    strength: '유연한 사고와 고정관념 파괴',
    weakness: '방향을 잃기 쉬움',
    charm: '독특한 철학과 자유로운 영혼'
  },

  // ═══════════════════ ENTJ (통솔자) ═══════════════════
  'ENTJ_목': {
    name: '거목이 되어가는 대장군',
    emoji: '🌳👑',
    description: '큰 나무처럼 위로 뻗어 성장하며 그늘 아래 많은 이를 품는 리더. 조직과 사람을 함께 키웁니다.',
    strength: '성장 지향 리더십과 포용력',
    weakness: '과도한 간섭과 통제욕',
    charm: '따라가고 싶은 비전 제시'
  },
  'ENTJ_화': {
    name: '전장을 호령하는 불의 군주',
    emoji: '🔥⚡',
    description: '열정과 야망으로 불가능을 현실로 만드는 강력한 리더. 두려움 없이 돌진합니다.',
    strength: '압도적 추진력과 대담한 결정',
    weakness: '독단적이고 타인 배려 부족',
    charm: '범접할 수 없는 카리스마'
  },
  'ENTJ_토': {
    name: '제국을 세우는 건설왕',
    emoji: '🏰👔',
    description: '견고한 조직과 시스템을 구축하는 경영의 달인. 효율적이고 안정적인 구조를 설계합니다.',
    strength: '시스템 구축과 조직 관리의 달인',
    weakness: '경직되고 관료적인 면',
    charm: '신뢰할 수 있는 체계적 리더'
  },
  'ENTJ_금': {
    name: '강철 의지의 원수',
    emoji: '⚔️🛡️',
    description: '강철같은 의지와 원칙으로 조직을 이끄는 엄격하지만 공정한 리더. 결과로 증명합니다.',
    strength: '원칙주의와 결단력',
    weakness: '지나친 엄격함과 냉정함',
    charm: '흔들림 없는 공정한 판단'
  },
  'ENTJ_수': {
    name: '흐르는 물처럼 이끄는 지장',
    emoji: '🌊🎲',
    description: '상황에 맞게 유연한 전략을 구사하는 지혜로운 리더. 강압이 아닌 설득으로 이끕니다.',
    strength: '전략적 유연성과 높은 적응력',
    weakness: '우유부단해 보일 수 있음',
    charm: '물처럼 부드럽지만 확실한 리더십'
  },

  // ═══════════════════ ENTP (변론가) ═══════════════════
  'ENTP_목': {
    name: '끝없이 뻗어나가는 덩굴 발명가',
    emoji: '🧪🌿',
    description: '새로운 아이디어가 끊임없이 솟아나는 혁신가. 기존의 틀을 깨고 새로운 길을 만듭니다.',
    strength: '창의적 문제 해결',
    weakness: '마무리가 약할 수 있음',
    charm: '예측 불가능한 재미'
  },
  'ENTP_화': {
    name: '번개처럼 치는 혁명의 불씨',
    emoji: '⚡🎆',
    description: '번개처럼 빠르고 불꽃처럼 화려한 변화를 일으키는 혁명가. 세상을 뒤집는 걸 즐깁니다.',
    strength: '즉각적 실행과 파괴적 혁신',
    weakness: '안정성이 부족하고 지속력이 약함',
    charm: '폭발적 에너지와 예측 불가능한 매력'
  },
  'ENTP_토': {
    name: '아이디어를 현실로 빚는 도공',
    emoji: '🏗️💡',
    description: '창의성과 실용성을 결합한 균형잡힌 혁신가. 아이디어를 현실로 만드는 능력이 탁월합니다.',
    strength: '실현 가능한 아이디어와 현실적 접근',
    weakness: '창의성이 보수적으로 제한됨',
    charm: '믿을 수 있는 혁신가'
  },
  'ENTP_금': {
    name: '번개처럼 빠른 논리 전사',
    emoji: '⚡🤺',
    description: '날카로운 논리로 모든 것을 분석하고 반박하는 토론의 달인. 지적 자극을 즐깁니다.',
    strength: '뛰어난 논리력',
    weakness: '논쟁을 즐겨서 관계에 문제',
    charm: '지적인 매력'
  },
  'ENTP_수': {
    name: '바다를 건너는 자유로운 탐험가',
    emoji: '🌊🧭',
    description: '물처럼 자유롭게 흐르며 모든 것을 탐험하는 모험가. 고정관념을 거부합니다.',
    strength: '자유로운 사고와 다재다능함',
    weakness: '방향성 부족과 일관성 없음',
    charm: '자유분방하고 예측 불가능한 매력'
  },

  // ═══════════════════ INFJ (옹호자) ═══════════════════
  'INFJ_목': {
    name: '상처를 어루만지는 새싹',
    emoji: '🌿💚',
    description: '부드럽고 따뜻하게 타인을 성장시키는 치유의 영혼. 깊은 공감으로 상처를 어루만집니다.',
    strength: '깊은 공감과 치유력',
    weakness: '과도한 희생과 자기 소진',
    charm: '안전하고 따뜻한 존재감'
  },
  'INFJ_화': {
    name: '어둠을 밝히는 촛불',
    emoji: '🕯️❤️',
    description: '촛불처럼 따뜻한 빛으로 어둠을 밝히는 영혼. 열정적인 공감과 강한 신념의 소유자입니다.',
    strength: '열정적 공감과 영감을 주는 카리스마',
    weakness: '번아웃과 극단적 감정 기복',
    charm: '진정성 있는 따뜻한 카리스마'
  },
  'INFJ_토': {
    name: '마음의 쉼터를 짓는 이',
    emoji: '🏡🤗',
    description: '대지처럼 포근하고 안정적인 안식처를 제공하는 상담자. 편안함을 선물합니다.',
    strength: '안정감 제공과 포용력',
    weakness: '변화를 두려워하고 감정을 억누름',
    charm: '누구나 편안해지는 분위기'
  },
  'INFJ_금': {
    name: '고결한 정의의 수호자',
    emoji: '⚖️✨',
    description: '강한 원칙과 순수한 이상으로 세상을 바로잡으려는 개혁가. 정의와 공감이 조화됩니다.',
    strength: '확고한 원칙과 정의감',
    weakness: '이상과 현실의 괴리에 고통',
    charm: '고결한 품성과 흔들리지 않는 신념'
  },
  'INFJ_수': {
    name: '달빛이 비치는 고요한 호수',
    emoji: '🌙💧',
    description: '깊고 고요한 호수처럼 풍부한 감성과 직관을 품은 신비로운 영혼입니다.',
    strength: '깊은 직관과 예술적 감수성',
    weakness: '과도한 감수성과 우울 경향',
    charm: '신비롭고 깊은 내면 세계'
  },

  // ═══════════════════ INFP (중재자) ═══════════════════
  'INFP_목': {
    name: '들꽃처럼 피어나는 시인',
    emoji: '🌸📜',
    description: '들꽃처럼 자유롭고 아름다운 영혼의 시인. 순수한 감성으로 세상의 아름다움을 발견합니다.',
    strength: '순수한 감성과 창의적 표현력',
    weakness: '현실 적응이 어렵고 우유부단',
    charm: '순수함이 주는 따뜻한 위로'
  },
  'INFP_화': {
    name: '불꽃으로 캔버스를 물들이는 예술가',
    emoji: '🎨🔥',
    description: '불꽃처럼 타오르는 열정으로 예술을 창조하는 영혼. 강렬한 감정을 작품으로 승화시킵니다.',
    strength: '열정적 창작과 강렬한 감정 표현',
    weakness: '감정 기복과 번아웃',
    charm: '작품에 담긴 강렬한 진심'
  },
  'INFP_토': {
    name: '보리밭의 꿈꾸는 농부',
    emoji: '🌾🌻',
    description: '풍요로운 대지 위에 따뜻한 꿈을 키우는 몽상가. 현실적이면서도 이상적인 삶을 추구합니다.',
    strength: '현실 감각과 안정적 이상주의',
    weakness: '소극적이고 변화를 두려워함',
    charm: '편안하고 꾸준한 따뜻함'
  },
  'INFP_금': {
    name: '순수한 마음의 기사',
    emoji: '🗡️💫',
    description: '강한 원칙과 순수한 마음으로 약자를 지키는 기사. 정의와 공감이 조화를 이룹니다.',
    strength: '강한 정의감과 보호 본능',
    weakness: '이상과 현실 괴리로 인한 좌절',
    charm: '용기 있는 순수함'
  },
  'INFP_수': {
    name: '달빛 아래 꿈꾸는 시인',
    emoji: '🌙✍️',
    description: '깊은 내면 세계를 가진 이상주의자. 감성과 상상력으로 아름다운 세계를 창조합니다.',
    strength: '풍부한 감성과 공감 능력',
    weakness: '현실 감각이 부족할 수 있음',
    charm: '순수하고 깊은 감성'
  },

  // ═══════════════════ ENFJ (선도자) ═══════════════════
  'ENFJ_목': {
    name: '큰 나무 아래 모이는 멘토',
    emoji: '🌳🌟',
    description: '큰 나무처럼 많은 이들에게 그늘과 성장의 기회를 제공하는 멘토. 잠재력을 끌어냅니다.',
    strength: '타인 성장 촉진과 영감 제공',
    weakness: '과도한 간섭과 자기 희생',
    charm: '따뜻한 리더십과 성장 지원'
  },
  'ENFJ_화': {
    name: '태양처럼 빛나는 지도자',
    emoji: '☀️👥',
    description: '태양처럼 밝은 에너지로 모두를 밝게 만드는 리더. 열정과 카리스마로 사람들을 모읍니다.',
    strength: '감염되는 열정과 동기 부여',
    weakness: '번아웃과 과도한 책임감',
    charm: '밝은 에너지로 분위기 전환'
  },
  'ENFJ_토': {
    name: '마을의 든든한 어른',
    emoji: '🏛️💕',
    description: '대지처럼 견고하고 안정적인 공동체의 중심. 모두를 포용하며 조화를 만듭니다.',
    strength: '안정적 리더십과 갈등 중재',
    weakness: '변화 저항과 갈등 회피',
    charm: '믿음직하고 안정감 있는 존재'
  },
  'ENFJ_금': {
    name: '정의로운 봉화의 선봉장',
    emoji: '⚖️🎖️',
    description: '강한 원칙과 뜨거운 마음으로 정의를 실현하는 리더. 공정함과 공감이 조화됩니다.',
    strength: '원칙적이면서 공감적인 리더십',
    weakness: '융통성 부족과 완벽주의',
    charm: '고결하고 명확한 신념'
  },
  'ENFJ_수': {
    name: '모든 것을 연결하는 물의 조화사',
    emoji: '🌊🤝',
    description: '물처럼 유연하게 흐르며 모두를 연결하는 조화의 달인. 감성과 지혜로 관계를 조율합니다.',
    strength: '뛰어난 적응력과 감성 지능',
    weakness: '자기주장 부족과 과도한 타협',
    charm: '깊은 공감과 유연한 대응'
  },

  // ═══════════════════ ENFP (활동가) ═══════════════════
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
  'ENFP_토': {
    name: '꽃밭의 자유로운 정원사',
    emoji: '🌾🎈',
    description: '넓은 들판처럼 자유로우면서도 편안한 에너지를 주는 낙관주의자. 현실적이면서 즐겁게 삽니다.',
    strength: '현실적 낙관과 균형잡힌 에너지',
    weakness: '야망이 부족하고 안주할 수 있음',
    charm: '편안하고 긍정적인 아우라'
  },
  'ENFP_금': {
    name: '반짝이는 별을 따는 이상가',
    emoji: '✨💎',
    description: '다이아몬드처럼 반짝이는 이상과 열정을 가진 활동가. 원칙 있으면서 즐겁게 세상을 바꿉니다.',
    strength: '원칙 있는 열정과 높은 영향력',
    weakness: '이상과 현실 사이에서 방황',
    charm: '빛나는 개성과 확고한 신념'
  },
  'ENFP_수': {
    name: '무지개빛 물방울의 몽상가',
    emoji: '🌈💧',
    description: '물방울 속 무지개처럼 다채롭고 신비로운 영혼. 자유롭고 창의적이며 예측할 수 없습니다.',
    strength: '다재다능함과 독특한 창의성',
    weakness: '방향을 잃고 현실 회피',
    charm: '예측 불가능한 다채로운 매력'
  },

  // ═══════════════════ ISTJ (현실주의자) ═══════════════════
  'ISTJ_목': {
    name: '대나무처럼 곧은 관리자',
    emoji: '🎋📋',
    description: '대나무처럼 곧고 꾸준히 성장하는 철저한 관리자. 규칙을 지키며 한 걸음씩 확실하게 나아갑니다.',
    strength: '꾸준한 성장과 철저한 관리',
    weakness: '유연성 부족과 변화 저항',
    charm: '흔들리지 않는 일관성'
  },
  'ISTJ_화': {
    name: '용광로의 철을 다루는 장인',
    emoji: '🔥📋',
    description: '뜨거운 열정을 가졌지만 그것을 정밀하게 다루는 솜씨를 가진 장인. 의무에 충실합니다.',
    strength: '열정적 업무 수행과 높은 완성도',
    weakness: '일 중독과 휴식 부족',
    charm: '말보다 행동으로 보여주는 성실함'
  },
  'ISTJ_토': {
    name: '반석 위의 기록관',
    emoji: '🏔️📝',
    description: '바위처럼 단단한 기반 위에 모든 것을 꼼꼼히 기록하는 사람. 데이터와 사실로 말합니다.',
    strength: '완벽한 기록 관리와 높은 신뢰도',
    weakness: '지나친 보수와 감정 표현 어려움',
    charm: '어떤 상황에서도 흔들리지 않는 안정감'
  },
  'ISTJ_금': {
    name: '무쇠 원칙의 파수꾼',
    emoji: '🛡️⚔️',
    description: '강철 같은 원칙과 규율로 조직을 지키는 파수꾼. 공정하고 정확한 판단의 소유자입니다.',
    strength: '철저한 원칙주의와 공정한 판단',
    weakness: '융통성 없고 냉정해 보임',
    charm: '절대적으로 신뢰할 수 있는 존재'
  },
  'ISTJ_수': {
    name: '지하수맥의 탐사자',
    emoji: '💧🔎',
    description: '보이지 않는 곳에서 꾸준히 흐르는 지하수처럼 묵묵히 일하는 분석가. 끈기가 남다릅니다.',
    strength: '꾸준한 분석과 인내심',
    weakness: '표현이 부족하고 내성적',
    charm: '조용하지만 확실한 존재감'
  },

  // ═══════════════════ ISFJ (수호자) ═══════════════════
  'ISFJ_목': {
    name: '조용히 가꾸는 정원지기',
    emoji: '🌱🤲',
    description: '묵묵히 정원을 가꾸듯 주변 사람들을 돌보는 헌신적인 보호자. 작은 것도 놓치지 않습니다.',
    strength: '세심한 배려와 꾸준한 돌봄',
    weakness: '자기 자신은 돌보지 못함',
    charm: '잔잔하지만 깊은 사랑'
  },
  'ISFJ_화': {
    name: '따뜻한 벽난로의 지킴이',
    emoji: '🔥🏠',
    description: '벽난로처럼 따뜻한 온기를 주며 가정을 지키는 수호자. 열정적으로 사랑하는 사람을 보호합니다.',
    strength: '열정적 보호와 깊은 헌신',
    weakness: '과보호와 소유욕',
    charm: '가슴이 따뜻해지는 정성'
  },
  'ISFJ_토': {
    name: '따뜻한 대지의 수호자',
    emoji: '🏡🌾',
    description: '안정과 평화를 사랑하는 든든한 존재. 주변 사람들을 보살피며 편안함을 제공합니다.',
    strength: '헌신과 책임감',
    weakness: '변화를 두려워할 수 있음',
    charm: '믿고 의지할 수 있는 든든함'
  },
  'ISFJ_금': {
    name: '은빛 방패의 조용한 수호자',
    emoji: '🛡️💎',
    description: '은처럼 빛나지만 조용히 보호하는 수호자. 원칙을 지키며 사랑하는 이를 지킵니다.',
    strength: '원칙적 보호와 조용한 헌신',
    weakness: '완벽주의와 자기 억압',
    charm: '은은하지만 확실한 보호막'
  },
  'ISFJ_수': {
    name: '치유의 샘물',
    emoji: '💧🌸',
    description: '맑은 샘물처럼 지친 이들에게 생기를 되돌려주는 치유자. 부드러운 공감이 상처를 씻어줍니다.',
    strength: '깊은 공감과 치유 능력',
    weakness: '감정 흡수로 인한 탈진',
    charm: '가까이 있으면 편안해지는 에너지'
  },

  // ═══════════════════ ESTJ (경영자) ═══════════════════
  'ESTJ_목': {
    name: '떡갈나무의 조직 리더',
    emoji: '🌳💼',
    description: '떡갈나무처럼 든든하고 넓게 성장하며 조직을 이끄는 리더. 체계와 성장을 동시에 추구합니다.',
    strength: '조직 성장과 체계적 관리',
    weakness: '과도한 성과 압박',
    charm: '든든하고 믿음직한 리더십'
  },
  'ESTJ_화': {
    name: '불타는 결단의 사령관',
    emoji: '🔥🎯',
    description: '뜨거운 열정과 빠른 결단으로 조직을 이끄는 사령관. 결과를 향해 거침없이 돌진합니다.',
    strength: '빠른 의사결정과 강한 추진력',
    weakness: '성급함과 타인 감정 무시',
    charm: '거침없는 실행력'
  },
  'ESTJ_토': {
    name: '성벽을 쌓는 총독',
    emoji: '🏰💪',
    description: '견고한 성벽처럼 단단한 조직을 만드는 총독. 안정적이고 효율적인 시스템을 구축합니다.',
    strength: '안정적 시스템 구축과 효율성',
    weakness: '변화 거부와 경직됨',
    charm: '어떤 상황에서도 무너지지 않는 안정감'
  },
  'ESTJ_금': {
    name: '강철 같은 조직의 리더',
    emoji: '👔⚙️',
    description: '원칙과 질서를 중시하는 완벽한 매니저. 효율성과 결과로 말합니다.',
    strength: '체계적 관리 능력',
    weakness: '융통성이 부족할 수 있음',
    charm: '신뢰할 수 있는 리더십'
  },
  'ESTJ_수': {
    name: '물길을 다스리는 치수관',
    emoji: '🌊📊',
    description: '물길을 관리하듯 조직의 흐름을 통제하고 최적화하는 관리자. 데이터로 의사결정합니다.',
    strength: '데이터 기반 의사결정과 리스크 관리',
    weakness: '감성 부족과 직원 소통 어려움',
    charm: '정확하고 예측 가능한 리더십'
  },

  // ═══════════════════ ESFJ (집정관) ═══════════════════
  'ESFJ_목': {
    name: '꽃이 만발한 커뮤니티 가드너',
    emoji: '🌺👥',
    description: '공동체에 아름다운 꽃을 피우는 사교적 정원사. 사람들 사이에서 조화를 만들어냅니다.',
    strength: '뛰어난 대인관계와 조화 추구',
    weakness: '타인의 시선에 과도하게 신경',
    charm: '함께하면 기분 좋아지는 에너지'
  },
  'ESFJ_화': {
    name: '모닥불 파티의 호스트',
    emoji: '🔥🎊',
    description: '따뜻한 모닥불처럼 사람들을 모으고 즐겁게 만드는 호스트. 파티의 영혼입니다.',
    strength: '열정적 호스팅과 분위기 메이킹',
    weakness: '인정 욕구와 과도한 에너지 소모',
    charm: '거부할 수 없는 따뜻한 환대'
  },
  'ESFJ_토': {
    name: '마을 광장의 어머니',
    emoji: '🏘️💕',
    description: '대지처럼 모든 것을 포용하고 품어주는 마을의 어머니. 공동체의 든든한 기둥입니다.',
    strength: '포용력과 공동체 리더십',
    weakness: '간섭과 과보호 경향',
    charm: '어머니 같은 따뜻한 보살핌'
  },
  'ESFJ_금': {
    name: '황금 초대장의 사교 여왕',
    emoji: '👑🎀',
    description: '우아하고 세련된 사교 모임의 주인공. 격식과 예절을 갖추면서도 따뜻함을 잃지 않습니다.',
    strength: '세련된 사교 능력과 조직력',
    weakness: '형식에 얽매이고 비판에 민감',
    charm: '우아하면서도 따뜻한 매너'
  },
  'ESFJ_수': {
    name: '흐르는 물처럼 연결하는 인맥왕',
    emoji: '💧🤝',
    description: '물처럼 자연스럽게 사람과 사람을 연결하는 소셜 커넥터. 모두와 잘 어울립니다.',
    strength: '자연스러운 네트워킹과 공감 능력',
    weakness: '거절하지 못하고 에너지 소진',
    charm: '누구와도 잘 통하는 소통 능력'
  },

  // ═══════════════════ ISTP (장인) ═══════════════════
  'ISTP_목': {
    name: '나무를 깎는 묵묵한 장인',
    emoji: '🪵🔧',
    description: '나무를 다루듯 손기술이 뛰어난 장인. 말보다 손으로 표현하며 묵묵히 결과물을 만들어냅니다.',
    strength: '뛰어난 손재주와 실용적 문제 해결',
    weakness: '감정 표현 서툴고 소통 어려움',
    charm: '쿨하면서도 능력있는 매력'
  },
  'ISTP_화': {
    name: '용광로의 대장장이',
    emoji: '🔥🔨',
    description: '뜨거운 불에서 금속을 다루는 대장장이처럼 어떤 문제도 두렵지 않은 실전형 해결사.',
    strength: '위기 상황에서의 냉철한 대처',
    weakness: '충동적 행동과 장기 계획 부재',
    charm: '위기에 강한 침착한 능력자'
  },
  'ISTP_토': {
    name: '흙을 빚는 도예가',
    emoji: '🏺🤲',
    description: '흙으로 작품을 만들듯 실용적이고 견고한 것을 만드는 장인. 안정적이고 꾸준합니다.',
    strength: '실용적 창작과 꾸준한 기술 향상',
    weakness: '변화에 느린 대응',
    charm: '묵묵히 만들어내는 솜씨'
  },
  'ISTP_금': {
    name: '정밀 시계의 마이스터',
    emoji: '⚙️🔍',
    description: '시계처럼 정밀한 기계를 다루는 마이스터. 복잡한 것을 분석하고 수리하는 능력이 탁월합니다.',
    strength: '정밀한 분석과 기계적 직관',
    weakness: '인간관계에 무관심',
    charm: '무뚝뚝하지만 실력으로 인정받는 존재'
  },
  'ISTP_수': {
    name: '심해를 탐사하는 잠수부',
    emoji: '🤿🌊',
    description: '깊은 바다를 탐사하듯 미지의 영역에 과감히 뛰어드는 모험가. 침착하고 대담합니다.',
    strength: '대담한 탐험과 뛰어난 적응력',
    weakness: '위험을 무시하는 무모함',
    charm: '과묵하지만 대담한 행동력'
  },

  // ═══════════════════ ISFP (모험가) ═══════════════════
  'ISFP_목': {
    name: '숲속을 거니는 수채화 화가',
    emoji: '🌲🎨',
    description: '자연 속에서 영감을 얻는 자유로운 예술가. 아름다움을 발견하고 그것을 색으로 표현합니다.',
    strength: '자연과의 교감과 예술적 표현',
    weakness: '현실적 판단 부족',
    charm: '자연스럽고 꾸밈없는 아름다움'
  },
  'ISFP_화': {
    name: '불꽃 위를 춤추는 댄서',
    emoji: '💃🔥',
    description: '불꽃처럼 열정적으로 순간을 사는 예술가. 몸과 감정으로 표현하는 댄서의 영혼입니다.',
    strength: '열정적 표현과 순간에 대한 몰입',
    weakness: '감정에 휩쓸리고 지속력 부족',
    charm: '강렬하고 아름다운 표현력'
  },
  'ISFP_토': {
    name: '찰흙으로 세상을 빚는 예술가',
    emoji: '🏺🌸',
    description: '흙을 빚어 아름다운 것을 만드는 손재주의 예술가. 안정적이면서도 감성적입니다.',
    strength: '실용적 예술성과 안정적 감성',
    weakness: '변화를 두려워하고 자기주장 부족',
    charm: '따뜻하고 소박한 아름다움'
  },
  'ISFP_금': {
    name: '은빛 선율의 음유시인',
    emoji: '🎵✨',
    description: '은처럼 맑은 선율로 감동을 주는 음악가. 원칙 있으면서 부드러운 예술혼의 소유자입니다.',
    strength: '감동을 주는 표현력과 원칙',
    weakness: '비판에 상처받기 쉬움',
    charm: '마음을 울리는 진정한 예술'
  },
  'ISFP_수': {
    name: '수채화처럼 번지는 감성',
    emoji: '💧🎨',
    description: '물처럼 유연하고 수채화처럼 아름다운 감성의 소유자. 흐르는 대로 사는 자유로운 영혼입니다.',
    strength: '유연한 감성과 깊은 공감 능력',
    weakness: '우유부단과 현실 회피',
    charm: '물 흐르듯 자연스러운 매력'
  },

  // ═══════════════════ ESTP (사업가) ═══════════════════
  'ESTP_목': {
    name: '정글을 달리는 탐험대장',
    emoji: '🌴🏃',
    description: '정글처럼 복잡한 환경에서도 길을 찾아내는 모험가. 성장하면서 동시에 도전합니다.',
    strength: '빠른 판단력과 현장 적응력',
    weakness: '장기 계획 없이 즉흥적',
    charm: '어디서든 살아남는 서바이벌 능력'
  },
  'ESTP_화': {
    name: '폭발하는 레이서',
    emoji: '🏎️🔥',
    description: '불꽃처럼 타오르며 속도를 즐기는 스피드 광. 아드레날린이 폭발하는 순간을 사랑합니다.',
    strength: '순발력과 압도적 행동력',
    weakness: '무모함과 충동적 결정',
    charm: '짜릿하고 역동적인 에너지'
  },
  'ESTP_토': {
    name: '보물을 캐는 발굴가',
    emoji: '⛏️💰',
    description: '대지에서 보물을 찾아내듯 어디서든 기회를 포착하는 사업가. 현실 감각이 뛰어납니다.',
    strength: '기회 포착과 현실적 이익 추구',
    weakness: '인내심 부족과 과도한 욕심',
    charm: '어디서든 돈이 되는 것을 찾는 눈'
  },
  'ESTP_금': {
    name: '강철 신경의 도박사',
    emoji: '🎰⚡',
    description: '강철 같은 신경으로 높은 판돈에도 동요하지 않는 승부사. 리스크를 즐기고 관리합니다.',
    strength: '위기에 강한 담력과 빠른 판단',
    weakness: '무모한 리스크 테이킹',
    charm: '스릴 넘치는 카리스마'
  },
  'ESTP_수': {
    name: '파도를 타는 서퍼',
    emoji: '🏄🌊',
    description: '파도 위에서 균형을 잡듯 변화하는 환경에 유연하게 대응하는 모험가. 흐름을 탑니다.',
    strength: '뛰어난 적응력과 상황 대처',
    weakness: '한 곳에 머무르지 못함',
    charm: '자유롭고 쿨한 라이프스타일'
  },

  // ═══════════════════ ESFP (연예인) ═══════════════════
  'ESFP_목': {
    name: '봄꽃 축제의 여왕',
    emoji: '🌸🎭',
    description: '봄처럼 화사하고 생동감 넘치는 퍼포머. 어디서든 축제를 시작하고 분위기를 장악합니다.',
    strength: '분위기 메이킹과 사교적 에너지',
    weakness: '산만하고 일관성 부족',
    charm: '함께하면 행복해지는 에너지'
  },
  'ESFP_화': {
    name: '파티장을 장악하는 불꽃놀이',
    emoji: '🎆🎉',
    description: '현재를 즐기는 데 타고난 천재. 어디를 가든 파티가 시작되고, 모든 이의 시선을 사로잡습니다.',
    strength: '순간을 즐기는 능력',
    weakness: '미래 계획이 약할 수 있음',
    charm: '타고난 엔터테이너'
  },
  'ESFP_토': {
    name: '추수 축제의 흥겨운 춤꾼',
    emoji: '🌾💃',
    description: '풍요로운 수확을 축하하듯 삶의 즐거움을 나누는 대지의 춤꾼. 현실적이면서 즐겁습니다.',
    strength: '현실적 즐거움과 사람들과의 교감',
    weakness: '책임감 부족과 즉흥적',
    charm: '풍요롭고 따뜻한 즐거움'
  },
  'ESFP_금': {
    name: '골든 스포트라이트의 스타',
    emoji: '🌟🎤',
    description: '무대 위에서 금빛으로 빛나는 스타. 모든 시선을 끌어당기는 타고난 연예인입니다.',
    strength: '무대 장악력과 관객 교감',
    weakness: '허영심과 관심 중독',
    charm: '눈을 뗄 수 없는 황금빛 존재감'
  },
  'ESFP_수': {
    name: '물놀이 파티의 주인공',
    emoji: '🏖️🎊',
    description: '바다처럼 넓은 품으로 모두를 즐겁게 하는 파티의 주인공. 유연하고 재미있습니다.',
    strength: '유연한 사교성과 분위기 전환',
    weakness: '깊이 부족과 변덕스러움',
    charm: '시원하고 상쾌한 여름 같은 에너지'
  }
};

/**
 * MBTI와 주요 오행을 조합한 퓨전 캐릭터 생성
 */
export function createFusionCharacter(
  mbti: MBTIType,
  dominantElement: Element
): FusionCharacter {
  const key = `${mbti}_${dominantElement}`;
  return FUSION_CHARACTERS[key] || createDefaultCharacter(mbti, dominantElement);
}

function createDefaultCharacter(mbti: MBTIType, element: Element): FusionCharacter {
  const elementNames: Record<Element, { name: string; emoji: string; trait: string }> = {
    '목': { name: '성장하는 나무', emoji: '🌳', trait: '확장과 발전' },
    '화': { name: '타오르는 불꽃', emoji: '🔥', trait: '열정과 변화' },
    '토': { name: '든든한 대지', emoji: '🏔️', trait: '안정과 포용' },
    '금': { name: '빛나는 금속', emoji: '⚔️', trait: '날카로움과 정의' },
    '수': { name: '흐르는 물', emoji: '💧', trait: '지혜와 유연함' }
  };
  const info = elementNames[element];
  return {
    name: `${info.name}의 ${mbti} 전사`,
    emoji: `${info.emoji}✨`,
    description: `${mbti} 타입과 ${element}의 ${info.trait} 에너지가 결합된 독특한 존재입니다.`,
    strength: `${element} 기운에서 오는 고유한 힘`,
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
  const mbtiScore = calculateMBTIScore(myMBTI, partnerMBTI);
  const elementScore = calculateElementScore(myElement, partnerElement);
  const totalScore = Math.round((mbtiScore + elementScore) / 2);

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
    message = '성격은 안 맞아도 운명적으로 서로를 보완하는 관계입니다.';
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
  // 인지 기능 기반 MBTI 궁합 점수
  const bestPairs: Record<string, number> = {
    'ENFP_INTJ': 95, 'ENTP_INFJ': 95, 'INFP_ENFJ': 93, 'INTP_ENTJ': 93,
    'ESFP_ISTJ': 88, 'ESTP_ISFJ': 88, 'ISFP_ESFJ': 88, 'ISTP_ESTJ': 88,
    'ENFP_INFJ': 90, 'ENTP_INTJ': 90, 'INFP_ENTJ': 85, 'INTP_ENFJ': 85,
    'ISFP_ENFJ': 87, 'ESFP_ISFJ': 85, 'ESTP_ISTJ': 85, 'ISTP_ESFJ': 82,
    'ENFJ_INFP': 93, 'ENTJ_INTP': 93, 'INFJ_ENFP': 90, 'INTJ_ENTP': 90,
  };

  const key1 = `${mbti1}_${mbti2}`;
  const key2 = `${mbti2}_${mbti1}`;

  if (bestPairs[key1]) return bestPairs[key1];
  if (bestPairs[key2]) return bestPairs[key2];

  // 공통 지표 기반 점수
  let score = 50;
  for (let i = 0; i < 4; i++) {
    if (mbti1[i] === mbti2[i]) score += 8;
  }
  // N-S 차이는 감점 큼, E-I 차이는 오히려 보완
  if (mbti1[1] !== mbti2[1]) score -= 5; // S/N 차이
  return Math.min(100, Math.max(30, score));
}

function calculateElementScore(element1: Element, element2: Element): number {
  const sheng: Record<Element, Element> = {
    '목': '화', '화': '토', '토': '금', '금': '수', '수': '목'
  };
  const ke: Record<Element, Element> = {
    '목': '토', '화': '금', '토': '수', '금': '목', '수': '화'
  };

  if (element1 === element2) return 70;
  if (sheng[element1] === element2) return 90;
  if (sheng[element2] === element1) return 85;
  if (ke[element1] === element2) return 40;
  if (ke[element2] === element1) return 45;
  return 60;
}
