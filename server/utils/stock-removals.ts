import { createError } from 'h3'
import {
  FieldValue,
  type DocumentSnapshot,
  type Firestore,
  type Transaction,
} from 'firebase-admin/firestore'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import { planHasFeature } from '~/types/subscription'
import {
  DELETE_REASON_LABELS,
  type DeleteReason,
  type StockRemovalKind,
} from '~/types/stock-removals'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import { resolveItemUnitCost } from '~/utils/inventory-item-cost'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { snapshotStockItemDetails } from '~/utils/stock-item-details'
import { actorCanUseCategory, assertId, forbid, type StoreActor } from '~/server/utils/sales/actor'
import { logSaleActivity } from '~/server/utils/sales/records'
import { bad, cleanText, conflict } from '~/server/utils/supplier-returns'

/**
 * Stock removals (see types/stock-removals.ts). Deleting a product, or a category with its
 * products, goes through here so every unit that leaves keeps a record: a copy of the item, how
 * many units, what they cost, why, who and when. Clients can't delete inventory rows directly.
 */

export const STOCK_REMOVALS_COLLECTION = 'stockRemovals'
const MAX_ITEMS_PER_REQUEST = 100
/** Products removed per call when a category is deleted; the client calls until none remain. */
const CATEGORY_CHUNK = 150
const DELETE_REASONS = Object.keys(DELETE_REASON_LABELS) as DeleteReason[]

export function canRemoveStock(actor: StoreActor): boolean {
  return actor.isOwner || actor.permissions.products.delete === true
}

/** The record kept for one inventory row leaving stock. */
function removalRecord(
  actor: StoreActor,
  args: {
    snap: DocumentSnapshot
    folder: InventoryFolder | undefined
    kind: StockRemovalKind
    reason: string
    note: string
  }
): Record<string, unknown> {
  const item = {
    id: args.snap.id,
    ...(args.snap.data() as Record<string, unknown>),
  } as InventoryItem
  const serial = folderHasSerialNumbers(args.folder)
  const quantity = serial
    ? 1
    : Math.max(
        0,
        resolveBulkStockFieldAndValueFromMap(item, args.folder?.template?.fields)?.value ?? 0
      )
  const unitCost = resolveItemUnitCost(item) ?? null
  return {
    storeId: actor.storeId,
    kind: args.kind,
    reason: args.reason,
    note: args.note,
    quantity,
    before: null,
    after: null,
    costValue: unitCost === null ? null : Math.round(unitCost * quantity * 100) / 100,
    item: {
      inventoryItemId: item.id,
      folderId: String(item.folderId || ''),
      folderName: cleanText(args.folder?.name, 80) || 'Inventory',
      name: getInventoryItemDisplayName(item) || 'Item',
      details: snapshotStockItemDetails(item),
      serial,
      unitCost,
    },
    // Kept so the row can be restored exactly if it was removed by mistake.
    itemSnapshot: args.snap.data() ?? null,
    // A sold unit removed with its category: record it, but it wasn't in stock.
    wasSold: serial && !!item.dateOut,
    restoredAt: null,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actor.uid,
    createdByName: actor.displayName,
  }
}

async function readFolders(tx: Transaction, actor: StoreActor, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))]
  const snaps = unique.length
    ? await tx.getAll(...unique.map((id) => actor.store.collection('inventoryFolders').doc(id)))
    : []
  return new Map(snaps.map((s) => [s.id, s.data() as InventoryFolder | undefined]))
}

