/**
 * 카카오톡 공유하기 SDK 연동
 *
 * 사용 전 준비사항:
 * 1. https://developers.kakao.com 에서 앱 등록
 * 2. JavaScript 키 발급
 * 3. 플랫폼 > 웹 > 사이트 도메인 등록
 */

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: KakaoShareOptions) => void;
      };
    };
  }
}

interface KakaoShareOptions {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons?: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
}

// 카카오 JavaScript 키 (발급 후 교체 필요)
const KAKAO_JS_KEY = 'YOUR_KAKAO_JAVASCRIPT_KEY';
const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://luckyplanet.app';

/**
 * 카카오 SDK 초기화
 * layout.tsx의 <Script>로 SDK를 로드한 후 호출
 */
export function initKakao(): void {
  if (typeof window === 'undefined') return;
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_JS_KEY);
  }
}

/**
 * 카카오톡으로 로또 번호 공유
 */
export function shareLottoNumbers(numbers: number[]): void {
  if (typeof window === 'undefined' || !window.Kakao) {
    alert('카카오톡 SDK가 로드되지 않았습니다.\n카카오 개발자 콘솔에서 JavaScript 키를 설정해주세요.');
    return;
  }

  const numbersStr = numbers.join(', ');

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: '🍀 로또 번호 추출기',
      description: `오늘의 행운 번호: ${numbersStr}\n나도 번호 뽑아보기!`,
      imageUrl: `${APP_URL}/og-image.png`,
      link: {
        mobileWebUrl: APP_URL,
        webUrl: APP_URL,
      },
    },
    buttons: [
      {
        title: '나도 뽑아보기',
        link: {
          mobileWebUrl: APP_URL,
          webUrl: APP_URL,
        },
      },
    ],
  });
}

/**
 * 카카오톡 SDK 스크립트 URL
 */
export const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.1/kakao.min.js';
