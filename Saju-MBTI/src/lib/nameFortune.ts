export interface NameFortuneResult {
  name: string;
  totalStrokes: number;
  fortuneScore: number;
  personality: string;
  loveLife: string;
  career: string;
  wealth: string;
  health: string;
  luckyNumbers: number[];
  luckyColors: string[];
  advice: string;
}

// Jamo stroke counts for Korean character decomposition
const CHO_STROKES = [2,4,4,2,5,5,3,3,5,6,7,4,4,4,4,4,5,4,4]; // 19 initial consonants
const JUNG_STROKES = [2,3,3,4,4,4,4,5,5,5,5,6,6,6,5,5,6,6,7,7,3]; // 21 vowels
const JONG_STROKES = [0,2,4,4,5,5,6,1,3,3,3,3,5,4,4,4,4,3,4,4,5,5,5,3,4,4,5,7]; // 28 finals (0 = no final)

function getKoreanStrokes(char: string): number {
  const code = char.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return 5; // non-Korean fallback
  const offset = code - 0xAC00;
  const cho = Math.floor(offset / 588);
  const jung = Math.floor((offset % 588) / 28);
  const jong = offset % 28;
  return (CHO_STROKES[cho] || 2) + (JUNG_STROKES[jung] || 2) + (JONG_STROKES[jong] || 0);
}

const personalityByMod: Record<number, string> = {
  0: '강한 의지와 리더십을 지닌 성격입니다. 주위 사람들을 자연스럽게 이끌며, 어떤 환경에서도 적응력이 뛰어납니다. 다만 지나친 고집이 인간관계에서 마찰을 일으킬 수 있으니 유연함도 키워보세요.',
  1: '섬세하고 창의적인 감수성을 지녔습니다. 예술적 재능이 뛰어나고 타인의 감정을 잘 이해합니다. 때로는 과도한 감정 몰입으로 지칠 수 있으니 자신을 돌보는 시간을 가지세요.',
  2: '지적 탐구심이 강하고 분석력이 뛰어납니다. 논리적 사고로 복잡한 문제를 해결하는 능력이 탁월합니다. 사람들과의 감정적 교류에 좀 더 열린 마음을 가져보세요.',
  3: '사교적이고 따뜻한 성품으로 주변에 사람이 끊이지 않습니다. 유머 감각이 뛰어나고 분위기를 밝히는 능력이 있습니다. 타인에게 너무 맞추다 보면 자신을 잃을 수 있으니 경계선을 지키세요.',
  4: '신중하고 책임감이 강한 성격입니다. 한 번 맡은 일은 끝까지 완수하는 성실함이 돋보입니다. 완벽주의적 성향이 스트레스를 유발할 수 있으니 때로는 내려놓는 연습을 하세요.',
  5: '자유롭고 모험을 즐기는 활동적인 성격입니다. 새로운 경험에 대한 열정이 넘치고 변화를 두려워하지 않습니다. 지속성과 꾸준함을 키우면 더 큰 성과를 얻을 수 있습니다.',
  6: '다정하고 보살피는 것을 좋아하는 따뜻한 성품입니다. 가족과 친구를 위해 헌신적으로 노력하며 조화를 중시합니다. 자신의 욕구도 소중히 여기는 균형감이 필요합니다.',
  7: '깊은 직관력과 통찰력을 지닌 신비로운 성격입니다. 영적인 것에 관심이 많고 깊은 사색을 즐깁니다. 현실적인 측면도 놓치지 않도록 균형을 맞추세요.',
  8: '강한 실행력과 추진력으로 목표를 반드시 이루는 성격입니다. 물질적 성공에 대한 의지가 강하고 비즈니스 감각이 뛰어납니다. 인간적인 따뜻함도 함께 표현하면 관계가 더욱 풍요로워집니다.',
  9: '이상주의적이고 인도주의적 가치를 중시합니다. 세상을 더 나은 곳으로 만들고 싶은 강한 소망이 있습니다. 현실과 이상 사이의 균형을 찾는 것이 중요한 과제입니다.',
};

