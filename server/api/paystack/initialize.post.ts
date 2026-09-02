import type { SubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'
import { isSubscriptionBillingCycle } from '~/types/subscription-billing'
import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireFreshTotp } from '~/server/utils/store-auth'
import {
  getExpectedPlanAmount,
  getPaystackPlanCode,
  PAYSTACK_CURRENCY,
  VALID_PLANS,
  resolvePaystackSecretKey,
} from '~/server/utils/paystack-validation'
import { disablePaystackSubscription } from '~/server/utils/paystack-subscription'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event, { requireVerifiedEmail: true })
    const body = await readBody(event)
    const {
      planId,
      email,
      userId,
      billingCycle: billingCycleRaw,
      totpCode,
    } = body as {
      planId?: SubscriptionPlan
      email?: string
      userId?: string
      billingCycle?: SubscriptionBillingCycle
      totpCode?: string
    }

    await requireFreshTotp(auth, totpCode)

    const billingCycle: SubscriptionBillingCycle = isSubscriptionBillingCycle(billingCycleRaw)
      ? billingCycleRaw
      : 'monthly'

    if (!planId || !email || !userId) {
      throw createError({
        statusCode: 400,
        message: 'planId, email, and userId are required',
      })
    }

    if (auth.uid !== userId) {
      throw createError({ statusCode: 403, message: 'Cannot initialize payment for another user' })
    }

    if (!VALID_PLANS.includes(planId)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid planId',
      })
    }

    if (planId === 'storvv_micro') {
      throw createError({
        statusCode: 400,
        message: 'Micro is free; choose Medium or Enterprise to subscribe.',
      })
    }

    const config = useRuntimeConfig()
    const secretKey = resolvePaystackSecretKey(config)
    if (!secretKey) {
      throw createError({
        statusCode: 503,
        message: 'Paystack is not configured. Set PAYSTACK_SECRET_KEY.',
      })
    }

    let paystackPlanCode: string
    try {
      paystackPlanCode = getPaystackPlanCode(
        planId,
        billingCycle,
        config as Record<string, unknown>
      )
    } catch (err: unknown) {
      throw createError({
        statusCode: 503,
        message: err instanceof Error ? err.message : 'Paystack plan is not configured.',
      })
    }

    const amount = getExpectedPlanAmount(planId, config as Record<string, unknown>, billingCycle)

    const adminDb = getAdminFirestore()
    const userSnap = await adminDb.collection('users').doc(userId).get()
    const existing = userSnap.data() as {
      paystackSubscriptionCode?: string
      paystackSubscriptionEmailToken?: string
    } | undefined

    if (existing?.paystackSubscriptionCode && existing?.paystackSubscriptionEmailToken) {
      try {
        await disablePaystackSubscription(
          secretKey,
          existing.paystackSubscriptionCode,
          existing.paystackSubscriptionEmailToken
        )
      } catch (err) {
        console.warn('[paystack/initialize] could not disable prior subscription', err)
      }
    }

    const normalizedEmail = email.trim().toLowerCase()
    const reference = `storvv_${planId}_${userId}_${Date.now()}`
    const baseUrl = getRequestURL(event).origin
    const callbackUrl = `${baseUrl}/dashboard/settings?paystack_callback=1`

    const response = (await $fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        email: normalizedEmail,
        amount,
        plan: paystackPlanCode,
        reference,
        currency: PAYSTACK_CURRENCY,
        callback_url: callbackUrl,
        metadata: {
          userId,
          planId,
          billingCycle,
          paystackPlanCode,
        },
      },
    })) as {
      status: boolean
      data?: { authorization_url: string; reference: string; access_code: string }
      message?: string
    }

    if (!response.status || !response.data?.authorization_url) {
      throw createError({
        statusCode: 502,
        message: response.message || 'Paystack could not create transaction',
      })
    }

    await adminDb.collection('users').doc(userId).collection('pendingCheckouts').doc(reference).set(
      {
        userId,
        planId,
        billingCycle,
        paystackPlanCode,
        email: normalizedEmail,
        amount,
        currency: PAYSTACK_CURRENCY,
        reference,
        status: 'initialized',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    return {
      success: true,
      authorization_url: response.data.authorization_url,
      reference: response.data.reference,
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Paystack initialize error:', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Failed to initialize payment',
    })
  }
})
