import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { merchantPayoutIsConnected } from '~/server/utils/payment-link-create'
import {
  publicStorefrontListingDto,
  publicStorefrontProfileDto,
} from '~/server/utils/storefront-public-dto'
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

  const store = publicStorefrontProfileDto(profile)
  if (profile.allowOnlineCheckout === true && profile.ownerUid && profile.storeId) {
    store.acceptsPayments = await merchantPayoutIsConnected(
      adminDb,
      profile.ownerUid,
      profile.storeId
    )
  }

  return {
    success: true,
    store,
    item: publicStorefrontListingDto(item),
  }
})

