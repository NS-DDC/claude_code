import { MBTIType, Element } from '@/types';

const ELEMENT_COLORS: Record<Element, { primary: string; secondary: string; accent: string }> = {
  '목': { primary: '#10B981', secondary: '#34D399', accent: '#6EE7B7' },
  '화': { primary: '#EF4444', secondary: '#F87171', accent: '#FCA5A5' },
  '토': { primary: '#F59E0B', secondary: '#FBBF24', accent: '#FCD34D' },
  '금': { primary: '#6B7280', secondary: '#9CA3AF', accent: '#D1D5DB' },
  '수': { primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD' }
};

const ELEMENT_SYMBOLS: Record<Element, string> = {
  '목': '木',
  '화': '火',
  '토': '土',
  '금': '金',
  '수': '水'
};

/**
 * Generate SVG talisman when image is not available
 */
export function generateTalismanSVG(
  mbti: MBTIType,
  element: Element,
  emoji: string,
  name: string
): string {
  const colors = ELEMENT_COLORS[element];
  const elementSymbol = ELEMENT_SYMBOLS[element];

  const svg = `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <!-- Background gradient -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:0.9" />
        </linearGradient>

        <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#FFA500;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFD700;stop-opacity:1" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Outer border (gold) -->
      <rect x="10" y="10" width="380" height="580" rx="20" fill="url(#borderGradient)" />

      <!-- Inner background -->
      <rect x="20" y="20" width="360" height="560" rx="15" fill="url(#bgGradient)" />

      <!-- Decorative corner patterns -->
      <circle cx="50" cy="50" r="20" fill="${colors.accent}" opacity="0.3" />
      <circle cx="350" cy="50" r="20" fill="${colors.accent}" opacity="0.3" />
      <circle cx="50" cy="550" r="20" fill="${colors.accent}" opacity="0.3" />
      <circle cx="350" cy="550" r="20" fill="${colors.accent}" opacity="0.3" />

      <!-- Top decorative line -->
      <line x1="60" y1="80" x2="340" y2="80" stroke="#FFD700" stroke-width="2" opacity="0.5" />

      <!-- Element Symbol (top) -->
      <text x="200" y="130" font-family="serif" font-size="60" font-weight="bold" fill="#FFFFFF" text-anchor="middle" filter="url(#glow)">
        ${elementSymbol}
      </text>

      <!-- Character Emoji (center large) -->
      <text x="200" y="280" font-size="120" text-anchor="middle">
        ${emoji}
      </text>

      <!-- Character Name -->
      <text x="200" y="360" font-family="sans-serif" font-size="32" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
        ${name}
      </text>

      <!-- MBTI Type -->
      <rect x="150" y="380" width="100" height="40" rx="20" fill="#FFFFFF" opacity="0.9" />
      <text x="200" y="407" font-family="sans-serif" font-size="24" font-weight="bold" fill="${colors.primary}" text-anchor="middle">
        ${mbti}
      </text>

      <!-- Element Name (Korean) -->
      <rect x="130" y="440" width="140" height="35" rx="17.5" fill="#FFFFFF" opacity="0.8" />
      <text x="200" y="465" font-family="sans-serif" font-size="20" fill="${colors.primary}" text-anchor="middle">
        ${element} (${elementSymbol})
      </text>

      <!-- Bottom decorative line -->
      <line x1="60" y1="520" x2="340" y2="520" stroke="#FFD700" stroke-width="2" opacity="0.5" />

      <!-- Bottom text -->
      <text x="200" y="555" font-family="serif" font-size="16" fill="#FFFFFF" text-anchor="middle" opacity="0.8">
        운명 캐릭터 행운 부적
      </text>
    </svg>
  `;

  return svg.trim();
}

/**
 * Generate talisman as data URL for download or display
 */
export function generateTalismanDataURL(
  mbti: MBTIType,
  element: Element,
  emoji: string,
  name: string
): string {
  const svg = generateTalismanSVG(mbti, element, emoji, name);
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get talisman image path (for actual PNG images)
 */
export function getTalismanImagePath(mbti: MBTIType, element: Element): string {
  return `/images/talismans/${mbti}_${element}.png`;
}

/**
 * Check if talisman image exists (needs to be called client-side)
 */
export async function talismanImageExists(mbti: MBTIType, element: Element): Promise<boolean> {
  const imagePath = getTalismanImagePath(mbti, element);

  try {
    const response = await fetch(imagePath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
