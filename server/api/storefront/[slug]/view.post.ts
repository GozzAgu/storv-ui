import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { assertRateLimit } from '~/server/utils/rate-limit'
import type { StorefrontPublicProfile } from '~/types/storefront'

/**
 * Aggregate public view ping (no PII). Increments store / product counters.
 */
export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
    .trim()
    .toLowerCase()
  if (!slug) throw createError({ statusCode: 400, message: 'Missing store slug' })

  await assertRateLimit(event, { id: 'storefront-view', limit: 60, windowMs: 60_000 })

  const body = (await readBody(event)) || {}
  const listingId = String(body.listingId || '').trim()
  const pathType = listingId ? 'product' : 'store'

  const adminDb = getAdminFirestore()
  const profileSnap = await adminDb.collection('storefronts').doc(slug).get()
  if (!profileSnap.exists) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }
  const profile = profileSnap.data() as StorefrontPublicProfile
  if (!profile.isPublished) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  const ownerUid = String(profile.ownerUid || '')
  const storeId = String(profile.storeId || '')
  if (!ownerUid || !storeId) {
    throw createError({ statusCode: 500, message: 'Storefront is misconfigured' })
  }

  if (listingId) {
    const listingSnap = await adminDb
      .collection('storefrontListings')
      .doc(slug)
      .collection('items')
      .doc(listingId)
      .get()
    if (!listingSnap.exists || listingSnap.data()?.isListed !== true) {
      throw createError({ statusCode: 404, message: 'Product not found' })
    }
  }

  const summaryRef = adminDb
    .collection('users')
    .doc(ownerUid)
    .collection('stores')
    .doc(storeId)
    .collection('storefrontAnalytics')
    .doc('summary')

  const dayKey = new Date().toISOString().slice(0, 10)
  const dayRef = adminDb
    .collection('users')
    .doc(ownerUid)
    .collection('stores')
    .doc(storeId)
    .collection('storefrontAnalytics')
    .doc(`daily_${dayKey}`)

  const summaryInc: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  }
  const dayInc: Record<string, unknown> = {
    date: dayKey,
    updatedAt: FieldValue.serverTimestamp(),
  }

  if (pathType === 'store') {
    summaryInc.storeViews = FieldValue.increment(1)
    dayInc.storeViews = FieldValue.increment(1)
  } else {
    summaryInc.productViews = FieldValue.increment(1)
    dayInc.productViews = FieldValue.increment(1)
    summaryInc[`listingViews.${listingId}`] = FieldValue.increment(1)
    dayInc[`listingViews.${listingId}`] = FieldValue.increment(1)
  }

  await Promise.all([
    summaryRef.set(summaryInc, { merge: true }),
    dayRef.set(dayInc, { merge: true }),
  ])

  return { success: true }
})
