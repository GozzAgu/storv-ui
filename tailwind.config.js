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
          50: '#e9eff8',
          100: '#c7d5f0',
          200: '#9ab5e3',
          300: '#6e94d6',
          400: '#4876c7',
          500: '#143f8d', // Main logo color
          600: '#0f357a',
          700: '#0c2c66',
          800: '#0a2453',
          900: '#081b40',
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

