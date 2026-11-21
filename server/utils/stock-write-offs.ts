import { createError } from 'h3'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import { planHasFeature } from '~/types/subscription'
import {
  WRITE_OFF_REASON_LABELS,
  type WriteOffReason,
  type WriteOffSource,
} from '~/types/stock-write-offs'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import { resolveItemUnitCost } from '~/utils/inventory-item-cost'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { snapshotStockItemDetails } from '~/utils/stock-item-details'
import { actorCanUseCategory, assertId, forbid, type StoreActor } from '~/server/utils/sales/actor'
import { logSaleActivity } from '~/server/utils/sales/records'
import {
  INSPECTION_HOLDS_COLLECTION,
  planReceiptPendingClear,
} from '~/server/utils/inspection-holds'
import {
  SUPPLIER_RETURNS_COLLECTION,
  bad,
  cleanText,
  conflict,
  readItemOrigin,
} from '~/server/utils/supplier-returns'

/**
 * Stock write-offs (see types/stock-write-offs.ts): damaged, lost, expired or otherwise unsellable
 * stock recorded as a loss at cost.
 *
 * Three ways in:
 * - inventory: an in-stock unit. A serial row is deleted; a bulk row loses the units.
 * - inspection: a held customer return judged unsellable. The serial row is deleted; held bulk
 *   units were never put back, so nothing else moves. The hold closes as written off.
 * - supplier_return: a claim the supplier rejected. The stock already left inventory when it was
 *   logged, so this only records the loss and links the two.
 *
 * Written only by the server, in one transaction with the stock change.
 */

export const STOCK_WRITE_OFFS_COLLECTION = 'stockWriteOffs'
const REASONS = Object.keys(WRITE_OFF_REASON_LABELS) as WriteOffReason[]

/** Writing stock off destroys it: owners, and staff allowed to delete products. */
export function canWriteOffStock(actor: StoreActor): boolean {
  return actor.isOwner || actor.permissions.products.delete === true
}

export interface CreateWriteOffInput {
  source: WriteOffSource
  /** inventory: the item; inspection: the hold; supplier_return: the return. */
  id: string
  quantity: number
  reason: WriteOffReason
  note: string
}

export function parseCreateWriteOff(input: Record<string, unknown>): CreateWriteOffInput {
  const source = String(input.source || 'inventory') as WriteOffSource
  if (!['inventory', 'inspection', 'supplier_return'].includes(source)) bad('Unknown source')
  const id = assertId(
    source === 'inventory' ? input.itemId : source === 'inspection' ? input.holdId : input.returnId,
    source === 'inventory' ? 'itemId' : source === 'inspection' ? 'holdId' : 'returnId'
  )
  const quantity = input.quantity === undefined ? 1 : Number(input.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100_000) {
    bad('Enter how many units to write off.')
  }
  const reason = String(input.reason || '') as WriteOffReason
  if (!REASONS.includes(reason)) bad('Choose why it is being written off.', 'REASON_REQUIRED')
  const note = cleanText(input.note, 500)
  // Lost or stolen stock is the kind owners ask about later: make people say what happened.
  if (reason === 'lost_stolen' && note.length < 3) {
    bad('Say what happened (when it was noticed, any police report).', 'NOTE_REQUIRED')
  }
  return { source, id, quantity, reason, note }
}

function itemFields(item: InventoryItem, folderName: string, serial: boolean, quantity: number) {
  const unitCost = resolveItemUnitCost(item) ?? null
  return {
    unitCost,
    item: {
      inventoryItemId: item.id,
      folderId: String(item.folderId || ''),
      folderName: cleanText(folderName, 80) || 'Inventory',
      name: getInventoryItemDisplayName(item) || 'Item',
      details: snapshotStockItemDetails(item),
      serial,
      quantity,
      unitCost,
    },
  }
}

