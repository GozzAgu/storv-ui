import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { koboToNaira, type PaymentLinkDoc } from '~/server/utils/payment-links'

/** Public (no auth): minimal snapshot for the checkout page. Never exposes itemId/folderId/owner. */
export default defineEventHandler(async (event) => {
  const token = (getRouterParam(event, 'token') || '').trim()
  if (!token) throw createError({ statusCode: 400, message: 'Missing token' })

  const adminDb = getAdminFirestore()
  const snap = await adminDb.collection('paymentLinks').doc(token).get()
  if (!snap.exists) {
    throw createError({ statusCode: 404, message: 'Payment link not found' })
  }
  const link = snap.data() as PaymentLinkDoc

  const expiresAtMs = (link.expiresAt as { toMillis?: () => number })?.toMillis?.() ?? 0
  const expired = expiresAtMs > 0 && Date.now() > expiresAtMs
  const status = expired && link.status === 'unpaid' ? 'expired' : link.status

  return {
    success: true,
    invoice: {
      businessName: link.businessName,
      invoiceNumber: link.invoiceNumber,
      customerName: link.customerName,
      items: (link.items || []).map((i) => ({
        name: i.name,
        unitPrice: Number(i.unitPrice) || 0,
        quantity: Number(i.quantity) || 0,
      })),
      total: koboToNaira(Number(link.amount) || 0),
      currency: link.currency,
      status,
      reference: link.status === 'paid' ? link.reference : undefined,
      channel: link.status === 'paid' ? link.channel : undefined,
    },
  }
})
