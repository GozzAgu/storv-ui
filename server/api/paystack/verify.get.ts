import type { SubscriptionPlan } from '~/types/subscription'
import type { SubscriptionBillingCycle } from '~/types/subscription-billing'
import { isSubscriptionBillingCycle } from '~/types/subscription-billing'
import { createError, defineEventHandler, getQuery } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth } from '~/server/utils/store-auth'
import {
  VALID_PLANS,
  PAYSTACK_CURRENCY,
  getExpectedPlanAmount,
  validatePaidAmountAndCurrency,
  resolvePaystackSecretKey,
} from '~/server/utils/paystack-validation'
import {
  applySubscriptionToUser,
  fetchActivePaystackSubscription,
} from '~/server/utils/paystack-subscription'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event, { requireVerifiedEmail: true })
    const query = getQuery(event)
    const reference = query.reference as string

    if (!reference) {
      throw createError({
        statusCode: 400,
        message: 'reference is required',
      })
    }

    const config = useRuntimeConfig()
    const secretKey = resolvePaystackSecretKey(config)
    if (!secretKey) {
      throw createError({
        statusCode: 503,
        message: 'Paystack is not configured',
      })
    }

    const response = (await $fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    )) as {
      status: boolean
      data?: {
        status: string
        reference: string
        amount?: number
        currency?: string
        metadata?: { userId?: string; planId?: string; billingCycle?: string }
        customer?: { customer_code?: string }
      }
      message?: string
    }

    if (!response.status || !response.data) {
      throw createError({
        statusCode: 502,
        message: response.message || 'Verification failed',
      })
    }

    const { data } = response
    if (data.status !== 'success') {
      return {
        success: false,
        message: 'Payment was not successful',
        paid: false,
      }
    }

    const userId = data.metadata?.userId as string | undefined
    const planId = data.metadata?.planId as SubscriptionPlan | undefined
    const billingCycle: SubscriptionBillingCycle = isSubscriptionBillingCycle(
      data.metadata?.billingCycle
    )
      ? data.metadata.billingCycle
      : 'monthly'

    if (!userId || !planId || !VALID_PLANS.includes(planId)) {
      return {
        success: false,
        message: 'Invalid transaction metadata or plan',
        paid: false,
      }
    }

    if (auth.uid !== userId) {
      throw createError({ statusCode: 403, message: 'Cannot verify payment for another user' })
    }

    const expectedAmount = getExpectedPlanAmount(
      planId,
      config as Record<string, unknown>,
      billingCycle
    )
    const paymentValidity = validatePaidAmountAndCurrency(
      data.amount ?? 0,
      data.currency,
      expectedAmount
    )
    if (!paymentValidity.valid) {
      return {
        success: false,
        message: paymentValidity.message || 'Invalid payment details.',
        paid: false,
      }
    }

    const adminDb = getAdminFirestore()
    const pendingRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('pendingCheckouts')
      .doc(reference)
    const userRef = adminDb.collection('users').doc(userId)

    const txResult = await adminDb.runTransaction(async (tx) => {
      const pendingSnap = await tx.get(pendingRef)
      if (!pendingSnap.exists) {
        throw createError({
          statusCode: 409,
          message: 'No matching pending checkout was found for this reference.',
        })
      }

      const pending = pendingSnap.data() as {
        status?: string
        planId?: SubscriptionPlan
        billingCycle?: SubscriptionBillingCycle
        amount?: number
        currency?: string
        userId?: string
      }

      if (
        pending.userId !== userId ||
        pending.planId !== planId ||
        (pending.billingCycle || 'monthly') !== billingCycle ||
        pending.amount !== expectedAmount ||
        (pending.currency || '').toUpperCase() !== PAYSTACK_CURRENCY
      ) {
        throw createError({
          statusCode: 409,
          message: 'Pending checkout does not match transaction details.',
        })
      }

      if (pending.status === 'completed') {
        return { alreadyProcessed: true }
      }

      tx.set(
        userRef,
        {
          subscription: planId,
          subscriptionBillingCycle: billingCycle,
          subscriptionUpdatedAt: new Date().toISOString(),
          subscriptionStatus: 'active',
          lastPaystackReference: data.reference,
        },
        { merge: true }
      )

      tx.set(
        pendingRef,
        {
          status: 'completed',
          paidAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paystackStatus: data.status,
          paystackReference: data.reference,
        },
        { merge: true }
      )

      return { alreadyProcessed: false }
    })

    const customerCode = data.customer?.customer_code
    if (customerCode) {
      try {
        const activeSub = await fetchActivePaystackSubscription(secretKey, customerCode)
        if (activeSub?.subscription_code) {
          await applySubscriptionToUser(adminDb, {
            userId,
            planId,
            billingCycle,
            reference: data.reference,
            paystackSubscriptionCode: activeSub.subscription_code,
            paystackSubscriptionEmailToken: activeSub.email_token,
            paystackCustomerCode: customerCode,
            subscriptionStatus: 'active',
            subscriptionCurrentPeriodEnd: activeSub.next_payment_date
              ? new Date(activeSub.next_payment_date).toISOString()
              : undefined,
          })
        }
      } catch (err) {
        console.warn('[paystack/verify] could not attach Paystack subscription record', err)
      }
    }

    return {
      success: true,
      paid: true,
      userId,
      planId,
      alreadyProcessed: txResult.alreadyProcessed,
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Paystack verify error:', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Failed to verify payment',
    })
  }
})
