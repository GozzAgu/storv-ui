import { createError, defineEventHandler } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth } from '~/server/utils/store-auth'
import { maybeDowngradeExpiredSubscription } from '~/server/utils/paystack-subscription'

/** Expire canceled subscriptions whose paid period has ended (lazy sync). */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const adminDb = getAdminFirestore()
  const userRef = adminDb.collection('users').doc(auth.uid)
  const userSnap = await userRef.get()

  if (!userSnap.exists) {
    throw createError({ statusCode: 404, message: 'User account not found.' })
  }

  const userData = userSnap.data()
  const downgraded = await maybeDowngradeExpiredSubscription(adminDb, auth.uid, userData)

  const refreshed = downgraded ? (await userRef.get()).data() : userData

  return {
    success: true,
    downgraded,
    subscription: refreshed?.subscription,
    subscriptionStatus: refreshed?.subscriptionStatus,
    subscriptionCurrentPeriodEnd: refreshed?.subscriptionCurrentPeriodEnd || null,
  }
})
