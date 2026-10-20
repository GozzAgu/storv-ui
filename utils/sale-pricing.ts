import type { InventoryItem } from '~/stores/inventory'
import { getInventoryItemField } from '~/composables/useInventoryItemDisplay'
import { roundMoney } from '~/utils/receipt-balance'

/**
 * Sale pricing shared by the checkout screens (to show totals) and the server (which is the only
 * one allowed to decide them). Every amount on a receipt is worked out here from the inventory
 * rows, never taken from the client.
 */

/** Checkout discounts above this share of a line's unit price need a manager's approval. */
export const STAFF_DISCOUNT_LIMIT_PERCENT = 10

/** Price the item sells at today: its standing discount if it has one, else its Unit Price. */
export function saleUnitPrice(item: InventoryItem): number {
  if (typeof item.discountedPrice === 'number' && item.discountedPrice >= 0) {
    return item.discountedPrice
  }
  const n = parseFloat(getInventoryItemField(item, 'price') || '0')
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Price before any standing discount, for the receipt's "was" figure. */
export function saleOriginalPrice(item: InventoryItem): number {
  if (typeof item.originalPrice === 'number' && item.originalPrice >= 0) return item.originalPrice
  const n = parseFloat(getInventoryItemField(item, 'price') || '0')
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Whether a checkout discount on one unit is above the staff limit. */
export function discountNeedsApproval(unitPrice: number, discountPerUnit: number): boolean {
  if (discountPerUnit <= 0 || unitPrice <= 0) return false
  return (discountPerUnit / unitPrice) * 100 > STAFF_DISCOUNT_LIMIT_PERCENT + 1e-9
}

export interface PricedLineInput {
  item: InventoryItem
  /** Units on this line; serial-number rows are always 1. */
  quantity: number
  serial: boolean
  /** Checkout discount per unit, in money. */
  discountPerUnit: number
}

export interface PricedLine {
  quantity: number
  unitPrice: number
  originalPrice: number
  discountPerUnit: number
  /** Final price per unit after the checkout discount. */
  finalPrice: number
  lineTotal: number
  needsApproval: boolean
  /** True when the row has a standing discount or a checkout discount. */
  hasDiscount: boolean
  discountPercentage?: number
  discountAmount?: number
}

export class SalePricingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SalePricingError'
  }
}

export function priceSaleLine(input: PricedLineInput): PricedLine {
  const unitPrice = saleUnitPrice(input.item)
  if (unitPrice <= 0) {
    throw new SalePricingError('One of the products has no Unit Price. Set one in Inventory first.')
  }
  const quantity = input.serial ? 1 : Math.floor(input.quantity)
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new SalePricingError('Check the product quantities.')
  }
  const discountPerUnit = roundMoney(Math.max(0, Number(input.discountPerUnit) || 0))
  if (discountPerUnit > unitPrice) {
    throw new SalePricingError('A discount is larger than the product price.')
  }
  const finalPrice = roundMoney(unitPrice - discountPerUnit)
  const originalPrice = saleOriginalPrice(input.item)
  const standingDiscount = typeof input.item.discountedPrice === 'number'
  const hasDiscount = standingDiscount || discountPerUnit > 0

  return {
    quantity,
    unitPrice,
    originalPrice,
    discountPerUnit,
    finalPrice,
    lineTotal: roundMoney(finalPrice * quantity),
    needsApproval: discountNeedsApproval(unitPrice, discountPerUnit),
    hasDiscount,
    ...(hasDiscount && {
      discountAmount: discountPerUnit > 0 ? discountPerUnit : input.item.discountAmount,
      discountPercentage:
        discountPerUnit > 0 && originalPrice > 0
          ? Math.round((discountPerUnit / originalPrice) * 100)
          : input.item.discountPercentage,
    }),
  }
}

export interface SaleTotals {
  subtotal: number
  /** Trade-in credit actually applied: never more than the items are worth. */
  swapInCredit: number
  commission: number
  total: number
}

export function computeSaleTotals(
  lines: readonly Pick<PricedLine, 'lineTotal'>[],
  swapInCredit = 0,
  commission = 0
): SaleTotals {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0))
  const credit = roundMoney(Math.min(Math.max(0, swapInCredit), subtotal))
  const fee = roundMoney(Math.max(0, commission))
  return {
    subtotal,
    swapInCredit: credit,
    commission: fee,
    total: roundMoney(subtotal - credit + fee),
  }
}

/** Split tenders must add up to what the customer pays now. */
export function splitPaymentsMatch(
  split: readonly { amount: number }[],
  expected: number
): boolean {
  const sum = roundMoney(split.reduce((s, p) => s + (Number(p.amount) || 0), 0))
  return Math.abs(sum - roundMoney(expected)) <= 0.01
}
