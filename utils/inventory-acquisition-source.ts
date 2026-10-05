import type { InventoryItem } from '~/stores/inventory'

export type InventoryAcquisitionSource = 'swap_in' | 'buyback'

export interface InventorySourceBadge {
  source: InventoryAcquisitionSource
  label: string
  meta?: string
}

export function isInventorySwapInItem(item: InventoryItem): boolean {
  return item.swapIn === true
}

export function isInventoryBuybackItem(item: InventoryItem): boolean {
  return item.buyback === true
}

export function inventorySourceBadgeForSwapIn(receiptNumber?: string): InventorySourceBadge {
  const meta = receiptNumber?.trim() || undefined
  return {
    source: 'swap_in',
    label: 'Swap-in',
    meta,
  }
}

export function inventorySourceBadgeForBuyback(paidLabel?: string): InventorySourceBadge {
  return {
    source: 'buyback',
    label: 'Buyback',
    meta: paidLabel,
  }
}

export function getInventorySourceBadge(
  item: InventoryItem,
  opts?: {
    receiptNumber?: string
    formatPrice?: (amount: number) => string
  }
): InventorySourceBadge | null {
  if (isInventorySwapInItem(item)) {
    return inventorySourceBadgeForSwapIn(opts?.receiptNumber)
  }

  if (isInventoryBuybackItem(item)) {
    const paidLabel =
      typeof item.buybackPrice === 'number' && item.buybackPrice > 0
        ? opts?.formatPrice?.(item.buybackPrice) ?? String(item.buybackPrice)
        : undefined
    return inventorySourceBadgeForBuyback(paidLabel)
  }

  return null
}

/** Badge tone for an acquisition source in the design-system components. */
export function inventorySourceTone(source: InventoryAcquisitionSource): 'info' | 'accent' {
  return source === 'swap_in' ? 'info' : 'accent'
}
