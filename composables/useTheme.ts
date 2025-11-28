export type Theme = 'light' | 'dark' | 'system'

export const useTheme = () => {
  const theme = useState<Theme>('theme', () => 'system')
  
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
      // Get saved theme from localStorage or default to 'system'
      const savedTheme = localStorage.getItem('theme') as Theme | null
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        theme.value = savedTheme
      }
      
      // Apply theme immediately
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

