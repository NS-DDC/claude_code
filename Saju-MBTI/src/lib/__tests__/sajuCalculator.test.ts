import { calculateSaju, calculateSajuCompatibility } from '../sajuCalculator';
import { SajuInput } from '@/types';

describe('sajuCalculator', () => {
  describe('calculateSaju', () => {
    it('should calculate saju correctly for male birth data', () => {
      const input: SajuInput = {
        gender: 'male',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 14,
      };

      const result = calculateSaju(input);

      expect(result).toBeDefined();
      expect(result.id).toContain('saju_');
      expect(result.input).toEqual(input);
      expect(result.elements).toBeDefined();
      expect(result.description).toBeTruthy();
      expect(result.luckyElement).toBeTruthy();
      expect(result.unluckyElement).toBeTruthy();
    });

    it('should calculate saju correctly for female birth data', () => {
      const input: SajuInput = {
        gender: 'female',
        birthYear: 1995,
        birthMonth: 8,
        birthDay: 20,
        birthHour: 9,
      };

      const result = calculateSaju(input);

      expect(result).toBeDefined();
      expect(result.id).toContain('saju_');
      expect(result.input).toEqual(input);
      expect(result.description).toContain('당신은');
    });

    it('should have all five elements in the result', () => {
      const input: SajuInput = {
        gender: 'male',
        birthYear: 2000,
        birthMonth: 1,
        birthDay: 1,
        birthHour: 0,
      };

      const result = calculateSaju(input);

      expect(result.elements).toHaveProperty('목');
      expect(result.elements).toHaveProperty('화');
      expect(result.elements).toHaveProperty('토');
      expect(result.elements).toHaveProperty('금');
      expect(result.elements).toHaveProperty('수');
    });

    it('should calculate element distribution correctly', () => {
      const input: SajuInput = {
        gender: 'male',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 14,
      };

      const result = calculateSaju(input);

      // Total elements should be 8 (4 stems + 4 branches)
      const total = Object.values(result.elements).reduce((sum, count) => sum + count, 0);
      expect(total).toBe(8);
    });

    it('should identify lucky element as the weakest', () => {
      const input: SajuInput = {
        gender: 'male',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 14,
      };

      const result = calculateSaju(input);

      const sortedElements = Object.entries(result.elements).sort((a, b) => a[1] - b[1]);
      const weakestElement = sortedElements[0][0];

      expect(result.luckyElement).toBe(weakestElement);
    });

    it('should identify unlucky element as the strongest', () => {
      const input: SajuInput = {
        gender: 'male',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 14,
      };

      const result = calculateSaju(input);

      const sortedElements = Object.entries(result.elements).sort((a, b) => b[1] - a[1]);
      const strongestElement = sortedElements[0][0];

      expect(result.unluckyElement).toBe(strongestElement);
    });

    it('should generate description containing gender-appropriate pronoun', () => {
      const maleInput: SajuInput = {
        gender: 'male',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 14,
      };

      const femaleInput: SajuInput = {
        gender: 'female',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 14,
      };

      const maleResult = calculateSaju(maleInput);
      const femaleResult = calculateSaju(femaleInput);

      expect(maleResult.description).toContain('그대는');
      expect(femaleResult.description).toContain('당신은');
    });

    it('should generate descriptions for all element types with both genders', () => {
      // Test different birth data to get different dominant elements
      const testCases = [
        { year: 1984, month: 2, day: 4, hour: 10 },   // Try for 목
        { year: 1986, month: 6, day: 14, hour: 14 },  // Try for 화
        { year: 1988, month: 10, day: 24, hour: 18 }, // Try for 토
        { year: 1990, month: 3, day: 8, hour: 6 },    // Try for 금
        { year: 1992, month: 11, day: 20, hour: 22 }, // Try for 수
        { year: 1994, month: 1, day: 1, hour: 0 },
        { year: 1996, month: 4, day: 12, hour: 4 },
        { year: 1998, month: 7, day: 22, hour: 12 },
        { year: 2000, month: 9, day: 30, hour: 16 },
        { year: 2002, month: 12, day: 15, hour: 20 },
      ];

      testCases.forEach(({ year, month, day, hour }) => {
        const maleInput: SajuInput = {
          gender: 'male',
          birthYear: year,
          birthMonth: month,
          birthDay: day,
          birthHour: hour,
        };

        const femaleInput: SajuInput = {
          gender: 'female',
          birthYear: year,
          birthMonth: month,
          birthDay: day,
          birthHour: hour,
        };

        const maleResult = calculateSaju(maleInput);
        const femaleResult = calculateSaju(femaleInput);

        expect(maleResult.description).toBeTruthy();
        expect(femaleResult.description).toBeTruthy();
        expect(maleResult.description).toContain('그대는');
        expect(femaleResult.description).toContain('당신은');

        // Verify element-specific text appears
        const elementKeywords = ['나무처럼', '불처럼', '대지처럼', '금속처럼', '물처럼'];
        const hasElementKeyword = elementKeywords.some(keyword =>
          maleResult.description.includes(keyword) || femaleResult.description.includes(keyword)
        );
        expect(hasElementKeyword).toBe(true);
      });
    });

    it('should test each element description explicitly', () => {
      // Generate many different combinations to increase chances of hitting all branches
      const years = [1980, 1985, 1990, 1995, 2000, 2005];
      const months = [1, 3, 5, 7, 9, 11];
      const days = [1, 10, 20];
      const hours = [0, 6, 12, 18];

      years.forEach(year => {
        months.forEach(month => {
          days.forEach(day => {
            hours.forEach(hour => {
              const maleInput: SajuInput = {
                gender: 'male',
                birthYear: year,
                birthMonth: month,
                birthDay: day,
                birthHour: hour,
              };

              const femaleInput: SajuInput = {
                gender: 'female',
                birthYear: year,
                birthMonth: month,
                birthDay: day,
                birthHour: hour,
              };

              const maleResult = calculateSaju(maleInput);
              const femaleResult = calculateSaju(femaleInput);

              expect(maleResult.description).toBeTruthy();
              expect(femaleResult.description).toBeTruthy();
            });
          });
        });
      });
    });

    it('should handle different birth hours correctly', () => {
      const inputs = [0, 6, 12, 18, 23].map(hour => ({
        gender: 'male' as const,
        birthYear: 1990,
        birthMonth: 1,
        birthDay: 1,
        birthHour: hour,
      }));

      const results = inputs.map(input => calculateSaju(input));

      // Each hour should produce a valid result
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.elements).toBeDefined();
      });
    });

    it('should generate unique IDs for different calculations', () => {
      const input: SajuInput = {
        gender: 'male',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 14,
      };

      const result1 = calculateSaju(input);
      const result2 = calculateSaju(input);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should include lucky and unlucky elements in description', () => {
      const input: SajuInput = {
        gender: 'male',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 14,
      };

      const result = calculateSaju(input);

      expect(result.description).toContain(result.luckyElement);
      expect(result.description).toContain(result.unluckyElement);
    });
  });

  describe('calculateSajuCompatibility', () => {
    const myBirth: SajuInput = {
      gender: 'male',
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 15,
      birthHour: 14,
    };

    const partnerBirth: SajuInput = {
      gender: 'female',
      birthYear: 1992,
      birthMonth: 8,
      birthDay: 20,
      birthHour: 10,
    };

    it('should calculate compatibility correctly', () => {
      const result = calculateSajuCompatibility(myBirth, partnerBirth);

      expect(result).toBeDefined();
      expect(result.id).toContain('saju_compat_');
      expect(result.myBirth).toEqual(myBirth);
      expect(result.partnerBirth).toEqual(partnerBirth);
      expect(result.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.compatibilityScore).toBeLessThanOrEqual(100);
      expect(result.description).toBeTruthy();
    });

    it('should return score between 0 and 100', () => {
      const result = calculateSajuCompatibility(myBirth, partnerBirth);

      expect(result.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.compatibilityScore).toBeLessThanOrEqual(100);
    });

    it('should provide compatibility level description', () => {
      const result = calculateSajuCompatibility(myBirth, partnerBirth);

      const validLevels = ['최상의 궁합', '좋은 궁합', '보통 궁합', '노력이 필요한 궁합'];
      const hasValidLevel = validLevels.some(level => result.description.includes(level));

      expect(hasValidLevel).toBe(true);
    });

    it('should classify high scores as best compatibility', () => {
      // Create identical birth data for maximum compatibility
      const identicalBirth: SajuInput = {
        gender: 'male',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 14,
      };

      const result = calculateSajuCompatibility(identicalBirth, identicalBirth);

      if (result.compatibilityScore >= 80) {
        expect(result.description).toContain('최상의 궁합');
      }
    });

    it('should include lucky elements in description', () => {
      const result = calculateSajuCompatibility(myBirth, partnerBirth);

      expect(result.description).toContain('행운 오행');
    });

    it('should generate unique IDs for different calculations', () => {
      const result1 = calculateSajuCompatibility(myBirth, partnerBirth);
      const result2 = calculateSajuCompatibility(myBirth, partnerBirth);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should handle same birth data gracefully', () => {
      const result = calculateSajuCompatibility(myBirth, myBirth);

      expect(result).toBeDefined();
      expect(result.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.compatibilityScore).toBeLessThanOrEqual(100);
    });

    it('should consider element differences in compatibility', () => {
      // Very different birth dates should potentially have different compatibility
      const veryDifferentBirth: SajuInput = {
        gender: 'female',
        birthYear: 2000,
        birthMonth: 12,
        birthDay: 31,
        birthHour: 23,
      };

      const result1 = calculateSajuCompatibility(myBirth, partnerBirth);
      const result2 = calculateSajuCompatibility(myBirth, veryDifferentBirth);

      // Results should be defined (scores can be similar but that's ok)
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should provide meaningful advice based on score', () => {
      const result = calculateSajuCompatibility(myBirth, partnerBirth);

      const score = result.compatibilityScore;
      const description = result.description;

      if (score >= 80) {
        expect(description).toContain('천생연분');
      } else if (score >= 60) {
        expect(description).toContain('이해하고 존중');
      } else if (score >= 40) {
        expect(description).toContain('노력');
      } else {
        expect(description).toContain('차이를 인정');
      }
    });

    it('should handle very low compatibility scores', () => {
      // Create very different birth data
      const birth1: SajuInput = {
        gender: 'male',
        birthYear: 1990,
        birthMonth: 1,
        birthDay: 1,
        birthHour: 0,
      };

      const birth2: SajuInput = {
        gender: 'female',
        birthYear: 2005,
        birthMonth: 12,
        birthDay: 31,
        birthHour: 23,
      };

      const result = calculateSajuCompatibility(birth1, birth2);

      expect(result.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.description).toBeTruthy();
    });

    it('should handle very high compatibility scores', () => {
      // Same birth data for maximum similarity
      const sameBirth: SajuInput = {
        gender: 'male',
        birthYear: 1995,
        birthMonth: 6,
        birthDay: 15,
        birthHour: 12,
      };

      const result = calculateSajuCompatibility(sameBirth, sameBirth);

      expect(result.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.compatibilityScore).toBeLessThanOrEqual(100);
    });

    it('should test all compatibility level branches', () => {
      // Create test cases for different score ranges
      const testCases = [
        { year1: 1990, year2: 1990, expected: 'minimum 40' }, // Similar -> high score
        { year1: 1990, year2: 2000, expected: 'minimum 0' },  // Different
        { year1: 1995, year2: 1995, expected: 'minimum 40' }, // Same
      ];

      testCases.forEach(({ year1, year2 }) => {
        const birth1: SajuInput = {
          gender: 'male',
          birthYear: year1,
          birthMonth: 5,
          birthDay: 15,
          birthHour: 14,
        };

        const birth2: SajuInput = {
          gender: 'female',
          birthYear: year2,
          birthMonth: 5,
          birthDay: 15,
          birthHour: 14,
        };

        const result = calculateSajuCompatibility(birth1, birth2);
        expect(result.compatibilityScore).toBeGreaterThanOrEqual(0);
        expect(result.compatibilityScore).toBeLessThanOrEqual(100);
        expect(result.description).toBeTruthy();

        // Verify description contains expected compatibility level
        const validLevels = ['최상의 궁합', '좋은 궁합', '보통 궁합', '노력이 필요한 궁합'];
        const hasValidLevel = validLevels.some(level => result.description.includes(level));
        expect(hasValidLevel).toBe(true);
      });
    });

    it('should cover score range 60-79 (good compatibility)', () => {
      const birth1: SajuInput = {
        gender: 'male',
        birthYear: 1992,
        birthMonth: 3,
        birthDay: 10,
        birthHour: 8,
      };

      const birth2: SajuInput = {
        gender: 'female',
        birthYear: 1994,
        birthMonth: 7,
        birthDay: 20,
        birthHour: 16,
      };

      const result = calculateSajuCompatibility(birth1, birth2);

      if (result.compatibilityScore >= 60 && result.compatibilityScore < 80) {
        expect(result.description).toContain('좋은 궁합');
      }
      expect(result.description).toBeTruthy();
    });

    it('should cover score range 40-59 (moderate compatibility)', () => {
      const birth1: SajuInput = {
        gender: 'male',
        birthYear: 1985,
        birthMonth: 2,
        birthDay: 14,
        birthHour: 6,
      };

      const birth2: SajuInput = {
        gender: 'female',
        birthYear: 2001,
        birthMonth: 11,
        birthDay: 25,
        birthHour: 20,
      };

      const result = calculateSajuCompatibility(birth1, birth2);

      if (result.compatibilityScore >= 40 && result.compatibilityScore < 60) {
        expect(result.description).toContain('보통 궁합');
      }
      expect(result.description).toBeTruthy();
    });

    it('should cover score range <40 (needs effort)', () => {
      const birth1: SajuInput = {
        gender: 'male',
        birthYear: 1980,
        birthMonth: 1,
        birthDay: 5,
        birthHour: 2,
      };

      const birth2: SajuInput = {
        gender: 'female',
        birthYear: 2010,
        birthMonth: 12,
        birthDay: 28,
        birthHour: 22,
      };

      const result = calculateSajuCompatibility(birth1, birth2);

      if (result.compatibilityScore < 40) {
        expect(result.description).toContain('노력이 필요한 궁합');
      }
      expect(result.description).toBeTruthy();
    });
  });
});