const loveByMod: Record<number, string> = {
  0: '열정적이고 직진하는 스타일로 상대방에게 강한 인상을 남깁니다. 다소 강압적으로 느껴질 수 있으니 상대의 페이스를 존중하는 것이 중요합니다.',
  1: '섬세하고 로맨틱한 사랑을 꿈꿉니다. 상대방의 작은 것까지 기억하고 세심하게 배려하여 깊은 유대감을 형성합니다.',
  2: '지적인 대화와 정신적 교감을 중시합니다. 마음이 통하는 사람과의 깊은 관계를 원하며, 서두르지 않고 천천히 신뢰를 쌓아가는 스타일입니다.',
  3: '활발하고 재미있는 연애를 즐깁니다. 유머와 즐거움이 넘치는 관계를 만들어가며, 많은 사람들에게 매력적으로 다가갑니다.',
  4: '안정적이고 신뢰할 수 있는 파트너를 원합니다. 한 번 사랑하면 깊고 충실하게 관계를 유지하며 장기적인 헌신을 소중히 여깁니다.',
  5: '자유롭고 모험적인 사랑을 추구합니다. 다양한 경험을 함께 나누는 파트너와 잘 맞으며, 구속보다는 신뢰를 바탕으로 한 자유로운 관계를 원합니다.',
  6: '헌신적이고 보살피는 사랑을 합니다. 상대방의 행복이 곧 자신의 행복이며, 따뜻한 가정을 꾸리는 것을 이상으로 삼습니다.',
  7: '깊고 영적인 연결을 중시합니다. 영혼의 짝을 찾는 낭만주의자로, 표면적인 관계보다 진정한 내면의 교감을 추구합니다.',
  8: '강하고 역동적인 관계를 즐깁니다. 파트너를 지지하고 함께 성장하는 관계를 원하며, 물질적 안정도 중요하게 여깁니다.',
  9: '이상적이고 헌신적인 사랑을 합니다. 사랑하는 사람을 위해 무엇이든 희생할 준비가 되어있지만, 자신도 소중히 여겨야 합니다.',
};

const careerByMod: Record<number, string> = {
  0: '리더십이 요구되는 분야에서 두각을 나타냅니다. 경영자, 관리자, 정치인 등의 역할에서 타고난 재능을 발휘할 수 있습니다.',
  1: '예술, 음악, 디자인, 작가 등 창의적인 분야에서 빛납니다. 감성과 창의성을 발휘할 수 있는 환경에서 최고의 성과를 냅니다.',
  2: '연구, 분석, IT, 과학 등 지식 기반 직업에 적합합니다. 깊이 있는 사고와 논리적 접근이 강점인 분야에서 성공합니다.',
  3: '커뮤니케이션, 교육, 영업, 마케팅 등 사람을 상대하는 직업에서 탁월합니다. 타인과의 교류에서 에너지를 얻습니다.',
  4: '건축, 엔지니어링, 법률, 회계 등 체계적이고 정확한 작업이 필요한 분야에 어울립니다.',
  5: '여행, 스포츠, 미디어, 영업 등 다양한 경험과 이동이 많은 직업에서 활력을 찾습니다.',
  6: '교육, 의료, 사회복지, 상담 등 타인을 돕는 직업에서 보람을 느낍니다.',
  7: '심리학, 철학, 영적 지도, 연구 등 깊은 사색과 탐구가 필요한 분야에서 역량을 발휘합니다.',
  8: '비즈니스, 금융, 부동산, 경영 등 성과 지향적인 분야에서 탁월한 능력을 발휘합니다.',
  9: '사회운동, NGO, 예술, 교육 등 사회에 기여할 수 있는 분야에서 의미를 찾습니다.',
};

const wealthByMod: Record<number, string> = {
  0: '강한 의지와 추진력으로 재물을 모으는 능력이 있습니다. 과감한 투자로 큰 성과를 거둘 수 있지만 지나친 모험은 피하세요.',
  1: '창의적인 방법으로 수익을 창출합니다. 예술이나 창작 활동에서 뜻밖의 금전적 행운이 따를 수 있습니다.',
  2: '꼼꼼한 분석으로 안정적인 재물 관리를 합니다. 급격한 투기보다 장기적인 투자가 재물운에 유리합니다.',
  3: '사람과의 관계에서 재물 기회가 찾아옵니다. 인맥을 잘 활용하면 예상치 못한 수입원이 생길 수 있습니다.',
  4: '성실하고 꾸준한 노력으로 안정적인 재물을 쌓습니다. 규칙적인 저축과 절약이 장기적 부를 만들어냅니다.',
  5: '다양한 분야에서 수입을 올릴 기회가 있습니다. 변화를 두려워하지 않는 자세가 재물운을 높여줍니다.',
  6: '가족과 가정에 투자하면 장기적으로 안정된 재물이 따릅니다. 인간관계를 통한 경제적 지원도 기대할 수 있습니다.',
  7: '정신적 만족을 추구하다 보면 물질적 풍요가 자연스럽게 따라오는 경우가 많습니다. 영적 작업이 뜻밖의 수익으로 이어질 수 있습니다.',
  8: '비즈니스 감각이 뛰어나 재물을 모으는 능력이 탁월합니다. 큰 그림을 그리고 체계적으로 실행하면 큰 부를 이룰 수 있습니다.',
  9: '돈보다 가치를 중시하는 성향이 있어 재물에 무관심할 수 있습니다. 경제관념을 키우면 이상 실현에 필요한 재원을 마련할 수 있습니다.',
};

