import { createError } from 'h3'
import type { Firestore } from 'firebase-admin/firestore'
import type { Auth } from 'firebase-admin/auth'

/**
 * A staff record's `authUid` is written by the owner's client, so it can name any account.
 * Before the server changes a login on the owner's behalf, the account must look like this
 * owner's staff: not a business account (only owners have `users/{uid}`), and its email must
 * match the staff record. Returns false when the login no longer exists.
 */
export async function assertStaffLoginTarget(
  db: Firestore,
  auth: Pick<Auth, 'getUser'>,
  authUid: string,
  staffEmail: string | undefined
): Promise<boolean> {
  const userDoc = await db.collection('users').doc(authUid).get()
  if (userDoc.exists) {
    throw createError({ statusCode: 403, message: 'This login is not a staff account' })
  }

  let email: string
  try {
    email = (await auth.getUser(authUid)).email || ''
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'auth/user-not-found') return false
    throw err
  }

  const expected = (staffEmail || '').trim().toLowerCase()
  if (!expected || email.trim().toLowerCase() !== expected) {
    throw createError({
      statusCode: 403,
      message: 'This login does not match the staff member’s email',
    })
  }
  return true
}
