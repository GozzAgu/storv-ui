import { createError, defineEventHandler, getRouterParam, getQuery } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import {
  getPaystackSecret,
  paystackRequest,
  type PaymentLinkDoc,
} from '~/server/utils/payment-links'
import { settlePaymentLink } from '~/server/utils/payment-link-settle'

/**
 * Public (no auth): verify a transaction after the Paystack redirect and settle
 * the link (deduct stock + create receipt). Idempotent — the webhook may also settle.
 */
export default defineEventHandler(async (event) => {
  const token = (getRouterParam(event, 'token') || '').trim()
  const reference = String(getQuery(event).reference || '').trim()
  if (!token || !reference) {
    throw createError({ statusCode: 400, message: 'token and reference are required' })
  }

  const adminDb = getAdminFirestore()
  const linkSnap = await adminDb.collection('paymentLinks').doc(token).get()
  if (!linkSnap.exists) throw createError({ statusCode: 404, message: 'Payment link not found' })
  const link = linkSnap.data() as PaymentLinkDoc

  // Anti-tamper: the reference must match the one we issued for this link.
  if (link.reference && link.reference !== reference) {
    throw createError({ statusCode: 409, message: 'Reference does not match this invoice' })
  }

  if (link.status === 'paid') {
    return { success: true, paid: true, alreadyProcessed: true }
  }

  const config = useRuntimeConfig()
  const secretKey = getPaystackSecret(config)

  const data = await paystackRequest<{ status?: string; amount?: number; channel?: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: 'GET', secretKey }
  )

  if (data?.status !== 'success') {
    // A definitive failure marks the link failed; "abandoned"/pending stay unpaid so the customer can retry.
    if (data?.status === 'failed') {
      await adminDb
        .collection('paymentLinks')
        .doc(token)
        .update({
          status: 'failed',
          channel: data.channel || null,
          updatedAt: FieldValue.serverTimestamp(),
        })
      return { success: true, paid: false, status: 'failed', message: 'Payment failed' }
    }
    return {
      success: true,
      paid: false,
      status: data?.status || 'pending',
      message: 'Payment not completed',
    }
  }

  const result = await settlePaymentLink(adminDb, token, {
    paidAmountKobo: Number(data.amount),
    reference,
    channel: data.channel,
  })

  return { success: true, paid: result.settled, alreadyProcessed: result.alreadyProcessed }
})
