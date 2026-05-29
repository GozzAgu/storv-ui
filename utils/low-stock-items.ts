import type { InventoryFolder, InventoryItem } from '~/stores/inventory'

export interface LowStockRow {
  id: string
  productName: string
  category: string
  folderId: string
  quantity: number
  threshold: number
  suggestedReorderQty: number
  isSerialNumber: boolean
  sku?: string
}

export function suggestedReorderQuantity(currentQty: number, threshold: number): number {
  const target = Math.max(threshold * 2, threshold + 1)
  return Math.max(1, target - Math.max(0, currentQty))
}

export function collectLowStockRows(
  folders: InventoryFolder[],
  itemsByFolderId: Record<string, InventoryItem[]>,
  lowStockThreshold: number,
): LowStockRow[] {
  const list: LowStockRow[] = []
  const threshold = Math.max(1, lowStockThreshold)

  for (const folder of folders) {
    const items = itemsByFolderId[folder.id] || []

    if (folder.hasSerialNumbers) {
      let availableCount = 0
      for (const item of items) {
        const dateOut = item.dateOut
        const hasDateOut = dateOut !== null && dateOut !== undefined && dateOut !== ''
        if (!hasDateOut) availableCount++
      }
      if (availableCount > 0 && availableCount <= threshold) {
        list.push({
          id: folder.id,
          productName: folder.name,
          category: folder.name,
          folderId: folder.id,
          quantity: availableCount,
          threshold,
          suggestedReorderQty: suggestedReorderQuantity(availableCount, threshold),
          isSerialNumber: true,
        })
      }
      continue
    }

    const quantityField = folder.template?.fields?.find((f) => {
      const n = f.name.toLowerCase()
      return n === 'quantity' || n === 'qty'
    })?.name

    if (!quantityField) {
      if (folder.lowStockCount > 0) {
        list.push({
          id: folder.id,
          productName: folder.name,
          category: folder.name,
          folderId: folder.id,
          quantity: folder.lowStockCount,
          threshold,
          suggestedReorderQty: suggestedReorderQuantity(folder.lowStockCount, threshold),
          isSerialNumber: false,
        })
      }
      continue
    }

    for (const item of items) {
      const dateOut = item.dateOut
      const hasDateOut = dateOut !== null && dateOut !== undefined && dateOut !== ''
      if (hasDateOut) continue
      if (item[quantityField] === undefined) continue

      const quantity =
        typeof item[quantityField] === 'number'
          ? item[quantityField]
          : parseFloat(String(item[quantityField])) || 0

      if (quantity > 0 && quantity <= threshold) {
        const nameField =
          folder.template?.fields?.find((f) => {
            const n = f.name.toLowerCase()
            return n === 'name' || n === 'item'
          })?.name || 'name'
        const productName = String(item[nameField] || item.name || item.itemName || 'Unnamed item')
        const sku = String(item.sku || item.serialNo || item.serialNumber || '').trim() || undefined

        list.push({
          id: item.id,
          productName,
          category: folder.name,
          folderId: folder.id,
          quantity,
          threshold,
          suggestedReorderQty: suggestedReorderQuantity(quantity, threshold),
          isSerialNumber: false,
          sku,
        })
      }
    }
  }

  return list.sort((a, b) => {
    const cat = a.category.localeCompare(b.category)
    if (cat !== 0) return cat
    return a.productName.localeCompare(b.productName)
  })
}
