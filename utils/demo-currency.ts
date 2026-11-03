import { formatFullMoney } from '~/utils/format-money'

export function formatDemoMoney(amount: number, symbol = '₦'): string {
  const n = Number.isFinite(amount) ? amount : 0
  return formatFullMoney(n, symbol)
}
