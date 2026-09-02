import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireFreshTotp } from '~/server/utils/store-auth'
import { resolvePaystackSecretKey } from '~/server/utils/paystack-validation'
import {
  cancelAutoRenewForUser,
  disablePaystackSubscription,
  maybeDowngradeExpiredSubscription,
} from '~/server/utils/paystack-subscription'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event, { requireVerifiedEmail: true })
    const body = (await readBody(event)) as { totpCode?: string }
    await requireFreshTotp(auth, body.totpCode)

    const config = useRuntimeConfig()
    const secretKey = resolvePaystackSecretKey(config)
    if (!secretKey) {
      throw createError({
        statusCode: 503,
        message: 'Paystack is not configured.',
      })
    }

    const adminDb = getAdminFirestore()
    const userRef = adminDb.collection('users').doc(auth.uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      throw createError({ statusCode: 404, message: 'User account not found.' })
    }

    const userData = userSnap.data() as {
      subscription?: string
      subscriptionStatus?: string
      subscriptionCurrentPeriodEnd?: string
      paystackSubscriptionCode?: string
      paystackSubscriptionEmailToken?: string
    }

    if (userData.subscription === 'storvv_micro') {
      throw createError({
        statusCode: 400,
        message: 'You are already on the free Micro plan.',
      })
    }

    if (userData.subscriptionStatus === 'canceled') {
      throw createError({
        statusCode: 409,
        message: 'Auto-renew is already canceled for this account.',
      })
    }

    const subscriptionCode = userData.paystackSubscriptionCode
    const emailToken = userData.paystackSubscriptionEmailToken

    if (subscriptionCode && emailToken) {
      await disablePaystackSubscription(secretKey, subscriptionCode, emailToken)
    }

    await cancelAutoRenewForUser(adminDb, auth.uid)
    await maybeDowngradeExpiredSubscription(adminDb, auth.uid, userData)

    const refreshed = await userRef.get()
    const refreshedData = refreshed.data()

    return {
      success: true,
      subscriptionStatus: refreshedData?.subscriptionStatus || 'canceled',
      subscription: refreshedData?.subscription,
      subscriptionCurrentPeriodEnd: refreshedData?.subscriptionCurrentPeriodEnd || null,
      paystackDisabled: Boolean(subscriptionCode && emailToken),
    }
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string }
    if (e.statusCode) throw err
    console.error('[paystack/cancel-subscription] error:', err)
    throw createError({
      statusCode: 500,
      message: e.message || 'Failed to cancel subscription',
    })
  }
})
