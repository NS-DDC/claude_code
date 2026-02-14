import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#F0FBF9',
          100: '#E0F2F1',
          200: '#B2DFDB',
          300: '#80CBC4',
          400: '#4DB6AC',
          500: '#26A69A',
          600: '#009688',
        },
        gold: {
          50: '#FFFDE7',
          100: '#FFF9C4',
          200: '#FFF176',
          300: '#FFD700',
          400: '#FFC107',
          500: '#FFB300',
          600: '#FFA000',
        },
        lotto: {
          yellow: '#FFC107',
          blue: '#2196F3',
          red: '#F44336',
          gray: '#9E9E9E',
          green: '#4CAF50',
        },
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(255, 215, 0, 0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
