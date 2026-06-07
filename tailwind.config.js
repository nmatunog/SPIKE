/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    extend: {
      colors: {
        spike: {
          DEFAULT: '#8B0000',
          dark: '#6B0000',
          light: '#A52A2A',
          muted: '#FDF2F2',
          surface: '#FFF5F5',
        },
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-sm': ['1.375rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'display': ['1.75rem', { lineHeight: '2.125rem', fontWeight: '600' }],
        'display-lg': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '600' }],
        'display-xl': ['3rem', { lineHeight: '3.5rem', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        nav: '0 -1px 3px rgba(15, 23, 42, 0.06)',
        projection: '0 8px 32px rgba(15, 23, 42, 0.12)',
      },
      maxWidth: {
        content: '72rem',
        'content-wide': '80rem',
        projection: '96rem',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
    },
  },
  plugins: [],
};
