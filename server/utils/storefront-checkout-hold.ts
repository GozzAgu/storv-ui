import type { Firestore } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'
import type { PaymentLinkDoc } from '~/server/utils/payment-links'
import type { StorefrontPublicListing } from '~/types/storefront'

/** Release a storefront soft-hold created by checkout (`reservationInquiryId = pay:{token}`). */
export async function releaseStorefrontCheckoutHold(
  adminDb: Firestore,
  link: PaymentLinkDoc
): Promise<void> {
  const slug = String(link.storefrontSlug || '').trim()
  const listingId = String(link.storefrontListingId || '').trim()
  if (!slug || !listingId) return

  const listingRef = adminDb
    .collection('storefrontListings')
    .doc(slug)
    .collection('items')
    .doc(listingId)
  const snap = await listingRef.get()
  if (!snap.exists) return
  const listing = snap.data() as StorefrontPublicListing
  if (listing.reservationInquiryId !== `pay:${link.token}`) return

  await listingRef.update({
    availability: 'available',
    reservationInquiryId: null,
    updatedAt: FieldValue.serverTimestamp(),
  })
}
