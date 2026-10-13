import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth, requireFreshTotp } from '~/server/utils/store-auth'
import { resolveStaffManager, setStaffAdminAccess } from '~/server/utils/staff-admin'

interface AdminAccessBody {
  ownerUserId?: string
  storeId?: string
  departmentId?: string
  staffId?: string
  admin?: boolean
  grants?: unknown
  totpCode?: string
}

/** Owner-only: make a staff member a branch admin (or remove it) and choose their extras. */
export default defineEventHandler(async (event) => {
  let auth: Awaited<ReturnType<typeof requireAuth>>
  try {
    auth = await requireAuth(event)
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'update')
  }

  const body = (await readBody<AdminAccessBody>(event)) || {}
  await requireFreshTotp(auth, body.totpCode)
  const ownerUserId = body.ownerUserId?.trim()
  const storeId = body.storeId?.trim()
  const departmentId = body.departmentId?.trim()
  const staffId = body.staffId?.trim()
  if (!ownerUserId || !storeId || !departmentId || !staffId || typeof body.admin !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'ownerUserId, storeId, departmentId, staffId and admin are required',
    })
  }

  let adminDb: ReturnType<typeof getAdminFirestore>
  try {
    adminDb = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'update')
  }

  const manager = await resolveStaffManager(adminDb, auth, ownerUserId, storeId)
  const result = await setStaffAdminAccess(adminDb, manager, {
    ownerUserId,
    storeId,
    departmentId,
    staffId,
    admin: body.admin,
    grants: body.grants,
  })
  return { ok: true, ...result }
})
