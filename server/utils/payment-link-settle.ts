import type { Firestore } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import {
  koboToNaira,
  type PaymentLinkDoc,
  type PaymentLinkItem,
} from '~/server/utils/payment-links'

export interface SettleResult {
  settled: boolean
  alreadyProcessed: boolean
  receiptId?: string
}

/**
 * Atomically settle a paid payment link:
 *  - idempotent (no-op if already applied)
 *  - validates the amount actually paid (kobo) against the locked link amount
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

    // Amount must match what was locked at link creation.
    if (Number(opts.paidAmountKobo) !== Number(link.amount)) {
      // Record the mismatch but do not silently fulfill.
      tx.update(linkRef, {
        status: 'failed',
        reference: opts.reference,
        updatedAt: FieldValue.serverTimestamp(),
      })
      return { settled: false, alreadyProcessed: false }
    }

    const ownerUserId = link.ownerUserId
    const storeId = link.storeId
    const items: PaymentLinkItem[] = Array.isArray(link.items) ? link.items : []

    const storeRef = adminDb.collection('users').doc(ownerUserId).collection('stores').doc(storeId)

    // --- READ PHASE ---------------------------------------------------------
    // Folder docs (for serial vs bulk + template quantity field).
    const folderIds = [...new Set(items.map((i) => i.folderId).filter(Boolean))]
    const folderData = new Map<string, Record<string, unknown>>()
    for (const fid of folderIds) {
      const fSnap = await tx.get(storeRef.collection('inventoryFolders').doc(fid))
      if (fSnap.exists) folderData.set(fid, fSnap.data() as Record<string, unknown>)
    }

    // Inventory item docs.
    const itemSnaps = new Map<string, FirebaseFirestore.DocumentSnapshot>()
    for (const it of items) {
      if (!it.itemId) continue
      const snap = await tx.get(storeRef.collection('inventoryItems').doc(it.itemId))
      itemSnaps.set(it.itemId, snap)
    }

    // --- WRITE PHASE --------------------------------------------------------
    for (const it of items) {
      const snap = itemSnaps.get(it.itemId)
      if (!snap || !snap.exists) continue
      const folder = folderData.get(it.folderId) as
        | { hasSerialNumbers?: boolean; template?: { fields?: Array<{ name?: string }> } }
        | undefined
      const usesSerial = !!folder?.hasSerialNumbers

      if (usesSerial) {
        tx.update(snap.ref, {
          dateOut: FieldValue.serverTimestamp(),
          pendingSaleReceiptId: FieldValue.delete(),
          pendingSaleAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        })
      } else {
        const raw = snap.data() as Record<string, unknown>
        const resolved = resolveBulkStockFieldAndValueFromMap(raw, folder?.template?.fields)
        if (!resolved) continue
        const newQty = Math.max(0, resolved.value - (Number(it.quantity) || 0))
        const update: Record<string, unknown> = {
          [resolved.fieldKey]: newQty,
          pendingSaleReceiptId: FieldValue.delete(),
          pendingSaleAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        }
        if (newQty <= 0) update.dateOut = FieldValue.serverTimestamp()
        tx.update(snap.ref, update)
      }
    }

    // Create the completed receipt.
    const receiptRef = storeRef.collection('receipts').doc()
    const totalNaira = koboToNaira(Number(link.amount))
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
      source: 'payment_link',
      paymentReference: opts.reference,
      paymentChannel: opts.channel || 'card',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: ownerUserId,
    })

    tx.update(linkRef, {
      status: 'paid',
      reference: opts.reference,
      channel: opts.channel || 'card',
      receiptId: receiptRef.id,
      inventoryApplied: true,
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return { settled: true, alreadyProcessed: false, receiptId: receiptRef.id }
  })
}
