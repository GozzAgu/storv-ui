/** Read-only view of the workspace's main store, for staff working in another branch. */

export interface MainStoreRef {
  id: string
  name: string
}

export interface MainStoreTotals {
  categories: number
  products: number
  /** Categories with at least one product at or below its low-stock level. */
  lowStock: number
  /** Omitted unless the caller may see financial figures. */
  totalValue?: number
}

export interface MainStoreCategorySummary {
  id: string
  name: string
  itemCount: number
  lowStockCount: number
  /** Omitted unless the caller may see financial figures. */
  totalValue?: number
}

export interface MainStoreSummaryResponse {
  mainStore: MainStoreRef
  /** The caller already works in the main store, so there is nothing extra to show. */
  isOwnBranch: boolean
  totals: MainStoreTotals | null
  categories: MainStoreCategorySummary[]
}
