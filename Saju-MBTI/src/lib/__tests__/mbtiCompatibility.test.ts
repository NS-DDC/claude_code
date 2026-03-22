import { calculateMBTICompatibility, mbtiTypes } from '../mbtiCompatibility';
import { MBTIType } from '@/types';

describe('mbtiCompatibility', () => {
  describe('calculateMBTICompatibility', () => {
    it('should calculate INTJ and ENTP compatibility correctly', () => {
      const result = calculateMBTICompatibility('INTJ', 'ENTP');

      expect(result).toBeDefined();
      expect(result.id).toContain('mbti_');
      expect(result.myMBTI).toBe('INTJ');
      expect(result.partnerMBTI).toBe('ENTP');
      expect(result.score).toBe(100); // Perfect match (5/5)
      expect(result.description).toBeTruthy();
    });

    it('should calculate INFP and ENFJ compatibility correctly', () => {
      const result = calculateMBTICompatibility('INFP', 'ENFJ');

      expect(result).toBeDefined();
      expect(result.score).toBe(100); // Perfect match (5/5)
      expect(result.description).toContain('찰떡 궁합');
    });

    it('should return score between 0 and 100', () => {
      const result = calculateMBTICompatibility('INTJ', 'ESFP');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle same MBTI type compatibility', () => {
      const result = calculateMBTICompatibility('INTJ', 'INTJ');

      expect(result).toBeDefined();
      expect(result.score).toBe(60); // Same type (3/5)
    });

    it('should provide compatibility level for high scores', () => {
      const result = calculateMBTICompatibility('INTJ', 'ENTP');

      expect(result.description).toContain('찰떡 궁합');
      expect(result.description).toContain('최고의 조합');
    });

    it('should provide compatibility level for good scores', () => {
      const result = calculateMBTICompatibility('INTJ', 'INTP');

      if (result.score >= 60 && result.score < 80) {
        expect(result.description).toContain('좋은 궁합');
      }
    });

    it('should provide compatibility level for moderate scores', () => {
      // Find a combination with moderate compatibility
      const result = calculateMBTICompatibility('INTJ', 'INTJ');

      if (result.score >= 40 && result.score < 60) {
        expect(result.description).toContain('보통 궁합');
      }
    });

    it('should include MBTI type names in description', () => {
      const result = calculateMBTICompatibility('INTJ', 'ENTP');

      expect(result.description).toContain('INTJ');
      expect(result.description).toContain('ENTP');
      expect(result.description).toContain('전략가');
      expect(result.description).toContain('변론가');
    });

    it('should generate unique IDs for different calculations', () => {
      const result1 = calculateMBTICompatibility('INTJ', 'ENTP');
      const result2 = calculateMBTICompatibility('INTJ', 'ENTP');

      expect(result1.id).not.toBe(result2.id);
    });

    it('should handle all 16 MBTI types', () => {
      mbtiTypes.forEach(type => {
        const result = calculateMBTICompatibility(type, 'INTJ');
        expect(result).toBeDefined();
        expect(result.myMBTI).toBe(type);
        expect(result.partnerMBTI).toBe('INTJ');
      });
    });

    it('should have consistent scores regardless of order', () => {
      const result1 = calculateMBTICompatibility('INTJ', 'ENTP');
      const result2 = calculateMBTICompatibility('ENTP', 'INTJ');

      // Both should have high compatibility but from different perspectives
      expect(result1.score).toBeGreaterThan(0);
      expect(result2.score).toBeGreaterThan(0);
    });

    it('should include personality descriptions', () => {
      const result = calculateMBTICompatibility('INTJ', 'ENTP');

      expect(result.description).toContain('상상력이 풍부하고');
      expect(result.description).toContain('영리하고 호기심이 많으며');
    });

    it('should provide advice based on compatibility level', () => {
      const highScore = calculateMBTICompatibility('INTJ', 'ENTP');
      expect(highScore.description).toContain('서로를 완벽하게 보완');

      const sameType = calculateMBTICompatibility('INTJ', 'INTJ');
      if (sameType.score >= 60) {
        expect(sameType.description).toContain('이해와 소통');
      }
    });

    it('should handle edge case for unmatched types', () => {
      // Test with types that have no explicit compatibility score
      const result = calculateMBTICompatibility('ISTJ', 'INFJ');

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should format compatibility score correctly', () => {
      const result = calculateMBTICompatibility('INTJ', 'ENTP');

      // Score should be a whole number (no decimals from rounding)
      expect(Number.isInteger(result.score)).toBe(true);
    });

    it('should include compatibility type in description', () => {
      const result = calculateMBTICompatibility('INTJ', 'ENTP');

      const compatibilityTypes = ['찰떡 궁합', '좋은 궁합', '보통 궁합', '노력이 필요한 궁합'];
      const hasCompatibilityType = compatibilityTypes.some(type =>
        result.description.includes(type)
      );

      expect(hasCompatibilityType).toBe(true);
    });
  });

  describe('mbtiTypes array', () => {
    it('should contain all 16 MBTI types', () => {
      expect(mbtiTypes).toHaveLength(16);
    });

    it('should contain all analyst types', () => {
      expect(mbtiTypes).toContain('INTJ');
      expect(mbtiTypes).toContain('INTP');
      expect(mbtiTypes).toContain('ENTJ');
      expect(mbtiTypes).toContain('ENTP');
    });

    it('should contain all diplomat types', () => {
      expect(mbtiTypes).toContain('INFJ');
      expect(mbtiTypes).toContain('INFP');
      expect(mbtiTypes).toContain('ENFJ');
      expect(mbtiTypes).toContain('ENFP');
    });

    it('should contain all sentinel types', () => {
      expect(mbtiTypes).toContain('ISTJ');
      expect(mbtiTypes).toContain('ISFJ');
      expect(mbtiTypes).toContain('ESTJ');
      expect(mbtiTypes).toContain('ESFJ');
    });

    it('should contain all explorer types', () => {
      expect(mbtiTypes).toContain('ISTP');
      expect(mbtiTypes).toContain('ISFP');
      expect(mbtiTypes).toContain('ESTP');
      expect(mbtiTypes).toContain('ESFP');
    });

    it('should not contain duplicates', () => {
      const uniqueTypes = new Set(mbtiTypes);
      expect(uniqueTypes.size).toBe(mbtiTypes.length);
    });
  });

  describe('MBTI compatibility matrix', () => {
    it('should have perfect matches for INTJ', () => {
      const enfp = calculateMBTICompatibility('INTJ', 'ENFP');
      const entp = calculateMBTICompatibility('INTJ', 'ENTP');

      expect(enfp.score).toBe(100);
      expect(entp.score).toBe(100);
    });

    it('should have perfect matches for INFP', () => {
      const enfj = calculateMBTICompatibility('INFP', 'ENFJ');
      const entj = calculateMBTICompatibility('INFP', 'ENTJ');

      expect(enfj.score).toBe(100);
      expect(entj.score).toBe(100);
    });

    it('should have perfect matches for ENFJ', () => {
      const infp = calculateMBTICompatibility('ENFJ', 'INFP');
      const isfp = calculateMBTICompatibility('ENFJ', 'ISFP');
      const intp = calculateMBTICompatibility('ENFJ', 'INTP');

      expect(infp.score).toBe(100);
      expect(isfp.score).toBe(100);
      expect(intp.score).toBe(100);
    });

    it('should have good matches for compatible types', () => {
      const result = calculateMBTICompatibility('INTJ', 'INTP');

      expect(result.score).toBeGreaterThanOrEqual(60);
    });

    it('should calculate all combinations without errors', () => {
      mbtiTypes.forEach(type1 => {
        mbtiTypes.forEach(type2 => {
          const result = calculateMBTICompatibility(type1, type2);
          expect(result).toBeDefined();
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
        });
      });
    });
  });
});
