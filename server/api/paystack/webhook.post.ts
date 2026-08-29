import { defineEventHandler, getHeader, readRawBody, setResponseStatus } from 'h3'
import type { SubscriptionPlan } from '~/types/subscription'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { getPaystackSecret, isValidPaystackSignature } from '~/server/utils/payment-links'
import { settlePaymentLink } from '~/server/utils/payment-link-settle'
import {
  applySubscriptionToUser,
  cancelAutoRenewForUser,
  extractSubscriptionFromChargePayload,
  findUserIdByPaystackSubscriptionCode,
  maybeDowngradeExpiredSubscription,
} from '~/server/utils/paystack-subscription'
import { VALID_PLANS } from '~/server/utils/paystack-validation'

type PaystackWebhookPayload = {
  event?: string
  data?: {
    reference?: string
    amount?: number
    channel?: string
    status?: string
    metadata?: Record<string, unknown>
    subscription?: {
      subscription_code?: string
      email_token?: string
      status?: string
      next_payment_date?: string
    }
    customer?: { customer_code?: string }
  }
}

/**
 * Public Paystack webhook (authoritative settlement).
 * - Payment links: charge.success with metadata.token
 * - Subscriptions: charge.success renewals + subscription.disable / invoice.payment_failed
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  let secretKey: string
  try {
    secretKey = getPaystackSecret(config)
  } catch {
    setResponseStatus(event, 200)
    return { received: true }
  }

  const raw = (await readRawBody(event)) || ''
  const signature = getHeader(event, 'x-paystack-signature') || ''

  if (!isValidPaystackSignature(raw, signature, secretKey)) {
    setResponseStatus(event, 401)
    return { error: 'Invalid signature' }
  }

  let payload: PaystackWebhookPayload
  try {
    payload = JSON.parse(raw)
  } catch {
    setResponseStatus(event, 200)
    return { received: true }
  }

  const adminDb = getAdminFirestore()
  const eventName = payload.event || ''
  const data = payload.data

  if (eventName === 'charge.success' && data) {
    const token = data.metadata?.token
    const reference = data.reference

    if (token && reference) {
      try {
        await settlePaymentLink(adminDb, token, {
          paidAmountKobo: Number(data.amount),
          reference,
          channel: data.channel,
        })
      } catch (err) {
        console.error('[paystack/webhook] payment link settle failed', err)
      }
    }

    const extracted = extractSubscriptionFromChargePayload(data)
    const subscriptionCode = extracted.subscriptionCode
    let userId = extracted.userId
    let planId = extracted.planId
    let billingCycle = extracted.billingCycle

    if (!userId && subscriptionCode) {
      userId = (await findUserIdByPaystackSubscriptionCode(adminDb, subscriptionCode)) || undefined
    }

    if (userId && subscriptionCode) {
      try {
        const userSnap = await adminDb.collection('users').doc(userId).get()
        const userData = userSnap.data()
        if (!planId && typeof userData?.subscription === 'string') {
          planId = userData.subscription as SubscriptionPlan
        }
        if (!billingCycle && userData?.subscriptionBillingCycle) {
          billingCycle = userData.subscriptionBillingCycle as typeof billingCycle
        }

        if (planId && VALID_PLANS.includes(planId) && billingCycle) {
          await applySubscriptionToUser(adminDb, {
            userId,
            planId,
            billingCycle,
            reference,
            paystackSubscriptionCode: subscriptionCode,
            paystackSubscriptionEmailToken: extracted.emailToken,
            paystackCustomerCode: extracted.customerCode,
            subscriptionStatus: 'active',
            subscriptionCurrentPeriodEnd: extracted.nextPaymentDate,
          })
        }
      } catch (err) {
        console.error('[paystack/webhook] subscription renewal failed', err)
      }
    }
  }

  if (eventName === 'subscription.disable' && data?.subscription?.subscription_code) {
    try {
      const userId = await findUserIdByPaystackSubscriptionCode(
        adminDb,
        data.subscription.subscription_code
      )
      if (userId) {
        const userSnap = await adminDb.collection('users').doc(userId).get()
        await cancelAutoRenewForUser(adminDb, userId)
        await maybeDowngradeExpiredSubscription(adminDb, userId, userSnap.data())
      }
    } catch (err) {
      console.error('[paystack/webhook] subscription disable failed', err)
    }
  }

  if (eventName === 'invoice.payment_failed' && data?.subscription?.subscription_code) {
    try {
      const userId = await findUserIdByPaystackSubscriptionCode(
        adminDb,
        data.subscription.subscription_code
      )
      if (userId) {
        await adminDb.collection('users').doc(userId).set(
          {
            subscriptionStatus: 'past_due',
            subscriptionUpdatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      }
    } catch (err) {
      console.error('[paystack/webhook] invoice payment failed handler error', err)
    }
  }

  setResponseStatus(event, 200)
  return { received: true }
})
