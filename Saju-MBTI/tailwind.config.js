/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'soft-mint': '#E0F2F1',
        'royal-gold': '#FFD700',
        'pastel-brown': '#C4A882',
        'mystic-purple': '#9B59B6',
        'deep-navy': '#1a1a4e',
        'star-white': '#E8E8FF',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
