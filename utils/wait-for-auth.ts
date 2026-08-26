import type { useAuthStore } from '~/stores/auth'
import type { useUserStore } from '~/stores/user'
import { isCapacitorNative } from '~/utils/capacitor-env'

type AuthStore = ReturnType<typeof useAuthStore>
type UserStore = ReturnType<typeof useUserStore>

const DEFAULT_MAX_MS = 5000
/** Shorter cap on native so route + layout guards do not stack long blank waits. */
const NATIVE_MAX_MS = 800

/** Use for middleware and layout auth guards. */
export function getAuthWaitMs(): number {
  return isCapacitorNative() ? NATIVE_MAX_MS : DEFAULT_MAX_MS
}

function waitForStoreLoading(
  isLoading: () => boolean,
  maxMs: number,
  onTimeout?: () => void
): Promise<void> {
  if (import.meta.server || !isLoading()) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const start = Date.now()

    const finish = (reason: 'ready' | 'timeout') => {
      if (reason === 'timeout' && isLoading()) {
        onTimeout?.()
      }
      resolve()
    }

    const tick = () => {
      if (!isLoading()) {
        finish('ready')
        return
      }
      if (Date.now() - start >= maxMs) {
        finish('timeout')
        return
      }
      setTimeout(tick, 50)
    }

    tick()
  })
}

/**
 * Wait for Pinia auth to finish initial restore. Always resolves within `maxMs`
 * so Capacitor never stays on a blank screen if `onAuthStateChanged` hangs.
 */
export function waitForAuthStore(store: AuthStore, maxMs = DEFAULT_MAX_MS): Promise<void> {
  return waitForStoreLoading(
    () => store.loading,
    maxMs,
    () => {
      console.warn('[Auth] Initialization timeout - unblocking UI (Capacitor-safe fallback)')
      store.loading = false
    }
  )
}

/** Wait for Firestore profile fetch to settle (or time out). */
export function waitForUserStore(store: UserStore, maxMs = DEFAULT_MAX_MS): Promise<void> {
  return waitForStoreLoading(
    () => store.loading,
    maxMs,
    () => {
      console.warn('[Auth] User profile load timeout - continuing without redirect guess')
      store.loading = false
    }
  )
}

/** Ensure user profile is loaded (or fetch attempted) before onboarding redirects. */
export async function ensureUserProfileLoaded(
  userStore: UserStore,
  userId: string,
  maxMs = DEFAULT_MAX_MS
): Promise<void> {
  if (userStore.userData?.uid === userId) return

  if (!userStore.loading) {
    try {
      await userStore.fetchUserData(userId)
    } catch {
      /* ignore */
    }
  }

  await waitForUserStore(userStore, maxMs)

  if (!userStore.userData && !userStore.loading) {
    try {
      await userStore.fetchUserData(userId)
    } catch {
      /* ignore */
    }
  }
}
