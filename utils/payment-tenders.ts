/** Default checkout tenders for Nigerian retail (customizable in Settings). */
export const DEFAULT_PAYMENT_TENDERS: string[] = [
  'Cash',
  'Card (POS)',
  'Bank Transfer',
  'OPay',
  'Moniepoint',
  'Palmpay',
  'Kuda',
  'USSD',
  'Mobile Money',
]

export function normalizePaymentTenderList(input: unknown): string[] {
  if (!Array.isArray(input)) return [...DEFAULT_PAYMENT_TENDERS]
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input) {
    const label = String(raw || '').trim()
    if (!label) continue
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(label)
  }
  return out.length > 0 ? out : [...DEFAULT_PAYMENT_TENDERS]
}

export function mergePaymentTenders(custom?: string[] | null): string[] {
  return normalizePaymentTenderList(custom ?? DEFAULT_PAYMENT_TENDERS)
}
