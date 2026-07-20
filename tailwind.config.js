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
          soft: 'var(--color-primary-soft)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          blue: 'var(--color-accent-blue)',
        },
        protein: {
          DEFAULT: 'var(--color-protein)',
          soft: 'var(--color-protein-soft)',
        },
        carbs: {
          DEFAULT: 'var(--color-carbs)',
          soft: 'var(--color-carbs-soft)',
        },
        fat: {
          DEFAULT: 'var(--color-fat)',
          soft: 'var(--color-fat-soft)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          soft: 'var(--color-success-soft)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          soft: 'var(--color-warning-soft)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          soft: 'var(--color-danger-soft)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          soft: 'var(--color-info-soft)',
        },
        oura: {
          DEFAULT: 'var(--color-oura)',
          soft: 'var(--color-oura-soft)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          lighter: 'var(--color-surface-lighter)',
          elevated: 'var(--color-surface-elevated)',
        },
        background: 'var(--color-background)',
        // Fixed scrim for photo/camera overlays — not theme-aware by design
        overlay: 'var(--color-overlay)',
        // Text colors for dark mode support
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        // Border color for dark mode support
        border: 'var(--color-border)',
        // Progress bar track background
        'progress-track': 'var(--color-progress-track)',
        // Muted/disabled elements
        muted: 'var(--color-muted)',
      },
      fontFamily: {
        satoshi: ['Satoshi', 'sans-serif'],
      },
      fontSize: {
        // Type scale — use these over raw text-* sizes for app chrome & metrics
        'display': ['2rem', { lineHeight: '2.25rem', letterSpacing: '-0.03em', fontWeight: '900' }],
        'title': ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em', fontWeight: '900' }],
        'heading': ['1.0625rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em', fontWeight: '700' }],
        'body-md': ['0.9375rem', { lineHeight: '1.375rem' }],
        'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        'overline': ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.08em', fontWeight: '700' }],
      },
      borderRadius: {
        'card': '20px',
        'control': '12px',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'float': 'var(--shadow-float)',
        'glow': 'var(--shadow-glow)',
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
