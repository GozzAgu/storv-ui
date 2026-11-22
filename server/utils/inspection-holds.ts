import { createError } from 'h3'
import {
  FieldValue,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
  type Transaction,
} from 'firebase-admin/firestore'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import type { InspectionHoldStatus } from '~/types/inspection-holds'
import { planHasFeature } from '~/types/subscription'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import { resolveItemUnitCost } from '~/utils/inventory-item-cost'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { snapshotStockItemDetails } from '~/utils/stock-item-details'
import { assertId, forbid, type StoreActor } from '~/server/utils/sales/actor'
import { logSaleActivity } from '~/server/utils/sales/records'
import { clearSoldPriceStamp } from '~/server/utils/sales/sold-price'
import { receiptSaleLines } from '~/server/utils/sales/stock'
import {
  SUPPLIER_RETURNS_COLLECTION,
  bad,
  canManageSupplierReturns,
  assertSupplierReturnsPlan,
  cleanText,
  conflict,
  logSupplierReturnCreated,
  parseSupplierDetails,
  readItemOrigin,
  supplierReturnRecord,
  toTimestamp,
} from '~/server/utils/supplier-returns'

/**
 * Inspection holds (see types/inspection-holds.ts).
 *
 * Refund → hold → decide. A refund can mark lines "Needs checking"; they aren't put back on sale.
 * A serial unit goes back into inventory flagged with `inspectionHoldId`, so sales, loans and
 * transfers refuse it; a bulk line's units stay off the count. A manager then decides: back on
 * sale (flag cleared or units added back) or return to the supplier (a supplier return carrying
 * the customer's complaint, and the unit leaves stock).
 */

export const INSPECTION_HOLDS_COLLECTION = 'inspectionHolds'
const MAX_HELD_LINES = 100

/** Held item ids from a refund request: unique, valid ids only. */
export function parseHeldItemIds(raw: unknown): string[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) bad('heldItemIds must be a list')
  const ids = [...new Set(raw.map((id) => assertId(id, 'heldItemIds')))]
  if (ids.length > MAX_HELD_LINES) bad('Too many items to hold in one refund')
  return ids
}

export interface InspectionHoldPlan {
  apply: (tx: Transaction) => void
  count: number
  ids: string[]
  /** Item ids to leave out of the refund's restock (pass to planStockReturn's `exclude`). */
  itemIds: Set<string>
}

/**
 * Plans the holds for a refund's "Needs checking" lines. Reads only; `apply` writes. Ids are
 * `{receiptId}_{itemId}`, so the same refund can never hold an item twice.
 */
