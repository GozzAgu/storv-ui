import type { Firestore } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import type { PaymentLinkDoc, PaymentLinkItem } from '~/server/utils/payment-links'
import { paymentLinkPendingId } from '~/server/utils/payment-links'

export interface SettleResult {
  settled: boolean
  alreadyProcessed: boolean
  receiptId?: string
  /** Set when Paystack paid but inventory could not be applied (needs merchant follow-up). */
  settleError?: string
}

export type InventorySettleBlockReason = 'already_sold' | 'held_by_other' | 'insufficient_stock' | 'missing_item'

/**
 * Pure guard used by settle + tests: can this payment-link line deduct stock?
 */
export function evaluatePaymentLinkItemStock(params: {
  token: string
  item: PaymentLinkItem
  itemData: Record<string, unknown> | null | undefined
  folder:
    | { hasSerialNumbers?: boolean; template?: { fields?: Array<{ name?: string }> } }
    | null
    | undefined
}): { ok: true; usesSerial: boolean; fieldKey?: string; newQty?: number } | {
  ok: false
  reason: InventorySettleBlockReason
} {
  const { token, item, itemData, folder } = params
  if (!itemData) return { ok: false, reason: 'missing_item' }

  const qty = Math.max(0, Math.floor(Number(item.quantity) || 0))
  if (qty <= 0) return { ok: false, reason: 'insufficient_stock' }

  const usesSerial = !!folder?.hasSerialNumbers
  const ourPending = paymentLinkPendingId(token)
  const pending = String(itemData.pendingSaleReceiptId || '')

  if (usesSerial) {
    if (itemData.dateOut) return { ok: false, reason: 'already_sold' }
    if (pending && pending !== ourPending) return { ok: false, reason: 'held_by_other' }
    return { ok: true, usesSerial: true }
  }

  const resolved = resolveBulkStockFieldAndValueFromMap(itemData, folder?.template?.fields)
  if (!resolved) return { ok: false, reason: 'insufficient_stock' }
  if (resolved.value < qty) return { ok: false, reason: 'insufficient_stock' }
  // Another unpaid hold on this line (e.g. storefront checkout) that is not ours.
  if (pending && pending !== ourPending) return { ok: false, reason: 'held_by_other' }

  return {
    ok: true,
    usesSerial: false,
    fieldKey: resolved.fieldKey,
    newQty: resolved.value - qty,
  }
}

/**
 * Atomically settle a paid payment link:
 *  - idempotent (no-op if already applied)
 *  - validates the amount actually paid (kobo) against the locked link amount
 *  - refuses already-sold / insufficient / foreign-held stock (no silent oversell)
 *  - deducts inventory stock (serial: set dateOut, bulk: decrement quantity)
 *  - creates a completed receipt
 *
 * Mirrors the reverse of server/api/receipts/delete.post.ts. All reads happen
 * before any writes (Firestore transaction requirement).
 */
