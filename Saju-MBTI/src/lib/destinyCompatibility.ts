import { MBTIType, Element, DestinyCharacter, DestinyCompatibilityResult } from '@/types';
import { getDestinyCharacter } from './destinyCharacter';
import { calculateMBTICompatibility } from './mbtiCompatibility';

/**
 * Element location recommendations based on element pairs
 */
const ELEMENT_LOCATIONS: Record<string, string[]> = {
  '목_목': ['숲', '식물원', '정원', '공원', '도서관'],
  '목_화': ['캠핑장', '바비큐장', '숲속 카페', '야외 공연장'],
  '목_토': ['전통 한옥', '도자기 공방', '전통시장', '한정식'],
  '목_금': ['미술관', '갤러리', '고급 카페', '공방'],
  '목_수': ['계곡', '호수공원', '분수대', '수목원'],

  '화_목': ['야외 카페', '공원 피크닉', '캠핑장', '숲속 바비큐'],
  '화_화': ['클럽', '놀이공원', '페스티벌', '해변파티', '불꽃놀이'],
  '화_토': ['아늑한 카페', '전통찻집', '온돌방', '찜질방'],
  '화_금': ['고급 레스토랑', '전망대 바', '루프탑', '샴페인 바'],
  '화_수': ['해변', '온천', '수영장', '워터파크', '강변'],

  '토_목': ['전통시장', '한옥 카페', '도자기 체험', '농장'],
  '토_화': ['전통 찻집', '한정식', '아늑한 식당', '온돌방'],
  '토_토': ['박물관', '고궁', '전통시장', '집', '도서관'],
  '토_금': ['골동품점', '전통공방', '보석상', '박물관'],
  '토_수': ['온천', '찜질방', '전통 목욕탕', '흙탕'],

  '금_목': ['갤러리', '디자인 스튜디오', '명품 카페', '공방'],
  '금_화': ['고급 바', '루프탑', '전망 좋은 레스토랑', '샴페인 바'],
  '금_토': ['전통공예점', '골동품점', '박물관', '보석 전시'],
  '금_금': ['은행', '보석상', '고급 레스토랑', '전망대', '미술관'],
  '금_수': ['고급 온천', '스파', '요트', '수족관 레스토랑'],

  '수_목': ['강변 공원', '호수', '계곡', '수목원', '분수대'],
  '수_화': ['해변', '온천', '수영장', '강변 바비큐', '워터파크'],
  '수_토': ['온천', '흙탕', '찜질방', '전통 목욕탕'],
  '수_금': ['요트', '수족관', '고급 온천', '강변 레스토랑'],
  '수_수': ['강', '바다', '수족관', '온천', '호수', '분수대']
};

/**
 * Calculate element compatibility score (0-100)
 */
