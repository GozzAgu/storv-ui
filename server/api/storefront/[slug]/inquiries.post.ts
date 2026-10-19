import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { isListingOfStore } from '~/server/utils/storefront-public-dto'
import {
  countOpenReservations,
  effectiveListingAvailability,
  inquiryPhoneKey,
  STOREFRONT_MAX_OPEN_RESERVATIONS_PER_PHONE,
  STOREFRONT_RESERVATION_HOLD_MS,
} from '~/server/utils/storefront-reservation'
import { validateInquiryPayload } from '~/utils/storefront-inquiry'
import type {
  StorefrontInquiry,
  StorefrontPublicListing,
  StorefrontPublicProfile,
} from '~/types/storefront'

/**
 * Public guest contact / reserve. Soft-holds listing on reserve only, for
 * STOREFRONT_RESERVATION_HOLD_MS; one phone may hold a few open reservations per store.
 * Never mutates private inventory.
 */
export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, 'slug') || '')
    .trim()
    .toLowerCase()
  if (!slug) throw createError({ statusCode: 400, message: 'Missing store slug' })

  // Reservations hold stock, so the limit must hold across instances (as checkout does).
  await assertRateLimit(event, {
    id: 'storefront-inquiry',
    limit: 8,
    windowMs: 60_000,
    requireDistributed: true,
  })

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
    throw createError({
      statusCode: 400,
      message: 'Reservations are not available for this store.',
    })
  }

  const ownerUid = String(profile.ownerUid || '')
  const storeId = String(profile.storeId || '')
  if (!ownerUid || !storeId) {
    throw createError({ statusCode: 500, message: 'Storefront is misconfigured' })
  }

  const inquiriesCol = adminDb
    .collection('users')
    .doc(ownerUid)
    .collection('stores')
    .doc(storeId)
    .collection('storefrontInquiries')
  const inquiryRef = inquiriesCol.doc()
  const phoneKey = inquiryPhoneKey(customerPhone)

  await adminDb.runTransaction(async (tx) => {
    const nowMs = Date.now()
    const reservedUntil = Timestamp.fromMillis(nowMs + STOREFRONT_RESERVATION_HOLD_MS)
    const listingSnap = await tx.get(listingRef)
    if (!listingSnap.exists) {
      throw createError({ statusCode: 404, message: 'Product not found' })
    }
    const listing = listingSnap.data() as StorefrontPublicListing
    if (!listing.isListed || !isListingOfStore(listing, ownerUid, storeId)) {
      throw createError({ statusCode: 404, message: 'Product not found' })
    }

    if (type === 'reserve') {
      const availability = effectiveListingAvailability(listing, nowMs)
      if (availability !== 'available') {
        throw createError({
          statusCode: 409,
          message:
            availability === 'reserved'
              ? 'This item is already reserved.'
              : 'This item is not available to reserve.',
        })
      }
      const mine = await tx.get(inquiriesCol.where('customerPhoneKey', '==', phoneKey).limit(100))
      const open = countOpenReservations(
        mine.docs.map((d) => d.data() as StorefrontInquiry),
        nowMs
      )
      if (open >= STOREFRONT_MAX_OPEN_RESERVATIONS_PER_PHONE) {
        throw createError({
          statusCode: 429,
          message: 'You already have several items reserved here. Contact the shop instead.',
        })
      }
    }

    const inquiry: StorefrontInquiry = {
      id: inquiryRef.id,
      type,
      status: 'pending',
      customerName,
      customerPhone,
      customerPhoneKey: phoneKey,
      customerNote,
      listingId: listing.id,
      listingTitle: listing.title,
      listingPrice: listing.price,
      sourceItemId: listing.sourceItemId || listing.id,
      sourceFolderId: listing.sourceFolderId,
      storefrontSlug: slug,
      storeId,
      ownerUid,
      ...(type === 'reserve' ? { reservedUntil } : {}),
      createdAt: FieldValue.serverTimestamp() as unknown as StorefrontInquiry['createdAt'],
      updatedAt: FieldValue.serverTimestamp() as unknown as StorefrontInquiry['updatedAt'],
    }

    tx.set(inquiryRef, inquiry)

    if (type === 'reserve') {
      tx.update(listingRef, {
        availability: 'reserved',
        reservationInquiryId: inquiryRef.id,
        reservedUntil,
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
