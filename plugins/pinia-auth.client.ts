import { useAuthStore } from '~/stores/auth'
import { useThemeStore } from '~/stores/theme'

export default defineNuxtPlugin(() => {
 // Initialize theme store - sync with localStorage immediately
 if (import.meta.client) {
 const themeStore = useThemeStore()
 
 // Ensure theme is loaded from localStorage before applying
 const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
 if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
 themeStore.theme = savedTheme
 } else {
 // If no saved theme, default to light until the user changes it
 themeStore.theme = 'light'
 localStorage.setItem('theme', 'light')
 }
 
 // Initialize theme (applies to document and sets up watchers)
 themeStore.initTheme()
 }

 // Note: Auth store is initialized by firebase-auth.client.ts plugin
 // to maintain backward compatibility with useState-based composables
})

