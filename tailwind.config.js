/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './plugins/**/*.{js,ts}',
    './error.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Comic Neue', 'Comic Sans MS', 'cursive'],
        display: ['Fredoka One', 'Comic Sans MS', 'cursive'],
      },
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b8fc',
          400: '#818df8',
          500: '#667eea',
          600: '#5a5fcf',
          700: '#4e4fa5',
          800: '#464982',
          900: '#3d4169',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      transitionDelay: {
        '75': '75ms',
        '150': '150ms',
      },
    },
  },
  plugins: []
}

