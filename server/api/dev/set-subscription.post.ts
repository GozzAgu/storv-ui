import { createError, defineEventHandler, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth } from '~/server/utils/store-auth'
import { applySubscriptionToUser } from '~/server/utils/paystack-subscription'
import { VALID_PLANS } from '~/server/utils/paystack-validation'
import type { SubscriptionPlan } from '~/types/subscription'
import { normalizeSubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'
import { isSubscriptionBillingCycle } from '~/types/subscription-billing'

function isDevPlanSwitcherAllowed(): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const flag = String(process.env.NUXT_PUBLIC_ALLOW_DEV_PLAN_SWITCHER || '')
    .trim()
    .toLowerCase()
  return flag === '1' || flag === 'true'
}

/**
 * Dev/QA only: set the account owner’s plan without Paystack.
 * Enabled in NODE_ENV=development or when NUXT_PUBLIC_ALLOW_DEV_PLAN_SWITCHER=1.
 */
export default defineEventHandler(async (event) => {
  if (!isDevPlanSwitcherAllowed()) {
    throw createError({ statusCode: 404, message: 'Not found' })
  }

  const auth = await requireAuth(event, { requireVerifiedEmail: true })
  const body = (await readBody(event)) || {}
  const planId = normalizeSubscriptionPlan(body.planId)
  if (!VALID_PLANS.includes(planId)) {
    throw createError({ statusCode: 400, message: 'Invalid planId' })
  }

  const adminDb = getAdminFirestore()
  const userRef = adminDb.collection('users').doc(auth.uid)
  const snap = await userRef.get()
  if (!snap.exists) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }
  const role = String(snap.data()?.role || '')
  if (role !== 'superAdmin') {
    throw createError({ statusCode: 403, message: 'Only the account owner can switch plans' })
  }

  const billingCycle: SubscriptionBillingCycle = isSubscriptionBillingCycle(body.billingCycle)
    ? body.billingCycle
    : 'monthly'

  if (planId === 'storvv_micro') {
    await userRef.set(
      {
        subscription: 'storvv_micro' satisfies SubscriptionPlan,
        subscriptionStatus: 'active',
        subscriptionBillingCycle: FieldValue.delete(),
        subscriptionCurrentPeriodEnd: FieldValue.delete(),
        paystackSubscriptionCode: FieldValue.delete(),
        paystackSubscriptionEmailToken: FieldValue.delete(),
        subscriptionUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
  } else {
    await applySubscriptionToUser(adminDb, {
      userId: auth.uid,
      planId,
      billingCycle,
      subscriptionStatus: 'active',
    })
    await userRef.set(
      {
        paystackSubscriptionCode: FieldValue.delete(),
        paystackSubscriptionEmailToken: FieldValue.delete(),
      },
      { merge: true }
    )
  }

  return { success: true, planId }
})
