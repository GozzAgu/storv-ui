export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) return
  
  // Use Pinia store directly for more reliable state
  const authStore = useAuthStore()
  
  // Wait for auth to finish loading (with proper timeout)
  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      let resolved = false
      const maxWait = 5000 // 5 seconds max wait
      const startTime = Date.now()
      
      const checkAuth = () => {
        // If loading is complete, resolve
        if (!authStore.loading) {
          if (!resolved) {
            resolved = true
            resolve()
          }
          return
        }
        
        // If we've exceeded max wait time, resolve anyway
        if (Date.now() - startTime > maxWait) {
          if (!resolved) {
            resolved = true
            resolve()
          }
          return
        }
        
        // Check again after a short delay
        setTimeout(checkAuth, 50)
      }
      
      // Start checking
      checkAuth()
    })
  }
  
  // Only redirect if auth has finished loading and user is authenticated
  if (!authStore.loading && authStore.currentUser) {
    // Redirect to dashboard on app domain
    const host = typeof window !== 'undefined' ? window.location.host : ''
    const isAppDomain = host && (host.startsWith('app.') || host === 'app.storvv.com')
    
    if (isAppDomain) {
      return navigateTo('/dashboard')
    } else {
      // If on main domain, redirect to app domain dashboard
      return navigateTo('https://app.storvv.com/dashboard', { external: true })
    }
  }
})

