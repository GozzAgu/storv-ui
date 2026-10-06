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
import {
  attachSubscriptionFromWebhook,
  cancelAllAddOns,
  completeAddOnCheckout,
  findAddOnBySubscriptionCode,
  updateAddOnFromWebhook,
} from '~/server/utils/subscription-addons'
import { logServerError } from '~/server/utils/log-server-error'

type PaystackWebhookPayload = {
  event?: string
  data?: {
    reference?: string
    amount?: number
    currency?: string
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
    /** subscription.* events send the subscription itself as `data`. */
    subscription_code?: string
    email_token?: string
    next_payment_date?: string
    plan?: { plan_code?: string }
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

    const isAddOnCharge =
      data.metadata?.kind === 'addon' ||
      Boolean(subscriptionCode && (await findAddOnBySubscriptionCode(adminDb, subscriptionCode)))

    if (isAddOnCharge) {
      try {
        if (data.metadata?.kind === 'addon' && userId && reference) {
          await completeAddOnCheckout(adminDb, {
            userId,
            reference,
            paidAmountKobo: Number(data.amount),
            currency: data.currency,
          })
        }
        if (subscriptionCode) {
          await updateAddOnFromWebhook(adminDb, subscriptionCode, {
            status: 'active',
            nextPaymentDate: extracted.nextPaymentDate,
          })
        }
      } catch (err) {
        logServerError('paystack/webhook.addon_charge', err)
      }
    } else if (!userId && subscriptionCode) {
      userId = (await findUserIdByPaystackSubscriptionCode(adminDb, subscriptionCode)) || undefined
    }

    if (!isAddOnCharge && userId && subscriptionCode) {
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

  if (eventName === 'subscription.create' && data?.subscription_code) {
    try {
      await attachSubscriptionFromWebhook(adminDb, data)
    } catch (err) {
      logServerError('paystack/webhook.subscription_create', err)
    }
  }

  const lifecycleCode = data?.subscription?.subscription_code || data?.subscription_code

  if (eventName === 'subscription.disable' && lifecycleCode) {
    try {
      const isAddOn = await updateAddOnFromWebhook(adminDb, lifecycleCode, { status: 'canceled' })
      const userId = isAddOn
        ? null
        : await findUserIdByPaystackSubscriptionCode(adminDb, lifecycleCode)
      if (userId) {
        const userSnap = await adminDb.collection('users').doc(userId).get()
        const userData = userSnap.data()
        await cancelAutoRenewForUser(adminDb, userId)
        await maybeDowngradeExpiredSubscription(adminDb, userId, userData)
        await cancelAllAddOns(adminDb, secretKey, userId, {
          endsAt: userData?.subscriptionCurrentPeriodEnd,
        })
      }
    } catch (err) {
      logServerError('paystack/webhook.subscription_disable', err)
    }
  }

  if (eventName === 'invoice.payment_failed' && lifecycleCode) {
    try {
      const isAddOn = await updateAddOnFromWebhook(adminDb, lifecycleCode, { status: 'past_due' })
      const userId = isAddOn
        ? null
        : await findUserIdByPaystackSubscriptionCode(adminDb, lifecycleCode)
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
      logServerError('paystack/webhook.invoice_payment_failed', err)
    }
  }

  setResponseStatus(event, 200)
  return { received: true }
})
