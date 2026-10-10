import type { TradeSaleLine } from '~/types/trade'
import { getTemplateQuantityFieldName } from '~/utils/inventory-bulk-quantity'
import { folderHasSerialNumbers } from '~/utils/receipt-multi-folder'
import type { InventoryFolder } from '~/stores/inventory'

/** A bought bill never turns into more than this many inventory rows. */
export const MAX_TRADE_STOCK_ROWS = 500

type FolderLike = Pick<InventoryFolder, 'hasSerialNumbers' | 'template'>

function templateKey(names: string[], exact: string[], contains?: string): string | null {
  for (const want of exact) {
    const hit = names.find((n) => n.toLowerCase() === want.toLowerCase())
    if (hit) return hit
  }
  return contains ? names.find((n) => n.toLowerCase().includes(contains)) ?? null : null
}

/**
 * Inventory rows for a paid partner bill in the buyer's chosen folder. Serial folders get one row
 * per unit; folders with a quantity column get one row per line; other folders get one row per
 * unit. The seller's serial or IMEI goes into the folder's serial/IMEI column, or `serialNo` when
 * the folder has none, on rows that hold a single unit.
 * Cost is the unit price paid, in naira.
 */
export function tradeStockRows(
  folder: FolderLike,
  lines: TradeSaleLine[],
  saleId: string
): Record<string, unknown>[] {
  const names = (folder.template?.fields ?? []).map((f) => f.name).filter(Boolean)
  const nameKey = templateKey(names, ['name', 'itemName', 'productName', 'title'], 'name') ?? 'name'
  const brandKey = templateKey(names, ['brand'])
  const modelKey = templateKey(names, ['model'])
  const serial = folderHasSerialNumbers(folder as InventoryFolder)
  const serialKey = templateKey(names, ['serialNo', 'serialNumber', 'imei'], 'serial') ?? 'serialNo'
  const qtyKey = serial ? null : getTemplateQuantityFieldName(folder)

  const rows: Record<string, unknown>[] = []
  for (const line of lines) {
    const base: Record<string, unknown> = {
      [nameKey]: line.name,
      unitCost: line.unitPriceKobo / 100,
      tradeSaleId: saleId,
    }
    if (brandKey && line.brand) base[brandKey] = line.brand
    if (modelKey && line.model) base[modelKey] = line.model
    if (qtyKey) {
      const row = { ...base, [qtyKey]: line.quantity }
      if (serialKey && line.serial && line.quantity === 1) row[serialKey] = line.serial
      rows.push(row)
    } else {
      for (let i = 0; i < line.quantity; i++) {
        const row = { ...base }
        if (serialKey && i === 0 && line.serial) row[serialKey] = line.serial
        rows.push(row)
        if (rows.length >= MAX_TRADE_STOCK_ROWS) return rows
      }
    }
    if (rows.length >= MAX_TRADE_STOCK_ROWS) return rows.slice(0, MAX_TRADE_STOCK_ROWS)
  }
  return rows
}
