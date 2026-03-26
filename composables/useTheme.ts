import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useThemeStore } from '~/stores/theme'

export const useTheme = () => {
  const themeStore = useThemeStore()
  const { theme } = storeToRefs(themeStore)

  const actualTheme = computed<'light' | 'dark'>(() => themeStore.actualTheme)

  return {
    theme,
    actualTheme,
    setTheme: themeStore.setTheme,
    initTheme: themeStore.initTheme,
    applyTheme: themeStore.applyTheme,
  }
}