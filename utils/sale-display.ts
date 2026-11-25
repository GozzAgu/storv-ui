/**
 * How sales read in lists and tables: when they happened, who bought, what was in the basket and
 * how it was paid. Pure functions so every table (Sales, Outstanding, Today, customers) agrees.
 */

const WALK_IN_NAMES = new Set([
  '',
  'walk-in',
  'walk-in customer',
  'walkin',
  'walk in',
  'walk in customer',
])

/** True when a sale has no named customer (blank, or the app's "Walk-in customer" placeholder). */
export function isWalkInCustomer(name: string | null | undefined): boolean {
  return WALK_IN_NAMES.has(
    String(name ?? '')
      .trim()
      .toLowerCase()
  )
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function timeLabel(date: Date): string {
  return date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(' AM', ' am')
    .replace(' PM', ' pm')
}

/**
 * "Today, 2:15 pm" / "Yesterday, 9:04 am" for the last two days (time matters at the till),
 * then "Nov 21" this year and "Nov 21, 2025" for older years. `title` is the full timestamp.
 */
export function formatSaleWhen(
  value: string | Date | null | undefined,
  now: Date = new Date()
): { label: string; title: string } {
  if (!value) return { label: '—', title: '' }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return { label: '—', title: '' }

  const title = date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (days === 0) return { label: `Today, ${timeLabel(date)}`, title }
  if (days === 1) return { label: `Yesterday, ${timeLabel(date)}`, title }

  const sameYear = date.getFullYear() === now.getFullYear()
  const label = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
  return { label, title }
}

/** First item name plus how many more, so one long name never hides the size of the basket. */
export function summarizeSaleItems(items: Array<{ itemName?: string | null }> | null | undefined): {
  first: string
  more: number
} {
  const names = (items ?? []).map((item) => (item.itemName ?? '').trim()).filter(Boolean)
  return { first: names[0] ?? '', more: Math.max(0, names.length - 1) }
}

export type PaymentKind = 'cash' | 'card' | 'transfer' | 'mobile' | 'ussd' | 'split' | 'other'

/** Groups a free-text tender ("Card (POS)", "OPay", "Bank Transfer") by kind, for its icon. */
export function paymentKind(method: string | null | undefined): PaymentKind {
  const m = String(method ?? '').toLowerCase()
  if (!m.trim()) return 'other'
  if (/split|\+|,|multiple|mixed/.test(m)) return 'split'
  if (/cash/.test(m)) return 'cash'
  if (/card|pos/.test(m)) return 'card'
  if (/transfer|bank/.test(m)) return 'transfer'
  if (/ussd/.test(m)) return 'ussd'
  if (/opay|moniepoint|palmpay|kuda|mobile|wallet|momo/.test(m)) return 'mobile'
  return 'other'
}
