import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'
import { loadStorePlanAccess, type OwnerPlanFields } from '~/server/utils/plan-access'
import { syncPlanTiers } from '~/server/utils/plan-tiers'

/** Owner only: choose which staff keep full access in a store that is over its staff count. */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = (await readBody(event)) as { storeId?: unknown; staffIds?: unknown }
  const storeId = typeof body?.storeId === 'string' ? body.storeId.trim() : ''
  if (!storeId) throw createError({ statusCode: 400, message: 'storeId is required' })
  if (!Array.isArray(body.staffIds) || body.staffIds.some((id) => typeof id !== 'string')) {
    throw createError({ statusCode: 400, message: 'staffIds must be a list of staff ids' })
  }
  const staffIds = [...new Set(body.staffIds as string[])]

  let db: ReturnType<typeof getAdminFirestore>
  try {
    db = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'save')
  }

  const ownerSnap = await db.collection('users').doc(auth.uid).get()
  if (ownerSnap.data()?.role !== 'superAdmin') {
    throw createError({ statusCode: 403, message: 'Only the account owner can do this' })
  }
  const storeRef = db.collection('users').doc(auth.uid).collection('stores').doc(storeId)
  if (!(await storeRef.get()).exists) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  const access = await loadStorePlanAccess(
    db,
    auth.uid,
    ownerSnap.data() as OwnerPlanFields,
    storeId
  )
  if (access.maxStaff >= 0 && staffIds.length > access.maxStaff) {
    throw createError({
      statusCode: 400,
      message: `Your plan includes ${access.maxStaff} staff with full access in this branch.`,
    })
  }
  const known = new Set(access.staff.map((member) => member.id))
  if (staffIds.some((id) => !known.has(id))) {
    throw createError({ statusCode: 400, message: "Choose from this branch's active staff." })
  }

  await storeRef.set({ fullAccessStaffIds: staffIds }, { merge: true })
  await syncPlanTiers(db, auth.uid)
  return { fullAccessStaffIds: staffIds }
})
