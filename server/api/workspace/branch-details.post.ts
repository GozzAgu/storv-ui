import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'
import { requireStoreAdminGrant } from '~/server/utils/staff-admin'
import { applyBranchDetails, branchDetailsUpdate } from '~/server/utils/admin-settings'

interface BranchDetailsBody {
  ownerUserId?: string
  storeId?: string
  values?: unknown
}

/** A branch admin with the "branches" extra edits their own branch's details. */
export default defineEventHandler(async (event) => {
  let auth: Awaited<ReturnType<typeof requireAuth>>
  try {
    auth = await requireAuth(event)
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'update')
  }

  const body = (await readBody<BranchDetailsBody>(event)) || {}
  const ownerUserId = body.ownerUserId?.trim()
  const storeId = body.storeId?.trim()
  if (!ownerUserId || !storeId) {
    throw createError({ statusCode: 400, message: 'ownerUserId and storeId are required' })
  }
  const details = branchDetailsUpdate(body.values)

  let adminDb: ReturnType<typeof getAdminFirestore>
  try {
    adminDb = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'update')
  }

  await requireStoreAdminGrant(adminDb, auth.uid, ownerUserId, storeId, 'branches')
  await applyBranchDetails(adminDb, ownerUserId, storeId, details)
  return { ok: true, details }
})