/** Records stock as a loss and takes it out of stock, from any of the three sources. */
export async function createWriteOff(
  db: Firestore,
  actor: StoreActor,
  raw: Record<string, unknown>
): Promise<{ writeOffId: string }> {
  if (!canWriteOffStock(actor)) forbid('You don’t have permission to write off stock.')
  const input = parseCreateWriteOff(raw)
  const ref = actor.store.collection(STOCK_WRITE_OFFS_COLLECTION).doc()

  await db.runTransaction(async (tx) => {
    let record: Record<string, unknown>
    let name = 'Item'
    let quantity = input.quantity
    let unitCost: number | null = null
    const after: Array<() => void> = []

    if (input.source === 'inventory') {
      const itemRef = actor.store.collection('inventoryItems').doc(input.id)
      const snap = await tx.get(itemRef)
      if (!snap.exists) conflict('This product no longer exists.', 'ITEM_MISSING')
      const item = { id: snap.id, ...(snap.data() as Record<string, unknown>) } as InventoryItem
      name = getInventoryItemDisplayName(item) || 'This product'
      if (item.storeId && item.storeId !== actor.storeId) {
        conflict(`${name} belongs to another branch.`, 'ITEM_OTHER_STORE')
      }
      const folder = (
        await tx.get(actor.store.collection('inventoryFolders').doc(String(item.folderId || '-')))
      ).data() as InventoryFolder | undefined
      if (!actorCanUseCategory(actor, folder)) {
        forbid(`You can’t change stock in ${folder?.name || 'that category'}.`, 'CATEGORY_LOCKED')
      }
      if (item.inspectionHoldId) {
        conflict(
          `${name} is waiting for inspection. Decide it from To inspect.`,
          'ITEM_ON_INSPECTION'
        )
      }
      if (item.sellerLoanOutId) conflict(`${name} is out on a stock loan.`, 'ITEM_ON_LOAN')
      if (item.pendingSaleReceiptId)
        conflict(`${name} is held on an outstanding order.`, 'ITEM_HELD')

      const serial = folderHasSerialNumbers(folder)
      if (serial) {
        if (item.dateOut) conflict(`${name} has already been sold.`, 'ITEM_SOLD')
        if (quantity !== 1) bad('A serial-numbered unit is written off one at a time.')
        after.push(() => tx.delete(itemRef))
      } else {
        const stock = resolveBulkStockFieldAndValueFromMap(item, folder?.template?.fields)
        if (!stock) conflict(`${name} has no stock quantity to take from.`, 'NO_STOCK_FIELD')
        if (quantity > stock.value) {
          conflict(`Only ${stock.value} of ${name} in stock.`, 'INSUFFICIENT_STOCK')
        }
        after.push(() =>
          tx.update(itemRef, {
            [stock.fieldKey]: stock.value - quantity,
            updatedAt: FieldValue.serverTimestamp(),
          })
        )
      }
      const origin = await readItemOrigin(tx, actor, item)
      const fields = itemFields(item, String(folder?.name || ''), serial, quantity)
      unitCost = fields.unitCost
      record = {
        item: fields.item,
        origin,
        itemSnapshot: snap.data() ?? null,
        inventoryAction: serial ? 'removed' : 'reduced',
      }
    } else if (input.source === 'inspection') {
      const holdRef = actor.store.collection(INSPECTION_HOLDS_COLLECTION).doc(input.id)
      const holdSnap = await tx.get(holdRef)
      if (!holdSnap.exists) throw createError({ statusCode: 404, message: 'Held item not found' })
      const hold = holdSnap.data() ?? {}
      if (hold.status !== 'held') conflict('This item has already been decided.', 'ALREADY_DECIDED')
      const held = (hold.item ?? {}) as Record<string, unknown>
      const sale = (hold.sale ?? {}) as Record<string, unknown>
      const serial = held.serial === true
      quantity = Math.max(1, Math.floor(Number(held.quantity) || 1))
      name = String(held.name || 'Item')
      const itemRef = actor.store
        .collection('inventoryItems')
        .doc(String(held.inventoryItemId || '-'))
      const itemSnap = await tx.get(itemRef)
      if (serial && (!itemSnap.exists || itemSnap.data()?.inspectionHoldId !== input.id)) {
        conflict(`${name} is no longer held in inventory.`, 'HOLD_ITEM_MISSING')
      }
      const item = itemSnap.exists
        ? ({ id: itemSnap.id, ...(itemSnap.data() as Record<string, unknown>) } as InventoryItem)
        : null
      unitCost = item
        ? resolveItemUnitCost(item) ?? null
        : typeof held.unitCost === 'number'
        ? held.unitCost
        : null
      record = {
        item: item
          ? itemFields(item, String(held.folderName || ''), serial, quantity).item
          : { ...held, quantity, unitCost },
        origin: item ? await readItemOrigin(tx, actor, item) : null,
        itemSnapshot: itemSnap.data() ?? null,
        inventoryAction: serial ? 'removed' : 'not_restocked',
        customerReturn: {
          holdId: input.id,
          receiptId: String(sale.receiptId || ''),
          receiptNumber: String(sale.receiptNumber || ''),
          customerName: String(sale.customerName || ''),
          complaint: String(hold.complaint || ''),
        },
      }
      const clearPending = await planReceiptPendingClear(tx, actor, hold, input.id)
      after.push(clearPending)
      if (serial) after.push(() => tx.delete(itemRef))
      after.push(() =>
        tx.update(holdRef, {
          status: 'written_off',
          writeOffId: ref.id,
          closedAt: FieldValue.serverTimestamp(),
          closedBy: actor.uid,
          closedByName: actor.displayName,
          updatedAt: FieldValue.serverTimestamp(),
        })
      )
    } else {
      const returnRef = actor.store.collection(SUPPLIER_RETURNS_COLLECTION).doc(input.id)
      const snap = await tx.get(returnRef)
      if (!snap.exists) throw createError({ statusCode: 404, message: 'Supplier return not found' })
      const ret = snap.data() ?? {}
      if (ret.status !== 'rejected') {
        conflict('Only a return the supplier rejected can be written off.', 'NOT_REJECTED')
      }
      if (ret.writeOffId)
        conflict('This return has already been written off.', 'ALREADY_WRITTEN_OFF')
      const retItem = (ret.item ?? {}) as Record<string, unknown>
      quantity = Math.max(1, Math.floor(Number(retItem.quantity) || 1))
      unitCost = typeof retItem.unitCost === 'number' ? retItem.unitCost : null
      name = String(retItem.name || 'Item')
      record = {
        item: { ...retItem, quantity },
        origin: ret.origin ?? null,
        itemSnapshot: ret.itemSnapshot ?? null,
        // Stock left inventory when the return was logged.
        inventoryAction: 'already_out',
        supplierReturn: {
          returnId: input.id,
          supplierName: String(ret.supplierName || ''),
          defect: String(ret.defect || ''),
        },
      }
      after.push(() =>
        tx.update(returnRef, {
          writeOffId: ref.id,
          writtenOffAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
      )
    }

    const costValue = unitCost === null ? null : Math.round(unitCost * quantity * 100) / 100
    // Writes only from here.
    tx.create(ref, {
      storeId: actor.storeId,
      source: input.source,
      reason: input.reason,
      note: input.note,
      quantity,
      costValue,
      ...record,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actor.uid,
      createdByName: actor.displayName,
    })
    for (const write of after) write()

    if (planHasFeature(actor.plan, 'activity_logs')) {
      const label = WRITE_OFF_REASON_LABELS[input.reason]
      logSaleActivity(tx, actor, {
        action: 'deleted',
        entityType: 'stockWriteOff',
        entityId: ref.id,
        entityName: `Written off (${label}): ${name}${quantity > 1 ? ` × ${quantity}` : ''}`,
        details: {
          facts: [
            { label: 'Item', value: name },
            { label: 'Units', value: String(quantity) },
            { label: 'Reason', value: label },
            ...(input.note ? [{ label: 'Note', value: input.note }] : []),
            ...(costValue === null
              ? []
              : [{ label: 'Loss at cost', value: costValue, money: true, tone: 'bad' as const }]),
          ],
          link: { label: 'Open stock losses', path: '/analytics?tab=losses' },
        },
      })
    }
  })

  return { writeOffId: ref.id }
}
