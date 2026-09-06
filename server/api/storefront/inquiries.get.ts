import { createError, defineEventHandler, getQuery } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreReadAccess } from '~/server/utils/store-auth'
import type { StorefrontInquiry, StorefrontInquiryStatus } from '~/types/storefront'

const STATUSES = new Set<StorefrontInquiryStatus>([
  'pending',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
])

/** Authenticated: list storefront inquiries for a store. */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const query = getQuery(event)
  const ownerUserId = String(query.ownerUserId || '').trim()
  const storeId = String(query.storeId || '').trim()
  const statusFilter = String(query.status || '').trim() as StorefrontInquiryStatus | ''

  if (!ownerUserId || !storeId) {
    throw createError({ statusCode: 400, message: 'ownerUserId and storeId are required' })
  }
  if (statusFilter && !STATUSES.has(statusFilter)) {
    throw createError({ statusCode: 400, message: 'Invalid status filter' })
  }

  await requireStoreReadAccess(auth.uid, ownerUserId, storeId)

  const adminDb = getAdminFirestore()
  const snap = await adminDb
    .collection('users')
    .doc(ownerUserId)
    .collection('stores')
    .doc(storeId)
    .collection('storefrontInquiries')
    .limit(200)
    .get()

  const toMillis = (v: unknown): number => {
    const t = v as { toMillis?: () => number } | undefined
    return typeof t?.toMillis === 'function' ? t.toMillis() : 0
  }

  let inquiries = snap.docs.map((d) => {
    const row = d.data() as StorefrontInquiry
    return {
      id: row.id || d.id,
      type: row.type,
      status: row.status,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerNote: row.customerNote || null,
      listingId: row.listingId,
      listingTitle: row.listingTitle,
      listingPrice: row.listingPrice ?? null,
      sourceItemId: row.sourceItemId,
      storefrontSlug: row.storefrontSlug,
      resolveNote: row.resolveNote || null,
      receiptId: row.receiptId || null,
      receiptNumber: row.receiptNumber || null,
      createdAtMs: toMillis(row.createdAt),
      updatedAtMs: toMillis(row.updatedAt),
      resolvedAtMs: toMillis(row.resolvedAt),
    }
  })

  if (statusFilter) {
    inquiries = inquiries.filter((i) => i.status === statusFilter)
  }

  inquiries.sort((a, b) => b.createdAtMs - a.createdAtMs)

  const counts = {
    pending: inquiries.filter((i) => i.status === 'pending').length,
    confirmed: inquiries.filter((i) => i.status === 'confirmed').length,
    all: inquiries.length,
  }

  return { success: true, inquiries, counts }
})
