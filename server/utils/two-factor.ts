import { createError } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { setTwoFactorEnabledClaims, clearTwoFactorClaims } from '~/server/utils/two-factor-claims'

const SECURITY_DOC_ID = 'twoFactor'

export async function getTwoFactorSecret(uid: string): Promise<string | null> {
  const adminDb = getAdminFirestore()
  const securitySnap = await adminDb
    .collection('users')
    .doc(uid)
    .collection('security')
    .doc(SECURITY_DOC_ID)
    .get()

  if (securitySnap.exists) {
    const secret = securitySnap.data()?.secret
    if (typeof secret === 'string' && secret.length > 0) return secret
  }

  // Legacy field on the user doc (pre-migration).
  const userSnap = await adminDb.collection('users').doc(uid).get()
  const legacy = userSnap.data()?.twoFactorSecret
  return typeof legacy === 'string' && legacy.length > 0 ? legacy : null
}

export async function saveTwoFactorSecret(
  uid: string,
  secret: string,
  method: 'totp' | 'phone',
  /** The sign-in that set 2FA up, which counts as verified. */
  authTime?: number
): Promise<void> {
  const adminDb = getAdminFirestore()
  const batch = adminDb.batch()
  batch.set(adminDb.collection('users').doc(uid).collection('security').doc(SECURITY_DOC_ID), {
    secret,
    method,
    updatedAt: FieldValue.serverTimestamp(),
  })
  batch.set(
    adminDb.collection('users').doc(uid),
    {
      twoFactorEnabled: true,
      twoFactorMethod: method,
      twoFactorEnabledAt: new Date().toISOString(),
      twoFactorSecret: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
  await batch.commit()
  await setTwoFactorEnabledClaims(uid, true, authTime)
}

export async function clearTwoFactor(uid: string): Promise<void> {
  const adminDb = getAdminFirestore()
  const batch = adminDb.batch()
  batch.delete(adminDb.collection('users').doc(uid).collection('security').doc(SECURITY_DOC_ID))
  batch.set(
    adminDb.collection('users').doc(uid),
    {
      twoFactorEnabled: false,
      twoFactorMethod: null,
      twoFactorEnabledAt: null,
      twoFactorSecret: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
  await batch.commit()
  await clearTwoFactorClaims(uid)
}

/** Wrong codes in a row before the account's 2FA is locked for a while. */
export const MAX_TOTP_FAILURES = 5
export const TOTP_LOCK_MS = 15 * 60_000
const TOTP_PERIOD_MS = 30_000

/**
 * Checks a code from the user's authenticator. One step of clock drift either way; a code that
 * was already used (or an older one) is refused; five wrong codes lock 2FA for 15 minutes, shared
 * by every route that asks for a code.
 */
export async function verifyTotpCode(
  uid: string,
  code: string,
  now = Date.now()
): Promise<boolean> {
  const secret = await getTwoFactorSecret(uid)
  if (!secret) {
    throw createError({ statusCode: 400, message: '2FA is not configured for this account' })
  }
  const adminDb = getAdminFirestore()
  const ref = adminDb.collection('users').doc(uid).collection('security').doc(SECURITY_DOC_ID)
  const state = (await ref.get()).data() ?? {}
  const lockedUntil = Number(state.totpLockedUntil) || 0
  if (lockedUntil > now) {
    throw createError({
      statusCode: 429,
      message: 'Too many wrong codes. Try again in a few minutes.',
      data: { code: 'TFA_LOCKED' },
    })
  }

  const { TOTP } = await import('otpauth')
  const totp = new TOTP({ secret, digits: 6, period: 30, algorithm: 'SHA1' })
  const delta = totp.validate({ token: code.trim(), timestamp: now, window: 1 })
  const step = delta === null ? null : Math.floor(now / TOTP_PERIOD_MS) + delta
  const lastUsed = Number(state.totpLastUsedStep) || 0

  if (step !== null && step > lastUsed) {
    await ref.set({ totpLastUsedStep: step, totpFailures: 0, totpLockedUntil: 0 }, { merge: true })
    return true
  }

  await adminDb.runTransaction(async (tx) => {
    const fresh = (await tx.get(ref)).data() ?? {}
    const failures = (Number(fresh.totpFailures) || 0) + 1
    const lock = failures >= MAX_TOTP_FAILURES
    tx.set(
      ref,
      { totpFailures: lock ? 0 : failures, totpLockedUntil: lock ? now + TOTP_LOCK_MS : 0 },
      { merge: true }
    )
  })
  return false
}
