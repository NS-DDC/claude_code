/**
 * 시드 기반 난수 생성기
 * 같은 시드 값으로는 항상 같은 난수 시퀀스를 생성
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  /**
   * 0과 1 사이의 난수 생성
   */
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  /**
   * min과 max 사이의 정수 생성
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * 배열에서 랜덤하게 선택
   */
  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * 배열을 섞기
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * 생년월일로부터 시드 값 생성
 */
export function createSeedFromBirthdate(
  year: number,
  month: number,
  day: number,
  hour: number = 12
): number {
  // 오늘 날짜를 포함하여 같은 날에는 같은 결과가 나오도록
  const today = new Date();
  const todaySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // 생년월일과 오늘 날짜를 조합
  return year * 1000000 + month * 10000 + day * 100 + hour + todaySeed;
}

/**
 * 날짜별 시드 생성 (날짜만 고려)
 */
export function createDailySeed(
  year: number,
  month: number,
  day: number
): number {
  const today = new Date();
  const todayValue = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return year + month + day + todayValue;
}
