import { defineEventHandler, getHeader, readRawBody, setResponseStatus } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { getPaystackSecret, isValidPaystackSignature } from '~/server/utils/payment-links'
import { settlePaymentLink } from '~/server/utils/payment-link-settle'

/**
 * Public Paystack webhook (authoritative settlement). Verifies the
 * x-paystack-signature HMAC over the raw body, then settles payment links on
 * charge.success. Always returns 200 so Paystack does not retry indefinitely.
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

  let payload: { event?: string; data?: { reference?: string; amount?: number; channel?: string; metadata?: { token?: string } } }
  try {
    payload = JSON.parse(raw)
  } catch {
    setResponseStatus(event, 200)
    return { received: true }
  }

  if (payload.event === 'charge.success') {
    const token = payload.data?.metadata?.token
    const reference = payload.data?.reference
    if (token && reference) {
      try {
        const adminDb = getAdminFirestore()
        await settlePaymentLink(adminDb, token, {
          paidAmountKobo: Number(payload.data?.amount),
          reference,
          channel: payload.data?.channel,
        })
      } catch (err) {
        // Log but still 200 — Paystack retries on non-2xx; we don't want infinite retries on a settle bug.
        console.error('[paystack/webhook] settle failed', err)
      }
    }
  }

  setResponseStatus(event, 200)
  return { received: true }
})
