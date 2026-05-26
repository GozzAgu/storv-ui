export function formatDemoMoney(amount: number, symbol = '₦'): string {
  const n = Number.isFinite(amount) ? amount : 0
  return `${symbol}${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
}
