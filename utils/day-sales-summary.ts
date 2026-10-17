import type { Receipt } from '~/stores/receipts'
import { receiptAmountPaid, receiptBalanceDue, roundMoney } from '~/utils/receipt-balance'

export type DaySalesMode = 'everyone' | 'mine'

export interface DaySalesOptions {
  /** Any moment on the day to summarise (local time). */
  day: Date
  /** Used to compare with yesterday at the same time of day when `day` is today. */
  now: Date
  viewerUid: string
  mode: DaySalesMode
  /** Owner, or staff with the Financial figures grant. Without it the summary is always "mine". */
  canViewStoreTotals: boolean
}

export interface DaySalesTender {
  method: string
  amount: number
}

export interface DaySalesProduct {
  key: string
  name: string
  quantity: number
  amount: number
  serials: string[]
}

export interface DaySalesSeller {
  uid: string
  name: string
  count: number
  amount: number
}

export interface DaySalesSummary {
  mode: DaySalesMode
  /** Completed and part-paid sales. */
  count: number
  sold: number
  collected: number
  owed: number
  refunds: { count: number; amount: number }
  tenders: DaySalesTender[]
  products: DaySalesProduct[]
  /** Product lines minus `sold`: checkout discounts and trade-in credit taken off sales. */
  reductions: number
  /** Empty in "mine" mode. */
  sellers: DaySalesSeller[]
  comparison: {
    previousSold: number
    change: number
    /** Null when yesterday had nothing to compare with. */
    changePct: number | null
    /** Set when yesterday is counted only up to the current time of day. */
    sameTimeCutoff: Date | null
  }
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const withToDate = value as { toDate?: () => Date }
  if (typeof withToDate.toDate === 'function') return withToDate.toDate()
  const parsed = new Date(value as string | number)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function receiptCreatorUid(receipt: Pick<Receipt, 'actualCreator' | 'createdBy'>): string {
  return receipt.actualCreator || receipt.createdBy || ''
}

function isSale(receipt: Receipt): boolean {
  return receipt.status === 'completed' || receipt.status === 'balance_due'
}

function collectedOn(receipt: Receipt): number {
  return receipt.status === 'completed' ? receipt.total || 0 : receiptAmountPaid(receipt)
}

/** How a sale's collected money splits across payment methods. */
function tendersOf(receipt: Receipt): DaySalesTender[] {
  const payments = (receipt.payments ?? []).filter((p) => (p.amount || 0) > 0)
  const paymentsList = payments.map((p) => ({ method: p.method, amount: p.amount }))
  if (receipt.status === 'completed') {
    const split = (receipt.splitPayments ?? []).filter((p) => (p.amount || 0) > 0)
    if (split.length > 0) return split.map((p) => ({ method: p.method, amount: p.amount }))
    // Paid off in instalments: `paymentMethod` only holds the last one.
    const paidInFull = payments.reduce((s, p) => s + p.amount, 0) >= (receipt.total || 0) - 0.01
    if (payments.length > 0 && paidInFull) return paymentsList
    return [{ method: receipt.paymentMethod, amount: receipt.total || 0 }]
  }
  if (payments.length > 0) return paymentsList
  const paid = receiptAmountPaid(receipt)
  return paid > 0 ? [{ method: receipt.paymentMethod, amount: paid }] : []
}

function addTo<T extends { amount: number }>(map: Map<string, T>, key: string, make: () => T) {
  const row = map.get(key) ?? make()
  map.set(key, row)
  return row
}

function soldBetween(receipts: Receipt[], from: Date, to: Date): number {
  return roundMoney(
    receipts
      .filter((r) => {
        const at = toDate(r.date)
        return isSale(r) && at !== null && at >= from && at < to
      })
      .reduce((sum, r) => sum + (r.total || 0), 0)
  )
}

/**
 * One day of sales for the Today screen. Figures are built so they tally: `sold` is
 * `collected` plus `owed`, and `collected` is the sum of `tenders` (as long as each sale's split
 * payments add up to its total). Refunded, cancelled and pending sales are kept out of every
 * total; refunds are reported on their own.
 */
export function summarizeDaySales(receipts: Receipt[], options: DaySalesOptions): DaySalesSummary {
  const mode: DaySalesMode = options.canViewStoreTotals ? options.mode : 'mine'
  const scoped =
    mode === 'mine' ? receipts.filter((r) => receiptCreatorUid(r) === options.viewerUid) : receipts

  const dayStart = startOfDay(options.day)
  const dayEnd = addDays(dayStart, 1)
  const onDay = scoped.filter((r) => {
    const at = toDate(r.date)
    return at !== null && at >= dayStart && at < dayEnd
  })
  const sales = onDay.filter(isSale)
  const refunded = onDay.filter((r) => r.status === 'refunded')

  const tenders = new Map<string, DaySalesTender>()
  const products = new Map<string, DaySalesProduct>()
  const sellers = new Map<string, DaySalesSeller>()
  let sold = 0
  let collected = 0
  let owed = 0

  for (const receipt of sales) {
    sold += receipt.total || 0
    collected += collectedOn(receipt)
    if (receipt.status === 'balance_due') owed += receiptBalanceDue(receipt)

    for (const tender of tendersOf(receipt)) {
      const label = (tender.method || '').trim() || 'Other'
      addTo(tenders, label.toLowerCase(), () => ({ method: label, amount: 0 })).amount +=
        tender.amount
    }

    for (const item of receipt.items ?? []) {
      const name = (item.itemName || '').trim() || 'Unnamed product'
      const key = `${item.folderId || receipt.folderId || ''}:${name.toLowerCase()}`
      const row = addTo(products, key, () => ({ key, name, quantity: 0, amount: 0, serials: [] }))
      const quantity = item.quantity || 1
      row.quantity += quantity
      row.amount += (item.price || 0) * quantity
      if (item.serialNo) row.serials.push(item.serialNo)
    }

    if (mode === 'everyone') {
      const uid = receiptCreatorUid(receipt)
      const seller = addTo(sellers, uid, () => ({
        uid,
        name: receipt.createdByUserName?.trim() || 'Unknown',
        count: 0,
        amount: 0,
      }))
      seller.count += 1
      seller.amount += receipt.total || 0
    }
  }

  const byAmount = <T extends { amount: number }>(rows: T[]) =>
    rows
      .map((row) => ({ ...row, amount: roundMoney(row.amount) }))
      .sort((a, b) => b.amount - a.amount)

  const isToday = dayStart.getTime() === startOfDay(options.now).getTime()
  const yesterday = addDays(dayStart, -1)
  const cutoff = isToday
    ? new Date(yesterday.getTime() + (options.now.getTime() - dayStart.getTime()))
    : null
  const previousSold = soldBetween(scoped, yesterday, cutoff ?? dayStart)
  const soldRounded = roundMoney(sold)
  const productRows = byAmount([...products.values()])
  const linesTotal = productRows.reduce((sum, row) => sum + row.amount, 0)

  return {
    mode,
    count: sales.length,
    sold: soldRounded,
    collected: roundMoney(collected),
    owed: roundMoney(owed),
    refunds: {
      count: refunded.length,
      amount: roundMoney(refunded.reduce((sum, r) => sum + (r.total || 0), 0)),
    },
    tenders: byAmount([...tenders.values()]),
    products: productRows,
    reductions: Math.max(0, roundMoney(linesTotal - soldRounded)),
    sellers: byAmount([...sellers.values()]),
    comparison: {
      previousSold,
      change: roundMoney(soldRounded - previousSold),
      changePct:
        previousSold > 0 ? Math.round(((soldRounded - previousSold) / previousSold) * 100) : null,
      sameTimeCutoff: cutoff,
    },
  }
}
