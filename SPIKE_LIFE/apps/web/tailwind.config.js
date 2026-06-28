/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        display: ['2rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display-sm': ['1.375rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],
        title: ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
        label: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.08em', fontWeight: '700' }],
        body: ['1rem', { lineHeight: '1.6' }],
        'body-lg': ['1.125rem', { lineHeight: '1.55' }],
        caption: ['0.875rem', { lineHeight: '1.45' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      minHeight: {
        touch: '2.75rem',
      },
      minWidth: {
        touch: '2.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 12px 32px rgba(15,23,42,0.08)',
        'card-lg': '0 4px 16px rgba(15,23,42,0.08), 0 24px 48px rgba(15,23,42,0.12)',
        board: '0 8px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
        'board-glow': '0 0 80px rgba(16,185,129,0.15)',
        focus: '0 0 0 3px rgba(251,191,36,0.55)',
      },
      colors: {
        spike: {
          brand: '#8B0000',
          'brand-hover': '#A50000',
          'brand-muted': '#FEF2F2',
          ink: '#0B1220',
          surface: '#F4F6FA',
          arena: '#E8ECF4',
          muted: '#64748B',
        },
        game: {
          chrome: '#0B1220',
          'chrome-border': '#1E293B',
          panel: '#FFFFFF',
          accent: '#F59E0B',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