function calculateElementScore(element1: Element, element2: Element): number {
  // 상생 관계 (Generative cycle)
  const sheng: Record<Element, Element> = {
    '목': '화', '화': '토', '토': '금', '금': '수', '수': '목'
  };

  // 상극 관계 (Overcoming cycle)
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

/**
 * Get location recommendations based on element combination
 */
function getLocationRecommendations(element1: Element, element2: Element): string[] {
  const key1 = `${element1}_${element2}`;
  const key2 = `${element2}_${element1}`;

  return ELEMENT_LOCATIONS[key1] || ELEMENT_LOCATIONS[key2] || ['카페', '공원', '식당'];
}

/**
 * Generate best meeting times based on elements
 */
function getBestMeetingTimes(element1: Element, element2: Element): string[] {
  const elementTimes: Record<Element, string[]> = {
    '목': ['아침 (7-9시)', '오전 (9-11시)', '봄철'],
    '화': ['낮 (11-13시)', '오후 (13-15시)', '여름철'],
    '토': ['오후 (15-17시)', '늦은 오후 (17-19시)', '환절기'],
    '금': ['저녁 (19-21시)', '밤 (21-23시)', '가을철'],
    '수': ['새벽 (5-7시)', '밤 (23-1시)', '겨울철']
  };

  const times1 = elementTimes[element1] || [];
  const times2 = elementTimes[element2] || [];

  // Merge and deduplicate
  return [...new Set([...times1, ...times2])].slice(0, 3);
}

/**
 * Determine compatibility type based on scores and MBTI relationship
 */
function determineCompatibilityType(
  totalScore: number,
  mbtiScore: number,
  elementScore: number,
  myMBTI: MBTIType,
  partnerMBTI: MBTIType
): '천생연분' | '애증의 소울메이트' | '정신적 동반자' | '비즈니스 파트너' {
  // 천생연분: Total score >= 90
  if (totalScore >= 90) {
    return '천생연분';
  }

  // 애증의 소울메이트: Opposite MBTI but good element harmony
  // Check if MBTI types are opposite (all 4 letters different)
  const oppositeCount = Array.from(myMBTI).filter((char, idx) => char !== partnerMBTI[idx]).length;
  if (oppositeCount === 4 && elementScore >= 80) {
    return '애증의 소울메이트';
  }

  // 정신적 동반자: 70-89 total score or high MBTI compatibility
  if (totalScore >= 70 || mbtiScore >= 80) {
    return '정신적 동반자';
  }

  // 비즈니스 파트너: Everything else
  return '비즈니스 파트너';
}

/**
 * Generate compatibility description
 */
function generateCompatibilityDescription(
  compatibilityType: string,
  totalScore: number,
  mbtiScore: number,
  elementScore: number,
  myCharacter: DestinyCharacter,
  partnerCharacter: DestinyCharacter
): string {
  const typeDescriptions: Record<string, string> = {
    '천생연분': '두 분은 말 그대로 하늘이 정해준 인연입니다! MBTI와 오행이 완벽한 조화를 이루며, 서로를 완벽하게 보완합니다. 이보다 더 좋은 궁합은 찾기 어렵습니다.',
    '애증의 소울메이트': 'MBTI는 정반대지만 오행이 조화를 이룹니다. 서로 다른 점이 많아 티격태격할 수 있지만, 그만큼 배울 점도 많고 서로를 성장시키는 관계입니다. 차이를 인정하면 최고의 파트너가 될 수 있습니다.',
    '정신적 동반자': '서로를 깊이 이해하고 정신적으로 교감할 수 있는 관계입니다. 대화가 잘 통하고 같은 가치관을 공유할 가능성이 높습니다. 좋은 친구이자 동료, 그 이상의 관계로 발전할 수 있습니다.',
    '비즈니스 파트너': '연인보다는 동료나 파트너로 더 잘 어울릴 수 있습니다. 감정적 교감보다는 실용적이고 목표 지향적인 관계를 추구하면 좋은 성과를 낼 수 있습니다. 서로의 다른 점을 존중하며 협력하세요.'
  };

  const description = typeDescriptions[compatibilityType] || '';

  return `${description}\n\n${myCharacter.name} (${myCharacter.mbti}/${myCharacter.element})와 ${partnerCharacter.name} (${partnerCharacter.mbti}/${partnerCharacter.element})의 궁합입니다.\n\nMBTI 궁합: ${mbtiScore}점\n오행 궁합: ${elementScore}점\n종합 점수: ${totalScore}점`;
}

/**
 * Calculate destiny compatibility
 */
export function calculateDestinyCompatibility(
  myMBTI: MBTIType,
  myElement: Element,
  partnerMBTI: MBTIType,
  partnerElement: Element
): DestinyCompatibilityResult {
  // Get characters
  const myCharacter = getDestinyCharacter(myMBTI, myElement);
  const partnerCharacter = getDestinyCharacter(partnerMBTI, partnerElement);

  // Calculate MBTI compatibility (0-100)
  const mbtiCompatResult = calculateMBTICompatibility(myMBTI, partnerMBTI);
  const mbtiScore = mbtiCompatResult.score;

  // Calculate element compatibility (0-100)
  const elementScore = calculateElementScore(myElement, partnerElement);

  // Calculate total score (50% MBTI + 50% Element)
  const totalScore = Math.round((mbtiScore * 0.5) + (elementScore * 0.5));

  // Determine compatibility type
  const compatibilityType = determineCompatibilityType(
    totalScore,
    mbtiScore,
    elementScore,
    myMBTI,
    partnerMBTI
  );

  // Generate description
  const description = generateCompatibilityDescription(
    compatibilityType,
    totalScore,
    mbtiScore,
    elementScore,
    myCharacter,
    partnerCharacter
  );

  // Get location recommendations
  const locationRecommendations = getLocationRecommendations(myElement, partnerElement);

  // Get best meeting times
  const bestMeetingTimes = getBestMeetingTimes(myElement, partnerElement);

  return {
    id: `destiny_compat_${Date.now()}_${Math.random()}`,
    date: new Date().toISOString(),
    myCharacter,
    partnerCharacter,
    totalScore,
    mbtiScore,
    elementScore,
    compatibilityType,
    description,
    locationRecommendations,
    bestMeetingTimes
  };
}
