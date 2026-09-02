import { defineStore } from 'pinia'
import { isCapacitorNative } from '~/utils/capacitor-env'
import { getDefaultThemePreference, resolveStoredThemePreference } from '~/utils/theme-default'

export type Theme = 'light' | 'dark' | 'system'

const NATIVE_LEGACY_LIGHT_MIGRATION = 'theme-native-legacy-light-v1'

/** Keep in sync with `assets/css/main.css` (`html.theme-transitioning` duration). */
const THEME_TRANSITION_MS = 160
const THEME_TRANSITION_MS_REDUCED = 70

/** Browser `setTimeout` id (avoid Node `Timeout` vs `number` mismatch in TS). */
let themeTransitionTimer: number | null = null
let systemThemeWatcherAttached = false

function syncThemeColorMeta(isDark: boolean) {
  if (!import.meta.client) return
  const el = document.getElementById('theme-color-meta')
  if (el) {
    el.setAttribute('content', isDark ? '#080808' : '#f4f1ea')
  }
}

function migrateLegacyNativeLightDefault(): void {
  if (!import.meta.client || !isCapacitorNative()) return
  if (localStorage.getItem(NATIVE_LEGACY_LIGHT_MIGRATION)) return

  if (localStorage.getItem('theme') === 'light') {
    localStorage.setItem('theme', 'system')
  }

  localStorage.setItem(NATIVE_LEGACY_LIGHT_MIGRATION, '1')
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
        migrateLegacyNativeLightDefault()
        const savedTheme = localStorage.getItem('theme')
        this.theme = resolveStoredThemePreference(savedTheme)
        if (!savedTheme) {
          localStorage.setItem('theme', this.theme)
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
        const currentlyDark = html.classList.contains('dark')
        const currentScheme = html.style.colorScheme || (currentlyDark ? 'dark' : 'light')

        if (currentlyDark === isDark && currentScheme === (isDark ? 'dark' : 'light')) {
          syncThemeColorMeta(isDark)
          return
        }

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
          if (html.classList.contains('capacitor-native')) {
            body.style.backgroundColor = isDark ? '#07080c' : '#f3f4f6'
          } else {
            body.style.backgroundColor = ''
          }
        }

        const endThemeTransition = () => {
          html.classList.remove('theme-transitioning')
          body.classList.remove('theme-transitioning')
          themeTransitionTimer = null
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
      if (!import.meta.client || systemThemeWatcherAttached) return

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if (this.theme === 'system') {
          this.applyTheme()
        }
      }

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
      } else {
        mediaQuery.addListener(handleChange)
      }

      systemThemeWatcherAttached = true
    },
  },
})
