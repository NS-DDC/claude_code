/**
 * 오늘의 행운 점수 & 운세 생성
 */

const MESSAGES = {
  excellent: [
    '오늘은 최고의 행운이 찾아옵니다! 지금 바로 로또를 구매하세요!',
    '별들이 당신 편입니다. 대박의 기운이 느껴집니다!',
    '운명의 숫자가 당신을 기다리고 있습니다!',
  ],
  good: [
    '좋은 기운이 감돌고 있어요. 번호 선택에 자신감을 가지세요!',
    '오늘의 직감을 믿어보세요. 좋은 결과가 있을 거예요.',
    '행운의 문이 반쯤 열려 있습니다. 과감하게 도전하세요!',
  ],
  normal: [
    '평범한 하루지만, 꾸준함이 행운을 만듭니다.',
    '차분하게 번호를 고르면 좋은 결과가 있을 거예요.',
    '오늘은 분석적으로 접근해보세요. 통계가 힌트가 됩니다.',
  ],
  low: [
    '오늘은 무리하지 말고 내일을 기다려 보는 것도 방법이에요.',
    '행운은 준비된 자에게 옵니다. 오늘은 연구의 날로!',
    '잠시 쉬어가는 것도 전략입니다. 내일 더 좋은 기운이 올 거예요.',
  ],
};

const LUCKY_ITEMS = [
  '빨간 양말', '파란 펜', '초록 우산', '노란 머플러', '하얀 손수건',
  '은색 반지', '금색 열쇠고리', '보라색 가방', '주황색 모자', '분홍 꽃',
  '네잎클로버', '동전 5개', '별 모양 스티커', '무지개 팔찌', '행운의 돌멩이',
];

/**
 * 오늘의 행운 점수 생성 (1-100)
 * 같은 날 같은 점수가 나오도록 날짜 기반 시드 사용
 */
export function generateFortuneScore(): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const hash = seededRandom(seed);
  return Math.floor(hash * 100) + 1;
}

/**
 * 점수에 따른 운세 메시지
 */
export function getFortuneMessage(score: number): string {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  let messages: string[];
  if (score >= 80) messages = MESSAGES.excellent;
  else if (score >= 60) messages = MESSAGES.good;
  else if (score >= 40) messages = MESSAGES.normal;
  else messages = MESSAGES.low;

  const index = Math.floor(seededRandom(seed + 1) * messages.length);
  return messages[index];
}

/**
 * 점수 등급 라벨
 */
export function getFortuneGrade(score: number): { label: string; emoji: string; color: string } {
  if (score >= 80) return { label: '대박', emoji: '🔥', color: '#FFD700' };
  if (score >= 60) return { label: '좋음', emoji: '✨', color: '#4CAF50' };
  if (score >= 40) return { label: '보통', emoji: '🌤️', color: '#2196F3' };
  return { label: '충전중', emoji: '🌙', color: '#9E9E9E' };
}

/**
 * 오늘의 행운 아이템
 */
export function getLuckyItem(): string {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = Math.floor(seededRandom(seed + 2) * LUCKY_ITEMS.length);
  return LUCKY_ITEMS[index];
}

/**
 * 오늘의 행운 번호 (1-45 중 하나)
 */
export function getLuckyNumber(): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return Math.floor(seededRandom(seed + 3) * 45) + 1;
}

/**
 * 시드 기반 의사 난수 (0-1)
 */
function seededRandom(seed: number): number {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
