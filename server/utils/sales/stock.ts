import {
  FieldValue,
  type DocumentReference,
  type DocumentSnapshot,
  type Transaction,
} from 'firebase-admin/firestore'
import type { InventoryFolder } from '~/stores/inventory'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'

/**
 * Stock moves that undo a sale, planned inside a transaction: every read happens in the plan
 * function and `apply` only writes, so callers can read everything first as Firestore requires.
 */

export interface StockWritePlan {
  apply: (tx: Transaction) => void
  /** Rows the plan changes. */
  count: number
}

interface SaleLine {
  itemId: string
  folderId: string
  quantity: number
}

const ID = /^[A-Za-z0-9_-]{1,128}$/

/** Lines of a receipt with their category, using the receipt's folder when a line has none. */
export function receiptSaleLines(receipt: Record<string, unknown>): SaleLine[] {
  const folderIds = Array.isArray(receipt.folderIds) ? receipt.folderIds.filter(Boolean) : []
  const fallback =
    typeof receipt.folderId === 'string' && receipt.folderId
      ? receipt.folderId
      : folderIds.length === 1
      ? String(folderIds[0])
      : ''
  const out: SaleLine[] = []
  const items = Array.isArray(receipt.items) ? receipt.items.slice(0, 500) : []
  for (const raw of items) {
    const line = raw as Record<string, unknown>
    const itemId = typeof line.itemId === 'string' ? line.itemId : ''
    if (!ID.test(itemId)) continue
    const folderId = typeof line.folderId === 'string' && line.folderId ? line.folderId : fallback
    out.push({
      itemId,
      folderId: ID.test(folderId) ? folderId : '',
      quantity: Math.max(1, Math.floor(Number(line.quantity) || 1)),
    })
  }
  if (out.length === 0 && Array.isArray(receipt.itemIds)) {
    for (const id of receipt.itemIds) {
      if (typeof id === 'string' && ID.test(id)) out.push({ itemId: id, folderId: fallback, quantity: 1 })
    }
  }
  return out
}

async function readLines(tx: Transaction, store: DocumentReference, lines: SaleLine[]) {
  const folderIds = [...new Set(lines.map((l) => l.folderId).filter(Boolean))]
  const itemIds = [...new Set(lines.map((l) => l.itemId))]
  const [folderSnaps, itemSnaps] = await Promise.all([
    folderIds.length
      ? tx.getAll(...folderIds.map((id) => store.collection('inventoryFolders').doc(id)))
      : Promise.resolve([] as DocumentSnapshot[]),
    itemIds.length
      ? tx.getAll(...itemIds.map((id) => store.collection('inventoryItems').doc(id)))
      : Promise.resolve([] as DocumentSnapshot[]),
  ])
  return {
    folders: new Map(folderSnaps.map((s) => [s.id, s.data() as InventoryFolder | undefined])),
    items: new Map(itemSnaps.map((s) => [s.id, s])),
  }
}

/**
 * Puts a completed sale's stock back (refund): serial rows lose `dateOut`, bulk rows get their
 * units back. Rows that are gone are skipped.
 */
export async function planStockReturn(
  tx: Transaction,
  store: DocumentReference,
  receipt: Record<string, unknown>
): Promise<StockWritePlan> {
  const lines = receiptSaleLines(receipt)
  const { folders, items } = await readLines(tx, store, lines)
  const add = new Map<string, number>()
  const serial = new Set<string>()
  const folderOf = new Map<string, InventoryFolder | undefined>()
  for (const line of lines) {
    const folder = folders.get(line.folderId)
    folderOf.set(line.itemId, folder)
    if (folderHasSerialNumbers(folder)) serial.add(line.itemId)
    else add.set(line.itemId, (add.get(line.itemId) ?? 0) + line.quantity)
  }

  const writes: { ref: DocumentReference; data: Record<string, unknown> }[] = []
  for (const [itemId, snap] of items) {
    if (!snap.exists) continue
    const data = snap.data() ?? {}
    if (serial.has(itemId)) {
      if (!data.dateOut) continue
      writes.push({
        ref: snap.ref,
        data: { dateOut: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() },
      })
      continue
    }
    const qty = add.get(itemId) ?? 0
    const stock = resolveBulkStockFieldAndValueFromMap(data, folderOf.get(itemId)?.template?.fields)
    if (!stock || qty <= 0) continue
    writes.push({
      ref: snap.ref,
      data: {
        [stock.fieldKey]: stock.value + qty,
        dateOut: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    })
  }
  return { apply: (t) => writes.forEach((w) => t.update(w.ref, w.data)), count: writes.length }
}

/** Frees the items a balance-due order was holding (cancel). */
export async function planHoldRelease(
  tx: Transaction,
  store: DocumentReference,
  receiptId: string,
  receipt: Record<string, unknown>
): Promise<StockWritePlan> {
  const lines = receiptSaleLines(receipt)
  const { items } = await readLines(tx, store, lines)
  const writes: DocumentReference[] = []
  for (const snap of items.values()) {
    if (snap.exists && String(snap.data()?.pendingSaleReceiptId || '') === receiptId) {
      writes.push(snap.ref)
    }
  }
  return {
    apply: (t) =>
      writes.forEach((ref) =>
        t.update(ref, {
          pendingSaleReceiptId: FieldValue.delete(),
          pendingSaleAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        })
      ),
    count: writes.length,
  }
}
