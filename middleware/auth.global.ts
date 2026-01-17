export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side (Firebase Auth is client-only)
  if (import.meta.server) return

  // TEMPORARY: Block access to signin, signup, and dashboard routes
  const blockedRoutes = ['/signin', '/signup', '/dashboard']
  const isBlockedRoute = blockedRoutes.some(route => to.path.startsWith(route))
  
  if (isBlockedRoute) {
    return navigateTo('/')
  }

  // Define route categories
  const isDashboardRoute = to.path.startsWith('/dashboard')
  const isAuthRoute = ['/signin', '/signup', '/forgot-password'].includes(to.path)
  const isPublicRoute = ['/privacy', '/terms'].includes(to.path)

  // Allow public routes
  if (isPublicRoute) {
    return
  }

  // For dashboard routes, check authentication
  if (isDashboardRoute) {
    const authStore = useAuthStore()

    // Wait for auth to finish loading
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

    // Redirect to signin if not authenticated
    if (!authStore.loading && !authStore.currentUser) {
      return navigateTo('/signin')
    }
  }
})