/** Deletes products (one or a bulk selection) and records each one. */
export async function removeItems(
  db: Firestore,
  actor: StoreActor,
  input: Record<string, unknown>
): Promise<{ removed: number }> {
  if (!canRemoveStock(actor)) forbid('You don’t have permission to delete products.')
  const rawIds = Array.isArray(input.itemIds) ? input.itemIds : []
  const itemIds = [...new Set(rawIds.map((id) => assertId(id, 'itemIds')))]
  if (itemIds.length === 0) bad('Choose at least one product.')
  if (itemIds.length > MAX_ITEMS_PER_REQUEST) bad('Delete at most 100 products at a time.')
  const reason = String(input.reason || '') as DeleteReason
  if (!DELETE_REASONS.includes(reason)) bad('Choose why it is being deleted.', 'REASON_REQUIRED')
  const note = cleanText(input.note, 500)
  if (reason === 'other' && note.length < 3) bad('Say why it is being deleted.', 'NOTE_REQUIRED')

  return db.runTransaction(async (tx) => {
    const snaps = await tx.getAll(
      ...itemIds.map((id) => actor.store.collection('inventoryItems').doc(id))
    )
    const folders = await readFolders(
      tx,
      actor,
      snaps.map((s) => String(s.data()?.folderId || ''))
    )
    for (const snap of snaps) {
      const data = snap.data()
      if (!snap.exists || !data) conflict('A product to delete no longer exists.', 'ITEM_MISSING')
      const name =
        getInventoryItemDisplayName({ id: snap.id, ...data } as InventoryItem) || 'A product'
      const folder = folders.get(String(data.folderId || ''))
      if (data.storeId && data.storeId !== actor.storeId) {
        conflict(`${name} belongs to another branch.`, 'ITEM_OTHER_STORE')
      }
      if (!actorCanUseCategory(actor, folder)) {
        forbid(
          `You can’t change products in ${folder?.name || 'that category'}.`,
          'CATEGORY_LOCKED'
        )
      }
      // Same locks the inventory page shows: these units are accounted for elsewhere.
      if (folderHasSerialNumbers(folder) && data.dateOut) {
        conflict(`${name} has been sold, so it stays on record.`, 'ITEM_SOLD')
      }
      if (data.sellerLoanOutId) conflict(`${name} is out on a stock loan.`, 'ITEM_ON_LOAN')
      if (data.pendingSaleReceiptId)
        conflict(`${name} is held on an outstanding order.`, 'ITEM_HELD')
      if (data.inspectionHoldId) {
        conflict(`${name} is waiting for inspection. Decide it from Returns.`, 'ITEM_ON_INSPECTION')
      }
    }

    // Writes only from here.
    for (const snap of snaps) {
      const folder = folders.get(String(snap.data()?.folderId || ''))
      tx.create(
        actor.store.collection(STOCK_REMOVALS_COLLECTION).doc(),
        removalRecord(actor, { snap, folder, kind: 'deleted', reason, note })
      )
      tx.delete(snap.ref)
    }
    if (planHasFeature(actor.plan, 'activity_logs')) {
      const names = snaps.map((s) =>
        getInventoryItemDisplayName({ id: s.id, ...s.data() } as InventoryItem)
      )
      logSaleActivity(tx, actor, {
        action: 'deleted',
        entityType: 'inventoryItem',
        entityId: snaps[0]!.id,
        entityName:
          snaps.length === 1
            ? `Deleted ${names[0]} (${DELETE_REASON_LABELS[reason]})`
            : `Deleted ${snaps.length} products (${DELETE_REASON_LABELS[reason]})`,
        details: {
          facts: [
            { label: 'Reason', value: DELETE_REASON_LABELS[reason] },
            ...(note ? [{ label: 'Note', value: note }] : []),
          ],
          lines: names.slice(0, 60).map((n) => ({ name: n || 'Item', qty: 1 })),
          linesLabel: 'Products deleted',
          link: { label: 'Open stock out log', path: '/supplier-returns?tab=log' },
        },
      })
    }
    return { removed: snaps.length }
  })
}

/**
 * Deleting a category: records and deletes its products in chunks. Returns `remaining: true`
 * while more are left; the client calls again, then deletes the empty category.
 */
