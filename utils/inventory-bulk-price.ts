/**
 * Bulk price changes for inventory items: set or adjust the Unit Price and/or Cost Price of many
 * products at once. The same planner runs in the browser (preview) and on the server (POST
 * /api/inventory/bulk-price), so what the owner previews is what gets written.
 */

export type PriceAdjustMode = 'set' | 'percent'

export interface PriceAdjustment {
  mode: PriceAdjustMode
  /** `set`: the new amount. `percent`: change in percent, e.g. 10 for +10%, -5 for -5%. */
  value: number
}

export interface BulkPriceChange {
  unitPrice?: PriceAdjustment
  costPrice?: PriceAdjustment
}

/** Items per server transaction: one update plus up to two price-history entries each. */
export const BULK_PRICE_MAX_ITEMS = 150

const MAX_AMOUNT = 1_000_000_000_000
const MIN_PERCENT = -90
const MAX_PERCENT = 1000

/** Fields the app reads the selling price from, in order (see getItemSellPrice). */
const SELL_PRICE_KEYS = ['price', 'Price', 'PRICE', 'cost', 'Cost', 'COST'] as const
const COST_KEY = 'unitCost'

export type BulkPriceSkipReason = 'sold' | 'on_loan' | 'awaiting_payment' | 'no_price' | 'unchanged'

export const BULK_PRICE_SKIP_LABELS: Record<BulkPriceSkipReason | 'not_found', string> = {
  not_found: 'no longer in this category',
  sold: 'sold',
  on_loan: 'out on a stock loan',
  awaiting_payment: 'held for a balance payment',
  no_price: 'no current price to adjust',
  unchanged: 'already at that price',
}

export interface ItemPriceSnapshot {
  price: number | null
  cost: number | null
  /** What the item sells for now (after any active discount). */
  sellPrice: number | null
  marginPercent: number | null
}

export interface ItemPricePlan {
  id: string
  before: ItemPriceSnapshot
  after: ItemPriceSnapshot
  /** Field writes for the item doc; empty when skipped. */
  patch: Record<string, number>
  skipped: BulkPriceSkipReason | null
  priceChanged: boolean
  costChanged: boolean
}

const round2 = (n: number) => Math.round(n * 100) / 100

function num(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === '') return null
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw))
  return Number.isFinite(n) ? n : null
}

function parseAdjustment(raw: unknown, label: string, allowZero: boolean): PriceAdjustment {
  if (!raw || typeof raw !== 'object') throw new Error(`${label} is invalid`)
  const { mode, value } = raw as { mode?: unknown; value?: unknown }
  if (mode !== 'set' && mode !== 'percent') throw new Error(`${label} is invalid`)
  const n = typeof value === 'number' ? value : NaN
  if (!Number.isFinite(n)) throw new Error(`Enter a number for ${label}`)
  if (mode === 'set') {
    if (n < 0 || (!allowZero && n === 0)) {
      throw new Error(`${label} must be ${allowZero ? '0 or more' : 'more than 0'}`)
    }
    if (n > MAX_AMOUNT) throw new Error(`${label} is too large`)
    return { mode, value: round2(n) }
  }
  if (n === 0) throw new Error(`Enter a percentage change for ${label}`)
  if (n < MIN_PERCENT || n > MAX_PERCENT) {
    throw new Error(`${label} change must be between ${MIN_PERCENT}% and +${MAX_PERCENT}%`)
  }
  return { mode, value: round2(n) }
}

/** Validates an untrusted change (request body or form). Throws an Error with a user-safe message. */
export function parseBulkPriceChange(input: unknown): BulkPriceChange {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const change: BulkPriceChange = {}
  if (body.unitPrice != null) change.unitPrice = parseAdjustment(body.unitPrice, 'Unit price', false)
  if (body.costPrice != null) change.costPrice = parseAdjustment(body.costPrice, 'Cost price', true)
  if (!change.unitPrice && !change.costPrice) {
    throw new Error('Choose a new unit price or cost price')
  }
  return change
}

/** Why an item can't be repriced: the same locks the inventory page applies to edits. */
export function bulkPriceLockReason(item: Record<string, unknown>): BulkPriceSkipReason | null {
  const filled = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== ''
  if (filled(item.dateOut)) return 'sold'
  if (filled(item.sellerLoanOutId)) return 'on_loan'
  if (filled(item.pendingSaleReceiptId)) return 'awaiting_payment'
  return null
}

function priceKey(item: Record<string, unknown>): string {
  return SELL_PRICE_KEYS.find((k) => num(item[k]) !== null) ?? 'price'
}

/** The list price before discount: `originalPrice` if a discount was applied, else the price field. */
function listPrice(item: Record<string, unknown>): number | null {
  const original = num(item.originalPrice)
  if (original !== null && original > 0) return original
  return num(item[priceKey(item)])
}

function snapshot(
  price: number | null,
  cost: number | null,
  discountedPrice: number | null
): ItemPriceSnapshot {
  const sellPrice = discountedPrice ?? price
  const marginPercent =
    sellPrice !== null && sellPrice > 0 && cost !== null
      ? round2(((sellPrice - cost) / sellPrice) * 100)
      : null
  return { price, cost, sellPrice, marginPercent }
}

function adjust(current: number | null, adj: PriceAdjustment): number | null {
  if (adj.mode === 'set') return adj.value
  if (current === null) return null
  return round2(current * (1 + adj.value / 100))
}

