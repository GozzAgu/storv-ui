function canUseSessionStorage(): boolean {
  return typeof sessionStorage !== 'undefined'
}

function canUseLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

/** Set while routing to /signin after logout so guest middleware does not bounce back to dashboard. */
export const SIGN_OUT_PENDING_KEY = 'storv_sign_out_pending'

export function markSignOutPending(): void {
  if (!canUseSessionStorage()) return
  try {
    sessionStorage.setItem(SIGN_OUT_PENDING_KEY, '1')
  } catch {
    /* private mode */
  }
}

export function clearSignOutPending(): void {
  if (!canUseSessionStorage()) return
  try {
    sessionStorage.removeItem(SIGN_OUT_PENDING_KEY)
  } catch {
    /* ignore */
  }
}

export function isSignOutPending(): boolean {
  if (!canUseSessionStorage()) return false
  try {
    return sessionStorage.getItem(SIGN_OUT_PENDING_KEY) === '1'
  } catch {
    return false
  }
}

export function clearCachedUserProfile(): void {
  if (!canUseLocalStorage()) return
  localStorage.removeItem('cached_user_name')
  localStorage.removeItem('cached_user_email')
  localStorage.removeItem('cached_user_id')
}
