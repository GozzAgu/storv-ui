import type { useAuthStore } from '~/stores/auth'
import { isCapacitorNative } from '~/utils/capacitor-env'

type AuthStore = ReturnType<typeof useAuthStore>

const DEFAULT_MAX_MS = 5000
/** Shorter cap on native so route + layout guards do not stack long blank waits. */
const NATIVE_MAX_MS = 800

/** Use for middleware and layout auth guards. */
export function getAuthWaitMs(): number {
  return isCapacitorNative() ? NATIVE_MAX_MS : DEFAULT_MAX_MS
}

/**
 * Wait for Pinia auth to finish initial restore. Always resolves within `maxMs`
 * so Capacitor never stays on a blank screen if `onAuthStateChanged` hangs.
 */
export function waitForAuthStore(store: AuthStore, maxMs = DEFAULT_MAX_MS): Promise<void> {
  if (import.meta.server || !store.loading) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const start = Date.now()

    const finish = (reason: 'ready' | 'timeout') => {
      if (reason === 'timeout' && store.loading) {
        console.warn('[Auth] Initialization timeout — unblocking UI (Capacitor-safe fallback)')
        store.loading = false
      }
      resolve()
    }

    const tick = () => {
      if (!store.loading) {
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
