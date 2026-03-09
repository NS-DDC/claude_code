import { SajuInput, MBTIType } from '@/types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const VALID_MBTI_TYPES: MBTIType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function validateBirthInfo(input: SajuInput): ValidationResult {
  const errors: Record<string, string> = {};
  const currentYear = new Date().getFullYear();

  if (!input.birthYear || input.birthYear < 1900 || input.birthYear > currentYear) {
    errors.birthYear = `1900~${currentYear} 사이의 년도를 입력하세요`;
  }

  if (!input.birthMonth || input.birthMonth < 1 || input.birthMonth > 12) {
    errors.birthMonth = '1~12 사이의 월을 입력하세요';
  }

  const maxDay = input.birthMonth >= 1 && input.birthMonth <= 12
    ? DAYS_IN_MONTH[input.birthMonth - 1]
    : 31;

  if (!input.birthDay || input.birthDay < 1 || input.birthDay > maxDay) {
    errors.birthDay = `1~${maxDay} 사이의 일을 입력하세요`;
  }

  if (input.birthHour === undefined || input.birthHour < 0 || input.birthHour > 23) {
    errors.birthHour = '0~23 사이의 시를 입력하세요';
  }

  if (!input.gender || (input.gender !== 'male' && input.gender !== 'female')) {
    errors.gender = '성별을 선택하세요';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function isValidMBTI(mbti: string): mbti is MBTIType {
  return VALID_MBTI_TYPES.includes(mbti as MBTIType);
}
