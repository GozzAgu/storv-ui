import type { InventoryItem } from '~/stores/inventory'
import {
  DETAIL_LABELS,
  DETAIL_ORDER,
  getReceiptProductDetails,
  humanizeDetailKey,
} from '~/composables/useReceiptProductDetails'

/**
 * What identifies a unit when it leaves the shelf on a transfer or a stock loan: serial/IMEI,
 * brand, model, colour, storage, condition and the category's own fields. Prices, costs and
 * bookkeeping never go in, because staff who can see transfers and loans may not be allowed to
 * see money.
 */
export type StockItemDetails = Record<string, string | number | boolean>

/** One unit in a transfer or loan, as StockItemDetailsList shows it. */
export interface StockItemRow {
  key?: string
  name: string
  quantity?: number
  details?: StockItemDetails | null
  loading?: boolean
  badge?: string
  badgeTone?: 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'info'
}

export interface StockItemDetailChip {
  key: string
  label: string
  value: string
}

const NAME_KEYS = new Set(['name', 'itemName', 'productName', 'title'])

const SKIP_KEYS = new Set([
  'quantity',
  'qty',
  'Quantity',
  'stock',
  'Stock',
  'status',
  'hasDiscount',
  'discountPercentage',
  'discountAmount',
  'discountReason',
  'lowStockThreshold',
  'ownerId',
  'userId',
  'buyback',
  'buybackId',
  'swapIn',
  'swapInReceiptId',
  'imageUrl',
  'imageUrls',
  'photoUrl',
  'thumbnailUrl',
])

/** Stock-loan, held-sale, transfer and acquisition bookkeeping. */
const INTERNAL_KEY = /^(sellerLoan|pendingSale|transfer|acquisition|storefront|search|_)/i

/** Price, cost, value, margin and similar money fields, in any naming style. */
const MONEY_KEY = /(price|cost|amount|value|margin|profit|msrp|total|commission|fee|credit)$/i

/** Kept small: up to 450 lines share one Firestore document (1 MB). */
const DEFAULT_MAX_KEYS = 16
const MAX_VALUE_LENGTH = 80

function keepKey(key: string): boolean {
  return (
    !NAME_KEYS.has(key) &&
    !SKIP_KEYS.has(key) &&
    !INTERNAL_KEY.test(key) &&
    !MONEY_KEY.test(key.replace(/[\s_-]/g, ''))
  )
}

/** Identifying details from an inventory item, safe to store on a transfer or loan line. */
export function snapshotStockItemDetails(
  item: InventoryItem,
  opts: { maxKeys?: number } = {}
): StockItemDetails {
  const maxKeys = opts.maxKeys ?? DEFAULT_MAX_KEYS
  const out: StockItemDetails = {}
  const entries = Object.entries(getReceiptProductDetails(item))
  // Identifiers first, so a tight budget still keeps the serial and model.
  const rank = (key: string) => {
    const i = (DETAIL_ORDER as readonly string[]).indexOf(key)
    return i === -1 ? DETAIL_ORDER.length : i
  }
  entries.sort((a, b) => rank(a[0]) - rank(b[0]))
  for (const [key, value] of entries) {
    if (Object.keys(out).length >= maxKeys) break
    if (!keepKey(key)) continue
    if (typeof value === 'boolean') {
      out[key] = value
      continue
    }
    const text = String(value).trim()
    if (!text || text.length > MAX_VALUE_LENGTH) continue
    out[key] = typeof value === 'number' ? value : text
  }
  return out
}

function formatValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value).trim()
}

/**
 * Details as labelled chips, identifiers first (SN, IMEI, brand, model…), then everything else
 * in the order it was captured. Repeats (the same label and value) are dropped. Filters again on
 * read so older snapshots never show money.
 */
export function stockItemDetailChips(
  details: StockItemDetails | null | undefined
): StockItemDetailChip[] {
  if (!details) return []
  const chips: StockItemDetailChip[] = []
  const seen = new Set<string>()
  const push = (key: string) => {
    const raw = details[key]
    if (raw === undefined || raw === null || !keepKey(key)) return
    const value = formatValue(raw)
    if (!value) return
    const label = DETAIL_LABELS[key] || humanizeDetailKey(key)
    const id = `${label}:${value.toLowerCase()}`
    if (seen.has(id)) return
    seen.add(id)
    chips.push({ key, label, value })
  }
  for (const key of DETAIL_ORDER) push(key)
  for (const key of ['condition', 'warranty', 'batteryHealth', 'processor']) push(key)
  for (const key of Object.keys(details)) push(key)
  return chips
}

/** One-line summary for compact rows, e.g. "SN 3592… · Black · 128GB". */
export function stockItemDetailSummary(
  details: StockItemDetails | null | undefined,
  max = 3
): string {
  return stockItemDetailChips(details)
    .slice(0, max)
    .map((chip) =>
      chip.label === 'SN' || chip.label === 'IMEI' ? `${chip.label} ${chip.value}` : chip.value
    )
    .join(' · ')
}

/** Every name, repeats folded into a count: "iPhone 13 × 2, Galaxy S22". Nothing is cut off. */
export function groupedItemNames(
  entries: Array<string | { name: string; quantity?: number }>
): string {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    const name = (typeof entry === 'string' ? entry : entry.name).trim() || 'Item'
    const qty = typeof entry === 'string' ? 1 : Math.max(1, Number(entry.quantity) || 1)
    counts.set(name, (counts.get(name) ?? 0) + qty)
  }
  return [...counts].map(([name, count]) => (count > 1 ? `${name} × ${count}` : name)).join(', ')
}
