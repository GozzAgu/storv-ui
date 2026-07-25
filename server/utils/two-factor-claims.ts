import type { DecodedIdToken } from 'firebase-admin/auth'
import { getAdminAuth } from '~/server/utils/firebase-admin'

export const TFA_VERIFIED_CLAIM = 'tfaVerifiedAt'
export const TFA_ENABLED_CLAIM = 'twoFactorEnabled'

export function isTwoFactorVerifiedForSession(decoded: DecodedIdToken): boolean {
  const authTime = decoded.auth_time
  const tfaVerifiedAt = decoded[TFA_VERIFIED_CLAIM]
  if (typeof authTime !== 'number' || typeof tfaVerifiedAt !== 'number') return false
  return tfaVerifiedAt >= authTime
}

export async function setTwoFactorVerifiedClaim(uid: string): Promise<void> {
  const auth = getAdminAuth()
  const user = await auth.getUser(uid)
  const existing = { ...(user.customClaims || {}) }
  existing[TFA_VERIFIED_CLAIM] = Math.floor(Date.now() / 1000)
  existing[TFA_ENABLED_CLAIM] = true
  await auth.setCustomUserClaims(uid, existing)
}

export async function setTwoFactorEnabledClaims(uid: string, enabled: boolean): Promise<void> {
  const auth = getAdminAuth()
  const user = await auth.getUser(uid)
  const existing = { ...(user.customClaims || {}) }
  if (enabled) {
    existing[TFA_ENABLED_CLAIM] = true
    existing[TFA_VERIFIED_CLAIM] = Math.floor(Date.now() / 1000)
  } else {
    delete existing[TFA_ENABLED_CLAIM]
    delete existing[TFA_VERIFIED_CLAIM]
  }
  await auth.setCustomUserClaims(uid, existing)
}

export async function clearTwoFactorClaims(uid: string): Promise<void> {
  await setTwoFactorEnabledClaims(uid, false)
}
