import { defineEventHandler, getQuery } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { isValidStorefrontSlug } from '~/utils/storefront-slug'

/** Check if a storefront slug can be claimed (Admin SDK). */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const slug = String(q.slug || '')
    .trim()
    .toLowerCase()
  const ownerUid = String(q.ownerUid || '').trim()

  if (!isValidStorefrontSlug(slug)) {
    return { available: false, reason: 'invalid' as const }
  }

  const adminDb = getAdminFirestore()
  const snap = await adminDb.collection('storefronts').doc(slug).get()
  if (!snap.exists) {
    return { available: true }
  }
  const data = snap.data() || {}
  if (ownerUid && data.ownerUid === ownerUid) {
    return { available: true, ownedByCaller: true }
  }
  return { available: false, reason: 'taken' as const }
})
