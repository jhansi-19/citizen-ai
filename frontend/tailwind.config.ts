/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060B1E',
          900: '#0B1437', // Brand Navy
          800: '#111C44',
          700: '#1B2754',
          600: '#2A3B75',
        },
        saffron: {
          DEFAULT: '#F5A524', // Brand Saffron
          50: '#FFF9ED',
          100: '#FFF0D4',
          200: '#FEDEA8',
          300: '#FDC673',
          400: '#FBAC3D',
          500: '#F5A524',
          600: '#D9820D',
          700: '#B06107',
        },
        teal: {
          DEFAULT: '#0A6B5F', // Brand Teal
          50: '#EBF7F5',
          100: '#D2EFEA',
          200: '#A9DFD6',
          500: '#0A6B5F',
          600: '#075249',
          700: '#053C35',
        },
      },
      fontFamily: {
        heading: ['var(--font-sora)', 'sans-serif'],
        sans: ['var(--font-jakarta)', 'sans-serif'],
        sora: ['var(--font-sora)', 'sans-serif'],
        jakarta: ['var(--font-jakarta)', 'sans-serif'],
      },
      animation: {
        'aurora': 'aurora 20s linear infinite',
        'marquee': 'marquee 30s linear infinite',
        'marquee-reverse': 'marquee-reverse 30s linear infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        aurora: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.15)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
