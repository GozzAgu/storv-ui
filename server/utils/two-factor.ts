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
  method: 'totp' | 'phone'
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
  await setTwoFactorEnabledClaims(uid, true)
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

export async function verifyTotpCode(uid: string, code: string): Promise<boolean> {
  const secret = await getTwoFactorSecret(uid)
  if (!secret) {
    throw createError({ statusCode: 400, message: '2FA is not configured for this account' })
  }

  const { TOTP } = await import('otpauth')
  const totp = new TOTP({
    secret,
    digits: 6,
    period: 30,
    algorithm: 'SHA1',
  })

  return totp.validate({ token: code.trim(), window: 2 }) !== null
}
