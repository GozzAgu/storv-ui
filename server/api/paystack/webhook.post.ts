import { defineEventHandler, getHeader, readRawBody, setResponseStatus } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import {
  getPaystackSecret,
  isValidPaystackSignature,
  paystackRequest,
} from '~/server/utils/payment-links'
import { settlePaymentLink } from '~/server/utils/payment-link-settle'
import { legacyPaymentLinksEnabled } from '~/server/utils/legacy-payment-links'
import { getPaymentsV2Gate } from '~/server/utils/payments/config'
import { handleLinkCharge } from '~/server/utils/payments/link-webhook'
import { isLinkReference, webhookIpAllowed } from '~/server/utils/payments/webhook-guard'
import { opsAlert, opsAlertDepsFromEnv } from '~/server/utils/payments/ops-alert'
import { isResendConfigured } from '~/server/utils/delivery-config'
import { sendReceiptEmail } from '~/server/utils/receipt-delivery-email'
import { sendViaResend } from '~/server/utils/staff-invite-email'
import {
  cancelAutoRenewForUser,
  extractSubscriptionFromChargePayload,
  findUserIdByPaystackSubscriptionCode,
  maybeDowngradeExpiredSubscription,
} from '~/server/utils/paystack-subscription'
import {
  applySubscriptionChargeOnce,
  recordSubscriptionPaymentIssue,
  resolveSubscriptionCharge,
} from '~/server/utils/paystack-subscription-charge'
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
 * - Payments V2 links: charge.success with a `stvp_` reference → verify and apply (link-webhook.ts)
 * - Legacy payment links: charge.success with metadata.token, only with LEGACY_PAYMENT_LINKS_ENABLED=1
 * - Subscriptions: charge.success renewals + subscription.disable / invoice.payment_failed
 *   (plan from Paystack's plan code and a checked amount, never from metadata; once per reference)
 * PAYSTACK_WEBHOOK_IPS, when set, applies to every event.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  let secretKey: string
  try {
    secretKey = getPaystackSecret(config)
  } catch {
    console.error(JSON.stringify({ tag: 'payments-alert', alert: 'webhook-without-secret-key' }))
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

  if (!webhookIpAllowed(event)) {
    console.error(JSON.stringify({ tag: 'payments-alert', alert: 'webhook-ip-not-allowed' }))
    setResponseStatus(event, 401)
    return { error: 'Not allowed' }
  }

  const emailReady = isResendConfigured()

  if (eventName === 'charge.success' && data && isLinkReference(data.reference)) {
    const gate = await getPaymentsV2Gate()
    const result = await handleLinkCharge(adminDb, data.reference, {
      enabled: gate.enabled,
      paystack: (path, init) =>
        paystackRequest(path, { method: init.method, body: init.body, secretKey }),
      sendPayerReceipt: emailReady
        ? (toEmail, view) =>
            sendReceiptEmail({ toEmail, view, caption: 'Thank you, your payment was received.' })
        : undefined,
      alerts: opsAlertDepsFromEnv(emailReady ? sendViaResend : undefined),
    })
    setResponseStatus(event, result.httpStatus)
    return { received: result.httpStatus === 200 }
  }

  if (eventName === 'charge.success' && data) {
    const token = data.metadata?.token
    const reference = data.reference

    if (token && reference && legacyPaymentLinksEnabled()) {
      try {
        await settlePaymentLink(adminDb, token, {
          paidAmountKobo: Number(data.amount),
          reference,
          channel: data.channel,
        })
      } catch (err) {
        console.error('[paystack/webhook] payment link settle failed', err)
      }
    } else if (token && reference) {
      console.error(
        JSON.stringify({ tag: 'payments-alert', alert: 'legacy-link-charge-ignored', reference })
      )
    }

    const extracted = extractSubscriptionFromChargePayload(data)
    const subscriptionCode = extracted.subscriptionCode
    const userId = extracted.userId

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
    }

    if (!isAddOnCharge && subscriptionCode) {
      try {
        const resolved = await resolveSubscriptionCharge(
          adminDb,
          data,
          config as Record<string, unknown>
        )
        if (resolved?.ok) {
          const applied = await applySubscriptionChargeOnce(adminDb, {
            userId: resolved.userId,
            planId: resolved.planId,
            billingCycle: resolved.billingCycle,
            reference,
            amountKobo: Number(data.amount),
            paystackSubscriptionCode: resolved.subscriptionCode,
            paystackSubscriptionEmailToken: extracted.emailToken,
            paystackCustomerCode: extracted.customerCode,
            subscriptionStatus: 'active',
            subscriptionCurrentPeriodEnd: extracted.nextPaymentDate,
          })
          if (!applied) {
            console.warn(
              JSON.stringify({ tag: 'paystack-webhook', event: 'duplicate-subscription-charge' })
            )
          }
        } else if (resolved) {
          if (resolved.userId) {
            await recordSubscriptionPaymentIssue(adminDb, resolved.userId, {
              reference,
              amountKobo: Number(data.amount),
              problem: resolved.problem,
            })
          }
          await opsAlert(
            adminDb,
            'subscription-charge-not-applied',
            reference || subscriptionCode,
            {
              problem: resolved.problem,
              reference: reference ?? null,
              amountKobo: Number(data.amount) || 0,
              currency: data.currency ?? null,
              userId: resolved.userId ?? null,
            },
            opsAlertDepsFromEnv(emailReady ? sendViaResend : undefined)
          )
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