export async function planInspectionHolds(
  tx: Transaction,
  actor: StoreActor,
  input: {
    receiptId: string
    receipt: Record<string, unknown>
    heldItemIds: string[]
    complaint: string
  }
): Promise<InspectionHoldPlan> {
  const held = new Set(input.heldItemIds)
  if (held.size === 0) return { apply: () => {}, count: 0, ids: [], itemIds: new Set() }

  const lines = receiptSaleLines(input.receipt).filter((l) => held.has(l.itemId))
  if ([...held].some((id) => !lines.some((l) => l.itemId === id))) {
    bad('An item to hold is not on this sale.', 'HELD_ITEM_NOT_ON_SALE')
  }

  const receiptLines = Array.isArray(input.receipt.items)
    ? (input.receipt.items as Record<string, unknown>[])
    : []
  const byItem = new Map<
    string,
    { folderId: string; quantity: number; amount: number; name: string }
  >()
  for (const line of lines) {
    const raw = receiptLines.find((r) => r.itemId === line.itemId) ?? {}
    const prev = byItem.get(line.itemId)
    byItem.set(line.itemId, {
      folderId: line.folderId,
      quantity: (prev?.quantity ?? 0) + line.quantity,
      amount: (prev?.amount ?? 0) + (Number(raw.price) || 0) * line.quantity,
      name: prev?.name || cleanText(raw.itemName, 120) || 'Item',
    })
  }

  const itemIds = [...byItem.keys()]
  const folderIds = [...new Set([...byItem.values()].map((v) => v.folderId).filter(Boolean))]
  const [itemSnaps, folderSnaps] = await Promise.all([
    tx.getAll(...itemIds.map((id) => actor.store.collection('inventoryItems').doc(id))),
    folderIds.length
      ? tx.getAll(...folderIds.map((id) => actor.store.collection('inventoryFolders').doc(id)))
      : Promise.resolve([] as DocumentSnapshot[]),
  ])
  const items = new Map(itemSnaps.map((s) => [s.id, s]))
  const folders = new Map(folderSnaps.map((s) => [s.id, s.data() as InventoryFolder | undefined]))

  const soldAt = toTimestamp(input.receipt.date) ?? toTimestamp(input.receipt.createdAt)
  const writes: Array<{
    holdRef: DocumentReference
    hold: Record<string, unknown>
    itemRef?: DocumentReference
    itemUpdate?: Record<string, unknown>
  }> = []

  for (const [itemId, line] of byItem) {
    const snap = items.get(itemId)
    const item = (snap?.exists ? { id: itemId, ...snap.data() } : undefined) as
      | InventoryItem
      | undefined
    const folder = folders.get(line.folderId)
    const serial = folderHasSerialNumbers(folder)
    const holdRef = actor.store
      .collection(INSPECTION_HOLDS_COLLECTION)
      .doc(`${input.receiptId}_${itemId}`)
    writes.push({
      holdRef,
      hold: {
        storeId: actor.storeId,
        status: 'held' satisfies InspectionHoldStatus,
        item: {
          inventoryItemId: itemId,
          folderId: line.folderId,
          folderName: cleanText(folder?.name, 80) || 'Inventory',
          name: (item && getInventoryItemDisplayName(item)) || line.name,
          details: item ? snapshotStockItemDetails(item) : {},
          serial,
          quantity: line.quantity,
          unitCost: item ? resolveItemUnitCost(item) ?? null : null,
        },
        sale: {
          receiptId: input.receiptId,
          receiptNumber: cleanText(input.receipt.receiptNumber, 40) || input.receiptId,
          customerName: cleanText(input.receipt.customerName, 120) || 'Walk-in Customer',
          ...(typeof input.receipt.customerPhone === 'string' &&
            input.receipt.customerPhone && {
              customerPhone: cleanText(input.receipt.customerPhone, 40),
            }),
          soldAt,
          amount: Math.round(line.amount * 100) / 100,
        },
        complaint: input.complaint,
        heldAt: FieldValue.serverTimestamp(),
        heldBy: actor.uid,
        heldByName: actor.displayName,
        closedAt: null,
        closedByName: '',
        supplierReturnId: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      // A serial unit comes back into inventory but flagged, so nothing can sell it yet. Bulk
      // units simply aren't added back until someone puts them back on sale.
      ...(serial &&
        snap?.exists && {
          itemRef: snap.ref,
          itemUpdate: {
            ...clearSoldPriceStamp(),
            dateOut: FieldValue.delete(),
            inspectionHoldId: holdRef.id,
            updatedAt: FieldValue.serverTimestamp(),
          },
        }),
    })
  }

  return {
    count: writes.length,
    ids: writes.map((w) => w.holdRef.id),
    itemIds: new Set(itemIds),
    apply: (t) => {
      for (const w of writes) {
        t.create(w.holdRef, w.hold)
        if (w.itemRef && w.itemUpdate) t.update(w.itemRef, w.itemUpdate)
      }
    },
  }
}

/**
 * The sale shows "Return pending" while any of its held items waits for a decision. Reads the
 * receipt and its other holds (call before any write); `apply` clears the flag when the hold being
 * decided is the last one still waiting.
 */
export async function planReceiptPendingClear(
  tx: Transaction,
  actor: StoreActor,
  hold: Record<string, unknown>,
  holdId: string
): Promise<() => void> {
  const receiptId = String(((hold.sale ?? {}) as Record<string, unknown>).receiptId || '')
  if (!receiptId) return () => {}
  const receiptRef = actor.store.collection('receipts').doc(receiptId)
  const receipt = (await tx.get(receiptRef)).data()
  if (!receipt?.inspectionPending) return () => {}
  const others = (Array.isArray(receipt.inspectionHoldIds) ? receipt.inspectionHoldIds : []).filter(
    (id): id is string => typeof id === 'string' && id !== holdId
  )
  const snaps = others.length
    ? await tx.getAll(
        ...others.map((id) => actor.store.collection(INSPECTION_HOLDS_COLLECTION).doc(id))
      )
    : []
  const stillWaiting = snaps.some((s) => s.exists && s.data()?.status === 'held')
  if (stillWaiting) return () => {}
  return () =>
    tx.update(receiptRef, {
      inspectionPending: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    })
}

/** Decide what happens to a held item: back on sale, or return to the supplier. */
export async function resolveInspectionHold(
  db: Firestore,
  actor: StoreActor,
  input: Record<string, unknown>
): Promise<{ status: InspectionHoldStatus; supplierReturnId?: string }> {
  if (!canManageSupplierReturns(actor)) {
    forbid('You don’t have permission to decide on returned items.')
  }
  const holdId = assertId(input.holdId, 'holdId')
  const action = String(input.action || '')
  if (action !== 'restock' && action !== 'supplier') bad('Unknown action')
  if (action === 'supplier') assertSupplierReturnsPlan(actor)
  const holdRef = actor.store.collection(INSPECTION_HOLDS_COLLECTION).doc(holdId)

  return db.runTransaction(async (tx) => {
    const holdSnap = await tx.get(holdRef)
    if (!holdSnap.exists) throw createError({ statusCode: 404, message: 'Held item not found' })
    const hold = holdSnap.data() ?? {}
    if (hold.status !== 'held') conflict('This item has already been decided.', 'ALREADY_DECIDED')

    const held = (hold.item ?? {}) as {
      inventoryItemId?: string
      folderId?: string
      folderName?: string
      name?: string
      serial?: boolean
      quantity?: number
    }
    const sale = (hold.sale ?? {}) as Record<string, unknown>
    const quantity = Math.max(1, Math.floor(Number(held.quantity) || 1))
    const itemRef = actor.store
      .collection('inventoryItems')
      .doc(String(held.inventoryItemId || '-'))
    const folderRef = actor.store.collection('inventoryFolders').doc(String(held.folderId || '-'))
    const [itemSnap, folderSnap] = await Promise.all([tx.get(itemRef), tx.get(folderRef)])
    const folder = folderSnap.data() as InventoryFolder | undefined
    const serial = held.serial === true
    const name = String(held.name || 'Item')

    if (serial && (!itemSnap.exists || itemSnap.data()?.inspectionHoldId !== holdId)) {
      conflict(`${name} is no longer held in inventory.`, 'HOLD_ITEM_MISSING')
    }
    if (!serial && !itemSnap.exists) {
      conflict(`${name} no longer exists in inventory.`, 'HOLD_ITEM_MISSING')
    }
    const item = {
      id: itemSnap.id,
      ...(itemSnap.data() as Record<string, unknown>),
    } as InventoryItem
    // Reads only: whether this decision ends the sale's "Return pending" state.
    const clearPending = await planReceiptPendingClear(tx, actor, hold, holdId)

    const close = (status: InspectionHoldStatus, extra: Record<string, unknown> = {}) => {
      clearPending()
      tx.update(holdRef, {
        status,
        closedAt: FieldValue.serverTimestamp(),
        closedBy: actor.uid,
        closedByName: actor.displayName,
        updatedAt: FieldValue.serverTimestamp(),
        ...extra,
      })
    }

    if (action === 'restock') {
      let stockUpdate: Record<string, unknown>
      if (serial) {
        stockUpdate = { inspectionHoldId: FieldValue.delete() }
      } else {
        const stock = resolveBulkStockFieldAndValueFromMap(item, folder?.template?.fields)
        if (!stock) conflict(`${name} has no stock quantity to add back to.`, 'NO_STOCK_FIELD')
        stockUpdate = { [stock.fieldKey]: stock.value + quantity }
      }
      tx.update(itemRef, { ...stockUpdate, updatedAt: FieldValue.serverTimestamp() })
      close('restocked')
      if (planHasFeature(actor.plan, 'activity_logs')) {
        logSaleActivity(tx, actor, {
          action: 'updated',
          entityType: 'inspectionHold',
          entityId: holdId,
          entityName: `Inspected and back on sale: ${name}${serial ? '' : ` × ${quantity}`}`,
          details: {
            facts: [
              { label: 'Item', value: name },
              { label: 'Returned on', value: `#${String(sale.receiptNumber || '')}` },
              { label: 'Customer', value: String(sale.customerName || '') },
            ],
            link: { label: 'Open the item', path: `/inventory/${String(held.folderId || '')}` },
          },
        })
      }
      return { status: 'restocked' as const }
    }

    // Return to supplier: the unit leaves stock (serial row deleted; bulk units never re-added).
    const details = parseSupplierDetails({ ...input, quantity })
    const origin = await readItemOrigin(tx, actor, item)
    const returnRef = actor.store.collection(SUPPLIER_RETURNS_COLLECTION).doc()
    const folderName = String(folder?.name || held.folderName || 'Inventory')
    const receiptNumber = String(sale.receiptNumber || '')
    tx.create(
      returnRef,
      supplierReturnRecord(actor, {
        item,
        itemSnapshot: itemSnap.data() ?? null,
        folderName,
        serial,
        origin,
        input: details,
        customerReturn: {
          holdId,
          receiptId: String(sale.receiptId || ''),
          receiptNumber,
          customerName: String(sale.customerName || ''),
          complaint: String(hold.complaint || ''),
          returnedAt: toTimestamp(hold.heldAt),
        },
      })
    )
    if (serial) tx.delete(itemRef)
    close('to_supplier', { supplierReturnId: returnRef.id })
    logSupplierReturnCreated(tx, actor, {
      returnId: returnRef.id,
      name,
      folderName,
      serial,
      unitCost: resolveItemUnitCost(item) ?? null,
      input: details,
      fromInspection: `#${receiptNumber} · ${String(sale.customerName || '')}`,
    })
    return { status: 'to_supplier' as const, supplierReturnId: returnRef.id }
  })
}
