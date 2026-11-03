import { fullMoneyFractionDigits } from '~/utils/format-money'

/** Format a Naira amount in full: kobo is kept, never rounded away. */
export function formatNaira(value: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    ...fullMoneyFractionDigits(value || 0),
  }).format(value || 0)
}
