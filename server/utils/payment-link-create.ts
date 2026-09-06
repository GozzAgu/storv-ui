import { createError } from 'h3'
import type { Firestore } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import {
  generatePaymentToken,
  nairaToKobo,
  payoutDocId,
  PAYMENT_LINK_CURRENCY,
  PAYMENT_LINK_TTL_MINUTES,
  type PaymentLinkItem,
} from '~/server/utils/payment-links'

const PRICE_FIELDS = ['price', 'Price', 'PRICE', 'cost', 'Cost', 'COST']

export function resolvePaymentLinkItemPrice(data: Record<string, unknown>): number {
  for (const f of PRICE_FIELDS) {
    if (data[f] !== undefined && data[f] !== null && data[f] !== '') {
      const n = parseFloat(String(data[f]))
      if (!Number.isNaN(n)) return n
    }
  }
  return 0
}

export function resolvePaymentLinkItemName(data: Record<string, unknown>): string {
  return String(data.name || data.Name || data.itemName || 'Item')
}

export function makePaymentLinkInvoiceNumber(): string {
  return `PL-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random()
    .toString(36)
    .toUpperCase()
    .slice(2, 4)}`
}

export async function assertMerchantPayoutConnected(
  adminDb: Firestore,
  ownerUserId: string,
  storeId: string
): Promise<void> {
  const payoutSnap = await adminDb
    .collection('merchantPayouts')
    .doc(payoutDocId(ownerUserId, storeId))
    .get()
  if (!payoutSnap.exists || !payoutSnap.data()?.subaccountCode) {
    throw createError({
      statusCode: 400,
      message: 'Connect a payout account before accepting online payments',
    })
  }
}

export async function merchantPayoutIsConnected(
  adminDb: Firestore,
  ownerUserId: string,
  storeId: string
): Promise<boolean> {
  const payoutSnap = await adminDb
    .collection('merchantPayouts')
    .doc(payoutDocId(ownerUserId, storeId))
    .get()
  return Boolean(payoutSnap.exists && payoutSnap.data()?.subaccountCode)
}

export type LockPaymentLinkItemsInput = {
  itemId: string
  folderId: string
  quantity: number
}

/**
 * Server-locks inventory lines for a payment link (price + stock checks).
 */
export async function lockPaymentLinkItems(
  adminDb: Firestore,
  ownerUserId: string,
  storeId: string,
  incoming: LockPaymentLinkItemsInput[]
): Promise<{ lockedItems: PaymentLinkItem[]; amountKobo: number }> {
  const storeRef = adminDb.collection('users').doc(ownerUserId).collection('stores').doc(storeId)
  const folderCache = new Map<string, Record<string, unknown> | null>()

  const getFolder = async (fid: string) => {
    if (folderCache.has(fid)) return folderCache.get(fid)!
    const snap = await storeRef.collection('inventoryFolders').doc(fid).get()
    const data = snap.exists ? (snap.data() as Record<string, unknown>) : null
    folderCache.set(fid, data)
    return data
  }

  const lockedItems: PaymentLinkItem[] = []
  let amountKobo = 0

  for (const it of incoming) {
    const itemId = (it.itemId || '').trim()
    const folderId = (it.folderId || '').trim()
    const quantity = Math.max(0, Math.floor(Number(it.quantity) || 0))
    if (!itemId || !folderId || quantity <= 0) continue

    const itemSnap = await storeRef.collection('inventoryItems').doc(itemId).get()
    if (!itemSnap.exists) {
      throw createError({ statusCode: 404, message: `Item ${itemId} not found` })
    }
    const data = itemSnap.data() as Record<string, unknown>

    const folder = (await getFolder(folderId)) as {
      hasSerialNumbers?: boolean
      template?: { fields?: Array<{ name?: string }> }
    } | null
    const usesSerial = !!folder?.hasSerialNumbers
    if (usesSerial) {
      if (data.dateOut || data.pendingSaleReceiptId || data.sellerLoanOutId) {
        throw createError({
          statusCode: 409,
          message: `"${resolvePaymentLinkItemName(data)}" is no longer available`,
        })
      }
      if (quantity !== 1) {
        throw createError({ statusCode: 400, message: `Serialized items must have quantity 1` })
      }
    } else {
      const resolved = resolveBulkStockFieldAndValueFromMap(data, folder?.template?.fields)
      const available = resolved?.value ?? 0
      if (available < quantity) {
        throw createError({
          statusCode: 409,
          message: `Not enough stock for "${resolvePaymentLinkItemName(data)}" (${available} left)`,
        })
      }
    }

    const unitPrice = resolvePaymentLinkItemPrice(data)
    lockedItems.push({
      itemId,
      folderId,
      name: resolvePaymentLinkItemName(data),
      unitPrice,
      quantity,
    })
    amountKobo += nairaToKobo(unitPrice) * quantity
  }

  if (lockedItems.length === 0 || amountKobo <= 0) {
    throw createError({ statusCode: 400, message: 'No valid items to charge for' })
  }

  return { lockedItems, amountKobo }
}

export type CreateLockedPaymentLinkParams = {
  adminDb: Firestore
  ownerUserId: string
  storeId: string
  businessName: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  lockedItems: PaymentLinkItem[]
  amountKobo: number
  createdBy: string
  source?: 'dashboard' | 'storefront'
  storefrontSlug?: string
  storefrontListingId?: string
  storefrontInquiryId?: string
}

export async function writeLockedPaymentLink(
  params: CreateLockedPaymentLinkParams
): Promise<{ token: string; invoiceNumber: string; amountKobo: number }> {
  const token = generatePaymentToken()
  const invoiceNumber = makePaymentLinkInvoiceNumber()
  const expiresAt = new Date(Date.now() + PAYMENT_LINK_TTL_MINUTES * 60 * 1000)

  await params.adminDb.collection('paymentLinks').doc(token).set({
    token,
    ownerUserId: params.ownerUserId,
    storeId: params.storeId,
    businessName: params.businessName,
    invoiceNumber,
    customerName: params.customerName,
    customerPhone: params.customerPhone || '',
    customerEmail: params.customerEmail || '',
    items: params.lockedItems,
    amount: params.amountKobo,
    currency: PAYMENT_LINK_CURRENCY,
    status: 'unpaid',
    inventoryApplied: false,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: params.createdBy,
    source: params.source || 'dashboard',
    ...(params.storefrontSlug ? { storefrontSlug: params.storefrontSlug } : {}),
    ...(params.storefrontListingId ? { storefrontListingId: params.storefrontListingId } : {}),
    ...(params.storefrontInquiryId ? { storefrontInquiryId: params.storefrontInquiryId } : {}),
  })

  return { token, invoiceNumber, amountKobo: params.amountKobo }
}
