/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
          50: '#eef0fc',
          100: '#dde1f9',
          200: '#bbc3f3',
          300: '#99a5ed',
          400: '#7787e7',
          500: '#6276e4',
          600: '#4e5eb6',
          700: '#3b4789',
          800: '#272f5b',
          900: '#14172e',
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

