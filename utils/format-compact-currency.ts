const COMPACT_MILLION = 1_000_000
const COMPACT_BILLION = 1_000_000_000

/** Format the numeric suffix for compact display (e.g. 1.3, 180, 4). */
export function formatCompactUnit(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 100) return String(Math.round(abs))
  if (abs >= 10) return abs.toFixed(1).replace(/\.0$/, '')
  return abs.toFixed(1).replace(/\.0$/, '')
}

/**
 * Compact currency suffix without symbol: "1.3b", "180m", or "" if below 1m.
 */
export function formatCompactCurrencySuffix(amount: number): string {
  if (!Number.isFinite(amount)) return ''
  const abs = Math.abs(amount)
  if (abs >= COMPACT_BILLION) {
    return `${formatCompactUnit(abs / COMPACT_BILLION)}b`
  }
  if (abs >= COMPACT_MILLION) {
    return `${formatCompactUnit(abs / COMPACT_MILLION)}m`
  }
  return ''
}

/** Full compact currency string, e.g. "₦180m" or "-$1.3b". */
export function formatCompactCurrency(amount: number, symbol: string): string | null {
  if (!Number.isFinite(amount)) return null
  const suffix = formatCompactCurrencySuffix(amount)
  if (!suffix) return null
  const sign = amount < 0 ? '-' : ''
  return `${sign}${symbol}${suffix}`
}
