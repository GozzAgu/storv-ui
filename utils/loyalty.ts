import { normalizeWhatsAppPhone } from '~/utils/whatsapp'

/**
 * Customer rewards. Points are written only by the server; this module holds the rules both
 * sides share: who a customer is across branches, how much of a sale has been paid, and what
 * that is worth in points.
 */

export type LoyaltyEarnFrom = 'all' | 'confirmed'

export interface LoyaltyTier {
  id: string
  name: string
  /** Spend in the last 12 months needed to reach this tier, in the business currency. */
  minSpend: number
  /** Points earned per point-step on each sale, e.g. 1.5 earns half as many again. */
  multiplier: number
}

export interface LoyaltySettings {
  enabled: boolean
  /** Spend that earns one point, in the business currency (e.g. 1000 = 1 point per ₦1,000). */
  spendPerPoint: number
  /** 'confirmed' earns only on sales whose payments the server has confirmed (Payments V2). */
  earnFrom: LoyaltyEarnFrom
  tiers: LoyaltyTier[]
}

export const LOYALTY_DEFAULT_SETTINGS: LoyaltySettings = {
  enabled: false,
  spendPerPoint: 1000,
  earnFrom: 'all',
  tiers: [
    { id: 'bronze', name: 'Bronze', minSpend: 0, multiplier: 1 },
    { id: 'silver', name: 'Silver', minSpend: 500_000, multiplier: 1.25 },
    { id: 'gold', name: 'Gold', minSpend: 2_000_000, multiplier: 1.5 },
  ],
}

export const LOYALTY_TIER_IDS = ['bronze', 'silver', 'gold'] as const

/** One award per sale. Rate and multiplier are fixed when the sale first earns. */
export interface LoyaltyAward {
  customerKey: string
  storeId: string
  receiptId: string
  amount: number
  points: number
  spendPerPoint: number
  multiplier: number
  month: string
  verified: boolean
}

export interface LoyaltyMember {
  key: string
  name: string
  phone: string | null
  email: string | null
  points: number
  spendByMonth: Record<string, number>
}

/** The receipt fields rewards read. Everything else on a sale is ignored. */
export interface LoyaltyReceipt {
  status?: string
  total?: number
  amountPaid?: number
  date?: Date | string | { toDate?: () => Date } | null
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  paymentSummary?: { netPaidKobo?: number; totalKobo?: number } | null
}

export class LoyaltySettingsError extends Error {}

const MAX_SPEND = 1e12

function finite(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Same customer in every branch: phone in international digits, else email. */
export function loyaltyCustomerKey(receipt: {
  customerPhone?: string
  customerEmail?: string
}): string | null {
  const phone = normalizeWhatsAppPhone(receipt.customerPhone ?? '')
  if (phone.length >= 10 && phone.length <= 15) return `p_${phone}`
  const email = (receipt.customerEmail ?? '').trim().toLowerCase()
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email) && email.length <= 254) return `e_${email}`
  return null
}

export function loyaltyAwardId(storeId: string, receiptId: string): string {
  return `${storeId}_${receiptId}`
}

function receiptDate(date: LoyaltyReceipt['date']): Date | null {
  if (!date) return null
  if (date instanceof Date) return date
  if (typeof date === 'object' && typeof date.toDate === 'function') return date.toDate()
  const d = new Date(date as string)
  return Number.isNaN(d.getTime()) ? null : d
}

export function loyaltyMonth(date: Date): string {
  return date.toISOString().slice(0, 7)
}

/**
 * Money actually paid on a sale, in the business currency. Payments V2 sales use the server's
 * confirmed total; other sales use what the sale record says.
 */
