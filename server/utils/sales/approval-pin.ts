import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { createError } from 'h3'
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore'

/**
 * Manager approval PINs for discounts above the staff limit. Stored hashed (scrypt) at
 * users/{owner}/approvalPins/{approverUid}; firestore.rules give clients no access at all.
 */

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>

const KEY_LENGTH = 32
export const MAX_PIN_ATTEMPTS = 5
export const PIN_LOCK_MS = 15 * 60_000
const PIN_PATTERN = /^\d{4,6}$/

/** PINs anyone would guess first. */
const WEAK_PINS = new Set(['0000', '1111', '1234', '4321', '000000', '111111', '123456', '654321'])

export function validateNewPin(pin: unknown): string {
  if (typeof pin !== 'string' || !PIN_PATTERN.test(pin)) {
    throw createError({ statusCode: 400, message: 'The PIN must be 4 to 6 digits' })
  }
  if (WEAK_PINS.has(pin) || /^(\d)\1+$/.test(pin)) {
    throw createError({ statusCode: 400, message: 'Choose a PIN that is harder to guess' })
  }
  return pin
}

export async function hashPin(pin: string, salt = randomBytes(16)) {
  const hash = await scrypt(pin, salt, KEY_LENGTH)
  return { hash: hash.toString('base64'), salt: salt.toString('base64') }
}

export async function pinMatches(pin: string, stored: { hash: string; salt: string }) {
  const expected = Buffer.from(stored.hash, 'base64')
  const actual = await scrypt(pin, Buffer.from(stored.salt, 'base64'), KEY_LENGTH)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function pinRef(db: Firestore, ownerId: string, approverUid: string) {
  return db.collection('users').doc(ownerId).collection('approvalPins').doc(approverUid)
}

export async function setApprovalPin(
  db: Firestore,
  ownerId: string,
  approverUid: string,
  pin: string
): Promise<void> {
  const { hash, salt } = await hashPin(validateNewPin(pin))
  await pinRef(db, ownerId, approverUid).set({
    algo: 'scrypt',
    hash,
    salt,
    failedAttempts: 0,
    lockedUntil: null,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function hasApprovalPin(db: Firestore, ownerId: string, approverUid: string) {
  return (await pinRef(db, ownerId, approverUid).get()).exists
}

/**
 * Checks an approver's PIN. Wrong PINs count towards a lockout, so a cashier can't guess a
 * manager's PIN at the till. Throws on a wrong, missing or locked PIN.
 */
export async function verifyApprovalPin(
  db: Firestore,
  ownerId: string,
  approverUid: string,
  pin: unknown,
  now = Date.now()
): Promise<void> {
  if (typeof pin !== 'string' || !PIN_PATTERN.test(pin)) {
    throw createError({ statusCode: 400, message: 'Enter the manager’s 4 to 6 digit PIN' })
  }
  const ref = pinRef(db, ownerId, approverUid)
  const snap = await ref.get()
  const data = snap.data() as
    | { hash?: string; salt?: string; failedAttempts?: number; lockedUntil?: Timestamp | null }
    | undefined
  if (!data?.hash || !data.salt) {
    throw createError({
      statusCode: 403,
      message: 'That manager has not set an approval PIN yet',
      data: { code: 'NO_APPROVAL_PIN' },
    })
  }
  const lockedUntil = data.lockedUntil?.toMillis?.() ?? 0
  if (lockedUntil > now) {
    throw createError({
      statusCode: 429,
      message: 'Too many wrong PINs. Try again in a few minutes.',
      data: { code: 'APPROVAL_PIN_LOCKED' },
    })
  }

  if (await pinMatches(pin, { hash: data.hash, salt: data.salt })) {
    if (data.failedAttempts) await ref.update({ failedAttempts: 0, lockedUntil: null })
    return
  }

  await db.runTransaction(async (tx) => {
    const fresh = (await tx.get(ref)).data() ?? {}
    const attempts = (Number(fresh.failedAttempts) || 0) + 1
    tx.update(ref, {
      failedAttempts: attempts >= MAX_PIN_ATTEMPTS ? 0 : attempts,
      lockedUntil: attempts >= MAX_PIN_ATTEMPTS ? Timestamp.fromMillis(now + PIN_LOCK_MS) : null,
    })
  })
  throw createError({
    statusCode: 403,
    message: 'Wrong approval PIN',
    data: { code: 'APPROVAL_PIN_WRONG' },
  })
}
