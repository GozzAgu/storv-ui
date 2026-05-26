export const DEMO_USER_UID = 'storvv-demo-user'
export const DEMO_STORE_LAGOS = 'demo_store_lagos'
export const DEMO_STORE_ABUJA = 'demo_store_abuja'
export const DEMO_STORE_PH = 'demo_store_ph'

/** @deprecated Use active store from demo state */
export const DEMO_STORE_ID = DEMO_STORE_LAGOS

export const DEMO_SESSION_KEY = 'storvv-demo-session'
export const DEMO_STORAGE_KEY = 'storvv-demo-v2'
export const DEMO_SAVED_SEARCHES_KEY = 'storvv-demo-saved-searches'

/** True when the current route is under `/demo` (including `/demo/dashboard`). */
export function isDemoRoutePath(path: string): boolean {
  return path === '/demo' || path.startsWith('/demo/')
}

/** Active demo session (set while browsing demo dashboard). */
export function isDemoModeActive(): boolean {
  if (import.meta.server) return false
  try {
    if (sessionStorage.getItem(DEMO_SESSION_KEY) === '1') return true
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && isDemoRoutePath(window.location.pathname)) {
    return true
  }
  return false
}

export function markDemoSessionActive() {
  if (!import.meta.client) return
  try {
    sessionStorage.setItem(DEMO_SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function clearDemoSession() {
  if (!import.meta.client) return
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY)
    localStorage.removeItem('currentStoreId')
  } catch {
    /* ignore */
  }
}

export function toDemoDashboardPath(path: string): string {
  if (!path.startsWith('/dashboard')) return path
  return path.replace(/^\/dashboard/, '/demo/dashboard')
}
