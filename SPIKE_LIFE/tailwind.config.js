/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        spike: {
          DEFAULT: '#8B0000',
          dark: '#6B0000',
          light: '#A52A2A',
          muted: '#FDF2F2',
          surface: '#FFF5F5',
        },
      },
    },
  },
  plugins: [],
}
