/** One row of the Returns → Stock out log, and the facts its hover card shows. */

export type StockOutTone = 'neutral' | 'warning' | 'info' | 'success' | 'error'
export type StockOutEntryType = 'supplier' | 'customer' | 'write_off' | 'deleted' | 'count'

export interface StockOutEntry {
  key: string
  type: StockOutEntryType
  typeLabel: string
  tone: StockOutTone
  at: string | null
  itemName: string
  itemLine: string
  what: string
  why: string
  units: number
  cost: number | null
  by: string
  search: string
  restorableId: string | null
  restored: boolean
  /** Hover card: one line on why it's out of stock, then the facts behind it. */
  headline: string
  facts: Array<{ label: string; value: string }>
}
