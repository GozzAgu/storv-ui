/**
 * Page-level auth middleware
 * This is used by individual pages that need authentication
 * The global auth.global.ts middleware handles most routing logic
 * This middleware is for pages that explicitly require auth via definePageMeta
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side (Firebase Auth is client-only)
  if (import.meta.server) return
  
  // Prevent redirect loops
  const redirectKey = 'page_auth_redirect_in_progress'
  if (import.meta.client && sessionStorage.getItem(redirectKey) === 'true') {
    // Clear the flag after a delay
    setTimeout(() => sessionStorage.removeItem(redirectKey), 2000)
    return // Don't redirect if we're already redirecting
  }
  
  // Use Pinia store directly for more reliable state
  const authStore = useAuthStore()
  
  // Add grace period after sign-in to allow auth to initialize after cross-domain redirect
  const lastSignInTime = import.meta.client ? sessionStorage.getItem('last_signin_time') : null
  const gracePeriod = 3000 // 3 seconds grace period
  const now = Date.now()
  const isInGracePeriod = lastSignInTime && (now - parseInt(lastSignInTime)) < gracePeriod
  
  // CRITICAL: If auth is still loading OR we're in grace period, ALWAYS allow the page to load
  // Don't wait - this prevents loops when auth state is initializing after cross-domain redirect
  if (authStore.loading || isInGracePeriod) {
    return // Let the page load - auth will resolve during page load
  }
  
  // Only redirect if auth has finished loading and there's no user
  // Add extra safety to prevent loops
  if (!authStore.currentUser) {
    // Check if we've redirected too many times
    const redirectCount = parseInt(sessionStorage.getItem('page_auth_redirect_count') || '0')
    if (redirectCount >= 2) {
      // Too many redirects - break the loop
      sessionStorage.removeItem('page_auth_redirect_count')
      sessionStorage.removeItem(redirectKey)
      return // Allow page to load even without auth
    }
    
    // Set flag to prevent redirect loops
    if (import.meta.client) {
      sessionStorage.setItem(redirectKey, 'true')
      sessionStorage.setItem('page_auth_redirect_count', String(redirectCount + 1))
      setTimeout(() => {
        sessionStorage.removeItem(redirectKey)
        sessionStorage.removeItem('page_auth_redirect_count')
      }, 3000)
    }
    
    // Redirect to signin on main domain
    return navigateTo('https://storvv.com/signin', { external: true })
  }
  
  // Clear redirect flags if user is authenticated
  if (import.meta.client && authStore.currentUser) {
    sessionStorage.removeItem(redirectKey)
    sessionStorage.removeItem('page_auth_redirect_count')
  }
})

