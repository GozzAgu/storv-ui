import { createError, defineEventHandler, getQuery } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreReadAccess } from '~/server/utils/store-auth'
import type { StorefrontInquiryStatus } from '~/types/storefront'

/** Authenticated: aggregate storefront views + inquiry funnel for app-wide analytics. */
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
  const storeRef = adminDb.collection('users').doc(ownerUserId).collection('stores').doc(storeId)

  const [summarySnap, inquiriesSnap] = await Promise.all([
    storeRef.collection('storefrontAnalytics').doc('summary').get(),
    storeRef.collection('storefrontInquiries').limit(200).get(),
  ])

  const summary = summarySnap.exists ? summarySnap.data() || {} : {}
  const listingViewsRaw = (summary.listingViews || {}) as Record<string, number>
  const topListings = Object.entries(listingViewsRaw)
    .map(([id, views]) => ({ id, views: Number(views) || 0 }))
    .filter((r) => r.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)

  const inquiryCounts: Record<StorefrontInquiryStatus | 'all', number> = {
    pending: 0,
    confirmed: 0,
    rejected: 0,
    cancelled: 0,
    completed: 0,
    all: inquiriesSnap.size,
  }
  for (const doc of inquiriesSnap.docs) {
    const status = String(doc.data()?.status || '') as StorefrontInquiryStatus
    if (status === 'pending' || status === 'confirmed' || status === 'rejected' || status === 'cancelled' || status === 'completed') {
      inquiryCounts[status] += 1
    }
  }

  // Last 7 calendar days
  const days: { date: string; storeViews: number; productViews: number }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    const date = d.toISOString().slice(0, 10)
    const daySnap = await storeRef.collection('storefrontAnalytics').doc(`daily_${date}`).get()
    const row = daySnap.exists ? daySnap.data() || {} : {}
    days.push({
      date,
      storeViews: Number(row.storeViews) || 0,
      productViews: Number(row.productViews) || 0,
    })
  }

  return {
    success: true,
    summary: {
      storeViews: Number(summary.storeViews) || 0,
      productViews: Number(summary.productViews) || 0,
      topListings,
    },
    inquiries: inquiryCounts,
    last7Days: days,
  }
})
