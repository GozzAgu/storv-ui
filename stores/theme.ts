import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'system' as Theme,
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
          // If no saved theme, default to 'system' but keep it in sync
          this.theme = 'system'
          localStorage.setItem('theme', 'system')
        }
        
        // Apply theme immediately to ensure consistency
        this.applyTheme()
        this.watchSystemTheme()
        this.initialized = true
      }
    },

    // Apply theme to document
    applyTheme() {
      if (import.meta.client) {
        const html = document.documentElement
        const isDark = this.actualTheme === 'dark'
        
        if (isDark) {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
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

