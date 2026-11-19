/**
 * A short, readable receipt number from the sale's random ID, so two tills (or a till and its
 * own offline replay) can't produce the same number the way a clock-based one could.
 * Shared by the server (which stores it) and screens that only have the sale ID.
 */
export function receiptNumberFor(saleId: string): string {
  return `REC-${saleId
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()}`
}
