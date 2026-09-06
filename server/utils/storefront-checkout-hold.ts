import { createError } from 'h3'
import type { Firestore } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import {
  generatePaymentToken,
  nairaToKobo,
  paymentLinkPendingId,
  storefrontCheckoutReservationId,
  PAYMENT_LINK_CURRENCY,
  PAYMENT_LINK_TTL_MINUTES,
  type PaymentLinkDoc,
  type PaymentLinkItem,
} from '~/server/utils/payment-links'
import {
  makePaymentLinkInvoiceNumber,
  resolvePaymentLinkItemName,
  resolvePaymentLinkItemPrice,
} from '~/server/utils/payment-link-create'
import type { StorefrontInquiry, StorefrontPublicListing } from '~/types/storefront'

export { paymentLinkPendingId, storefrontCheckoutReservationId } from '~/server/utils/payment-links'

/**
 * Atomically create a storefront checkout payment link:
 *  - listing must still be `available`
 *  - private inventory must still be sellable
 *  - listing → reserved (`pay:{token}`)
 *  - inventory → pendingSaleReceiptId (`paylink:{token}`)
 *  - paymentLinks/{token} unpaid doc
 *
 * Concurrent guests racing the same listing: only one transaction commits.
 */
export async function createStorefrontCheckoutPaymentLink(params: {
  adminDb: Firestore
  ownerUserId: string
  storeId: string
  slug: string
  listingId: string
  businessName: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
}): Promise<{ token: string; invoiceNumber: string; amountKobo: number }> {
  const token = generatePaymentToken()
  const invoiceNumber = makePaymentLinkInvoiceNumber()
  const expiresAt = new Date(Date.now() + PAYMENT_LINK_TTL_MINUTES * 60 * 1000)
  const pendingId = paymentLinkPendingId(token)
  const reservationId = storefrontCheckoutReservationId(token)

  const listingRef = params.adminDb
    .collection('storefrontListings')
    .doc(params.slug)
    .collection('items')
    .doc(params.listingId)
  const storeRef = params.adminDb
    .collection('users')
    .doc(params.ownerUserId)
    .collection('stores')
    .doc(params.storeId)
  const linkRef = params.adminDb.collection('paymentLinks').doc(token)

  let amountKobo = 0
  let lockedItems: PaymentLinkItem[] = []

  await params.adminDb.runTransaction(async (tx) => {
    const listingSnap = await tx.get(listingRef)
    if (!listingSnap.exists) {
      throw createError({ statusCode: 404, message: 'Product not found' })
    }
    const listing = listingSnap.data() as StorefrontPublicListing
    if (!listing.isListed) {
      throw createError({ statusCode: 404, message: 'Product not found' })
    }
    if (listing.availability !== 'available') {
      throw createError({
        statusCode: 409,
        message:
          listing.availability === 'reserved'
            ? 'This item is reserved. Contact the shop instead.'
            : 'This item is not available to buy online.',
      })
    }

    const itemId = String(listing.sourceItemId || listing.id || '').trim()
    const folderId = String(listing.sourceFolderId || '').trim()
    if (!itemId || !folderId) {
      throw createError({ statusCode: 500, message: 'Listing is missing inventory linkage' })
    }

    const itemRef = storeRef.collection('inventoryItems').doc(itemId)
    const folderRef = storeRef.collection('inventoryFolders').doc(folderId)
    const [itemSnap, folderSnap] = await Promise.all([tx.get(itemRef), tx.get(folderRef)])

    if (!itemSnap.exists) {
      throw createError({ statusCode: 409, message: 'This product is no longer in stock.' })
    }

    const itemData = itemSnap.data() as Record<string, unknown>
    const folder = (folderSnap.exists ? folderSnap.data() : null) as {
      hasSerialNumbers?: boolean
      template?: { fields?: Array<{ name?: string }> }
    } | null
    const usesSerial = !!folder?.hasSerialNumbers

    if (usesSerial) {
      if (itemData.dateOut || itemData.sellerLoanOutId) {
        throw createError({
          statusCode: 409,
          message: 'This item is no longer available.',
        })
      }
      if (itemData.pendingSaleReceiptId) {
        throw createError({
          statusCode: 409,
          message: 'This item is reserved for another checkout.',
        })
      }
    } else {
      const resolved = resolveBulkStockFieldAndValueFromMap(itemData, folder?.template?.fields)
      const available = resolved?.value ?? 0
      if (available < 1) {
        throw createError({
          statusCode: 409,
          message: 'This item is out of stock.',
        })
      }
      // Coarse hold: one unpaid storefront checkout at a time per inventory line.
      if (itemData.pendingSaleReceiptId) {
        throw createError({
          statusCode: 409,
          message: 'This item is reserved for another checkout.',
        })
      }
    }

    const unitPrice = resolvePaymentLinkItemPrice(itemData)
    const name = resolvePaymentLinkItemName(itemData)
    amountKobo = nairaToKobo(unitPrice)
    if (amountKobo <= 0) {
      throw createError({ statusCode: 400, message: 'This product has no valid price for checkout.' })
    }

    lockedItems = [
      {
        itemId,
        folderId,
        name,
        unitPrice,
        quantity: 1,
      },
    ]

    tx.set(linkRef, {
      token,
      ownerUserId: params.ownerUserId,
      storeId: params.storeId,
      businessName: params.businessName,
      invoiceNumber,
      customerName: params.customerName,
      customerPhone: params.customerPhone || '',
      customerEmail: params.customerEmail || '',
      items: lockedItems,
      amount: amountKobo,
      currency: PAYMENT_LINK_CURRENCY,
      status: 'unpaid',
      inventoryApplied: false,
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: 'storefront',
      source: 'storefront',
      storefrontSlug: params.slug,
      storefrontListingId: params.listingId,
    })

    tx.update(listingRef, {
      availability: 'reserved',
      reservationInquiryId: reservationId,
      updatedAt: FieldValue.serverTimestamp(),
    })

    tx.update(itemRef, {
      pendingSaleReceiptId: pendingId,
      pendingSaleAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  })

  return { token, invoiceNumber, amountKobo }
}

/**
 * Merchant sends a Paystack payment link for an inquiry.
 * Soft-holds listing under the inquiry id, locks inventory with paylink:{token},
 * and stores paymentLinkToken on the inquiry. Complete stays blocked until paid.
 */
export async function createInquiryPaymentLink(params: {
  adminDb: Firestore
  ownerUserId: string
  storeId: string
  inquiryId: string
  businessName: string
  createdByUid: string
}): Promise<{ token: string; invoiceNumber: string; amountKobo: number; reused: boolean }> {
  const storeRef = params.adminDb
    .collection('users')
    .doc(params.ownerUserId)
    .collection('stores')
    .doc(params.storeId)
  const inquiryRef = storeRef.collection('storefrontInquiries').doc(params.inquiryId)

  const inquirySnap = await inquiryRef.get()
  if (!inquirySnap.exists) {
    throw createError({ statusCode: 404, message: 'Inquiry not found' })
  }
  const inquiry = { ...(inquirySnap.data() as StorefrontInquiry), id: params.inquiryId }
  if (inquiry.status === 'completed' || inquiry.status === 'rejected' || inquiry.status === 'cancelled') {
    throw createError({
      statusCode: 409,
      message: 'Cannot send a payment link for a closed inquiry.',
    })
  }

  // Reuse an existing unpaid link for this inquiry when still valid.
  const existingToken = String(inquiry.paymentLinkToken || '').trim()
  if (existingToken && inquiry.paymentLinkStatus === 'unpaid') {
    const existingSnap = await params.adminDb.collection('paymentLinks').doc(existingToken).get()
    if (existingSnap.exists) {
      const existing = existingSnap.data() as PaymentLinkDoc
      const expiresAt =
        existing.expiresAt && typeof (existing.expiresAt as { toMillis?: () => number }).toMillis === 'function'
          ? (existing.expiresAt as { toMillis: () => number }).toMillis()
          : existing.expiresAt instanceof Date
            ? existing.expiresAt.getTime()
            : 0
      if (existing.status === 'unpaid' && (!expiresAt || expiresAt > Date.now())) {
        return {
          token: existingToken,
          invoiceNumber: String(existing.invoiceNumber || inquiry.paymentLinkInvoiceNumber || ''),
          amountKobo: Number(existing.amount) || 0,
          reused: true,
        }
      }
    }
  }

  if (inquiry.paymentLinkStatus === 'paid') {
    throw createError({
      statusCode: 409,
      message: 'This inquiry already has a paid payment link.',
    })
  }

  const token = generatePaymentToken()
  const invoiceNumber = makePaymentLinkInvoiceNumber()
  const expiresAt = new Date(Date.now() + PAYMENT_LINK_TTL_MINUTES * 60 * 1000)
  const pendingId = paymentLinkPendingId(token)

  const slug = String(inquiry.storefrontSlug || '').trim()
  const listingId = String(inquiry.listingId || '').trim()
  if (!slug || !listingId) {
    throw createError({ statusCode: 400, message: 'Inquiry is missing listing details.' })
  }

  const listingRef = params.adminDb
    .collection('storefrontListings')
    .doc(slug)
    .collection('items')
    .doc(listingId)
  const linkRef = params.adminDb.collection('paymentLinks').doc(token)

  let amountKobo = 0

  await params.adminDb.runTransaction(async (tx) => {
    const [inqSnap, listingSnap] = await Promise.all([tx.get(inquiryRef), tx.get(listingRef)])
    if (!inqSnap.exists) {
      throw createError({ statusCode: 404, message: 'Inquiry not found' })
    }
    const liveInquiry = { ...(inqSnap.data() as StorefrontInquiry), id: params.inquiryId }
    if (
      liveInquiry.status === 'completed' ||
      liveInquiry.status === 'rejected' ||
      liveInquiry.status === 'cancelled'
    ) {
      throw createError({
        statusCode: 409,
        message: 'Cannot send a payment link for a closed inquiry.',
      })
    }

    if (!listingSnap.exists) {
      throw createError({ statusCode: 404, message: 'Product listing not found' })
    }
    const listing = listingSnap.data() as StorefrontPublicListing
    if (listing.availability === 'unavailable') {
      throw createError({ statusCode: 409, message: 'This listing is no longer available.' })
    }
    const holdId = String(listing.reservationInquiryId || '')
    if (
      listing.availability === 'reserved' &&
      holdId &&
      holdId !== params.inquiryId
    ) {
      throw createError({
        statusCode: 409,
        message: 'This listing is reserved for another request.',
      })
    }

    const itemId = String(listing.sourceItemId || liveInquiry.sourceItemId || '').trim()
    const folderId = String(listing.sourceFolderId || liveInquiry.sourceFolderId || '').trim()
    if (!itemId || !folderId) {
      throw createError({ statusCode: 500, message: 'Listing is missing inventory linkage' })
    }

    const itemRef = storeRef.collection('inventoryItems').doc(itemId)
    const folderRef = storeRef.collection('inventoryFolders').doc(folderId)
    const [itemSnap, folderSnap] = await Promise.all([tx.get(itemRef), tx.get(folderRef)])
    if (!itemSnap.exists) {
      throw createError({ statusCode: 409, message: 'This product is no longer in stock.' })
    }

    const itemData = itemSnap.data() as Record<string, unknown>
    const folder = (folderSnap.exists ? folderSnap.data() : null) as {
      hasSerialNumbers?: boolean
      template?: { fields?: Array<{ name?: string }> }
    } | null
    const usesSerial = !!folder?.hasSerialNumbers
    const existingPending = String(itemData.pendingSaleReceiptId || '')

    if (usesSerial) {
      if (itemData.dateOut || itemData.sellerLoanOutId) {
        throw createError({ statusCode: 409, message: 'This item is no longer available.' })
      }
      if (existingPending && existingPending !== paymentLinkPendingId(String(liveInquiry.paymentLinkToken || ''))) {
        throw createError({
          statusCode: 409,
          message: 'This item is reserved for another checkout.',
        })
      }
    } else {
      const resolved = resolveBulkStockFieldAndValueFromMap(itemData, folder?.template?.fields)
      if ((resolved?.value ?? 0) < 1) {
        throw createError({ statusCode: 409, message: 'This item is out of stock.' })
      }
      if (existingPending && existingPending !== paymentLinkPendingId(String(liveInquiry.paymentLinkToken || ''))) {
        throw createError({
          statusCode: 409,
          message: 'This item is reserved for another checkout.',
        })
      }
    }

    const unitPrice = resolvePaymentLinkItemPrice(itemData)
    amountKobo = nairaToKobo(unitPrice)
    if (amountKobo <= 0) {
      throw createError({ statusCode: 400, message: 'This product has no valid price for checkout.' })
    }

    const lockedItems: PaymentLinkItem[] = [
      {
        itemId,
        folderId,
        name: resolvePaymentLinkItemName(itemData),
        unitPrice,
        quantity: 1,
      },
    ]

    tx.set(linkRef, {
      token,
      ownerUserId: params.ownerUserId,
      storeId: params.storeId,
      businessName: params.businessName,
      invoiceNumber,
      customerName: liveInquiry.customerName,
      customerPhone: liveInquiry.customerPhone || '',
      customerEmail: '',
      items: lockedItems,
      amount: amountKobo,
      currency: PAYMENT_LINK_CURRENCY,
      status: 'unpaid',
      inventoryApplied: false,
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: params.createdByUid,
      source: 'storefront',
      storefrontSlug: slug,
      storefrontListingId: listingId,
      storefrontInquiryId: params.inquiryId,
    })

    tx.update(itemRef, {
      pendingSaleReceiptId: pendingId,
      pendingSaleAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    tx.update(listingRef, {
      availability: 'reserved',
      reservationInquiryId: params.inquiryId,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const inquiryPatch: Record<string, unknown> = {
      paymentLinkToken: token,
      paymentLinkStatus: 'unpaid',
      paymentLinkInvoiceNumber: invoiceNumber,
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (liveInquiry.status === 'pending') {
      inquiryPatch.status = 'confirmed'
    }
    tx.update(inquiryRef, inquiryPatch)
  })

  return { token, invoiceNumber, amountKobo, reused: false }
}

/**
 * Release a storefront soft-hold created by checkout (`reservationInquiryId = pay:{token}`),
 * and clear matching inventory pending locks (`paylink:{token}`).
 */
export async function releaseStorefrontCheckoutHold(
  adminDb: Firestore,
  link: PaymentLinkDoc
): Promise<void> {
  const token = String(link.token || '').trim()
  const slug = String(link.storefrontSlug || '').trim()
  const listingId = String(link.storefrontListingId || '').trim()
  if (!token) return

  const pendingId = paymentLinkPendingId(token)
  const reservationId = storefrontCheckoutReservationId(token)
  const ownerUserId = String(link.ownerUserId || '').trim()
  const storeId = String(link.storeId || '').trim()

  await adminDb.runTransaction(async (tx) => {
    const listingRef =
      slug && listingId
        ? adminDb.collection('storefrontListings').doc(slug).collection('items').doc(listingId)
        : null

    const storeRef =
      ownerUserId && storeId
        ? adminDb.collection('users').doc(ownerUserId).collection('stores').doc(storeId)
        : null

    const items = Array.isArray(link.items) ? link.items : []
    const itemRefs = storeRef
      ? items
          .map((it) => String(it.itemId || '').trim())
          .filter(Boolean)
          .map((itemId) => storeRef.collection('inventoryItems').doc(itemId))
      : []

    // READ PHASE (all reads before any writes)
    const listingSnap = listingRef ? await tx.get(listingRef) : null
    const itemSnaps = await Promise.all(itemRefs.map((ref) => tx.get(ref)))

    // WRITE PHASE
    if (listingSnap?.exists && listingRef) {
      const listing = listingSnap.data() as StorefrontPublicListing
      if (listing.reservationInquiryId === reservationId) {
        tx.update(listingRef, {
          availability: 'available',
          reservationInquiryId: null,
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
    }

    for (const itemSnap of itemSnaps) {
      if (!itemSnap.exists) continue
      const data = itemSnap.data() as Record<string, unknown>
      if (String(data.pendingSaleReceiptId || '') !== pendingId) continue
      tx.update(itemSnap.ref, {
        pendingSaleReceiptId: FieldValue.delete(),
        pendingSaleAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
  })
}
