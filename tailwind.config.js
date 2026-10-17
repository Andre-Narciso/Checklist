/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f2f6fc',
          100: '#e2ebf7',
          200: '#c5d6ee',
          300: '#9bb6df',
          400: '#6a90cb',
          500: '#4671b4',
          600: '#345897',
          700: '#2b477a',
          800: '#283d66',
          900: '#1b2947',
          950: '#0f1930',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,25,48,.04), 0 4px 16px rgba(15,25,48,.06)',
      },
    },
  },
  plugins: [],
};