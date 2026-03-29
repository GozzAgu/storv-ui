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
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
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
        /** Elevated panels on dashboard canvas (matches layout dark shell) */
        dashboard: {
          canvas: '#07080c',
          card: '#12141c',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        /** Auth shell: soft entrance, ends at opacity 1 */
        'auth-fade-up': 'authFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'auth-glow-drift': 'authGlowDrift 14s ease-in-out infinite alternate',
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
        // End with transform:none so descendants can use position:fixed relative to the viewport
        // (translateY(0) still creates a fixed containing block and breaks sticky/fixed footers).
        authFadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        authGlowDrift: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(6%, 4%) scale(1.06)' },
        },
      },
      transitionDelay: {
        '75': '75ms',
        '150': '150ms',
      },
      /* Same radius as sidebar panels & nav controls (rounded-sm = 2px) */
      borderRadius: {
        sidenav: '0.125rem',
      },
    },
  },
  plugins: []
}

