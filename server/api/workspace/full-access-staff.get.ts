import { createError, defineEventHandler, getQuery } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'
import { loadStorePlanAccess, type OwnerPlanFields } from '~/server/utils/plan-access'

/**
 * Owner only: a store's active staff and who keeps full access when the store has more staff
 * than the plan includes. `fullAccessIds` is null when everyone keeps full access.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const storeId = String(getQuery(event).storeId || '').trim()
  if (!storeId) throw createError({ statusCode: 400, message: 'storeId is required' })

  let db: ReturnType<typeof getAdminFirestore>
  try {
    db = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'load')
  }

  const ownerSnap = await db.collection('users').doc(auth.uid).get()
  if (ownerSnap.data()?.role !== 'superAdmin') {
    throw createError({ statusCode: 403, message: 'Only the account owner can do this' })
  }
  const storeSnap = await db
    .collection('users')
    .doc(auth.uid)
    .collection('stores')
    .doc(storeId)
    .get()
  if (!storeSnap.exists) throw createError({ statusCode: 404, message: 'Store not found' })

  const access = await loadStorePlanAccess(
    db,
    auth.uid,
    ownerSnap.data() as OwnerPlanFields,
    storeId
  )
  return {
    storeViewOnly: access.storeViewOnly,
    maxStaff: access.maxStaff,
    fullAccessIds: access.fullAccessIds,
    staff: access.staff.map(({ id, name, departmentId }) => ({ id, name, departmentId })),
  }
})
