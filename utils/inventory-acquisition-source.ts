import type { InventoryItem } from '~/stores/inventory'

export type InventoryAcquisitionSource = 'swap_in' | 'buyback'

export interface InventorySourceBadge {
  source: InventoryAcquisitionSource
  label: string
  meta?: string
  dotClass: string
  class: string
}

const badgeShell =
  'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-tight'

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
    dotClass: 'bg-sky-500 dark:bg-sky-400',
    class: `${badgeShell} bg-sky-50 text-sky-950 dark:bg-sky-500/15 dark:text-sky-100`,
  }
}

export function inventorySourceBadgeForBuyback(paidLabel?: string): InventorySourceBadge {
  return {
    source: 'buyback',
    label: 'Buyback',
    meta: paidLabel,
    dotClass: 'bg-cyan-500 dark:bg-cyan-400',
    class: `${badgeShell} bg-cyan-50 text-cyan-950 dark:bg-cyan-500/15 dark:text-cyan-100`,
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
