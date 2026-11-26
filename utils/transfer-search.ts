/**
 * Finding stock transfers from the global search: by their "TR-7F3K2A" reference (with or without
 * the prefix), either branch, an item or serial number, the notes or the tracking number.
 */
import { TRANSFER_STATUS_LABELS, normalizeTransferStatus } from '~/types/transfers'

export interface SearchableTransfer {
  id: string
  sourceStoreId?: string
  destinationStoreId?: string
  sourceStoreName?: string
  destinationStoreName?: string
  items?: Array<{
    itemName?: string
    name?: string
    serialNumber?: string | null
    quantity?: number
  }>
  itemsCount?: number
  notes?: string
  trackingNumber?: string
  carrier?: string
  status?: unknown
}

/** Short, stable reference people quote to each other, e.g. "TR-7F3K2A". */
export function transferReference(id: unknown): string {
  const clean = String(id || '').replace(/[^a-z0-9]/gi, '')
  return `TR-${clean.slice(-6).toUpperCase()}`
}

/** Branch names as the Transfers page shows them: current name first, then the saved one. */
export function transferBranchNames(
  transfer: SearchableTransfer,
  storeNames: Record<string, string>
): { from: string; to: string } {
  return {
    from: storeNames[transfer.sourceStoreId || ''] || transfer.sourceStoreName || 'Another branch',
    to:
      storeNames[transfer.destinationStoreId || ''] ||
      transfer.destinationStoreName ||
      'Another branch',
  }
}

const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

export function transferMatchesQuery(
  transfer: SearchableTransfer,
  query: string,
  storeNames: Record<string, string> = {}
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  // "TR-NQZWVW", "tr nqzwvw" and "nqzwvw" all find the same transfer
  const ref = compact(transferReference(transfer.id))
  const qRef = compact(q)
  if (qRef.length >= 3 && (ref.includes(qRef) || ref.slice(2) === qRef)) return true
  if (qRef.length >= 6 && compact(transfer.id).includes(qRef)) return true

  const { from, to } = transferBranchNames(transfer, storeNames)
  const haystack = [
    from,
    to,
    transfer.sourceStoreName,
    transfer.destinationStoreName,
    transfer.notes,
    transfer.trackingNumber,
    transfer.carrier,
    ...(transfer.items || []).flatMap((item) => [item.itemName, item.name, item.serialNumber]),
  ]
  return haystack.some((value) => typeof value === 'string' && value.toLowerCase().includes(q))
}

export function transferSearchSummary(
  transfer: SearchableTransfer,
  storeNames: Record<string, string> = {}
) {
  const { from, to } = transferBranchNames(transfer, storeNames)
  const items = transfer.items || []
  const first = items[0]?.itemName || items[0]?.name
  const units = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
  const what =
    items.length === 0
      ? `${transfer.itemsCount ?? 0} items`
      : items.length === 1
      ? `${first || 'Item'}${units > 1 ? ` × ${units}` : ''}`
      : `${first || 'Item'} + ${items.length - 1} more`
  return {
    title: transferReference(transfer.id),
    subtitle: `${from} → ${to}`,
    description: `${what} · ${TRANSFER_STATUS_LABELS[normalizeTransferStatus(transfer.status)]}`,
  }
}

/** Opens the History tab with this transfer expanded. */
export function transferSearchUrl(id: string): string {
  return `/dashboard/multi-store-sync?tab=history&transfer=${encodeURIComponent(id)}`
}
