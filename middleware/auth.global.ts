import { SIGNIN_ALLOW_WHILE_AUTHED_KEY } from './guest'
import { getAuthWaitMs, waitForAuthStore, ensureUserProfileLoaded } from '~/utils/wait-for-auth'
import { isOnboardingCompleteForSession } from '~/utils/onboarding-session'
import { isCapacitorNative } from '~/utils/capacitor-env'
import { isCapacitorMarketingRoot } from '~/utils/capacitor-root-path'
import { isTwoFactorSessionVerified } from '~/utils/two-factor-session'
import { isOnboardingExemptDashboardPath } from '~/utils/onboarding-routes'

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
  const isAuthRoute = ['/signin', '/signup', '/forgot-password', '/auth/action'].includes(to.path)
  const isPublicRoute = ['/privacy', '/terms'].includes(to.path)

  // Allow public routes
  if (isPublicRoute || isDemoRoute) {
    return
  }

  // Native shell: never load marketing `/` - go straight to sign-in (app.html + plugin also redirect).
  if (isCapacitorNative() && isCapacitorMarketingRoot(to.path)) {
    return navigateTo('/signin', { replace: true })
  }

  // Legacy Firebase links sometimes land on /signin with action params - route to the handler page.
  if (to.path === '/signin' && (to.query.mode || to.query.oobCode)) {
    return navigateTo({ path: '/auth/action', query: to.query, hash: to.hash || undefined })
  }

  if (to.path === '/signin' && to.hash && (to.hash.includes('oobCode') || to.hash.includes('mode='))) {
    return navigateTo({ path: '/auth/action', hash: to.hash })
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
      const userId = authStore.currentUser.uid
      const waitMs = getAuthWaitMs()

      await ensureUserProfileLoaded(userStore, userId, waitMs)

      const emailVerifyExempt =
        userStore.userData?.role === 'staff' ||
        to.path === '/dashboard/verify-email' ||
        to.path === '/dashboard/change-password'

      if (!authStore.currentUser.emailVerified && !emailVerifyExempt) {
        return navigateTo('/dashboard/verify-email')
      }

      if (
        userStore.userData?.twoFactorEnabled &&
        !isTwoFactorSessionVerified(userId)
      ) {
        return navigateTo('/signin?verify2fa=1')
      }

      const isStaffAccount = userStore.userData?.role === 'staff'
      const sessionOnboardingComplete = isOnboardingCompleteForSession(userId)
      const profileLoaded = !!userStore.userData
      const onboardingIncomplete =
        profileLoaded && userStore.userData?.hasCompletedOnboarding === false

      if (
        onboardingIncomplete &&
        !isStaffAccount &&
        !isOnboardingExemptDashboardPath(to.path)
      ) {
        return navigateTo('/dashboard/onboarding')
      }

      // Already completed setup in this session - skip onboarding while profile reloads.
      if (
        !profileLoaded &&
        sessionOnboardingComplete &&
        to.path === '/dashboard/onboarding'
      ) {
        return navigateTo('/dashboard')
      }
    }
  }
})
