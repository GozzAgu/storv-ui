import type { MainStoreCategorySummary, MainStoreTotals } from '~/types/main-store-summary'
import { normalizeParentId } from '~/utils/inventory-folder-tree'

export interface MainStoreCandidate {
  id: string
  name: string
  status?: string
  createdAtMs: number | null
}

export interface SummaryFolder {
  id: string
  name: string
  parentId?: string | null
  itemCount: number
  totalValue: number
  lowStockCount: number
}

/** The first store the owner created; stores without a creation time sort last. */
export function pickMainStore<T extends MainStoreCandidate>(stores: T[]): T | null {
  const live = stores.filter((store) => store.status !== 'inactive' && store.status !== 'deleted')
  live.sort((a, b) => {
    const aMs = a.createdAtMs ?? Number.POSITIVE_INFINITY
    const bMs = b.createdAtMs ?? Number.POSITIVE_INFINITY
    if (aMs !== bMs) return aMs - bMs
    return a.id.localeCompare(b.id)
  })
  return live[0] ?? null
}

type FolderStats = Pick<SummaryFolder, 'itemCount' | 'totalValue' | 'lowStockCount'>

function rollup(folder: SummaryFolder, folders: SummaryFolder[]): FolderStats {
  const children = folders.filter((f) => normalizeParentId(f.parentId) === folder.id)
  if (children.length === 0) {
    return {
      itemCount: folder.itemCount,
      totalValue: folder.totalValue,
      lowStockCount: folder.lowStockCount,
    }
  }
  return children.reduce<FolderStats>(
    (acc, child) => {
      const stats = rollup(child, folders)
      return {
        itemCount: acc.itemCount + stats.itemCount,
        totalValue: acc.totalValue + stats.totalValue,
        lowStockCount: acc.lowStockCount + stats.lowStockCount,
      }
    },
    { itemCount: 0, totalValue: 0, lowStockCount: 0 }
  )
}

/**
 * Totals use the same formulas as the owner's Inventory page header, so the figures a branch
 * sees for the main store match what the owner sees there. Categories are top-level only, with
 * subcategories rolled into their parent.
 */
export function summarizeStoreInventory(
  folders: SummaryFolder[],
  options: { includeValue: boolean }
): { totals: MainStoreTotals; categories: MainStoreCategorySummary[] } {
  const roots = folders.filter((folder) => !normalizeParentId(folder.parentId))

  const totals: MainStoreTotals = {
    categories: roots.length,
    products: folders.reduce((sum, folder) => sum + folder.itemCount, 0),
    lowStock: folders.filter((folder) => folder.lowStockCount > 0).length,
  }
  if (options.includeValue) {
    totals.totalValue = folders.reduce((sum, folder) => sum + folder.totalValue, 0)
  }

  const categories = roots
    .map((folder) => {
      const stats = rollup(folder, folders)
      const row: MainStoreCategorySummary = {
        id: folder.id,
        name: folder.name,
        itemCount: stats.itemCount,
        lowStockCount: stats.lowStockCount,
      }
      if (options.includeValue) row.totalValue = stats.totalValue
      return row
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  return { totals, categories }
}
