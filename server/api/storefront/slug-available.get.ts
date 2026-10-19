import { defineEventHandler, getHeader, getQuery, type H3Event } from 'h3'
import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireStoreReadAccess } from '~/server/utils/store-auth'
import { isValidStorefrontSlug } from '~/utils/storefront-slug'

/** Signed-in caller's uid from an optional Bearer token; anything else counts as anonymous. */
async function optionalCallerUid(event: H3Event): Promise<string | null> {
  const [scheme, token] = (getHeader(event, 'authorization') || '').split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  try {
    return (await getAdminAuth().verifyIdToken(token)).uid
  } catch {
    return null
  }
}

/** Caller is the storefront's owner or an active member of its store. */
async function callerRunsStorefront(
  callerUid: string | null,
  ownerUid: unknown,
  storeId: unknown
): Promise<boolean> {
  if (!callerUid || typeof ownerUid !== 'string' || !ownerUid) return false
  if (callerUid === ownerUid) return true
  if (typeof storeId !== 'string' || !storeId) return false
  try {
    await requireStoreReadAccess(callerUid, ownerUid, storeId)
    return true
  } catch {
    return false
  }
}

/**
 * Check if a storefront slug can be claimed (Admin SDK). A slug belonging to the signed-in
 * caller's own store counts as available to them (so re-saving keeps it); everyone else only
 * learns available or not, never who owns it.
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const slug = String(q.slug || '')
    .trim()
    .toLowerCase()

  if (!isValidStorefrontSlug(slug)) {
    return { available: false }
  }

  const adminDb = getAdminFirestore()
  const snap = await adminDb.collection('storefronts').doc(slug).get()
  if (!snap.exists) {
    return { available: true }
  }
  const data = snap.data() || {}
  const callerUid = await optionalCallerUid(event)
  return { available: await callerRunsStorefront(callerUid, data.ownerUid, data.storeId) }
})
