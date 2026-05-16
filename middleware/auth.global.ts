import { SIGNIN_ALLOW_WHILE_AUTHED_KEY } from './guest'
import { waitForAuthStore } from '~/utils/wait-for-auth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side (Firebase Auth is client-only)
  if (import.meta.server) return

  // // TEMPORARY: Block access to signin, signup, and dashboard routes
  // const blockedRoutes = ['/signin', '/signup', '/dashboard']
  // const isBlockedRoute = blockedRoutes.some(route => to.path.startsWith(route))
  
  // if (isBlockedRoute) {
  //   return navigateTo('/')
  // }

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
    try {
      sessionStorage.removeItem(SIGNIN_ALLOW_WHILE_AUTHED_KEY)
    } catch {
      /* ignore */
    }

    const authStore = useAuthStore()

    await waitForAuthStore(authStore, 5000)

    // Redirect to signin if not authenticated
    if (!authStore.loading && !authStore.currentUser) {
      return navigateTo('/signin')
    }
  }
})
