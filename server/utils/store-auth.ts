import { createError, getHeader, readBody, type H3Event } from 'h3'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'
import {
  isTwoFactorVerifiedForSession,
  TFA_ENABLED_CLAIM,
} from '~/server/utils/two-factor-claims'
import { verifyTotpCode } from '~/server/utils/two-factor'

export interface AuthContext {
  uid: string
  email?: string
  emailVerified: boolean
  authTime: number
  twoFactorEnabled: boolean
  twoFactorVerified: boolean
  decoded: DecodedIdToken
}

export type RequireAuthOptions = {
  /** Allow authenticated users who still need to complete 2FA this session */
  allowPendingTwoFactor?: boolean
  /** Require a verified email (billing, staff, sensitive account changes) */
  requireVerifiedEmail?: boolean
}

function getBearerToken(event: H3Event): string {
  const authHeader = getHeader(event, 'authorization') || ''
  const [scheme, token] = authHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw createError({ statusCode: 401, message: 'Missing or invalid Authorization header' })
  }
  return token
}

async function resolveTwoFactorEnabled(
  decoded: DecodedIdToken
): Promise<boolean> {
  if (decoded[TFA_ENABLED_CLAIM] === true) return true
  if (decoded[TFA_ENABLED_CLAIM] === false) return false

  const userSnap = await getAdminFirestore().collection('users').doc(decoded.uid).get()
  return userSnap.data()?.twoFactorEnabled === true
}

export async function requireAuth(
  event: H3Event,
  options: RequireAuthOptions = {}
): Promise<AuthContext> {
  const token = getBearerToken(event)
  const decoded = await getAdminAuth().verifyIdToken(token)
  const twoFactorEnabled = await resolveTwoFactorEnabled(decoded)
  const twoFactorVerified = !twoFactorEnabled || isTwoFactorVerifiedForSession(decoded)
  const emailVerified = decoded.email_verified === true

  if (twoFactorEnabled && !twoFactorVerified && !options.allowPendingTwoFactor) {
    throw createError({
      statusCode: 403,
      message: 'Two-factor authentication required',
      data: { code: 'TFA_REQUIRED' },
    })
  }

  if (options.requireVerifiedEmail && !emailVerified) {
    throw createError({
      statusCode: 403,
      message: 'Email verification required',
      data: { code: 'EMAIL_VERIFICATION_REQUIRED' },
    })
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    emailVerified,
    authTime: decoded.auth_time,
    twoFactorEnabled,
    twoFactorVerified,
    decoded,
  }
}

/** Require a fresh TOTP code when 2FA is enabled (disable 2FA, billing, staff changes). */
export async function requireFreshTotp(auth: AuthContext, code?: string): Promise<void> {
  if (!auth.twoFactorEnabled) return

  const trimmed = code?.trim()
  if (!trimmed || trimmed.length !== 6) {
    throw createError({
      statusCode: 400,
      message: 'A 6-digit authenticator code is required for this action',
      data: { code: 'TFA_CODE_REQUIRED' },
    })
  }

  const valid = await verifyTotpCode(auth.uid, trimmed)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid verification code' })
  }
}

export async function readTotpCodeFromRequest(event: H3Event): Promise<string | undefined> {
  const headerCode = getHeader(event, 'x-storvv-totp')?.trim()
  if (headerCode && /^\d{6}$/.test(headerCode)) return headerCode

  try {
    const body = (await readBody<Record<string, unknown>>(event)) || {}
    const fromBody = body.totpCode ?? body.code
    if (typeof fromBody === 'string' && /^\d{6}$/.test(fromBody.trim())) {
      return fromBody.trim()
    }
  } catch {
    /* no body */
  }

  return undefined
}

export async function requireStoreManageAccess(
  authUid: string,
  ownerUserId: string,
  storeId: string
): Promise<void> {
  const adminDb = getAdminFirestore()

  if (authUid === ownerUserId) return

  const memberSnap = await adminDb
    .collection('users')
    .doc(ownerUserId)
    .collection('stores')
    .doc(storeId)
    .collection('members')
    .doc(authUid)
    .get()

  if (!memberSnap.exists) {
    throw createError({ statusCode: 403, message: 'Store membership not found' })
  }

  const member = memberSnap.data() as { status?: string; role?: string } | undefined
  if (member?.status !== 'active' || member?.role !== 'manager') {
    throw createError({ statusCode: 403, message: 'Insufficient store permissions' })
  }
}

export async function requireStoreReadAccess(
  authUid: string,
  ownerUserId: string,
  storeId: string
): Promise<void> {
  const adminDb = getAdminFirestore()
  if (authUid === ownerUserId) return

  const memberSnap = await adminDb
    .collection('users')
    .doc(ownerUserId)
    .collection('stores')
    .doc(storeId)
    .collection('members')
    .doc(authUid)
    .get()

  if (!memberSnap.exists) {
    throw createError({ statusCode: 403, message: 'Store membership not found' })
  }

  const member = memberSnap.data() as { status?: string } | undefined
  if (member?.status !== 'active') {
    throw createError({ statusCode: 403, message: 'Inactive store membership' })
  }
}

/** Stub / placeholder store APIs: caller must match authenticated uid. */
export function requireSelfUserId(auth: AuthContext, userId: string | undefined): string {
  const trimmed = userId?.trim()
  if (!trimmed) {
    throw createError({ statusCode: 400, message: 'userId is required' })
  }
  if (auth.uid !== trimmed) {
    throw createError({ statusCode: 403, message: 'Cannot act on behalf of another user' })
  }
  return trimmed
}
