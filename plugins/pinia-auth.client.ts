import { useAuthStore } from '~/stores/auth'
import { useThemeStore } from '~/stores/theme'

export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    useThemeStore().initTheme()
  }
})
