import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'
import { syncPlanTiersQuietly } from '~/server/utils/plan-tiers'
import {
  applyStaffUpdate,
  resolveStaffManager,
  type StaffUpdateInput,
} from '~/server/utils/staff-admin'

interface UpdateStaffBody {
  ownerUserId?: string
  storeId?: string
  departmentId?: string
  staffId?: string
  updates?: StaffUpdateInput
}

/** Owner or branch admin edits a staff record. Admins can't edit admins or themselves. */
export default defineEventHandler(async (event) => {
  let auth: Awaited<ReturnType<typeof requireAuth>>
  try {
    auth = await requireAuth(event)
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'update')
  }

  const body = (await readBody<UpdateStaffBody>(event)) || {}
  const ownerUserId = body.ownerUserId?.trim()
  const storeId = body.storeId?.trim()
  const departmentId = body.departmentId?.trim()
  const staffId = body.staffId?.trim()
  if (!ownerUserId || !storeId || !departmentId || !staffId || !body.updates) {
    throw createError({
      statusCode: 400,
      message: 'ownerUserId, storeId, departmentId, staffId and updates are required',
    })
  }

  let adminDb: ReturnType<typeof getAdminFirestore>
  try {
    adminDb = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'update')
  }

  const manager = await resolveStaffManager(adminDb, auth, ownerUserId, storeId)
  const result = await applyStaffUpdate(adminDb, manager, {
    ownerUserId,
    storeId,
    departmentId,
    staffId,
    updates: body.updates,
  })
  await syncPlanTiersQuietly(adminDb, ownerUserId)
  return { ok: true, ...result }
})
