import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { validateInquiryPayload } from '~/utils/storefront-inquiry'
import type {
  StorefrontInquiry,
  StorefrontPublicListing,
  StorefrontPublicProfile,
} from '~/types/storefront'

/**
 * Public guest contact / reserve. Soft-holds listing on reserve only.
 * Never mutates private inventory.
 */
export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
    .trim()
    .toLowerCase()
  if (!slug) throw createError({ statusCode: 400, message: 'Missing store slug' })

  await assertRateLimit(event, { id: 'storefront-inquiry', limit: 8, windowMs: 60_000 })

  const body = (await readBody(event)) || {}
  const validated = validateInquiryPayload(body)
  if (!validated.ok) {
    throw createError({ statusCode: 400, message: validated.message })
  }
  const { type, customerName, customerPhone, customerNote, listingId } = validated.data

  const adminDb = getAdminFirestore()
  const profileRef = adminDb.collection('storefronts').doc(slug)
  const listingRef = adminDb
    .collection('storefrontListings')
    .doc(slug)
    .collection('items')
    .doc(listingId)

  const profileSnap = await profileRef.get()
  if (!profileSnap.exists) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }
  const profile = profileSnap.data() as StorefrontPublicProfile
  if (!profile.isPublished) {
    throw createError({ statusCode: 404, message: 'Store not found' })
  }

  if (type === 'reserve' && profile.allowReservations === false) {
    throw createError({ statusCode: 400, message: 'Reservations are not available for this store.' })
  }

  const ownerUid = String(profile.ownerUid || '')
  const storeId = String(profile.storeId || '')
  if (!ownerUid || !storeId) {
    throw createError({ statusCode: 500, message: 'Storefront is misconfigured' })
  }

  const inquiryRef = adminDb
    .collection('users')
    .doc(ownerUid)
    .collection('stores')
    .doc(storeId)
    .collection('storefrontInquiries')
    .doc()

  await adminDb.runTransaction(async (tx) => {
    const listingSnap = await tx.get(listingRef)
    if (!listingSnap.exists) {
      throw createError({ statusCode: 404, message: 'Product not found' })
    }
    const listing = listingSnap.data() as StorefrontPublicListing
    if (!listing.isListed) {
      throw createError({ statusCode: 404, message: 'Product not found' })
    }

    if (type === 'reserve') {
      if (listing.availability !== 'available') {
        throw createError({
          statusCode: 409,
          message:
            listing.availability === 'reserved'
              ? 'This item is already reserved.'
              : 'This item is not available to reserve.',
        })
      }
    }

    const inquiry: StorefrontInquiry = {
      id: inquiryRef.id,
      type,
      status: 'pending',
      customerName,
      customerPhone,
      customerNote,
      listingId: listing.id,
      listingTitle: listing.title,
      listingPrice: listing.price,
      sourceItemId: listing.sourceItemId || listing.id,
      sourceFolderId: listing.sourceFolderId,
      storefrontSlug: slug,
      storeId,
      ownerUid,
      createdAt: FieldValue.serverTimestamp() as unknown as StorefrontInquiry['createdAt'],
      updatedAt: FieldValue.serverTimestamp() as unknown as StorefrontInquiry['updatedAt'],
    }

    tx.set(inquiryRef, inquiry)

    if (type === 'reserve') {
      tx.update(listingRef, {
        availability: 'reserved',
        reservationInquiryId: inquiryRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    const notifRef = adminDb
      .collection('users')
      .doc(ownerUid)
      .collection('stores')
      .doc(storeId)
      .collection('notifications')
      .doc()

    tx.set(notifRef, {
      type: 'storefront_inquiry',
      title: type === 'reserve' ? 'New reservation request' : 'New storefront enquiry',
      message: `${customerName} · ${listing.title}`,
      userId: ownerUid,
      read: false,
      metadata: {
        inquiryId: inquiryRef.id,
        listingId: listing.id,
        itemId: listing.sourceItemId || listing.id,
        inquiryType: type,
        storefrontSlug: slug,
      },
      createdAt: FieldValue.serverTimestamp(),
    })
  })

  return {
    success: true,
    inquiryId: inquiryRef.id,
    type,
    status: 'pending',
    message:
      type === 'reserve'
        ? 'Reservation requested. The shop will confirm shortly.'
        : 'Message sent. The shop will get back to you.',
  }
})
