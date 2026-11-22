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

/**
 * Short money for chart axes only ("₦200M", "₦1.5B", "₦50k"), where full figures crowd the
 * chart. Tooltips and totals keep the full amount.
 */
export function formatAxisMoney(amount: number, symbol: string): string {
  if (!Number.isFinite(amount)) return `${symbol}0`
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  const steps: Array<[number, string]> = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'k'],
  ]
  for (const [size, suffix] of steps) {
    if (abs >= size) {
      const value = abs / size
      const text = value >= 100 || Number.isInteger(value) ? Math.round(value) : value.toFixed(1)
      return `${sign}${symbol}${String(text).replace(/\.0$/, '')}${suffix}`
    }
  }
  return `${sign}${symbol}${Math.round(abs)}`
}
