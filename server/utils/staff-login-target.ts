import { createError } from 'h3'
import type { Auth } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'

/**
 * The business a staff login was created for, set by the server when it creates the login
 * (staff/create). Custom claims can't be written by clients, so this, not a staff record any owner
 * can write, decides which business may disable, re-enable or verify a login.
 */
export const STAFF_OWNER_CLAIM = 'staffOwner'

/** Logins made before the claim existed were created in the same request as their staff record. */
export const LEGACY_LINK_WINDOW_MS = 10 * 60_000

function toMillis(value: unknown): number | null {
  if (!value) return null
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  const v = value as { toMillis?: () => number; toDate?: () => Date }
  if (typeof v.toMillis === 'function') return v.toMillis()
  if (typeof v.toDate === 'function') return v.toDate().getTime()
  const parsed = Date.parse(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

export async function stampStaffOwner(
  auth: Pick<Auth, 'getUser' | 'setCustomUserClaims'>,
  authUid: string,
  ownerUserId: string
): Promise<void> {
  const user = await auth.getUser(authUid)
  await auth.setCustomUserClaims(authUid, {
    ...(user.customClaims || {}),
    [STAFF_OWNER_CLAIM]: ownerUserId,
  })
}

/**
 * Before a staff route changes a Firebase login: it must be a staff login (no owner account),
 * match the staff record's email, and belong to `ownerUserId`. Returns false when the login no
 * longer exists.
 */
export async function assertStaffLoginTarget(
  db: Firestore,
  auth: Pick<Auth, 'getUser' | 'setCustomUserClaims'>,
  authUid: string,
  staffEmail: string | undefined,
  owner: { ownerUserId: string; staffCreatedAt?: unknown }
): Promise<boolean> {
  const userDoc = await db.collection('users').doc(authUid).get()
  if (userDoc.exists) {
    throw createError({ statusCode: 403, message: 'This login is not a staff account' })
  }

  let user: Awaited<ReturnType<Auth['getUser']>>
  try {
    user = await auth.getUser(authUid)
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'auth/user-not-found') return false
    throw err
  }

  const expected = (staffEmail || '').trim().toLowerCase()
  if (!expected || (user.email || '').trim().toLowerCase() !== expected) {
    throw createError({
      statusCode: 403,
      message: 'This login does not match the staff member’s email',
    })
  }

  const claimed = user.customClaims?.[STAFF_OWNER_CLAIM]
  if (typeof claimed === 'string' && claimed) {
    if (claimed !== owner.ownerUserId) {
      throw createError({ statusCode: 403, message: 'This login belongs to another business' })
    }
    return true
  }

  // Older login: accept it only if it was created alongside this business's staff record, then
  // record the owner so the check is exact from now on.
  const createdMs = Date.parse(user.metadata?.creationTime || '')
  const staffMs = toMillis(owner.staffCreatedAt)
  if (
    !Number.isFinite(createdMs) ||
    staffMs === null ||
    Math.abs(createdMs - staffMs) > LEGACY_LINK_WINDOW_MS
  ) {
    throw createError({ statusCode: 403, message: 'This login was not created for this business' })
  }
  await auth.setCustomUserClaims(authUid, {
    ...(user.customClaims || {}),
    [STAFF_OWNER_CLAIM]: owner.ownerUserId,
  })
  return true
}
