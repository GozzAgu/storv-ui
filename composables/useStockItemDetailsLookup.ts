import { reactive } from 'vue'
import { useInventoryStore } from '~/stores/inventory'
import { snapshotStockItemDetails, type StockItemDetails } from '~/utils/stock-item-details'

type Entry = { status: 'loading' | 'done'; details: StockItemDetails | null }

/**
 * Transfers and stock loans recorded before details were saved on each line only kept the item's
 * name. This looks the unit up in inventory once (per session) so those older records can still
 * show its serial, model and so on. Items the viewer can't read, or that no longer exist, simply
 * show their name.
 */
const cache = reactive(new Map<string, Entry>())

export function useStockItemDetailsLookup() {
  const inventoryStore = useInventoryStore()

  function key(itemId: string, storeIds: string[]) {
    return `${storeIds.join('|')}/${itemId}`
  }

  async function load(itemId: string, storeIds: string[]) {
    const k = key(itemId, storeIds)
    if (cache.has(k)) return
    cache.set(k, { status: 'loading', details: null })
    let details: StockItemDetails | null = null
    for (const storeId of storeIds.filter(Boolean)) {
      const item = await inventoryStore
        .fetchInventoryItemById(itemId, { storeId })
        .catch(() => null)
      if (item) {
        details = snapshotStockItemDetails(item)
        break
      }
    }
    cache.set(k, { status: 'done', details })
  }

  /** Details for a line: what it saved, else the looked-up unit (loading starts on first ask). */
  function detailsFor(
    line: { itemId?: string; details?: StockItemDetails | null },
    storeIds: Array<string | undefined>
  ): { details: StockItemDetails | null; loading: boolean } {
    if (line.details && Object.keys(line.details).length) {
      return { details: line.details, loading: false }
    }
    const ids = storeIds.filter((s): s is string => !!s)
    if (!line.itemId || ids.length === 0) return { details: null, loading: false }
    const entry = cache.get(key(line.itemId, ids))
    if (!entry) {
      void load(line.itemId, ids)
      return { details: null, loading: true }
    }
    return { details: entry.details, loading: entry.status === 'loading' }
  }

  return { detailsFor }
}
