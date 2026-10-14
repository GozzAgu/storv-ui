import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'
import { requireStoreAdminGrant } from '~/server/utils/staff-admin'
import { applySharedSettings, sharedSettingsUpdate } from '~/server/utils/admin-settings'

interface StoreSettingsBody {
  ownerUserId?: string
  storeId?: string
  section?: unknown
  values?: unknown
}

/**
 * A branch admin with the "store settings" extra saves one shared settings section (business
 * details, inventory, receipts or checkout methods). These apply to every branch.
 */
export default defineEventHandler(async (event) => {
  let auth: Awaited<ReturnType<typeof requireAuth>>
  try {
    auth = await requireAuth(event)
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'update')
  }

  const body = (await readBody<StoreSettingsBody>(event)) || {}
  const ownerUserId = body.ownerUserId?.trim()
  const storeId = body.storeId?.trim()
  if (!ownerUserId || !storeId) {
    throw createError({ statusCode: 400, message: 'ownerUserId and storeId are required' })
  }
  const update = sharedSettingsUpdate(body.section, body.values)

  let adminDb: ReturnType<typeof getAdminFirestore>
  try {
    adminDb = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'update')
  }

  await requireStoreAdminGrant(adminDb, auth.uid, ownerUserId, storeId, 'storeSettings')
  await applySharedSettings(adminDb, ownerUserId, update)
  return { ok: true }
})
