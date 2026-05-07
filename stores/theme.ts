import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark' | 'system'

/** Keep in sync with `assets/css/main.css` (`html.theme-transitioning` duration). */
const THEME_TRANSITION_MS = 400
const THEME_TRANSITION_MS_REDUCED = 110

/** Browser `setTimeout` id (avoid Node `Timeout` vs `number` mismatch in TS). */
let themeTransitionTimer: number | null = null

function syncThemeColorMeta(isDark: boolean) {
  if (!import.meta.client) return
  const el = document.getElementById('theme-color-meta')
  if (el) {
    el.setAttribute('content', isDark ? '#07080c' : '#fafafa')
  }
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'light' as Theme,
    initialized: false,
  }),

  getters: {
    actualTheme: (state): 'light' | 'dark' => {
      if (state.theme === 'system') {
        if (import.meta.client) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return 'light'
      }
      return state.theme
    },
  },

  actions: {
    // Initialize theme from localStorage
    initTheme() {
      if (import.meta.client && !this.initialized) {
        // Get saved theme from localStorage
        const savedTheme = localStorage.getItem('theme') as Theme | null
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          this.theme = savedTheme
        } else {
          // If no saved theme, default to light until the user changes it
          this.theme = 'light'
          localStorage.setItem('theme', 'light')
        }

        // Apply theme immediately to ensure consistency
        this.applyTheme()
        this.watchSystemTheme()
        this.initialized = true
      }
    },

    // Apply theme to document (smooth transition for theme-related properties)
    applyTheme() {
      if (import.meta.client) {
        const html = document.documentElement
        const body = document.body
        const isDark = this.actualTheme === 'dark'
        // First paint during initTheme: apply class immediately (no transition) to avoid a long flash
        const shouldAnimate = this.initialized
        const reducedMotion =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const transitionMs = reducedMotion ? THEME_TRANSITION_MS_REDUCED : THEME_TRANSITION_MS

        if (themeTransitionTimer) {
          clearTimeout(themeTransitionTimer)
          themeTransitionTimer = null
        }

        const applyThemeClasses = () => {
          if (isDark) {
            html.classList.add('dark')
          } else {
            html.classList.remove('dark')
          }
          // Native scrollbars / form controls follow the palette immediately (pairs with global CSS transition)
          html.style.colorScheme = isDark ? 'dark' : 'light'
          syncThemeColorMeta(isDark)
        }

        const endThemeTransition = () => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              html.classList.remove('theme-transitioning')
              body.classList.remove('theme-transitioning')
              themeTransitionTimer = null
            })
          })
        }

        if (shouldAnimate) {
          html.classList.add('theme-transitioning')
          body.classList.add('theme-transitioning')
        }

        // Intentionally avoid `document.startViewTransition` for theme: a root snapshot cross-fade
        // composites badly with large scroll regions and zebra-striped tables (horizontal banding).
        applyThemeClasses()
        if (shouldAnimate) {
          themeTransitionTimer = window.setTimeout(endThemeTransition, transitionMs)
        }
      }
    },

    // Set theme
    setTheme(newTheme: Theme) {
      this.theme = newTheme
      if (import.meta.client) {
        localStorage.setItem('theme', newTheme)
        this.applyTheme()
      }
    },

    // Watch for system theme changes
    watchSystemTheme() {
      if (import.meta.client && this.theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => {
          if (this.theme === 'system') {
            this.applyTheme()
          }
        }

        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleChange)
        } else {
          // Fallback for older browsers
          mediaQuery.addListener(handleChange)
        }
      }
    },
  },
})
