import type { InventoryItem } from '~/stores/inventory'
import type { Receipt, ReceiptItem } from '~/stores/receipts'

const SELL_PRICE_FIELDS = ['price', 'Price', 'PRICE', 'cost', 'Cost', 'COST'] as const

export function resolveItemUnitCost(item: InventoryItem | null | undefined): number | undefined {
  if (!item) return undefined
  if (typeof item.unitCost === 'number' && item.unitCost >= 0) return item.unitCost
  if (item.buyback && typeof item.buybackPrice === 'number' && item.buybackPrice >= 0) {
    return item.buybackPrice
  }
  return undefined
}

export function getItemSellPrice(item: InventoryItem | null | undefined): number {
  if (!item) return 0
  if (typeof item.discountedPrice === 'number' && item.discountedPrice >= 0) {
    return item.discountedPrice
  }
  for (const field of SELL_PRICE_FIELDS) {
    const value = item[field]
    if (value !== undefined && value !== null && value !== '') {
      const parsed = parseFloat(String(value))
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return 0
}

export function getItemGrossProfit(item: InventoryItem | null | undefined): number | null {
  const cost = resolveItemUnitCost(item)
  if (cost === undefined) return null
  return getItemSellPrice(item) - cost
}

export function getItemMarginPercent(item: InventoryItem | null | undefined): number | null {
  const profit = getItemGrossProfit(item)
  const sell = getItemSellPrice(item)
  if (profit === null || sell <= 0) return null
  return (profit / sell) * 100
}

export function resolveReceiptLineUnitCost(
  line: ReceiptItem,
  item?: InventoryItem | null
): number {
  if (typeof line.unitCost === 'number' && line.unitCost >= 0) return line.unitCost
  return resolveItemUnitCost(item) ?? 0
}

export function receiptLineRevenue(receipt: Receipt): number {
  if (receipt.items?.length) {
    return receipt.items.reduce((sum, line) => sum + (line.price || 0) * (line.quantity || 1), 0)
  }
  return receipt.total || 0
}

export function receiptLineCogs(
  receipt: Receipt,
  itemLookup?: (itemId: string) => InventoryItem | null | undefined
): number {
  if (!receipt.items?.length) return 0
  return receipt.items.reduce((sum, line) => {
    const item = itemLookup?.(line.itemId)
    const unitCost = resolveReceiptLineUnitCost(line, item)
    return sum + unitCost * (line.quantity || 1)
  }, 0)
}

export function receiptGrossProfit(
  receipt: Receipt,
  itemLookup?: (itemId: string) => InventoryItem | null | undefined
): number {
  return receiptLineRevenue(receipt) - receiptLineCogs(receipt, itemLookup)
}

export function sumReceiptGrossProfit(
  receipts: Receipt[],
  itemLookup?: (itemId: string) => InventoryItem | null | undefined
): number {
  return receipts.reduce((sum, receipt) => sum + receiptGrossProfit(receipt, itemLookup), 0)
}

export function sumReceiptCogs(
  receipts: Receipt[],
  itemLookup?: (itemId: string) => InventoryItem | null | undefined
): number {
  return receipts.reduce((sum, receipt) => sum + receiptLineCogs(receipt, itemLookup), 0)
}

export function formatMarginPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${value.toFixed(0)}%`
}

export function formatGrossProfitHint(
  profit: number,
  formatCurrency: (value: number) => string
): string {
  const prefix = profit >= 0 ? '+' : ''
  return `${prefix}${formatCurrency(profit)} profit`
}

export function receiptGrossProfitHint(
  receipt: Receipt,
  formatCurrency: (value: number) => string,
  itemLookup?: (itemId: string) => InventoryItem | null | undefined
): string | null {
  if (receipt.status !== 'completed') return null
  return formatGrossProfitHint(receiptGrossProfit(receipt, itemLookup), formatCurrency)
}
