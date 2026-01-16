export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) return
  
  // Use Pinia store directly for more reliable state
  const authStore = useAuthStore()
  
  // Wait for auth to finish loading (with proper timeout)
  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      let resolved = false
      const maxWait = 3000 // 3 seconds max wait
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

  // Only redirect if auth has finished loading and user is authenticated
  if (!authStore.loading && authStore.currentUser) {
    // Check if we're already going to dashboard to prevent loops
    if (to.path.startsWith('/dashboard')) {
      return // Already going to dashboard, don't redirect
    }
    
    return navigateTo('/dashboard')
  }
})
