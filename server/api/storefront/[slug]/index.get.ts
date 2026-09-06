import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import {
  publicStorefrontListingDto,
  publicStorefrontProfileDto,
} from '~/server/utils/storefront-public-dto'
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
  const sort = String(q.sort || '').trim() // '' | recent | price_asc | price_desc

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
  if (
    availability === 'available' ||
    availability === 'unavailable' ||
    availability === 'reserved'
  ) {
    items = items.filter((i) => i.availability === availability)
  }

  const toMs = (v: unknown): number => {
    if (!v) return 0
    const t = v as { toMillis?: () => number; seconds?: number }
    if (typeof t.toMillis === 'function') return t.toMillis()
    if (typeof t.seconds === 'number') return t.seconds * 1000
    if (v instanceof Date) return v.getTime()
    return 0
  }

  const rank = (a: string) => (a === 'available' ? 0 : a === 'reserved' ? 1 : 2)
  items.sort((a, b) => {
    if (sort === 'recent') {
      const ta = toMs(a.firstListedAt) || toMs(a.updatedAt)
      const tb = toMs(b.firstListedAt) || toMs(b.updatedAt)
      if (tb !== ta) return tb - ta
      return a.title.localeCompare(b.title)
    }
    if (sort === 'price_asc') return (a.price || 0) - (b.price || 0)
    if (sort === 'price_desc') return (b.price || 0) - (a.price || 0)
    const rd = rank(a.availability) - rank(b.availability)
    if (rd !== 0) return rd
    return a.title.localeCompare(b.title)
  })

  const recent = [...items]
    .sort((a, b) => {
      const ta = toMs(a.firstListedAt) || toMs(a.updatedAt)
      const tb = toMs(b.firstListedAt) || toMs(b.updatedAt)
      return tb - ta
    })
    .slice(0, 8)
    .map(publicStorefrontListingDto)

  const categories = Array.from(
    new Set(items.map((i) => i.categoryName).filter(Boolean))
  ).sort()

  return {
    success: true,
    store: publicStorefrontProfileDto(profile),
    categories,
    recent,
    items: items.map(publicStorefrontListingDto),
  }
})