export function loyaltyPaidAmount(receipt: LoyaltyReceipt | null): {
  amount: number
  verified: boolean
} {
  if (!receipt) return { amount: 0, verified: false }
  const status = receipt.status ?? ''
  if (status === 'refunded' || status === 'cancelled') {
    return { amount: 0, verified: Boolean(receipt.paymentSummary) }
  }
  if (receipt.paymentSummary) {
    const summary = receipt.paymentSummary
    const net = Math.max(0, finite(summary.netPaidKobo))
    const cap = summary.totalKobo != null ? Math.max(0, finite(summary.totalKobo)) : net
    return { amount: Math.min(net, cap) / 100, verified: true }
  }
  const total = Math.max(0, finite(receipt.total))
  if (status === 'completed') return { amount: total, verified: false }
  if (status === 'balance_due') {
    return { amount: Math.min(total, Math.max(0, finite(receipt.amountPaid))), verified: false }
  }
  return { amount: 0, verified: false }
}

export function loyaltyPoints(amount: number, spendPerPoint: number, multiplier: number): number {
  if (amount <= 0 || spendPerPoint <= 0) return 0
  return Math.floor((amount / spendPerPoint) * multiplier + 1e-9)
}

/** Spend in the 12 calendar months ending with `now`'s month. */
export function loyaltySpendLast12Months(
  spendByMonth: Record<string, number> | undefined,
  now: Date
): number {
  if (!spendByMonth) return 0
  const months = new Set<string>()
  for (let i = 0; i < 12; i++) {
    months.add(loyaltyMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))))
  }
  let sum = 0
  for (const [month, spend] of Object.entries(spendByMonth)) {
    if (months.has(month)) sum += finite(spend)
  }
  return Math.max(0, sum)
}

export function loyaltyTierFor(spend: number, tiers: LoyaltyTier[]): LoyaltyTier {
  const sorted = [...tiers].sort((a, b) => a.minSpend - b.minSpend)
  let current = sorted[0] ?? LOYALTY_DEFAULT_SETTINGS.tiers[0]!
  for (const tier of sorted) if (spend >= tier.minSpend) current = tier
  return current
}

export function loyaltyTierTone(tierId: string): 'neutral' | 'info' | 'warning' {
  if (tierId === 'gold') return 'warning'
  if (tierId === 'silver') return 'info'
  return 'neutral'
}

export function loyaltyNextTier(
  spend: number,
  tiers: LoyaltyTier[]
): { tier: LoyaltyTier; remaining: number } | null {
  const next = [...tiers].sort((a, b) => a.minSpend - b.minSpend).find((t) => t.minSpend > spend)
  return next ? { tier: next, remaining: next.minSpend - spend } : null
}

export interface LoyaltyMemberChange {
  customerKey: string
  points: number
  amount: number
  month: string
  type: 'earn' | 'reverse'
}

export interface LoyaltyPlan {
  /** Award doc after the change; null deletes it. Undefined leaves it as is. */
  award?: LoyaltyAward | null
  changes: LoyaltyMemberChange[]
}

/**
 * What a sale is worth now versus what it has already earned. Running it again with the same
 * sale changes nothing; a refund or a lower paid amount takes points back.
 */
