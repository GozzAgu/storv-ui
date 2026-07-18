import { getAuthWaitMs, waitForAuthStore } from '~/utils/wait-for-auth'

/**
 * Page-level auth middleware
 * This is used by individual pages that need authentication
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side (Firebase Auth is client-only)
  if (import.meta.server) return

  const { isDemoRoutePath } = await import('~/utils/demo-mode')
  if (isDemoRoutePath(to.path)) {
    const { initDemoAuth } = await import('~/utils/demo-bridge')
    initDemoAuth()
    return
  }

  // Use Pinia store directly for more reliable state
  const authStore = useAuthStore()

  await waitForAuthStore(authStore, getAuthWaitMs())

  // Only redirect if auth has finished loading and there's no user
  if (!authStore.loading && !authStore.currentUser) {
    return navigateTo('/signin')
  }
})
