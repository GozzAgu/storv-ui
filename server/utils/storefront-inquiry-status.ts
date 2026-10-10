import { createError } from 'h3'
import { FieldValue, type DocumentReference, type Firestore } from 'firebase-admin/firestore'
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

export const STOREFRONT_INQUIRY_TARGETS: StorefrontInquiryStatus[] = [
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
function canBackfillSale(inquiry: StorefrontInquiry, to: StorefrontInquiryStatus): boolean {
  return to === 'completed' && inquiry.status === 'completed' && !inquiry.receiptId
}

export type StorefrontInquiryStatusInput = {
  ownerUserId: string
  storeId: string
  inquiryId: string
  actorUid: string
  status: StorefrontInquiryStatus
  resolveNote?: string
  /** Cash, transfer, POS...: the business took payment itself, so no payment link is needed. */
  paymentMethod?: string
  paymentsV2?: boolean
}

export type StorefrontInquiryStatusResult = {
  receiptId?: string
  receiptNumber?: string
  folderId?: string
  /** A new sale was recorded with `paymentMethod`; V2 still needs the tender recorded. */
  paidInPerson: boolean
  saleTotal: number
}

/**
 * Business confirm / reject / complete / cancel.
 * Soft hold cleared on reject, cancel, or complete. Confirmed keeps reserved.
 * Completing creates a sale from guest details and decrements private inventory.
 */
export async function applyStorefrontInquiryStatus(
  db: Firestore,
  input: StorefrontInquiryStatusInput
): Promise<StorefrontInquiryStatusResult> {
  const { ownerUserId, storeId, inquiryId, status, resolveNote } = input
  const paymentMethod = String(input.paymentMethod || '').trim()
  const storeRef = db.collection('users').doc(ownerUserId).collection('stores').doc(storeId)
  const inquiryRef = storeRef.collection('storefrontInquiries').doc(inquiryId)

  const result: StorefrontInquiryStatusResult = { paidInPerson: false, saleTotal: 0 }

  await db.runTransaction(async (tx) => {
    result.receiptId = undefined
    result.receiptNumber = undefined
    result.folderId = undefined
    result.paidInPerson = false
    result.saleTotal = 0
    const pendingWrites: Array<() => void> = []

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
      listingRef = db.collection('storefrontListings').doc(slug).collection('items').doc(listingId)
      const listingSnap = await tx.get(listingRef)
      if (listingSnap.exists) {
        listing = listingSnap.data() as StorefrontPublicListing
      }
    }

    let inventory: InquiryFulfillReads | null = null
    if (status === 'completed') {
      if (inquiry.receiptId) {
        result.receiptId = inquiry.receiptId
        result.receiptNumber = inquiry.receiptNumber
      } else {
        // Complete needs payment: either the payment link sent for this inquiry was
        // paid, or the business says how it was paid (cash, transfer, POS...).
        // Backfilling an old completed row still needs a paid link.
        let paymentPaid = inquiry.paymentLinkStatus === 'paid'
        const paymentToken = String(inquiry.paymentLinkToken || '').trim()
        let openLinkRef: DocumentReference | null = null
        if (!paymentPaid && paymentToken) {
          const linkRef = db.collection('paymentLinks').doc(paymentToken)
          const paySnap = await tx.get(linkRef)
          if (paySnap.exists) {
            const pay = paySnap.data() as {
              status?: string
              receiptId?: string
              receiptNumber?: string
            }
            if (pay.status === 'paid') {
              paymentPaid = true
              if (pay.receiptId) {
                result.receiptId = pay.receiptId
                result.receiptNumber = pay.receiptNumber || inquiry.paymentLinkInvoiceNumber
              }
            } else if (pay.status !== 'cancelled') {
              openLinkRef = linkRef
            }
          }
        }
        if (!paymentPaid && paymentMethod && !backfillSale) {
          result.paidInPerson = true
        } else if (!paymentPaid) {
          throw createError({
            statusCode: 409,
            message: backfillSale
              ? 'Only a paid payment link can create a sale for this request.'
              : 'Choose how the customer paid before marking complete.',
          })
        }
        if (result.paidInPerson && openLinkRef) {
          // The unpaid link must not be charged once the sale is recorded here.
          const ref = openLinkRef
          pendingWrites.push(() =>
            tx.update(ref, {
              status: 'cancelled',
              cancelledAt: FieldValue.serverTimestamp(),
              cancelReason: 'paid_in_person',
            })
          )
        }
        if (!result.receiptId) {
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
      resolvedByUid: input.actorUid,
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
        createdByUid: input.actorUid,
        inquiryId,
        inquiry,
        inventory,
        ...(result.paidInPerson ? { paymentMethod, paymentsV2: !!input.paymentsV2 } : {}),
      })
      result.receiptId = sale.receiptId
      result.receiptNumber = sale.receiptNumber
      result.folderId = inventory.folderId
      result.saleTotal = sale.total
      patch.receiptId = sale.receiptId
      patch.receiptNumber = sale.receiptNumber
    } else if (status === 'completed' && result.receiptId) {
      patch.receiptId = result.receiptId
      if (result.receiptNumber) patch.receiptNumber = result.receiptNumber
      patch.paymentLinkStatus = 'paid'
    }

    if (result.paidInPerson) patch.paidInPersonMethod = paymentMethod
    tx.update(inquiryRef, patch)
    for (const write of pendingWrites) write()

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

  return result
}