export function planLoyaltyAward(input: {
  storeId: string
  receiptId: string
  receipt: LoyaltyReceipt | null
  settings: LoyaltySettings
  award: LoyaltyAward | null
  /** 12-month spend of the customer the sale belongs to now, before this sale. */
  memberSpend12m: number
  now: Date
}): LoyaltyPlan {
  const { receipt, settings, award } = input
  const key = receipt ? loyaltyCustomerKey(receipt) : null
  const { amount, verified } = loyaltyPaidAmount(receipt)
  const changes: LoyaltyMemberChange[] = []

  let current = award
  if (current && current.customerKey !== key) {
    if (current.points !== 0 || current.amount !== 0) {
      changes.push({
        customerKey: current.customerKey,
        points: -current.points,
        amount: -current.amount,
        month: current.month,
        type: 'reverse',
      })
    }
    current = null
  }

  if (!current) {
    const mayEarn =
      settings.enabled && key !== null && amount > 0 && (settings.earnFrom === 'all' || verified)
    if (!mayEarn) return { award: award ? null : undefined, changes }
    const multiplier = loyaltyTierFor(input.memberSpend12m, settings.tiers).multiplier
    const points = loyaltyPoints(amount, settings.spendPerPoint, multiplier)
    const date = receiptDate(receipt?.date) ?? input.now
    const next: LoyaltyAward = {
      customerKey: key,
      storeId: input.storeId,
      receiptId: input.receiptId,
      amount,
      points,
      spendPerPoint: settings.spendPerPoint,
      multiplier,
      month: loyaltyMonth(date),
      verified,
    }
    changes.push({ customerKey: key, points, amount, month: next.month, type: 'earn' })
    return { award: next, changes }
  }

  const points = loyaltyPoints(amount, current.spendPerPoint, current.multiplier)
  const pointsDelta = points - current.points
  const amountDelta = amount - current.amount
  if (pointsDelta === 0 && amountDelta === 0 && current.verified === verified) {
    return { award: current === award ? undefined : current, changes }
  }
  if (pointsDelta !== 0 || amountDelta !== 0) {
    changes.push({
      customerKey: current.customerKey,
      points: pointsDelta,
      amount: amountDelta,
      month: current.month,
      type: pointsDelta < 0 || amountDelta < 0 ? 'reverse' : 'earn',
    })
  }
  return { award: { ...current, amount, points, verified }, changes }
}

/** Owner input → settings, or a clear message about what is wrong. */
export function parseLoyaltySettings(raw: unknown): LoyaltySettings {
  const input = (raw ?? {}) as Record<string, unknown>
  if (typeof input.enabled !== 'boolean')
    throw new LoyaltySettingsError('enabled must be true or false')
  const spendPerPoint = Number(input.spendPerPoint)
  if (!Number.isFinite(spendPerPoint) || spendPerPoint < 1 || spendPerPoint > MAX_SPEND) {
    throw new LoyaltySettingsError('Spend per point must be at least 1')
  }
  if (input.earnFrom !== 'all' && input.earnFrom !== 'confirmed') {
    throw new LoyaltySettingsError('Choose which sales earn points')
  }
  if (!Array.isArray(input.tiers) || input.tiers.length !== LOYALTY_TIER_IDS.length) {
    throw new LoyaltySettingsError(`Set all ${LOYALTY_TIER_IDS.length} tiers`)
  }
  const tiers = LOYALTY_TIER_IDS.map((id, index) => {
    const t = (input.tiers as unknown[])[index] as Record<string, unknown> | undefined
    const name = typeof t?.name === 'string' ? t.name.trim() : ''
    if (!name || name.length > 24)
      throw new LoyaltySettingsError('Each tier needs a name up to 24 characters')
    const minSpend = index === 0 ? 0 : Number(t?.minSpend)
    if (!Number.isFinite(minSpend) || minSpend < 0 || minSpend > MAX_SPEND) {
      throw new LoyaltySettingsError(`${name}: spend must be a positive amount`)
    }
    const multiplier = Number(t?.multiplier)
    if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 5) {
      throw new LoyaltySettingsError(`${name}: points rate must be between 1× and 5×`)
    }
    return { id, name, minSpend, multiplier: Math.round(multiplier * 100) / 100 }
  })
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i]!.minSpend <= tiers[i - 1]!.minSpend) {
      throw new LoyaltySettingsError('Each tier must need more spend than the one before')
    }
  }
  return { enabled: input.enabled, spendPerPoint, earnFrom: input.earnFrom, tiers }
}

/** Stored settings with anything missing or malformed replaced by the defaults. */
export function readLoyaltySettings(raw: unknown): LoyaltySettings {
  if (!raw) return { ...LOYALTY_DEFAULT_SETTINGS }
  try {
    return parseLoyaltySettings(raw)
  } catch {
    return { ...LOYALTY_DEFAULT_SETTINGS }
  }
}
