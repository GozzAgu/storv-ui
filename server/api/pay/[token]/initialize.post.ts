import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import {
  generateReference,
  getPaystackSecret,
  paystackRequest,
  payoutDocId,
  PAYMENT_LINK_CURRENCY,
  type MerchantPayoutDoc,
  type PaymentLinkDoc,
} from '~/server/utils/payment-links'

interface Body {
  email?: string
}

/**
 * Public (no auth): initialize a Paystack transaction for this link.
 * Splits to the merchant's subaccount; returns the hosted authorization URL.
 */
export default defineEventHandler(async (event) => {
  const token = (getRouterParam(event, 'token') || '').trim()
  if (!token) throw createError({ statusCode: 400, message: 'Missing token' })

  const body = await readBody<Body>(event)
  const email = (body.email || '').trim()
  if (!email || !email.includes('@')) {
    throw createError({ statusCode: 400, message: 'A valid email is required for the receipt' })
  }

  const adminDb = getAdminFirestore()
  const linkRef = adminDb.collection('paymentLinks').doc(token)
  const snap = await linkRef.get()
  if (!snap.exists) throw createError({ statusCode: 404, message: 'Payment link not found' })
  const link = snap.data() as PaymentLinkDoc

  if (link.status === 'paid') {
    throw createError({ statusCode: 409, message: 'This invoice has already been paid' })
  }
  const expiresAtMs = (link.expiresAt as { toMillis?: () => number })?.toMillis?.() ?? 0
  if (expiresAtMs > 0 && Date.now() > expiresAtMs) {
    throw createError({ statusCode: 410, message: 'This payment link has expired' })
  }

  const payoutSnap = await adminDb.collection('merchantPayouts').doc(payoutDocId(link.ownerUserId, link.storeId)).get()
  const payout = payoutSnap.data() as MerchantPayoutDoc | undefined
  if (!payout?.subaccountCode) {
    throw createError({ statusCode: 503, message: 'This store cannot accept payments yet' })
  }

  const config = useRuntimeConfig()
  const secretKey = getPaystackSecret(config)
  const reference = generateReference(token)
  const origin = getRequestURL(event).origin

  const data = await paystackRequest<{ authorization_url?: string }>('/transaction/initialize', {
    method: 'POST',
    secretKey,
    body: {
      email,
      amount: Number(link.amount),
      currency: PAYMENT_LINK_CURRENCY,
      reference,
      subaccount: payout.subaccountCode,
      // Merchant (subaccount) absorbs the Paystack transaction fee, not the platform.
      bearer: 'subaccount',
      callback_url: `${origin}/pay/${token}`,
      metadata: { token, invoiceNumber: link.invoiceNumber },
    },
  })

  if (!data?.authorization_url) {
    throw createError({ statusCode: 502, message: 'Paystack did not return a checkout URL' })
  }

  await linkRef.update({
    reference,
    customerEmail: email,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { success: true, authorizationUrl: data.authorization_url, reference }
})
