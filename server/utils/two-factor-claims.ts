import type { DecodedIdToken } from 'firebase-admin/auth'
import { getAdminAuth } from '~/server/utils/firebase-admin'

export const TFA_VERIFIED_CLAIM = 'tfaVerifiedAt'
export const TFA_ENABLED_CLAIM = 'twoFactorEnabled'

/**
 * Sign-ins (their `auth_time`) that passed 2FA. Verification belongs to one sign-in: a session
 * stuck at the code prompt must not become verified because the owner passed 2FA on another
 * device. firestore.rules check the same claim.
 */
export const TFA_SESSIONS_CLAIM = 'tfaSessions'
const MAX_VERIFIED_SESSIONS = 5

export function isTwoFactorVerifiedForSession(decoded: DecodedIdToken): boolean {
  const authTime = decoded.auth_time
  const sessions = decoded[TFA_SESSIONS_CLAIM]
  return typeof authTime === 'number' && Array.isArray(sessions) && sessions.includes(authTime)
}

/** Marks this sign-in (its `auth_time`) as having passed 2FA. */
export async function setTwoFactorVerifiedClaim(uid: string, authTime: number): Promise<void> {
  const auth = getAdminAuth()
  const user = await auth.getUser(uid)
  const existing = { ...(user.customClaims || {}) }
  const previous = Array.isArray(existing[TFA_SESSIONS_CLAIM])
    ? (existing[TFA_SESSIONS_CLAIM] as unknown[]).filter((t): t is number => typeof t === 'number')
    : []
  existing[TFA_SESSIONS_CLAIM] = [...new Set([...previous, authTime])].slice(-MAX_VERIFIED_SESSIONS)
  existing[TFA_ENABLED_CLAIM] = true
  delete existing[TFA_VERIFIED_CLAIM]
  await auth.setCustomUserClaims(uid, existing)
}

/** Turning 2FA on verifies the sign-in that set it up; turning it off clears every session. */
export async function setTwoFactorEnabledClaims(
  uid: string,
  enabled: boolean,
  authTime?: number
): Promise<void> {
  const auth = getAdminAuth()
  const user = await auth.getUser(uid)
  const existing = { ...(user.customClaims || {}) }
  delete existing[TFA_VERIFIED_CLAIM]
  if (enabled) {
    existing[TFA_ENABLED_CLAIM] = true
    existing[TFA_SESSIONS_CLAIM] = typeof authTime === 'number' ? [authTime] : []
  } else {
    delete existing[TFA_ENABLED_CLAIM]
    delete existing[TFA_SESSIONS_CLAIM]
  }
  await auth.setCustomUserClaims(uid, existing)
}

export async function clearTwoFactorClaims(uid: string): Promise<void> {
  await setTwoFactorEnabledClaims(uid, false)
}
