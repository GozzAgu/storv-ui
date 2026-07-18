import { createError, defineEventHandler, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth, requireStoreManageAccess } from '~/server/utils/store-auth'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import {
  generatePaymentToken,
  nairaToKobo,
  payoutDocId,
  PAYMENT_LINK_CURRENCY,
  PAYMENT_LINK_TTL_MINUTES,
  type PaymentLinkItem,
} from '~/server/utils/payment-links'

interface IncomingItem {
  itemId?: string
  folderId?: string
  quantity?: number
}
interface Body {
  ownerUserId?: string
  storeId?: string
  businessName?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  items?: IncomingItem[]
}

const PRICE_FIELDS = ['price', 'Price', 'PRICE', 'cost', 'Cost', 'COST']

function resolveItemPrice(data: Record<string, unknown>): number {
  for (const f of PRICE_FIELDS) {
    if (data[f] !== undefined && data[f] !== null && data[f] !== '') {
      const n = parseFloat(String(data[f]))
      if (!Number.isNaN(n)) return n
    }
  }
  return 0
}

function resolveItemName(data: Record<string, unknown>): string {
  return String(data.name || data.Name || data.itemName || 'Item')
}

function makeInvoiceNumber(): string {
  return `PL-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.random()
    .toString(36)
    .toUpperCase()
    .slice(2, 4)}`
}

/**
 * Authenticated (owner/manager): create a payment link. Prices and stock are
 * read server-side from inventory; the amount is locked and cannot be tampered
 * with from the client.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody<Body>(event)

  const ownerUserId = (body.ownerUserId || '').trim()
  const storeId = (body.storeId || '').trim()
  const customerName = (body.customerName || '').trim()
  const customerPhone = (body.customerPhone || '').trim()
  const customerEmail = (body.customerEmail || '').trim()
  const incoming = Array.isArray(body.items) ? body.items : []

  if (!ownerUserId || !storeId) {
    throw createError({ statusCode: 400, message: 'ownerUserId and storeId are required' })
  }
  if (!customerName) {
    throw createError({ statusCode: 400, message: 'Customer name is required' })
  }
  if (incoming.length === 0) {
    throw createError({ statusCode: 400, message: 'At least one item is required' })
  }

  await requireStoreManageAccess(auth.uid, ownerUserId, storeId)

  const adminDb = getAdminFirestore()

  // Require a connected payout account.
  const payoutSnap = await adminDb
    .collection('merchantPayouts')
    .doc(payoutDocId(ownerUserId, storeId))
    .get()
  if (!payoutSnap.exists || !payoutSnap.data()?.subaccountCode) {
    throw createError({
      statusCode: 400,
      message: 'Connect a payout account before creating payment links',
    })
  }

  const storeRef = adminDb.collection('users').doc(ownerUserId).collection('stores').doc(storeId)

  // Cache folder docs for serial/bulk + template.
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

    // Availability + stock check.
    const folder = (await getFolder(folderId)) as {
      hasSerialNumbers?: boolean
      template?: { fields?: Array<{ name?: string }> }
    } | null
    const usesSerial = !!folder?.hasSerialNumbers
    if (usesSerial) {
      if (data.dateOut || data.pendingSaleReceiptId || data.sellerLoanOutId) {
        throw createError({
          statusCode: 409,
          message: `"${resolveItemName(data)}" is no longer available`,
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
          message: `Not enough stock for "${resolveItemName(data)}" (${available} left)`,
        })
      }
    }

    const unitPrice = resolveItemPrice(data)
    lockedItems.push({ itemId, folderId, name: resolveItemName(data), unitPrice, quantity })
    amountKobo += nairaToKobo(unitPrice) * quantity
  }

  if (lockedItems.length === 0 || amountKobo <= 0) {
    throw createError({ statusCode: 400, message: 'No valid items to charge for' })
  }

  // Resolve business name (account-level).
  let businessName = (body.businessName || '').trim()
  if (!businessName) {
    const ownerSnap = await adminDb.collection('users').doc(ownerUserId).get()
    businessName = String(ownerSnap.data()?.name || 'Storvv merchant')
  }

  const token = generatePaymentToken()
  const invoiceNumber = makeInvoiceNumber()
  const expiresAt = new Date(Date.now() + PAYMENT_LINK_TTL_MINUTES * 60 * 1000)

  await adminDb.collection('paymentLinks').doc(token).set({
    token,
    ownerUserId,
    storeId,
    businessName,
    invoiceNumber,
    customerName,
    customerPhone,
    customerEmail,
    items: lockedItems,
    amount: amountKobo,
    currency: PAYMENT_LINK_CURRENCY,
    status: 'unpaid',
    inventoryApplied: false,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: auth.uid,
  })

  const origin = getRequestURL(event).origin
  return {
    success: true,
    token,
    invoiceNumber,
    amount: amountKobo,
    url: `${origin}/pay/${token}`,
  }
})
