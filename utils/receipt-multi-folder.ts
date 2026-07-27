import type { InventoryFolder, InventoryItem } from '~/stores/inventory'
import type { ReceiptItem } from '~/stores/receipts'

export type SelectedSaleLine = { id: string; quantity: number; item: InventoryItem }

export function folderHasSerialNumbers(folder: InventoryFolder | null | undefined): boolean {
  if (!folder) return false
  if (folder.hasSerialNumbers) return true
  return (
    folder.template?.fields?.some(
      (field) =>
        field.name.toLowerCase() === 'serialno' ||
        field.name.toLowerCase() === 'serialnumber' ||
        field.name.toLowerCase().includes('serial')
    ) ?? false
  )
}

export function getSelectedFolderIds(lines: SelectedSaleLine[]): string[] {
  return [...new Set(lines.map((line) => line.item.folderId).filter(Boolean))]
}

export function groupSelectedSaleLinesByFolder(
  lines: SelectedSaleLine[]
): Map<string, SelectedSaleLine[]> {
  const grouped = new Map<string, SelectedSaleLine[]>()
  for (const line of lines) {
    const folderId = line.item.folderId
    if (!folderId) continue
    const bucket = grouped.get(folderId) ?? []
    bucket.push(line)
    grouped.set(folderId, bucket)
  }
  return grouped
}

export function groupReceiptItemsByFolder(
  items: ReceiptItem[],
  fallbackFolderId?: string
): Map<string, ReceiptItem[]> {
  const grouped = new Map<string, ReceiptItem[]>()
  for (const line of items) {
    const folderId = line.folderId || fallbackFolderId
    if (!folderId || !line.itemId) continue
    const bucket = grouped.get(folderId) ?? []
    bucket.push(line)
    grouped.set(folderId, bucket)
  }
  return grouped
}

export function receiptUsesSerialNumbers(
  items: ReceiptItem[],
  folderResolver: (folderId: string) => InventoryFolder | null | undefined,
  fallbackFolderId?: string
): boolean {
  const grouped = groupReceiptItemsByFolder(items, fallbackFolderId)
  for (const folderId of grouped.keys()) {
    if (folderHasSerialNumbers(folderResolver(folderId))) return true
  }
  if (fallbackFolderId && grouped.size === 0) {
    return folderHasSerialNumbers(folderResolver(fallbackFolderId))
  }
  return false
}