const healthByMod: Record<number, string> = {
  0: '체력이 강하고 활동적이지만, 과로로 인한 번아웃을 주의하세요. 규칙적인 휴식이 건강을 지키는 핵심입니다.',
  1: '신경계와 감정이 건강에 큰 영향을 미칩니다. 스트레스 관리와 정서적 안정이 전반적인 건강의 열쇠입니다.',
  2: '두뇌를 많이 쓰는 만큼 충분한 수면이 중요합니다. 명상이나 자연 속 산책이 정신 건강에 도움이 됩니다.',
  3: '사교적 활동이 건강에 긍정적인 영향을 줍니다. 즐거운 운동이나 팀 스포츠를 통해 몸과 마음을 가꾸세요.',
  4: '꾸준한 운동과 규칙적인 식습관으로 건강을 유지합니다. 관절과 뼈 건강에 신경 쓰고 정기적인 건강검진을 받으세요.',
  5: '다양한 활동으로 건강을 유지하지만 불규칙한 생활이 약점입니다. 일정한 수면과 식사 습관을 만들어가세요.',
  6: '타인을 돌보느라 자신의 건강을 소홀히 하는 경향이 있습니다. 자기 자신을 먼저 챙기는 것이 모두를 위한 일입니다.',
  7: '정신과 영성의 균형이 건강에 중요합니다. 과도한 사색보다 신체 활동과의 균형을 유지하세요.',
  8: '강한 체력과 에너지가 장점이지만 혈압과 심혈관 건강에 주의가 필요합니다. 스트레스 해소법을 개발하세요.',
  9: '이상적인 건강 목표를 세우고 그를 향해 꾸준히 나아갑니다. 과도한 이상화보다 현실적인 건강 습관이 중요합니다.',
};

const adviceByScore: (score: number) => string = (score) => {
  if (score >= 80) return '당신의 이름은 강한 긍정의 기운을 품고 있습니다. 자신감을 가지고 크게 꿈꾸세요. 운이 당신 편입니다.';
  if (score >= 60) return '균형 잡힌 기운의 이름입니다. 꾸준한 노력과 긍정적인 마음가짐이 원하는 것을 이루게 해줄 것입니다.';
  if (score >= 40) return '이름의 기운에 약간의 긴장이 담겨 있습니다. 명상과 자기 성찰로 내면을 강화하고 균형을 찾아가세요.';
  return '도전적인 기운의 이름입니다. 이 어려움을 극복하는 과정에서 더 강한 사람이 됩니다. 긍정적 사고가 운을 바꿔줄 수 있습니다.';
};

export function analyzeNameFortune(name: string): NameFortuneResult {
  // Use algorithmic jamo-based stroke calculation instead of sparse lookup table
  const totalStrokes = name.split('').reduce((sum, char) => {
    return sum + getKoreanStrokes(char);
  }, 0);

  const rawScore = ((totalStrokes * 7 + totalStrokes % 13) % 100);
  const fortuneScore = rawScore < 20 ? rawScore + 35 : rawScore;

  // Use DIFFERENT mod bases per category so same-stroke names get varied results
  const modPersonality = totalStrokes % 10;
  const modLove       = (totalStrokes * 3 + 7) % 10;
  const modCareer     = (totalStrokes * 7 + 3) % 10;
  const modWealth     = (totalStrokes + 13) % 10;
  const modHealth     = (totalStrokes * 5 + 1) % 10;
  const mod5 = totalStrokes % 5;

  // Guarantee exactly 3 distinct lucky numbers using seeded deterministic shuffle
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const sorted = pool.sort((a, b) =>
    ((totalStrokes * 17 + a * 31) % 100) - ((totalStrokes * 17 + b * 31) % 100)
  );
  const luckyNumbers = sorted.slice(0, 3);

  const allColors = [
    ['빨간색', '주황색'],
    ['파란색', '남색'],
    ['초록색', '청록색'],
    ['보라색', '라벤더색'],
    ['노란색', '금색'],
  ];
  const luckyColors = allColors[mod5];

  return {
    name,
    totalStrokes,
    fortuneScore,
    personality: personalityByMod[modPersonality] ?? personalityByMod[0]!,
    loveLife:    loveByMod[modLove]               ?? loveByMod[0]!,
    career:      careerByMod[modCareer]           ?? careerByMod[0]!,
    wealth:      wealthByMod[modWealth]           ?? wealthByMod[0]!,
    health:      healthByMod[modHealth]           ?? healthByMod[0]!,
    luckyNumbers,
    luckyColors,
    advice: adviceByScore(fortuneScore),
  };
}
