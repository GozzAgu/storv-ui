type SwapInField = { name: string; label?: string; type?: string }

/** Fields that hold what the shop pays for an item, most specific first. */
const COST_FIELD_NAMES = ['unitCost', 'costPrice', 'cost', 'buybackPrice'] as const

/** Fields that hold the resale price, which staff may not know when taking a trade-in. */
const PRICE_FIELD_NAMES = ['price', 'unitPrice', 'sellingPrice'] as const
const PRICE_FIELD_LABEL = /^(unit|selling)?\s*price$/i

/** Unit Price (resale) on the swap-in form: optional, and never credited to the customer. */
export function isSwapInPriceField(field: SwapInField): boolean {
  if (field.type !== 'currency') return false
  return (
    (PRICE_FIELD_NAMES as readonly string[]).includes(field.name) ||
    PRICE_FIELD_LABEL.test(field.label?.trim() ?? '')
  )
}

/**
 * The swap-in field whose value is credited to the customer: the device's cost price (what the
 * shop gives for it), or the only money field that isn't a resale price. Null when the category
 * has no such field, in which case staff enter a separate swap value.
 */
export function swapInCreditField(fields: SwapInField[]): string | null {
  const money = fields.filter((field) => field.type === 'currency')
  const cost = COST_FIELD_NAMES.find((name) => money.some((field) => field.name === name))
  if (cost) return cost
  const other = money.filter((field) => !isSwapInPriceField(field))
  return other.length === 1 ? other[0]!.name : null
}

function toCredit(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Amount credited for the swapped-in device; `swapValue` is used when there is no cost field. */
export function swapInCredit(
  fields: SwapInField[],
  form: Record<string, unknown>,
  swapValue?: unknown
): number {
  const field = swapInCreditField(fields)
  return toCredit(field ? form[field] : swapValue)
}
