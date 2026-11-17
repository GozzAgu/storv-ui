import { createError } from 'h3'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import { planHasFeature } from '~/types/subscription'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import {
  BULK_PRICE_MAX_ITEMS,
  parseBulkPriceChange,
  planBulkPriceChange,
  type BulkPriceChange,
  type BulkPriceSkipReason,
} from '~/utils/inventory-bulk-price'
import { actorCanUseCategory, assertId, forbid, type StoreActor } from '~/server/utils/sales/actor'
import { logSaleActivity } from '~/server/utils/sales/records'

function bad(message: string): never {
  throw createError({ statusCode: 400, message })
}

/** Owner, or a member granted products.edit: the same people the rules let edit an item. */
export function canBulkEditPrices(actor: Pick<StoreActor, 'isOwner' | 'permissions'>): boolean {
  return actor.isOwner || actor.permissions?.products?.edit === true
}

export interface BulkPriceRequest {
  folderId: string
  itemIds: string[]
  /** One change for every item (bulk price dialog)... */
  change?: BulkPriceChange
  /** ...or a set price per item (Excel import). */
  perItem?: Map<string, BulkPriceChange>
}

function parsePerItemUpdates(folderId: string, raw: unknown): BulkPriceRequest {
  if (!Array.isArray(raw) || raw.length === 0) bad('Choose at least one product')
  if (raw.length > BULK_PRICE_MAX_ITEMS) {
    bad(`Update up to ${BULK_PRICE_MAX_ITEMS} products at a time`)
  }
  const perItem = new Map<string, BulkPriceChange>()
  for (const entry of raw) {
    const e = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>
    const itemId = assertId(e.itemId, 'itemId')
    if (perItem.has(itemId)) bad('Each product can only be listed once')
    const set = (v: unknown) => (v === undefined || v === null ? undefined : { mode: 'set', value: v })
    try {
      perItem.set(
        itemId,
        parseBulkPriceChange({ unitPrice: set(e.unitPrice), costPrice: set(e.costPrice) })
      )
    } catch (err) {
      bad(err instanceof Error ? err.message : 'Price change is invalid')
    }
  }
  return { folderId, itemIds: [...perItem.keys()], perItem }
}

export function parseBulkPriceRequest(input: Record<string, unknown>): BulkPriceRequest {
  const folderId = assertId(input.folderId, 'folderId')
  if (input.updates !== undefined) {
    if (input.itemIds !== undefined) bad('Send either itemIds or updates, not both')
    return parsePerItemUpdates(folderId, input.updates)
  }
  const raw = input.itemIds
  if (!Array.isArray(raw) || raw.length === 0) bad('Choose at least one product')
  if (raw.length > BULK_PRICE_MAX_ITEMS) {
    bad(`Update up to ${BULK_PRICE_MAX_ITEMS} products at a time`)
  }
  const itemIds = [...new Set(raw.map((id) => assertId(id, 'itemIds')))]
  let change: BulkPriceChange
  try {
    change = parseBulkPriceChange(input)
  } catch (err) {
    bad(err instanceof Error ? err.message : 'Price change is invalid')
  }
  return { folderId, itemIds, change }
}

export interface BulkPriceResult {
  updated: number
  skipped: Partial<Record<BulkPriceSkipReason | 'not_found', number>>
  /** New field values per updated item, so the page can show them without a reload. */
  items: Array<{ id: string; patch: Record<string, number> }>
}

/**
 * Sets or adjusts the unit and/or cost price of many items in one transaction. Sold items, items
 * on a stock loan and items held for a balance payment are left alone (and counted as skipped).
 * Writes a price-history entry per changed field and one activity log entry.
 */
export async function runBulkPriceUpdate(
  db: Firestore,
  actor: StoreActor,
  input: Record<string, unknown>
): Promise<BulkPriceResult> {
  if (!canBulkEditPrices(actor)) forbid('You don’t have permission to change product prices.')
  const { folderId, itemIds, change, perItem } = parseBulkPriceRequest(input)

  const folderRef = actor.store.collection('inventoryFolders').doc(folderId)
  const itemsCol = actor.store.collection('inventoryItems')

  return db.runTransaction(async (tx) => {
    const [folderSnap, ...snaps] = await tx.getAll(
      folderRef,
      ...itemIds.map((id) => itemsCol.doc(id))
    )
    if (!folderSnap!.exists) throw createError({ statusCode: 404, message: 'Category not found' })
    const folder = folderSnap!.data() as InventoryFolder
    if (!actorCanUseCategory(actor, folder)) {
      forbid(`You can’t change prices in ${folder?.name || 'that category'}.`)
    }

    // Only items that really sit in this folder; anything else counts as not found.
    let notFound = 0
    const items: Array<Record<string, unknown> & { id: string }> = []
    for (const snap of snaps) {
      const data = snap.data()
      if (!snap.exists || !data || data.folderId !== folderId) {
        notFound++
        continue
      }
      items.push({ ...data, id: snap.id })
    }

    const summary = planBulkPriceChange(items, perItem ? (id) => perItem.get(id)! : change!)
    const byId = new Map(items.map((i) => [i.id, i]))
    for (const plan of summary.toUpdate) {
      const item = byId.get(plan.id)!
      tx.update(itemsCol.doc(plan.id), { ...plan.patch, updatedAt: FieldValue.serverTimestamp() })
      const itemName = (getInventoryItemDisplayName(item as InventoryItem) || 'Product').slice(0, 200)
      const history = (field: 'price' | 'cost', from: number | null, to: number | null) =>
        tx.create(actor.store.collection('inventoryAuditLogs').doc(), {
          userId: actor.uid,
          userDisplayName: actor.displayName,
          itemId: plan.id,
          itemName,
          field,
          previousValue: from,
          newValue: to,
          storeId: actor.storeId,
          source: 'bulk_price',
          createdAt: FieldValue.serverTimestamp(),
        })
      if (plan.priceChanged) history('price', plan.before.price, plan.after.price)
      if (plan.costChanged) history('cost', plan.before.cost, plan.after.cost)
    }

    const updated = summary.toUpdate.length
    if (updated > 0 && planHasFeature(actor.plan, 'activity_logs')) {
      const products = `${updated} product${updated === 1 ? '' : 's'}`
      const where = folder?.name || 'a category'
      const parts = change
        ? [change.unitPrice && 'unit price', change.costPrice && 'cost price'].filter(Boolean)
        : []
      logSaleActivity(tx, actor, {
        action: 'updated',
        entityType: 'items_batch',
        entityId: folderId,
        entityName: perItem
          ? `Updated the prices of ${products} in ${where} from an Excel import`
          : `Changed the ${parts.join(' and ')} of ${products} in ${where}`,
      })
    }

    return {
      updated,
      skipped: { ...summary.skippedByReason, ...(notFound > 0 && { not_found: notFound }) },
      items: summary.toUpdate.map((p) => ({ id: p.id, patch: p.patch })),
    }
  })
}
