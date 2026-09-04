import type { Receipt, ReceiptItem } from '~/stores/receipts'

/** Total $ discounted on one line (0 when the line has no discount). */
export function receiptLineDiscount(line: ReceiptItem): number {
  if (!line.hasDiscount || !line.discountAmount) return 0
  return line.discountAmount * (line.quantity || 1)
}

/** Total $ discounted across every item on a receipt. */
export function receiptDiscountTotal(receipt: Receipt): number {
  if (!receipt.items?.length) return 0
  return receipt.items.reduce((sum, line) => sum + receiptLineDiscount(line), 0)
}

/** Whether a receipt has at least one discounted line. */
export function receiptHasDiscount(receipt: Receipt): boolean {
  return !!receipt.items?.some((line) => line.hasDiscount && (line.discountAmount || 0) > 0)
}

/** Sum of $ discounted across a set of receipts. */
export function sumReceiptDiscounts(receipts: Receipt[]): number {
  return receipts.reduce((sum, receipt) => sum + receiptDiscountTotal(receipt), 0)
}

/** Count of receipts (not line items) that included at least one discount. */
export function countDiscountedReceipts(receipts: Receipt[]): number {
  return receipts.reduce((count, receipt) => count + (receiptHasDiscount(receipt) ? 1 : 0), 0)
}

/**
 * Discount rate = total discounted $ over the pre-discount subtotal (revenue + discounts),
 * i.e. what fraction of gross list-price sales was given away. Null when there's no revenue
 * to compute a rate against.
 */
export function discountRatePercent(discountTotal: number, postDiscountRevenue: number): number | null {
  const grossBeforeDiscount = postDiscountRevenue + discountTotal
  if (grossBeforeDiscount <= 0) return null
  return (discountTotal / grossBeforeDiscount) * 100
}
