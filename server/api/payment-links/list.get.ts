import { createError, defineEventHandler, getQuery } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreReadAccess } from '~/server/utils/store-auth'
import { koboToNaira, type PaymentLinkDoc } from '~/server/utils/payment-links'

/** Authenticated: list this store's payment links + headline stats for the dashboard. */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const query = getQuery(event)
  const ownerUserId = String(query.ownerUserId || '').trim()
  const storeId = String(query.storeId || '').trim()

  if (!ownerUserId || !storeId) {
    throw createError({ statusCode: 400, message: 'ownerUserId and storeId are required' })
  }

  await requireStoreReadAccess(auth.uid, ownerUserId, storeId)

  const adminDb = getAdminFirestore()
  // Two equality filters (no composite index needed); sort in memory.
  const snap = await adminDb
    .collection('paymentLinks')
    .where('ownerUserId', '==', ownerUserId)
    .where('storeId', '==', storeId)
    .limit(200)
    .get()

  const origin = getRequestURL(event).origin
  const toMillis = (v: unknown): number => {
    const t = v as { toMillis?: () => number } | undefined
    return typeof t?.toMillis === 'function' ? t.toMillis() : 0
  }

  const now = Date.now()
  const links = snap.docs
    .map((d) => {
      const l = d.data() as PaymentLinkDoc
      const expiresAtMs = toMillis(l.expiresAt)
      // Lazy expiry: an unpaid link past its window reads as "expired".
      const status =
        l.status === 'unpaid' && expiresAtMs > 0 && now > expiresAtMs ? 'expired' : l.status
      return {
        token: l.token,
        invoiceNumber: l.invoiceNumber,
        customerName: l.customerName,
        customerPhone: l.customerPhone,
        itemsCount: Array.isArray(l.items) ? l.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0) : 0,
        total: koboToNaira(Number(l.amount) || 0),
        status,
        url: `${origin}/pay/${l.token}`,
        createdAtMs: toMillis(l.createdAt),
        paidAtMs: toMillis(l.paidAt),
      }
    })
    .sort((a, b) => b.createdAtMs - a.createdAtMs)

  const stats = {
    collected: links.filter((l) => l.status === 'paid').reduce((s, l) => s + l.total, 0),
    paid: links.filter((l) => l.status === 'paid').length,
    unpaid: links.filter((l) => l.status === 'unpaid').length,
    failed: links.filter((l) => l.status === 'failed').length,
  }

  return { success: true, links, stats }
})
