/**
 * Money is always shown in full: never shortened ("₦1.2m", "₦12k") and never rounded.
 * Whole amounts drop the decimals ("₦1,250,000"); anything with kobo/cents keeps both digits
 * ("₦1,250,000.50").
 */
export function fullMoneyFractionDigits(amount: number): {
  minimumFractionDigits: number
  maximumFractionDigits: number
} {
  const cents = Math.round(Math.abs(amount) * 100)
  return { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }
}

/** "₦1,250,000", "-$2,500.75": a symbol-prefixed amount for charts and compact UI. */
export function formatFullMoney(amount: number, symbol: string): string {
  if (!Number.isFinite(amount)) return `${symbol}0`
  const sign = amount < 0 ? '-' : ''
  const digits = Math.abs(amount).toLocaleString('en-US', fullMoneyFractionDigits(amount))
  return `${sign}${symbol}${digits}`
}
