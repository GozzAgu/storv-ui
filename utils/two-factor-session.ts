const SESSION_KEY_PREFIX = 'storv_2fa_verified_'

export function markTwoFactorSessionVerified(uid: string): void {
  if (import.meta.server || !uid) return
  try {
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${uid}`, String(Date.now()))
  } catch {
    /* ignore */
  }
}

export function isTwoFactorSessionVerified(uid: string): boolean {
  if (import.meta.server || !uid) return false
  try {
    return sessionStorage.getItem(`${SESSION_KEY_PREFIX}${uid}`) != null
  } catch {
    return false
  }
}

export function clearTwoFactorSessionVerified(uid: string): void {
  if (import.meta.server || !uid) return
  try {
    sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${uid}`)
  } catch {
    /* ignore */
  }
}

export function clearAllTwoFactorSessionFlags(): void {
  if (import.meta.server) return
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(SESSION_KEY_PREFIX)) keysToRemove.push(key)
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key))
  } catch {
    /* ignore */
  }
}