export async function settlePaymentLink(
  adminDb: Firestore,
  token: string,
  opts: { paidAmountKobo: number; reference: string; channel?: string }
): Promise<SettleResult> {
  const linkRef = adminDb.collection('paymentLinks').doc(token)

  return adminDb.runTransaction<SettleResult>(async (tx) => {
    const linkSnap = await tx.get(linkRef)
    if (!linkSnap.exists) {
      return { settled: false, alreadyProcessed: false }
    }
    const link = linkSnap.data() as PaymentLinkDoc

    if (link.reference && link.reference !== opts.reference) {
      return { settled: false, alreadyProcessed: false }
    }

    // Idempotency: webhook + verify may both fire.
    if (link.status === 'paid' && link.inventoryApplied) {
      return { settled: true, alreadyProcessed: true, receiptId: link.receiptId }
    }
    if (link.status === 'paid' && link.settleError) {
      return {
        settled: false,
        alreadyProcessed: true,
        receiptId: link.receiptId,
        settleError: link.settleError,
      }
    }

    // Amount must match what was locked at link creation.
    if (Number(opts.paidAmountKobo) !== Number(link.amount)) {
      tx.update(linkRef, {
        status: 'failed',
        reference: opts.reference,
        settleError: 'amount_mismatch',
        updatedAt: FieldValue.serverTimestamp(),
      })
      return { settled: false, alreadyProcessed: false, settleError: 'amount_mismatch' }
    }

    const ownerUserId = link.ownerUserId
    const storeId = link.storeId
    const items: PaymentLinkItem[] = Array.isArray(link.items) ? link.items : []

    const storeRef = adminDb.collection('users').doc(ownerUserId).collection('stores').doc(storeId)

    // --- READ PHASE ---------------------------------------------------------
    const folderIds = [...new Set(items.map((i) => i.folderId).filter(Boolean))]
    const folderData = new Map<string, Record<string, unknown>>()
    for (const fid of folderIds) {
      const fSnap = await tx.get(storeRef.collection('inventoryFolders').doc(fid))
      if (fSnap.exists) folderData.set(fid, fSnap.data() as Record<string, unknown>)
    }

    const itemSnaps = new Map<string, FirebaseFirestore.DocumentSnapshot>()
    for (const it of items) {
      if (!it.itemId) continue
      const snap = await tx.get(storeRef.collection('inventoryItems').doc(it.itemId))
      itemSnaps.set(it.itemId, snap)
    }

    const sfSlug = String(link.storefrontSlug || '').trim()
    const sfListingId = String(link.storefrontListingId || '').trim()
    const inquiryId = String(link.storefrontInquiryId || '').trim()
    let listingRef: FirebaseFirestore.DocumentReference | null = null
    let listingExists = false
    if (sfSlug && sfListingId) {
      listingRef = adminDb
        .collection('storefrontListings')
        .doc(sfSlug)
        .collection('items')
        .doc(sfListingId)
      const listingSnap = await tx.get(listingRef)
      listingExists = listingSnap.exists
    }

    let inquiryRef: FirebaseFirestore.DocumentReference | null = null
    let inquiryExists = false
    if (inquiryId) {
      inquiryRef = storeRef.collection('storefrontInquiries').doc(inquiryId)
      const inquirySnap = await tx.get(inquiryRef)
      inquiryExists = inquirySnap.exists
    }

    // --- STOCK GUARDS -------------------------------------------------------
    const plans: Array<{
      item: PaymentLinkItem
      snap: FirebaseFirestore.DocumentSnapshot
      eval: Extract<ReturnType<typeof evaluatePaymentLinkItemStock>, { ok: true }>
    }> = []

    for (const it of items) {
      const snap = itemSnaps.get(it.itemId)
      const folder = folderData.get(it.folderId) as
        | { hasSerialNumbers?: boolean; template?: { fields?: Array<{ name?: string }> } }
        | undefined
      const verdict = evaluatePaymentLinkItemStock({
        token,
        item: it,
        itemData: snap?.exists ? (snap.data() as Record<string, unknown>) : null,
        folder,
      })
      if (!verdict.ok) {
        tx.update(linkRef, {
          status: 'paid',
          reference: opts.reference,
          channel: opts.channel || 'card',
          inventoryApplied: false,
          settleError: verdict.reason,
          paidAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        if (listingRef && listingExists) {
          // Public catalogue must not keep showing this as buyable/reserved for this token.
          tx.update(listingRef, {
            availability: 'unavailable',
            reservationInquiryId: null,
            updatedAt: FieldValue.serverTimestamp(),
          })
        }
        return {
          settled: false,
          alreadyProcessed: false,
          settleError: verdict.reason,
        }
      }
      if (!snap) continue
      plans.push({ item: it, snap, eval: verdict })
    }

    // --- WRITE PHASE --------------------------------------------------------
    for (const plan of plans) {
      const { item: it, snap, eval: verdict } = plan
      if (verdict.usesSerial) {
        tx.update(snap.ref, {
          dateOut: FieldValue.serverTimestamp(),
          pendingSaleReceiptId: FieldValue.delete(),
          pendingSaleAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        })
      } else if (verdict.fieldKey != null && verdict.newQty != null) {
        const update: Record<string, unknown> = {
          [verdict.fieldKey]: verdict.newQty,
          pendingSaleReceiptId: FieldValue.delete(),
          pendingSaleAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        }
        if (verdict.newQty <= 0) update.dateOut = FieldValue.serverTimestamp()
        tx.update(snap.ref, update)
      }
    }

    const receiptRef = storeRef.collection('receipts').doc()
    const totalNaira = Math.round(Number(link.amount) || 0) / 100
    const receiptItems = items.map((it) => ({
      itemId: it.itemId,
      quantity: Number(it.quantity) || 0,
      price: Number(it.unitPrice) || 0,
      itemName: it.name,
    }))
    tx.set(receiptRef, {
      receiptNumber: link.invoiceNumber,
      customerName: link.customerName || 'Online customer',
      customerEmail: link.customerEmail || '',
      customerPhone: link.customerPhone || '',
      date: FieldValue.serverTimestamp(),
      items: receiptItems,
      itemsCount: receiptItems.reduce((s, r) => s + r.quantity, 0),
      total: totalNaira,
      paymentMethod: 'Paystack',
      status: 'completed',
      folderId: items[0]?.folderId || '',
      itemIds: items.map((i) => i.itemId),
      storeId,
      source: link.source === 'storefront' ? 'storefront' : 'payment_link',
      paymentReference: opts.reference,
      paymentChannel: opts.channel || 'card',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: ownerUserId,
    })

    if (listingRef && listingExists) {
      tx.update(listingRef, {
        availability: 'unavailable',
        reservationInquiryId: null,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    if (inquiryRef && inquiryExists) {
      tx.update(inquiryRef, {
        paymentLinkStatus: 'paid',
        paymentLinkToken: token,
        receiptId: receiptRef.id,
        receiptNumber: link.invoiceNumber,
        // Stay confirmed so merchant can Mark complete; inventory already applied.
        status: 'confirmed',
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    tx.update(linkRef, {
      status: 'paid',
      reference: opts.reference,
      channel: opts.channel || 'card',
      receiptId: receiptRef.id,
      inventoryApplied: true,
      settleError: FieldValue.delete(),
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return { settled: true, alreadyProcessed: false, receiptId: receiptRef.id }
  })
}
