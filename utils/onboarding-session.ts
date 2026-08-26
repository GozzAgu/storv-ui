const ONBOARDING_COMPLETE_UID_KEY = 'storvv-onboarding-complete-uid'

function canUseSessionStorage(): boolean {
  return typeof sessionStorage !== 'undefined'
}

/** Remember completed onboarding for this browser session to avoid setup flashes on refresh. */
export function markOnboardingCompleteForSession(uid: string) {
  if (!canUseSessionStorage() || !uid) return
  try {
    sessionStorage.setItem(ONBOARDING_COMPLETE_UID_KEY, uid)
  } catch {
    /* ignore */
  }
}

export function isOnboardingCompleteForSession(uid: string): boolean {
  if (!canUseSessionStorage() || !uid) return false
  try {
    return sessionStorage.getItem(ONBOARDING_COMPLETE_UID_KEY) === uid
  } catch {
    return false
  }
}

export function clearOnboardingCompleteForSession(uid?: string) {
  if (!canUseSessionStorage()) return
  try {
    if (!uid || sessionStorage.getItem(ONBOARDING_COMPLETE_UID_KEY) === uid) {
      sessionStorage.removeItem(ONBOARDING_COMPLETE_UID_KEY)
    }
  } catch {
    /* ignore */
  }
}
