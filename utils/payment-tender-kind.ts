import type { PaymentKind, PaymentSettings } from '~/types/payments-v2'

export type ManualKind = Exclude<PaymentKind, 'paystack_link'>
export const MANUAL_KINDS: readonly ManualKind[] = ['cash', 'pos', 'manual_transfer']

export function normalizeTenderLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60)
}

/**
 * Kind for a merchant's tender label. Every manual kind needs a checker, so a wrong mapping can
 * only change whether cash goes through the till count, never skip confirmation.
 */
export function kindForTender(
  label: string,
  settings: Pick<PaymentSettings, 'tenderKinds'>
): ManualKind {
  const key = normalizeTenderLabel(label)
  const mapped = settings.tenderKinds?.[key]
  if (mapped) return mapped
  if (/\bcash\b/.test(key)) return 'cash'
  if (/\b(pos|card|terminal)\b/.test(key)) return 'pos'
  return 'manual_transfer'
}
