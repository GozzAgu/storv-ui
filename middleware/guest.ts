import type { RouteLocationNormalized } from 'vue-router'
import { getAuthWaitMs, waitForAuthStore } from '~/utils/wait-for-auth'

/** Let verified users finish on /signin (and survive refresh) without guest → dashboard bounce. */
export const SIGNIN_ALLOW_WHILE_AUTHED_KEY = 'storv_allow_signin_while_authed'

function isFirebaseEmailActionQuery(q: RouteLocationNormalized['query']): boolean {
  if (q.mode || q.oobCode) return true
  const apiKey = q.apiKey
  if (typeof apiKey === 'string' && apiKey.length > 0) return true
  return false
}

function hashLooksLikeFirebaseAction(hash: string): boolean {
  if (!hash) return false
  const h = hash.startsWith('#') ? hash.slice(1) : hash
  return h.includes('oobCode') || h.includes('mode=')
}

function shouldStayOnSigninWhileAuthed(to: RouteLocationNormalized): boolean {
  if (to.path !== '/signin') return false
  if (isFirebaseEmailActionQuery(to.query)) return true
  if (hashLooksLikeFirebaseAction(to.hash || '')) return true
  if (!import.meta.client) return false
  try {
    return sessionStorage.getItem(SIGNIN_ALLOW_WHILE_AUTHED_KEY) === '1'
  } catch {
    return false
  }
}

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) return
  
  // Use Pinia store directly for more reliable state
  const authStore = useAuthStore()
  
  await waitForAuthStore(authStore, getAuthWaitMs())
  
  // Only redirect if auth has finished loading and user is authenticated
  if (!authStore.loading && authStore.currentUser) {
    // Check if we're already going to dashboard to prevent loops
    if (to.path.startsWith('/dashboard')) {
      return // Already going to dashboard, don't redirect
    }

    if (shouldStayOnSigninWhileAuthed(to)) {
      try {
        sessionStorage.setItem(SIGNIN_ALLOW_WHILE_AUTHED_KEY, '1')
      } catch {
        /* private / blocked storage */
      }
      return
    }

    return navigateTo('/dashboard')
  }
})
