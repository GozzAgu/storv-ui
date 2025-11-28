export default defineNuxtPlugin(() => {
  const { initTheme } = useTheme()
  
  // Initialize theme on app load
  if (import.meta.client) {
    initTheme()
  }
})

