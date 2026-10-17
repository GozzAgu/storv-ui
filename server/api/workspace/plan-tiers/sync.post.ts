import { createError, defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'
import { syncPlanTiers } from '~/server/utils/plan-tiers'

/** Owner only: refresh the plan tiers Firestore rules use after stores or staff change. */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)

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
  return await syncPlanTiers(db, auth.uid)
})
