import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreManageAccess } from '~/server/utils/store-auth'
import {
  readInquiryFulfillInventory,
  writeInquiryFulfillSale,
  type InquiryFulfillReads,
} from '~/server/utils/storefront-inquiry-fulfill'
import type {
  StorefrontInquiry,
  StorefrontInquiryStatus,
  StorefrontPublicListing,
} from '~/types/storefront'

const ALLOWED: StorefrontInquiryStatus[] = [
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
]

function canTransition(from: StorefrontInquiryStatus, to: StorefrontInquiryStatus): boolean {
  if (from === to) return false
  if (from === 'rejected' || from === 'cancelled' || from === 'completed') return false
  if (from === 'pending') {
    return to === 'confirmed' || to === 'rejected' || to === 'cancelled'
  }
  if (from === 'confirmed') {
    return to === 'completed' || to === 'cancelled' || to === 'rejected'
  }
  return false
}

/** Already completed but sale never created (pre-fulfillment inquiries). */
function canBackfillSale(
  inquiry: StorefrontInquiry,
  to: StorefrontInquiryStatus
): boolean {
  return to === 'completed' && inquiry.status === 'completed' && !inquiry.receiptId
}

/**
 * Business confirm / reject / complete / cancel.
 * Soft hold cleared on reject, cancel, or complete. Confirmed keeps reserved.
 * Completing creates a sale from guest details and decrements private inventory.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const inquiryId = String(getRouterParam(event, 'id') || '').trim()
  if (!inquiryId) throw createError({ statusCode: 400, message: 'Missing inquiry id' })

  const body = (await readBody(event)) || {}
  const ownerUserId = String(body.ownerUserId || '').trim()
  const storeId = String(body.storeId || '').trim()
  const status = String(body.status || '').trim() as StorefrontInquiryStatus
  const resolveNote =
    body.resolveNote != null ? String(body.resolveNote).trim().slice(0, 500) : undefined

  if (!ownerUserId || !storeId) {
    throw createError({ statusCode: 400, message: 'ownerUserId and storeId are required' })
  }
  if (!ALLOWED.includes(status)) {
    throw createError({ statusCode: 400, message: 'Invalid status' })
  }

  await requireStoreManageAccess(auth.uid, ownerUserId, storeId)

  const adminDb = getAdminFirestore()
  const storeRef = adminDb.collection('users').doc(ownerUserId).collection('stores').doc(storeId)
  const inquiryRef = storeRef.collection('storefrontInquiries').doc(inquiryId)

  let receiptId: string | undefined
  let receiptNumber: string | undefined
  let folderId: string | undefined

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(inquiryRef)
    if (!snap.exists) {
      throw createError({ statusCode: 404, message: 'Inquiry not found' })
    }
    const inquiry = { ...(snap.data() as StorefrontInquiry), id: inquiryId }
    const backfillSale = canBackfillSale(inquiry, status)
    if (!backfillSale && !canTransition(inquiry.status, status)) {
      throw createError({
        statusCode: 409,
        message: `Cannot move inquiry from ${inquiry.status} to ${status}`,
      })
    }

    const slug = String(inquiry.storefrontSlug || '')
    const listingId = String(inquiry.listingId || '')
    let listingRef: DocumentReference | null = null
    let listing: StorefrontPublicListing | null = null

    if (slug && listingId) {
      listingRef = adminDb
        .collection('storefrontListings')
        .doc(slug)
        .collection('items')
        .doc(listingId)
      const listingSnap = await tx.get(listingRef)
      if (listingSnap.exists) {
        listing = listingSnap.data() as StorefrontPublicListing
      }
    }

    let inventory: InquiryFulfillReads | null = null
    if (status === 'completed') {
      if (inquiry.receiptId) {
        receiptId = inquiry.receiptId
        receiptNumber = inquiry.receiptNumber
      } else {
        // Complete is only allowed after the customer paid the payment link
        // sent for this inquiry (or when backfilling a legacy completed row).
        let paymentPaid = inquiry.paymentLinkStatus === 'paid'
        const paymentToken = String(inquiry.paymentLinkToken || '').trim()
        if (!paymentPaid && paymentToken) {
          const paySnap = await tx.get(adminDb.collection('paymentLinks').doc(paymentToken))
          if (paySnap.exists) {
            const pay = paySnap.data() as { status?: string; receiptId?: string; receiptNumber?: string; inventoryApplied?: boolean }
            if (pay.status === 'paid') {
              paymentPaid = true
              if (pay.receiptId) {
                receiptId = pay.receiptId
                receiptNumber = pay.receiptNumber || inquiry.paymentLinkInvoiceNumber
              }
            }
          }
        }
        if (!paymentPaid) {
          throw createError({
            statusCode: 409,
            message:
              'Send a payment link and wait for the customer to pay before marking complete.',
          })
        }
        if (!receiptId) {
          inventory = await readInquiryFulfillInventory(
            tx,
            storeRef,
            inquiry,
            listing?.sourceFolderId
          )
        }
      }
    }

    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      resolvedByUid: auth.uid,
    }
    if (!backfillSale) {
      patch.status = status
      if (status !== 'confirmed') {
        patch.resolvedAt = FieldValue.serverTimestamp()
      }
    }
    if (resolveNote) patch.resolveNote = resolveNote

    if (status === 'completed' && inventory) {
      const sale = writeInquiryFulfillSale(tx, {
        storeRef,
        storeId,
        ownerUserId,
        createdByUid: auth.uid,
        inquiryId,
        inquiry,
        inventory,
      })
      receiptId = sale.receiptId
      receiptNumber = sale.receiptNumber
      folderId = inventory.folderId
      patch.receiptId = sale.receiptId
      patch.receiptNumber = sale.receiptNumber
    } else if (status === 'completed' && receiptId) {
      patch.receiptId = receiptId
      if (receiptNumber) patch.receiptNumber = receiptNumber
      patch.paymentLinkStatus = 'paid'
    }

    tx.update(inquiryRef, patch)

    if (!listingRef || !listing) return

    if (status === 'completed') {
      tx.update(listingRef, {
        availability: 'unavailable',
        reservationInquiryId: null,
        updatedAt: FieldValue.serverTimestamp(),
      })
      return
    }

    const holdsThis =
      listing.reservationInquiryId === inquiryId ||
      (inquiry.type === 'reserve' && listing.availability === 'reserved')

    if (!holdsThis && inquiry.type !== 'reserve') return

    if (status === 'confirmed') {
      if (listing.availability !== 'reserved' || listing.reservationInquiryId !== inquiryId) {
        tx.update(listingRef, {
          availability: 'reserved',
          reservationInquiryId: inquiryId,
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
      return
    }

    // reject / cancel. release soft hold
    if (listing.reservationInquiryId === inquiryId || listing.availability === 'reserved') {
      tx.update(listingRef, {
        availability: 'available',
        reservationInquiryId: null,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
  })

  return { success: true, id: inquiryId, status, receiptId, receiptNumber, folderId }
})
