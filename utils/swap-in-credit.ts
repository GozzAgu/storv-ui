/** Fields that hold what the shop pays for an item, most specific first. */
const COST_FIELD_NAMES = ['unitCost', 'costPrice', 'cost', 'buybackPrice'] as const

/**
 * The swap-in field whose value is credited to the customer: the device's cost price (what the
 * shop gives for it), not its resale price. Falls back to the only money field, then `price`,
 * for categories set up without a cost field.
 */
export function swapInCreditField(fields: Array<{ name: string; type?: string }>): string | null {
  const money = fields.filter((field) => field.type === 'currency').map((field) => field.name)
  const cost = COST_FIELD_NAMES.find((name) => money.includes(name))
  if (cost) return cost
  if (money.length === 1) return money[0]!
  if (money.includes('price')) return 'price'
  return money[0] ?? null
}

export function swapInCredit(
  fields: Array<{ name: string; type?: string }>,
  form: Record<string, unknown>
): number {
  const field = swapInCreditField(fields)
  if (!field) return 0
  const value = Number(form[field])
  return Number.isFinite(value) && value > 0 ? value : 0
}
