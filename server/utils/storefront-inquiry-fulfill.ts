import { createError } from 'h3'
import { FieldValue, type DocumentReference, type Transaction } from 'firebase-admin/firestore'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import type { StorefrontInquiry } from '~/types/storefront'

export function makeStorefrontInquiryReceiptNumber(): string {
  return `SF-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random()
    .toString(36)
    .toUpperCase()
    .slice(2, 4)}`
}

export type InquiryFulfillReads = {
  itemRef: DocumentReference
  itemData: Record<string, unknown>
  folderId: string
  usesSerial: boolean
  folderTemplateFields?: Array<{ name?: string }>
}

/**
 * Read inventory docs needed to fulfill an inquiry sale.
 * Must run in the transaction read phase (before any writes).
 */
export async function readInquiryFulfillInventory(
  tx: Transaction,
  storeRef: DocumentReference,
  inquiry: StorefrontInquiry,
  listingSourceFolderId?: string
): Promise<InquiryFulfillReads> {
  const sourceItemId = String(inquiry.sourceItemId || '').trim()
  if (!sourceItemId) {
    throw createError({
      statusCode: 400,
      message: 'This inquiry has no linked inventory item, so it cannot create a sale.',
    })
  }

  const folderId = String(
    inquiry.sourceFolderId || listingSourceFolderId || ''
  ).trim()
  if (!folderId) {
    throw createError({
      statusCode: 400,
      message: 'Missing inventory category for this inquiry.',
    })
  }

  const folderRef = storeRef.collection('inventoryFolders').doc(folderId)
  const itemRef = storeRef.collection('inventoryItems').doc(sourceItemId)
  const [folderSnap, itemSnap] = await Promise.all([tx.get(folderRef), tx.get(itemRef)])

  if (!itemSnap.exists) {
    throw createError({
      statusCode: 409,
      message: 'Linked inventory item was not found. It may have been deleted.',
    })
  }

  const folder = (folderSnap.exists ? folderSnap.data() : null) as
    | { hasSerialNumbers?: boolean; template?: { fields?: Array<{ name?: string }> } }
    | null
  const usesSerial = !!folder?.hasSerialNumbers
  const itemData = itemSnap.data() as Record<string, unknown>

  if (usesSerial) {
    if (itemData.dateOut) {
      throw createError({
        statusCode: 409,
        message: 'This item is already marked sold in inventory.',
      })
    }
  } else {
    const resolved = resolveBulkStockFieldAndValueFromMap(
      itemData,
      folder?.template?.fields
    )
    if (!resolved) {
      throw createError({
        statusCode: 409,
        message: 'Could not read stock quantity for this item.',
      })
    }
    if (resolved.value < 1) {
      throw createError({
        statusCode: 409,
        message: 'This item is out of stock in private inventory.',
      })
    }
  }

  return {
    itemRef,
    itemData,
    folderId,
    usesSerial,
    folderTemplateFields: folder?.template?.fields,
  }
}

export type InquiryFulfillWriteResult = {
  receiptId: string
  receiptNumber: string
  total: number
}

/**
 * Decrement private inventory and create a completed receipt for a storefront inquiry.
 * Call only after reads; keeps qty at 1 (same as storefront checkout).
 */
export function writeInquiryFulfillSale(
  tx: Transaction,
  params: {
    storeRef: DocumentReference
    storeId: string
    ownerUserId: string
    createdByUid: string
    inquiryId: string
    inquiry: StorefrontInquiry
    inventory: InquiryFulfillReads
  }
): InquiryFulfillWriteResult {
  const { storeRef, storeId, ownerUserId, createdByUid, inquiryId, inquiry, inventory } =
    params
  const quantity = 1
  const unitPrice =
    inquiry.listingPrice != null && Number.isFinite(Number(inquiry.listingPrice))
      ? Number(inquiry.listingPrice)
      : Number(inventory.itemData.price) || 0
  const itemName =
    String(inquiry.listingTitle || '').trim() ||
    String(inventory.itemData.name || inventory.itemData.Name || 'Item')

  if (inventory.usesSerial) {
    tx.update(inventory.itemRef, {
      dateOut: FieldValue.serverTimestamp(),
      pendingSaleReceiptId: FieldValue.delete(),
      pendingSaleAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  } else {
    const resolved = resolveBulkStockFieldAndValueFromMap(
      inventory.itemData,
      inventory.folderTemplateFields
    )
    if (!resolved) {
      throw createError({
        statusCode: 409,
        message: 'Could not read stock quantity for this item.',
      })
    }
    const newQty = resolved.value - quantity
    if (newQty < 0) {
      throw createError({
        statusCode: 409,
        message: 'This item is out of stock in private inventory.',
      })
    }
    const update: Record<string, unknown> = {
      [resolved.fieldKey]: newQty,
      pendingSaleReceiptId: FieldValue.delete(),
      pendingSaleAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (newQty <= 0) update.dateOut = FieldValue.serverTimestamp()
    tx.update(inventory.itemRef, update)
  }

  const receiptRef = storeRef.collection('receipts').doc()
  const receiptNumber = makeStorefrontInquiryReceiptNumber()
  const noteParts = [
    inquiry.customerNote ? `Guest note: ${inquiry.customerNote}` : '',
    `Storefront ${inquiry.type} inquiry ${inquiryId}`,
  ].filter(Boolean)

  tx.set(receiptRef, {
    receiptNumber,
    customerName: inquiry.customerName || 'Storefront customer',
    customerEmail: '',
    customerPhone: inquiry.customerPhone || '',
    date: FieldValue.serverTimestamp(),
    items: [
      {
        itemId: inventory.itemRef.id,
        quantity,
        price: unitPrice,
        itemName,
        folderId: inventory.folderId,
      },
    ],
    itemsCount: quantity,
    total: unitPrice * quantity,
    paymentMethod: 'Storefront',
    status: 'completed',
    notes: noteParts.join(' · '),
    folderId: inventory.folderId,
    itemIds: [inventory.itemRef.id],
    storeId,
    source: 'storefront_inquiry',
    storefrontInquiryId: inquiryId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    // Sales list queries createdBy == owner UID (same as POS / payment-link settle).
    createdBy: ownerUserId,
    ...(createdByUid && createdByUid !== ownerUserId ? { actualCreator: createdByUid } : {}),
  })

  return {
    receiptId: receiptRef.id,
    receiptNumber,
    total: unitPrice * quantity,
    folderId: inventory.folderId,
  }
}
