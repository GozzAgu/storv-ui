import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import type { CountReductionWhy, StockRemoval } from '~/types/stock-removals'
import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { resolveBulkStockFieldAndValueFromMap } from '~/utils/inventory-bulk-quantity'
import { resolveItemUnitCost } from '~/utils/inventory-item-cost'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import { snapshotStockItemDetails } from '~/utils/stock-item-details'

/** Units on hand for a quantity product (null for serial products or no stock field). */
export function bulkStockOf(
  item: Partial<InventoryItem>,
  folder: Pick<InventoryFolder, 'hasSerialNumbers' | 'template'> | null | undefined
): number | null {
  if (!folder || folderHasSerialNumbers(folder as InventoryFolder)) return null
  return (
    resolveBulkStockFieldAndValueFromMap(item as Record<string, unknown>, folder.template?.fields)
      ?.value ?? null
  )
}

/** How many units an edit takes off the count (0 when it doesn't lower it). */
export function countDrop(
  before: Partial<InventoryItem>,
  after: Partial<InventoryItem>,
  folder: Pick<InventoryFolder, 'hasSerialNumbers' | 'template'> | null | undefined
): number {
  const was = bulkStockOf(before, folder)
  const now = bulkStockOf(after, folder)
  if (was === null || now === null) return 0
  return Math.max(0, was - now)
}

function itemSummary(item: InventoryItem, folder: InventoryFolder | null | undefined) {
  const unitCost = resolveItemUnitCost(item) ?? null
  return {
    inventoryItemId: item.id,
    folderId: String(item.folderId || ''),
    folderName: folder?.name || 'Inventory',
    name: getInventoryItemDisplayName(item) || 'Item',
    details: snapshotStockItemDetails(item),
    serial: folderHasSerialNumbers(folder ?? undefined),
    unitCost,
  }
}

/**
 * The record written with an edit that lowers a stock count (null when it doesn't). Matches the
 * rules: kind count_reduced, created by the signed-in user, quantity > 0, never restored.
 */
export function countReductionRecord(
  before: InventoryItem,
  after: InventoryItem,
  folder: InventoryFolder | null | undefined,
  why: CountReductionWhy,
  who: { storeId: string; uid: string; name: string }
): Record<string, unknown> | null {
  const drop = countDrop(before, after, folder)
  if (drop <= 0) return null
  const summary = itemSummary(before, folder)
  return {
    storeId: who.storeId,
    kind: 'count_reduced',
    reason: why.reason,
    note: (why.note ?? '').trim().slice(0, 500),
    quantity: drop,
    before: bulkStockOf(before, folder),
    after: bulkStockOf(after, folder),
    costValue: summary.unitCost === null ? null : summary.unitCost * drop,
    item: summary,
    restoredAt: null,
    createdBy: who.uid,
    createdByName: who.name,
  }
}

/** Demo mode: a deletion record as the server would write it. */
export function demoDeletionRecord(
  item: InventoryItem,
  folder: InventoryFolder | null | undefined,
  why: { reason: StockRemoval['reason']; note?: string }
): StockRemoval {
  const summary = itemSummary(item, folder)
  const quantity = summary.serial ? 1 : bulkStockOf(item, folder) ?? 0
  return {
    id: `local-rm-${Date.now()}-${item.id}`,
    storeId: String(item.storeId || ''),
    kind: 'deleted',
    reason: why.reason,
    note: why.note ?? '',
    quantity,
    before: null,
    after: null,
    costValue: summary.unitCost === null ? null : summary.unitCost * quantity,
    item: summary,
    restoredAt: null,
    createdAt: new Date().toISOString(),
    createdByName: 'You',
  }
}
