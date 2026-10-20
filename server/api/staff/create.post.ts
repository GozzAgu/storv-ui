import { randomBytes } from 'node:crypto'
import { STAFF_OWNER_CLAIM } from '~/server/utils/staff-login-target'
import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'
import { syncPlanTiersQuietly } from '~/server/utils/plan-tiers'
import {
  assertStaffCapacity,
  parseNewStaff,
  permissionsForWrite,
  resolveStaffManager,
  writeNewStaff,
  type NewStaffInput,
} from '~/server/utils/staff-admin'

interface CreateStaffBody extends Partial<NewStaffInput> {
  ownerUserId?: string
  storeId?: string
  departmentId?: string
  password?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateTemporaryPassword(): string {
  return randomBytes(9).toString('base64url')
}

/** Owner or branch admin creates a staff login and record. Admins can't create admins. */
export default defineEventHandler(async (event) => {
  let auth: Awaited<ReturnType<typeof requireAuth>>
  try {
    auth = await requireAuth(event)
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'create')
  }

  const body = (await readBody<CreateStaffBody>(event)) || {}
  const ownerUserId = body.ownerUserId?.trim()
  const storeId = body.storeId?.trim()
  const departmentId = body.departmentId?.trim()
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!ownerUserId || !storeId || !departmentId || !email) {
    throw createError({
      statusCode: 400,
      message: 'ownerUserId, storeId, departmentId and email are required',
    })
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw createError({ statusCode: 400, message: 'Enter a valid email address' })
  }
  const password = body.password?.trim() || generateTemporaryPassword()
  if (password.length < 6) {
    throw createError({ statusCode: 400, message: 'Password must be at least 6 characters' })
  }

  let adminDb: ReturnType<typeof getAdminFirestore>
  try {
    adminDb = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'create')
  }

  const manager = await resolveStaffManager(adminDb, auth, ownerUserId, storeId)
  const fields = parseNewStaff({ ...body, email } as NewStaffInput)
  const permissions = permissionsForWrite(manager, body.permissions)
  await assertStaffCapacity(adminDb, ownerUserId, storeId)

  const adminAuth = getAdminAuth()
  let authUid: string
  try {
    const user = await adminAuth.createUser({
      email,
      password,
      displayName: `${fields.firstName} ${fields.lastName}`.trim(),
    })
    authUid = user.uid
    // The login belongs to this business; staff routes check this before touching it.
    await adminAuth.setCustomUserClaims(authUid, { [STAFF_OWNER_CLAIM]: ownerUserId })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'auth/email-already-exists') {
      throw createError({ statusCode: 409, message: 'An account with this email already exists' })
    }
    if (code === 'auth/invalid-password') {
      throw createError({ statusCode: 400, message: 'Password must be at least 6 characters' })
    }
    throw err
  }

  try {
    const staffId = await writeNewStaff(adminDb, {
      ownerUserId,
      storeId,
      departmentId,
      authUid,
      email,
      fields,
      permissions,
    })
    await syncPlanTiersQuietly(adminDb, ownerUserId)
    return { ok: true, staffId, authUid, temporaryPassword: password }
  } catch (err) {
    await adminAuth.deleteUser(authUid).catch(() => {})
    throw err
  }
})
