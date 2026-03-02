/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'ds-h1': ['32px', { lineHeight: '1.2' }],
        'ds-h2': ['24px', { lineHeight: '1.3' }],
        'ds-h3': ['20px', { lineHeight: '1.4' }],
        'ds-body': ['16px', { lineHeight: '1.5' }],
        'ds-secondary': ['14px', { lineHeight: '1.5' }],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1d4ed8',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: { DEFAULT: '#16A34A', hover: '#15803d' },
        warning: { DEFAULT: '#F59E0B', hover: '#d97706' },
        error: { DEFAULT: '#DC2626', hover: '#b91c1c' },
        background: '#F9FAFB',
        surface: '#ffffff',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        border: '#E5E7EB',
        'ds-bg': '#F9FAFB',
        'ds-text': '#111827',
        'ds-muted': '#6B7280',
        'ds-border': '#E5E7EB',
      },
      borderRadius: {
        'theme-sm': '8px',
        'theme-md': '12px',
        'theme-lg': '16px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        250: '250ms',
      },
      transitionTimingFunction: {
        smooth: 'ease-in-out',
      },
      keyframes: {
        'card-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'chart-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'modal-overlay-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'modal-pop-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'menu-scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        // 150–250ms para microinteracciones y entradas de contexto
        'card-in': 'card-in 0.22s ease-out forwards',
        'chart-in': 'chart-in 0.24s ease-out 0.1s forwards',
        'modal-overlay-in': 'modal-overlay-in 0.18s ease-out forwards',
        'modal-pop-in': 'modal-pop-in 0.2s ease-out forwards',
        'menu-scale-in': 'menu-scale-in 0.18s ease-out forwards',
      },
    },
  },
  plugins: [],
};
