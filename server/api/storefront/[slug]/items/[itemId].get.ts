import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import type { StorefrontPublicListing, StorefrontPublicProfile } from '~/types/storefront'

/** Public product detail for a storefront listing. */
export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
    .trim()
    .toLowerCase()
  const itemId = String(getRouterParam(event, 'itemId') || '').trim()
  if (!slug || !itemId) {
    throw createError({ statusCode: 400, message: 'Missing store or product' })
  }

  const adminDb = getAdminFirestore()
  const profileSnap = await adminDb.collection('storefronts').doc(slug).get()
  if (!profileSnap.exists) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }
  const profile = profileSnap.data() as StorefrontPublicProfile
  if (!profile.isPublished) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  const itemSnap = await adminDb
    .collection('storefrontListings')
    .doc(slug)
    .collection('items')
    .doc(itemId)
    .get()
  if (!itemSnap.exists) {
    throw createError({ statusCode: 404, message: 'Product not found' })
  }
  const item = itemSnap.data() as StorefrontPublicListing
  if (!item.isListed) {
    throw createError({ statusCode: 404, message: 'Product not found' })
  }

  return {
    success: true,
    store: {
      slug: profile.slug,
      displayName: profile.displayName,
      tagline: profile.tagline || null,
      phonePublic: profile.phonePublic || null,
      whatsappE164: profile.whatsappE164 || null,
      emailPublic: profile.emailPublic || null,
      social: profile.social || {},
      collectionInfo: profile.collectionInfo || null,
      warrantyInfo: profile.warrantyInfo || null,
      currency: profile.currency || null,
    },
    item: {
      id: item.id,
      title: item.title,
      price: item.price,
      currency: item.currency || null,
      availability: item.availability,
      categoryPath: item.categoryPath,
      categoryName: item.categoryName,
      attributes: item.attributes || [],
      description: item.description || null,
      imageUrl: item.imageUrl || null,
    },
  }
})
