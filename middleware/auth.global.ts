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
        return navigateTo(`https://storvv.com${to.path}`, { external: true })
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
      // CRITICAL: On app domain, we DO NOT check auth in global middleware
      // This prevents redirect loops when auth state is still initializing after cross-domain redirects
      // Page-level auth middleware (auth.ts) will handle authentication checks
      // This is the key to preventing loops - let pages load first, then check auth
      
      // For dashboard routes on app domain, just allow them through
      // The page-level 'auth' middleware will handle authentication
      if (isDashboardRoute && isAppDomain) {
        // Clear any redirect flags when successfully reaching dashboard
        if (import.meta.client) {
          sessionStorage.removeItem('auth_redirect_in_progress')
          sessionStorage.removeItem('auth_redirect_from')
          sessionStorage.removeItem('auth_redirect_count')
          sessionStorage.removeItem('guest_redirect_in_progress')
          
          // Check if we have signed-in user data (from recent sign-in)
          // This helps ensure user data is available even if auth state is still initializing
          const signedInUserId = sessionStorage.getItem('signed_in_user_id')
          if (signedInUserId) {
            // User just signed in - allow through without checking auth
            // The dashboard layout will handle loading user data
            return
          }
        }
        // Let the page load - page-level middleware will handle auth
        return
      }

  // ============================================
  // ROOT PATH HANDLING
  // ============================================
  // Handle root path based on domain and auth status
  if (isLandingRoute) {
    if (isAppDomain) {
      // On app domain root, always redirect to dashboard
      // The dashboard page-level auth middleware will handle authentication
      // This prevents loops by not checking auth state here
      return navigateTo('/dashboard')
    }
    // Main domain root - allow landing page
    return
  }
})
