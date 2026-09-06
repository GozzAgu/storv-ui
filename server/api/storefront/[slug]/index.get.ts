import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import type { StorefrontPublicListing, StorefrontPublicProfile } from '~/types/storefront'

/**
 * Public storefront catalogue (Admin SDK).
 * Strips internal owner/source pointers from the response.
 */
export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
    .trim()
    .toLowerCase()
  if (!slug) throw createError({ statusCode: 400, message: 'Missing store slug' })

  const q = getQuery(event)
  const search = String(q.q || '')
    .trim()
    .toLowerCase()
  const category = String(q.category || '').trim()
  const availability = String(q.availability || '').trim()

  const adminDb = getAdminFirestore()
  const profileSnap = await adminDb.collection('storefronts').doc(slug).get()
  if (!profileSnap.exists) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }
  const profile = profileSnap.data() as StorefrontPublicProfile
  if (!profile.isPublished) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  const itemsSnap = await adminDb
    .collection('storefrontListings')
    .doc(slug)
    .collection('items')
    .where('isListed', '==', true)
    .limit(200)
    .get()

  let items = itemsSnap.docs.map((d) => d.data() as StorefrontPublicListing)

  if (search) {
    items = items.filter((i) => (i.searchText || '').includes(search))
  }
  if (category) {
    items = items.filter(
      (i) => i.categoryName === category || i.categoryPath === category
    )
  }
  if (availability === 'available' || availability === 'unavailable') {
    items = items.filter((i) => i.availability === availability)
  }

  items.sort((a, b) => {
    if (a.availability !== b.availability) {
      return a.availability === 'available' ? -1 : 1
    }
    return a.title.localeCompare(b.title)
  })

  const categories = Array.from(
    new Set(items.map((i) => i.categoryName).filter(Boolean))
  ).sort()

  return {
    success: true,
    store: publicProfileDto(profile),
    categories,
    items: items.map(publicListingDto),
  }
})

function publicProfileDto(profile: StorefrontPublicProfile) {
  return {
    slug: profile.slug,
    displayName: profile.displayName,
    tagline: profile.tagline || null,
    description: profile.description || null,
    logoUrl: profile.logoUrl || null,
    city: profile.city || null,
    addressPublic: profile.addressPublic || null,
    phonePublic: profile.phonePublic || null,
    whatsappE164: profile.whatsappE164 || null,
    emailPublic: profile.emailPublic || null,
    social: profile.social || {},
    collectionInfo: profile.collectionInfo || null,
    warrantyInfo: profile.warrantyInfo || null,
    currency: profile.currency || null,
  }
}

function publicListingDto(item: StorefrontPublicListing) {
  return {
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
  }
}
