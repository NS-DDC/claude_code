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
        'pastel-brown': '#A1887F',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
