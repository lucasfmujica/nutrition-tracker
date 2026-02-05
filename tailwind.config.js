/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          blue: 'var(--color-accent-blue)',
        },
        protein: 'var(--color-protein)',
        carbs: 'var(--color-carbs)',
        fat: 'var(--color-fat)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          lighter: 'var(--color-surface-lighter)',
        },
        background: 'var(--color-background)',
      },
      fontFamily: {
        satoshi: ['Satoshi', 'sans-serif'],
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'neon': 'var(--shadow-neon)',
      },
      backgroundImage: {
        'noise': 'var(--noise-texture)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