export async function removeCategoryItems(
  db: Firestore,
  actor: StoreActor,
  input: Record<string, unknown>
): Promise<{ removed: number; remaining: boolean }> {
  if (!canRemoveStock(actor)) forbid('You don’t have permission to delete categories.')
  const folderId = assertId(input.folderId, 'folderId')
  const note = cleanText(input.note, 500)
  const query = actor.store
    .collection('inventoryItems')
    .where('folderId', '==', folderId)
    .limit(CATEGORY_CHUNK + 1)

  return db.runTransaction(async (tx) => {
    const folder = (
      await tx.get(actor.store.collection('inventoryFolders').doc(folderId))
    ).data() as InventoryFolder | undefined
    if (folder && !actorCanUseCategory(actor, folder)) {
      forbid(`You can’t change products in ${folder.name || 'that category'}.`, 'CATEGORY_LOCKED')
    }
    const page = await tx.get(query)
    const docs = page.docs.slice(0, CATEGORY_CHUNK)
    for (const snap of docs) {
      tx.create(
        actor.store.collection(STOCK_REMOVALS_COLLECTION).doc(),
        removalRecord(actor, {
          snap,
          folder,
          kind: 'category_deleted',
          reason: 'category_deleted',
          note,
        })
      )
      tx.delete(snap.ref)
    }
    if (docs.length && planHasFeature(actor.plan, 'activity_logs')) {
      logSaleActivity(tx, actor, {
        action: 'deleted',
        entityType: 'inventoryFolder',
        entityId: folderId,
        entityName: `Removed ${docs.length} product${docs.length === 1 ? '' : 's'} with category ${
          folder?.name || ''
        }`.trim(),
        details: {
          lines: docs.slice(0, 60).map((s) => ({
            name: getInventoryItemDisplayName({ id: s.id, ...s.data() } as InventoryItem) || 'Item',
            qty: 1,
          })),
          linesLabel: 'Products removed',
          link: { label: 'Open stock out log', path: '/supplier-returns?tab=log' },
        },
      })
    }
    return { removed: docs.length, remaining: page.docs.length > CATEGORY_CHUNK }
  })
}

/** Puts a deleted product back exactly as it was, under its old id. */
export async function restoreRemoval(
  db: Firestore,
  actor: StoreActor,
  input: Record<string, unknown>
): Promise<{ itemId: string }> {
  if (!actor.isOwner && actor.permissions.products.create !== true) {
    forbid('You don’t have permission to add products.')
  }
  const removalId = assertId(input.removalId, 'removalId')
  const ref = actor.store.collection(STOCK_REMOVALS_COLLECTION).doc(removalId)

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw createError({ statusCode: 404, message: 'Record not found' })
    const removal = snap.data() ?? {}
    if (removal.kind === 'count_reduced') {
      conflict('Edit the product’s count to add units back.', 'NOT_RESTORABLE')
    }
    if (removal.restoredAt) conflict('This product has already been restored.', 'ALREADY_RESTORED')
    const snapshot = removal.itemSnapshot as Record<string, unknown> | null
    const item = (removal.item ?? {}) as Record<string, unknown>
    if (!snapshot) conflict('There’s no saved copy to restore.', 'NO_ITEM_SNAPSHOT')
    const folderId = String(snapshot.folderId || item.folderId || '')
    const folderSnap = await tx.get(actor.store.collection('inventoryFolders').doc(folderId || '-'))
    if (!folderSnap.exists) {
      conflict(
        `The ${String(item.folderName || '')} category no longer exists. Create it again first.`,
        'NO_FOLDER'
      )
    }
    const itemRef = actor.store
      .collection('inventoryItems')
      .doc(String(item.inventoryItemId || '-'))
    if ((await tx.get(itemRef)).exists) {
      conflict('This product is already in inventory.', 'ALREADY_IN_STOCK')
    }
    tx.set(itemRef, {
      ...snapshot,
      storeId: actor.storeId,
      restoredFromRemovalId: removalId,
      updatedAt: FieldValue.serverTimestamp(),
    })
    tx.update(ref, {
      restoredAt: FieldValue.serverTimestamp(),
      restoredBy: actor.uid,
      restoredByName: actor.displayName,
    })
    if (planHasFeature(actor.plan, 'activity_logs')) {
      logSaleActivity(tx, actor, {
        action: 'created',
        entityType: 'inventoryItem',
        entityId: itemRef.id,
        entityName: `Restored ${String(item.name || 'product')} from Returns`,
        details: { link: { label: 'Open the category', path: `/inventory/${folderId}` } },
      })
    }
    return { itemId: itemRef.id }
  })
}
