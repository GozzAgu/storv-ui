export default defineNuxtRouteMiddleware(async (to, from) => {
  // Get the host from request headers (server) or window location (client)
  const host = process.server
    ? useRequestHeaders(['host']).host
    : (typeof window !== 'undefined' ? window.location.host : '')

  if (!host) return

  // Check if we're on the app subdomain
  const isAppDomain = host.startsWith('app.') || host === 'app.storvv.com'
  
  // Define route categories
  const isDashboardRoute = to.path.startsWith('/dashboard')
  const isAuthRoute = ['/signin', '/signup', '/forgot-password'].includes(to.path)
  const isLandingRoute = to.path === '/' || to.path === '/index'
  const isPublicRoute = ['/privacy', '/terms'].includes(to.path)

  // Allow public routes on both domains
  if (isPublicRoute) {
    return
  }

  // ============================================
  // DOMAIN-BASED ROUTING
  // ============================================
  
  // APP DOMAIN (app.storvv.com) - Dashboard Only
  if (isAppDomain) {
    // On app domain, only allow dashboard routes
    if (!isDashboardRoute) {
      // If trying to access auth pages on app domain, redirect to main domain
      if (isAuthRoute) {
        return navigateTo(`https://storvv.com${to.path}`)
      }
      // Redirect to dashboard if trying to access landing pages
      return navigateTo('/dashboard')
    }
    // Dashboard routes are allowed - continue to auth check below
  } else {
    // MAIN DOMAIN (storvv.com / www.storvv.com) - Landing & Auth Only
    // On main domain, block dashboard routes
    if (isDashboardRoute) {
      // Redirect to home if trying to access dashboard
      return navigateTo('/')
    }
    // Allow landing and auth routes on main domain - return early to skip auth check
    if (isLandingRoute || isAuthRoute) {
      return
    }
    // For any other routes on main domain, redirect to home
    return navigateTo('/')
  }

  // ============================================
  // AUTHENTICATION CHECK (for dashboard routes)
  // ============================================
  // Only check authentication for dashboard routes on app domain
  
  if (isDashboardRoute && isAppDomain) {
    // Only run auth check on client side (Firebase Auth is client-only)
    if (import.meta.server) return

    // Use Pinia store for authentication state
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

    // Redirect to signin if not authenticated
    if (!authStore.loading && !authStore.currentUser) {
      // Redirect to signin on main domain (since we're blocking dashboard on main domain)
      // Or redirect to app domain signin if you want signin on app domain
      return navigateTo('https://storvv.com/signin')
    }
  }

  // ============================================
  // ROOT PATH HANDLING
  // ============================================
  // Handle root path based on domain and auth status
  if (isLandingRoute) {
    if (isAppDomain) {
      // On app domain root, redirect to dashboard if authenticated, otherwise signin
      if (import.meta.client) {
        const authStore = useAuthStore()
        if (!authStore.loading) {
          if (authStore.currentUser) {
            return navigateTo('/dashboard')
          } else {
            return navigateTo('https://storvv.com/signin')
          }
        }
      }
      // If still loading or server-side, redirect to dashboard (will be handled by auth check)
      return navigateTo('/dashboard')
    }
    // Main domain root - allow landing page
    return
  }
})
