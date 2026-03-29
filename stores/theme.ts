import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark' | 'system'

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
        const isDark = this.actualTheme === 'dark'
        // First paint during initTheme: apply class immediately (no transition) to avoid a long flash
        const shouldAnimate = this.initialized
        const reducedMotion =
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        // Must finish after CSS `transition-duration` on `html.theme-transitioning` (see `assets/css/main.css`)
        const transitionMs = reducedMotion ? 80 : 280

        if (shouldAnimate) {
          html.classList.add('theme-transitioning')
          // Ensure transition class is committed before toggling `.dark` so the browser interpolates
          void html.offsetHeight
        }
        if (isDark) {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }
        // Native scrollbars / form controls follow the palette immediately (pairs with global CSS transition)
        html.style.colorScheme = isDark ? 'dark' : 'light'
        if (shouldAnimate) {
          window.setTimeout(() => {
            html.classList.remove('theme-transitioning')
          }, transitionMs)
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

