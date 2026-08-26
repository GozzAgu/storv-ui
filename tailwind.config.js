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
        sans: [
          'Quicksand',
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Quicksand',
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
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
        75: '75ms',
        150: '150ms',
      },
      /* Same radius as sidebar panels & nav controls (rounded-sm = 2px) */
      borderRadius: {
        sidenav: '0.125rem',
      },
      /**
       * iOS typography aliases — authoritative styles live in ios-typography.css
       * (scoped to html.capacitor-ios.capacitor-native). These sizes mirror the
       * token scale for IDE hints and optional web preview; use useIosTypography()
       * in Vue for native-first components.
       */
      fontSize: {
        'ios-display': ['2.125rem', { lineHeight: '1.2', letterSpacing: '-0.022em', fontWeight: '700' }],
        'ios-large-title': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.022em', fontWeight: '700' }],
        'ios-title': ['1.375rem', { lineHeight: '1.32', letterSpacing: '-0.022em', fontWeight: '600' }],
        'ios-title2': ['1.25rem', { lineHeight: '1.32', letterSpacing: '-0.012em', fontWeight: '600' }],
        'ios-title3': ['1.0625rem', { lineHeight: '1.32', letterSpacing: '-0.012em', fontWeight: '600' }],
        'ios-headline': ['1.0625rem', { lineHeight: '1.41', letterSpacing: '-0.012em', fontWeight: '600' }],
        'ios-body': ['1.0625rem', { lineHeight: '1.41', letterSpacing: '-0.012em', fontWeight: '400' }],
        'ios-body-emphasized': [
          '1.0625rem',
          { lineHeight: '1.41', letterSpacing: '-0.012em', fontWeight: '600' },
        ],
        'ios-callout': ['1rem', { lineHeight: '1.41', letterSpacing: '-0.006em', fontWeight: '400' }],
        'ios-subheadline': [
          '0.9375rem',
          { lineHeight: '1.41', letterSpacing: '-0.006em', fontWeight: '400' },
        ],
        'ios-footnote': ['0.8125rem', { lineHeight: '1.32', letterSpacing: '-0.006em', fontWeight: '400' }],
        'ios-caption': ['0.75rem', { lineHeight: '1.32', letterSpacing: '-0.006em', fontWeight: '400' }],
        'ios-caption2': ['0.6875rem', { lineHeight: '1.32', letterSpacing: '-0.006em', fontWeight: '400' }],
        'ios-input': ['1rem', { lineHeight: '1.41', fontWeight: '400' }],
      },
    },
  },
  safelist: [
    'text-ios-display',
    'text-ios-large-title',
    'text-ios-title',
    'text-ios-title2',
    'text-ios-title3',
    'text-ios-headline',
    'text-ios-body',
    'text-ios-body-emphasized',
    'text-ios-callout',
    'text-ios-subheadline',
    'text-ios-footnote',
    'text-ios-caption',
    'text-ios-caption2',
    'text-ios-input',
    'ios-type-display',
    'ios-type-large-title',
    'ios-type-title',
    'ios-type-title2',
    'ios-type-title3',
    'ios-type-headline',
    'ios-type-body',
    'ios-type-body-emphasized',
    'ios-type-callout',
    'ios-type-subheadline',
    'ios-type-footnote',
    'ios-type-caption',
    'ios-type-caption2',
    'ios-type-tabular',
    'ios-type-secondary',
    'ios-type-input',
  ],
  plugins: [],
}
