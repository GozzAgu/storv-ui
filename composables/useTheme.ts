// Theme type is exported from stores/theme.ts to avoid duplication
// Re-export for backward compatibility
export type { Theme } from '~/stores/theme'

export const useTheme = () => {
  const theme = useState<Theme>('theme', () => 'light')
  
  const actualTheme = computed<'light' | 'dark'>(() => {
    if (theme.value === 'system') {
      if (import.meta.client) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'light'
    }
    return theme.value
  })

  const applyTheme = () => {
    if (import.meta.client) {
      const html = document.documentElement
      // Determine the actual theme to apply
      let isDark = false
      
      if (theme.value === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      } else {
        isDark = theme.value === 'dark'
      }
      
      if (isDark) {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
    }
  }

  const setTheme = (newTheme: Theme) => {
    if (import.meta.client) {
      theme.value = newTheme
      localStorage.setItem('theme', newTheme)
      // Apply theme immediately
      applyTheme()
    } else {
      theme.value = newTheme
    }
  }

  const initTheme = () => {
    if (import.meta.client) {
      // Get saved theme from localStorage or default to light (first-time users)
      const savedTheme = localStorage.getItem('theme') as Theme | null
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        theme.value = savedTheme
      } else {
        // If no saved theme, default to light until the user changes it
        theme.value = 'light'
        localStorage.setItem('theme', 'light')
      }
      
      // Apply theme immediately to ensure consistency with inline script
      applyTheme()

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if (theme.value === 'system') {
          applyTheme()
        }
      }
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange)
      }
    }
  }

  return {
    theme,
    actualTheme,
    setTheme,
    initTheme,
    applyTheme
  }
}

