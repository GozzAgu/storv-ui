import { SIGNIN_ALLOW_WHILE_AUTHED_KEY } from './guest'
import { getAuthWaitMs, waitForAuthStore } from '~/utils/wait-for-auth'
import { isCapacitorNative } from '~/utils/capacitor-env'
import { isCapacitorMarketingRoot } from '~/utils/capacitor-root-path'
import { isTwoFactorSessionVerified } from '~/utils/two-factor-session'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side (Firebase Auth is client-only)
  if (import.meta.server) return

  // // TEMPORARY: Block access to signin, signup, and dashboard routes
  // const blockedRoutes = ['/signin', '/signup', '/dashboard']
  // const isBlockedRoute = blockedRoutes.some(route => to.path.startsWith(route))

  // if (isBlockedRoute) {
  // return navigateTo('/')
  // }

  // Define route categories
  const isDashboardRoute = to.path.startsWith('/dashboard')
  const isDemoRoute = to.path === '/demo' || to.path.startsWith('/demo/')
  const isAuthRoute = ['/signin', '/signup', '/forgot-password'].includes(to.path)
  const isPublicRoute = ['/privacy', '/terms'].includes(to.path)

  // Allow public routes
  if (isPublicRoute || isDemoRoute) {
    return
  }

  // Native shell: never load marketing `/` - go straight to sign-in (app.html + plugin also redirect).
  if (isCapacitorNative() && isCapacitorMarketingRoot(to.path)) {
    return navigateTo('/signin', { replace: true })
  }

  // For dashboard routes, check authentication
  if (isDashboardRoute) {
    try {
      sessionStorage.removeItem(SIGNIN_ALLOW_WHILE_AUTHED_KEY)
    } catch {
      /* ignore */
    }

    const authStore = useAuthStore()

    await waitForAuthStore(authStore, getAuthWaitMs())

    if (!authStore.loading && !authStore.currentUser) {
      return navigateTo('/signin')
    }

    if (authStore.currentUser) {
      const userStore = useUserStore()
      if (!userStore.userData && !userStore.loading) {
        try {
          await userStore.fetchUserData(authStore.currentUser.uid)
        } catch {
          /* ignore */
        }
      }
      if (
        userStore.userData?.twoFactorEnabled &&
        !isTwoFactorSessionVerified(authStore.currentUser.uid)
      ) {
        return navigateTo('/signin?verify2fa=1')
      }
    }
  }
})
