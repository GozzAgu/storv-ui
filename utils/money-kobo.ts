/**
 * The only naira ↔ kobo conversion for Payments V2. Payment amounts are stored as integer kobo;
 * receipts still store naira floats, so every crossing goes through here.
 */

export const PAYMENTS_V2_CURRENCY = 'NGN' as const
export type PaymentsCurrency = typeof PAYMENTS_V2_CURRENCY

export class MoneyConversionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MoneyConversionError'
  }
}

/**
 * Naira → integer kobo. `toPrecision(15)` strips binary float noise before rounding
 * (19.99 * 100 = 1998.9999999999998 → 1999), then `Math.round` rounds half-kobo up.
 * Negative, non-finite and unsafe values are rejected.
 */
export function nairaToKobo(naira: number | string): number {
  const value = typeof naira === 'string' ? Number(naira.trim()) : naira
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new MoneyConversionError('Amount must be a finite number')
  }
  if (value < 0) throw new MoneyConversionError('Amount cannot be negative')
  const kobo = Math.round(Number((value * 100).toPrecision(15)))
  if (!Number.isSafeInteger(kobo)) throw new MoneyConversionError('Amount is too large')
  return kobo
}

export function koboToNaira(kobo: number): number {
  assertKobo(kobo)
  return kobo / 100
}

/** Non-negative safe integer kobo. */
export function assertKobo(kobo: unknown): asserts kobo is number {
  if (typeof kobo !== 'number' || !Number.isSafeInteger(kobo) || kobo < 0) {
    throw new MoneyConversionError('Kobo amount must be a non-negative integer')
  }
}

export function isPaymentsCurrency(currency: unknown): currency is PaymentsCurrency {
  return currency === PAYMENTS_V2_CURRENCY
}
