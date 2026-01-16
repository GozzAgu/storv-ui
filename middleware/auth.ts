/**
 * Page-level auth middleware
 * This is used by individual pages that need authentication
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side (Firebase Auth is client-only)
  if (import.meta.server) return
  
  // Use Pinia store directly for more reliable state
  const authStore = useAuthStore()
  
  // Wait for auth to finish loading
  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      let resolved = false
      const maxWait = 5000 // 5 seconds max wait
      const startTime = Date.now()
      
      const checkAuth = () => {
        if (!authStore.loading) {
          if (!resolved) {
            resolved = true
            resolve()
          }
          return
        }
        if (Date.now() - startTime > maxWait) {
          if (!resolved) {
            resolved = true
            resolve()
          }
          return
        }
        setTimeout(checkAuth, 50)
      }
      checkAuth()
    })
  }
  
  // Only redirect if auth has finished loading and there's no user
  if (!authStore.loading && !authStore.currentUser) {
    return navigateTo('/signin')
  }
})
