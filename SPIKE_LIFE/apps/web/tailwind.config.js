/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        'display-sm': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'label': ['0.8125rem', { lineHeight: '1.25', letterSpacing: '0.06em', fontWeight: '700' }],
        'body': ['0.9375rem', { lineHeight: '1.55' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.5' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.08)',
        'card-lg': '0 2px 8px rgba(15,23,42,0.06), 0 16px 40px rgba(15,23,42,0.1)',
        board: '0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      colors: {
        spike: {
          brand: '#8B0000',
          'brand-hover': '#A50000',
          'brand-muted': '#FEF2F2',
        },
      },
    },
  },
  plugins: [],
}
