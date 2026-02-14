/**
 * 로또 번호 생성 로직
 */

export interface GenerateOptions {
  count?: number;        // 생성할 세트 수 (기본 1)
  include?: number[];    // 반드시 포함할 번호
  exclude?: number[];    // 반드시 제외할 번호
}

/**
 * 로또 번호 1세트(6개) 생성
 */
export function generateNumbers(options: GenerateOptions = {}): number[][] {
  const { count = 1, include = [], exclude = [] } = options;
  const results: number[][] = [];

  for (let i = 0; i < count; i++) {
    const available = Array.from({ length: 45 }, (_, i) => i + 1)
      .filter((n) => !exclude.includes(n));

    if (available.length < 6) {
      throw new Error('제외 번호가 너무 많아 6개를 생성할 수 없습니다.');
    }

    const selected = new Set<number>();

    // 포함 번호 먼저 추가
    include.forEach((n) => {
      if (n >= 1 && n <= 45 && !exclude.includes(n)) {
        selected.add(n);
      }
    });

    // 나머지 랜덤 채우기
    while (selected.size < 6) {
      const pool = available.filter((n) => !selected.has(n));
      const randomIndex = Math.floor(Math.random() * pool.length);
      selected.add(pool[randomIndex]);
    }

    results.push(Array.from(selected).sort((a, b) => a - b));
  }

  return results;
}

/**
 * 로또 공 색상 반환 (공식 색상)
 */
export function getBallColor(num: number): string {
  if (num <= 10) return '#FFC107'; // 노랑
  if (num <= 20) return '#2196F3'; // 파랑
  if (num <= 30) return '#F44336'; // 빨강
  if (num <= 40) return '#9E9E9E'; // 회색
  return '#4CAF50'; // 초록
}

/**
 * 로또 공 색상 이름
 */
export function getBallColorName(num: number): string {
  if (num <= 10) return 'yellow';
  if (num <= 20) return 'blue';
  if (num <= 30) return 'red';
  if (num <= 40) return 'gray';
  return 'green';
}

/**
 * 로또 공 텍스트 색상 (배경 대비)
 */
export function getBallTextColor(num: number): string {
  if (num <= 10) return '#000000';
  if (num <= 20) return '#FFFFFF';
  if (num <= 30) return '#FFFFFF';
  if (num <= 40) return '#FFFFFF';
  return '#FFFFFF';
}

/**
 * 번호 유효성 검증
 */
export function isValidLottoNumber(num: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= 45;
}

/**
 * 당첨 등수 확인 (내 번호 vs 당첨 번호)
 */
export function checkWinning(
  myNumbers: number[],
  winNumbers: number[],
  bonusNumber: number
): { rank: number | null; matchCount: number; hasBonus: boolean } {
  const matchCount = myNumbers.filter((n) => winNumbers.includes(n)).length;
  const hasBonus = myNumbers.includes(bonusNumber);

  let rank: number | null = null;
  if (matchCount === 6) rank = 1;
  else if (matchCount === 5 && hasBonus) rank = 2;
  else if (matchCount === 5) rank = 3;
  else if (matchCount === 4) rank = 4;
  else if (matchCount === 3) rank = 5;

  return { rank, matchCount, hasBonus };
}
