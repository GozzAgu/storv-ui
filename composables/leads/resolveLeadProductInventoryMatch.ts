import { getInventoryItemDisplayName } from '~/composables/useInventoryItemDisplay'
import { useInventoryStore, type InventoryFolder, type InventoryItem } from '~/stores/inventory'

function itemMatchesProductQuery(item: InventoryItem, queryLower: string): boolean {
  const name = getInventoryItemDisplayName(item).toLowerCase()
  if (name.includes(queryLower)) return true

  const fields = ['sku', 'brand', 'model', 'serialNo', 'serialNumber', 'serial'] as const
  for (const field of fields) {
    const value = item[field]
    if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) return true
  }

  return false
}

function matchScore(item: InventoryItem, queryLower: string): number {
  const name = getInventoryItemDisplayName(item).toLowerCase()
  if (name === queryLower) return 3
  if (name.startsWith(queryLower)) return 2
  if (name.includes(queryLower)) return 1
  return 0
}

/** Find in-stock inventory for a lead product name across leaf categories. */
export async function resolveLeadProductInventoryMatch(
  productQuery: string
): Promise<{ item: InventoryItem; folder: InventoryFolder } | null> {
  const queryLower = productQuery.trim().toLowerCase()
  if (!queryLower) return null

  const inventoryStore = useInventoryStore()
  if (inventoryStore.folders.length === 0) {
    await inventoryStore.fetchFolders()
  }

  let best: { item: InventoryItem; folder: InventoryFolder; score: number } | null = null

  for (const folder of inventoryStore.leafFolders) {
    let items: InventoryItem[]
    try {
      items = await inventoryStore.fetchItemsAllChunked(folder.id)
    } catch {
      continue
    }

    for (const item of items) {
      if (item.dateOut || item.pendingSaleReceiptId) continue
      if (!itemMatchesProductQuery(item, queryLower)) continue

      const score = matchScore(item, queryLower)
      if (!best || score > best.score) {
        best = { item, folder, score }
        if (score === 3) {
          return { item, folder }
        }
      }
    }
  }

  return best ? { item: best.item, folder: best.folder } : null
}
