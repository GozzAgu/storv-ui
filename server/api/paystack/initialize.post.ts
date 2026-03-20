import type { SubscriptionPlan } from '~/types/subscription'
import { getAdminFirestore } from '~/server/utils/firebase-admin'

const PLAN_AMOUNT_KEYS: Record<SubscriptionPlan, keyof ReturnType<typeof useRuntimeConfig>> = {
  storvv_micro: 'paystackPlanMicroAmount',
  storvv_medium: 'paystackPlanMediumAmount',
  storvv_enterprise: 'paystackPlanEnterpriseAmount',
}
const PAYSTACK_CURRENCY = 'NGN'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { planId, email, userId } = body as { planId?: SubscriptionPlan; email?: string; userId?: string }

    if (!planId || !email || !userId) {
      throw createError({
        statusCode: 400,
        message: 'planId, email, and userId are required',
      })
    }

    const validPlans: SubscriptionPlan[] = ['storvv_micro', 'storvv_medium', 'storvv_enterprise']
    if (!validPlans.includes(planId)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid planId',
      })
    }

    const config = useRuntimeConfig()
    const secretKey = config.paystackSecretKey
    if (!secretKey) {
      throw createError({
        statusCode: 503,
        message: 'Paystack is not configured. Set PAYSTACK_SECRET_KEY.',
      })
    }

    const amountKey = PLAN_AMOUNT_KEYS[planId]
    const amount = (config as Record<string, number>)[amountKey] as number | undefined
    if (!amount || amount <= 0) {
      throw createError({
        statusCode: 400,
        message: `Plan ${planId} has no amount configured. Set PAYSTACK_PLAN_*_AMOUNT in kobo.`,
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const reference = `storvv_${planId}_${userId}_${Date.now()}`
    const baseUrl = getRequestURL(event).origin
    const callbackUrl = `${baseUrl}/dashboard/settings?paystack_callback=1`

    const response = await $fetch<{
      status: boolean
      data?: { authorization_url: string; reference: string; access_code: string }
      message?: string
    }>('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        email: normalizedEmail,
        amount,
        reference,
        currency: PAYSTACK_CURRENCY,
        callback_url: callbackUrl,
        metadata: {
          userId,
          planId,
        },
      },
    })

    if (!response.status || !response.data?.authorization_url) {
      throw createError({
        statusCode: 502,
        message: response.message || 'Paystack could not create transaction',
      })
    }

    // Persist pending checkout server-side for later verification hard checks.
    const adminDb = getAdminFirestore()
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('pendingCheckouts')
      .doc(reference)
      .set(
        {
          userId,
          planId,
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