/** What the change does to one item: before/after values and the field writes. */
export function planItemPriceChange(
  item: Record<string, unknown> & { id: string },
  change: BulkPriceChange
): ItemPricePlan {
  const price = listPrice(item)
  const cost = num(item[COST_KEY])
  const discounted = num(item.discountedPrice)
  const discountPct = num(item.discountPercentage)
  const before = snapshot(price, cost, discounted)
  const base = { id: item.id, before, patch: {}, priceChanged: false, costChanged: false }

  const lock = bulkPriceLockReason(item)
  if (lock) return { ...base, after: before, skipped: lock }

  const newPrice = change.unitPrice ? adjust(price, change.unitPrice) : price
  const newCost = change.costPrice ? adjust(cost, change.costPrice) : cost
  // A percentage change needs something to change: no price (or no cost) means nothing to adjust.
  const priceMissing = !!change.unitPrice && newPrice === null
  const costMissing = !!change.costPrice && newCost === null
  if ((priceMissing || !change.unitPrice) && (costMissing || !change.costPrice)) {
    return { ...base, after: before, skipped: 'no_price' }
  }
  if (newPrice !== null && newPrice <= 0) {
    return { ...base, after: before, skipped: 'no_price' }
  }

  const priceChanged = !!change.unitPrice && newPrice !== null && newPrice !== price
  const costChanged = !!change.costPrice && newCost !== null && newCost !== cost
  if (!priceChanged && !costChanged) return { ...base, after: before, skipped: 'unchanged' }

  const patch: Record<string, number> = {}
  let newDiscounted = discounted
  if (priceChanged && newPrice !== null) {
    patch[priceKey(item)] = newPrice
    if (num(item.originalPrice) !== null) patch.originalPrice = newPrice
    // An active discount keeps its percentage on the new price.
    if (discounted !== null) {
      const pct =
        discountPct ?? (price && price > 0 ? ((price - discounted) / price) * 100 : 0)
      newDiscounted = round2(newPrice * (1 - pct / 100))
      patch.originalPrice = newPrice
      patch.discountedPrice = newDiscounted
      patch.discountAmount = round2(newPrice - newDiscounted)
    }
  }
  if (costChanged && newCost !== null) patch[COST_KEY] = newCost

  return {
    id: item.id,
    before,
    after: snapshot(priceChanged ? newPrice : price, costChanged ? newCost : cost, newDiscounted),
    patch,
    skipped: null,
    priceChanged,
    costChanged,
  }
}

export interface BulkPricePlanSummary {
  plans: ItemPricePlan[]
  toUpdate: ItemPricePlan[]
  skippedByReason: Partial<Record<BulkPriceSkipReason, number>>
  /** Total change in stock value at unit price (per unit; bulk quantities are not multiplied). */
  priceDelta: number
  costDelta: number
}

/** `change` is one change for every item, or a lookup for per-item prices (Excel import). */
export function planBulkPriceChange(
  items: Array<Record<string, unknown> & { id: string }>,
  change: BulkPriceChange | ((itemId: string) => BulkPriceChange)
): BulkPricePlanSummary {
  const changeFor = typeof change === 'function' ? change : () => change
  const plans = items.map((item) => planItemPriceChange(item, changeFor(item.id)))
  const toUpdate = plans.filter((p) => !p.skipped)
  const skippedByReason: Partial<Record<BulkPriceSkipReason, number>> = {}
  for (const p of plans) {
    if (p.skipped) skippedByReason[p.skipped] = (skippedByReason[p.skipped] ?? 0) + 1
  }
  const delta = (k: 'price' | 'cost') =>
    round2(toUpdate.reduce((sum, p) => sum + ((p.after[k] ?? 0) - (p.before[k] ?? 0)), 0))
  return { plans, toUpdate, skippedByReason, priceDelta: delta('price'), costDelta: delta('cost') }
}

/** "3 sold, 1 out on a stock loan" for skipped items. */
export function describeBulkPriceSkips(skipped: Partial<Record<string, number>>): string {
  const labels = BULK_PRICE_SKIP_LABELS as Record<string, string>
  return Object.keys(skipped)
    .filter((r) => (skipped[r] ?? 0) > 0)
    .map((r) => `${skipped[r]} ${labels[r] ?? 'skipped'}`)
    .join(', ')
}

function textField(item: Record<string, unknown>, name: string): string {
  const key = Object.keys(item).find((k) => k.toLowerCase() === name)
  const v = key ? item[key] : undefined
  return v === undefined || v === null ? '' : String(v).trim()
}

/**
 * Groups products by name + product model (the `brand` field, labelled "Product model"), so the
 * owner can reprice "every Acura MDX" in one go. Matching ignores case and extra spaces.
 */
export function bulkPriceGroupKey(item: Record<string, unknown>): string {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ')
  return `${norm(textField(item, 'name'))}|${norm(textField(item, 'brand') || textField(item, 'model'))}`
}

export function bulkPriceGroupLabel(item: Record<string, unknown>): string {
  const name = textField(item, 'name')
  const model = textField(item, 'brand') || textField(item, 'model')
  return [name, model].filter(Boolean).join(' · ') || 'Unnamed product'
}

export interface BulkPriceGroup {
  key: string
  label: string
  itemIds: string[]
}

export function groupItemsForBulkPrice(
  items: Array<Record<string, unknown> & { id: string }>
): BulkPriceGroup[] {
  const groups = new Map<string, BulkPriceGroup>()
  for (const item of items) {
    const key = bulkPriceGroupKey(item)
    const group = groups.get(key) ?? { key, label: bulkPriceGroupLabel(item), itemIds: [] }
    group.itemIds.push(item.id)
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label))
}
