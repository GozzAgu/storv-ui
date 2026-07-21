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
  'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-[11px] font-medium leading-tight'

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
    class: `${badgeShell} border-sky-200/90 bg-sky-50/90 text-sky-950 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100`,
  }
}

export function inventorySourceBadgeForBuyback(paidLabel?: string): InventorySourceBadge {
  return {
    source: 'buyback',
    label: 'Buyback',
    meta: paidLabel,
    dotClass: 'bg-cyan-500 dark:bg-cyan-400',
    class: `${badgeShell} border-cyan-200/90 bg-cyan-50/90 text-cyan-950 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100`,
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
