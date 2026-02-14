import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f4',
          100: '#fde6ea',
          200: '#fbd0d9',
          300: '#f8a9ba',
          400: '#f37896',
          500: '#e94d75',
          600: '#d62d60',
          700: '#b4204f',
          800: '#961e48',
          900: '#801d43',
        },
        warm: {
          50: '#fdf8f0',
          100: '#faecd9',
          200: '#f5d5b0',
          300: '#efb87e',
          400: '#e89349',
          500: '#e3782d',
          600: '#d45f22',
          700: '#b0471e',
          800: '#8d3920',
          900: '#73311d',
        },
        pastel: {
          pink: '#FFD1DC',
          peach: '#FFDAB9',
          lavender: '#E6E6FA',
          mint: '#D4F0DB',
          sky: '#D4E8F7',
          cream: '#FFF8E7',
          rose: '#FFE4E8',
          lilac: '#DCD0FF',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
