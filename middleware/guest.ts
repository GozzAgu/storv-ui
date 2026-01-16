export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) return
  
  // Prevent redirect loops - check if we're already on an auth page
  // If so, don't redirect at all - let authenticated users stay on signin if they want
  const isAuthPage = ['/signin', '/signup', '/forgot-password'].includes(to.path)
  
  // If we're on an auth page, don't redirect authenticated users
  // This prevents loops - let them manually navigate or use the signin form
  if (isAuthPage) {
    return // Don't redirect from auth pages - prevents loops
  }
  
  // Use Pinia store directly for more reliable state
  const authStore = useAuthStore()
  
  // Wait for auth to finish loading (with proper timeout)
  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      let resolved = false
      const maxWait = 2000 // Reduced to 2 seconds to prevent long waits
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
  // And we're NOT on an auth page (already checked above)
  if (!authStore.loading && authStore.currentUser) {
    // Check if we're already going to dashboard to prevent loops
    if (to.path.startsWith('/dashboard')) {
      return // Already going to dashboard, don't redirect
    }
    
    // Check if we just came from a redirect to prevent loops
    const redirectKey = 'guest_redirect_in_progress'
    if (import.meta.client && sessionStorage.getItem(redirectKey) === 'true') {
      // Clear the flag after a short delay
      setTimeout(() => sessionStorage.removeItem(redirectKey), 1000)
      return // Don't redirect if we're already in a redirect
    }
    
    // Check redirect count to prevent loops
    const redirectCount = parseInt(sessionStorage.getItem('guest_redirect_count') || '0')
    if (redirectCount >= 2) {
      // Too many redirects - break the loop
      sessionStorage.removeItem('guest_redirect_count')
      sessionStorage.removeItem(redirectKey)
      return // Don't redirect, let user stay on signin
    }
    
    // Set flag to prevent redirect loops
    if (import.meta.client) {
      sessionStorage.setItem(redirectKey, 'true')
      sessionStorage.setItem('guest_redirect_count', String(redirectCount + 1))
      setTimeout(() => {
        sessionStorage.removeItem(redirectKey)
        sessionStorage.removeItem('guest_redirect_count')
      }, 3000)
    }
    
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
  
  // Clear redirect flags if user is not authenticated
  if (!authStore.loading && !authStore.currentUser) {
    if (import.meta.client) {
      sessionStorage.removeItem('guest_redirect_in_progress')
      sessionStorage.removeItem('guest_redirect_count')
    }
  }
})

