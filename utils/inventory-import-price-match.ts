/**
 * Excel import: rows that match products already in the folder. Instead of only skipping them as
 * duplicates, the import can update their prices. Serial folders match on serial number; bulk
 * folders match on name + product model.
 */
import {
  bulkPriceGroupKey,
  bulkPriceGroupLabel,
  planItemPriceChange,
  type BulkPriceChange,
  type ItemPricePlan,
} from '~/utils/inventory-bulk-price'

type Row = { rowNumber: number; data: Record<string, unknown> }
type Item = Record<string, unknown> & { id: string }

const SERIAL_KEYS = ['serialno', 'serialnumber', 'serial_no', 'serial_number']
const PRICE_KEYS = ['price']
const COST_KEYS = ['unitcost']

function pick(record: Record<string, unknown>, keys: string[], extra?: string): unknown {
  const wanted = extra ? [extra.toLowerCase(), ...keys] : keys
  for (const want of wanted) {
    const key = Object.keys(record).find((k) => k.toLowerCase() === want)
    const v = key ? record[key] : undefined
    if (v !== undefined && v !== null && String(v).trim() !== '') return v
  }
  return undefined
}

/** A positive amount from a cell, or undefined (empty cells import as 0, which means "not given"). */
function amount(v: unknown): number | undefined {
  if (v === undefined) return undefined
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined
}

export function importSerialKey(record: Record<string, unknown>, serialField?: string): string {
  const v = pick(record, SERIAL_KEYS, serialField)
  return v === undefined ? '' : String(v).trim().toLowerCase()
}

export interface ImportPriceUpdate {
  itemId: string
  rowNumber: number
  label: string
  unitPrice?: number
  costPrice?: number
  plan: ItemPricePlan
}

export interface ImportPriceMatch {
  /** Existing products whose price or cost in the file differs, and that may be changed. */
  updates: ImportPriceUpdate[]
  /** Rows that matched a product already in the folder. */
  matchedRows: Set<number>
  /** Matching products left alone because they are sold, on loan or held. */
  lockedCount: number
}

export function matchImportPriceUpdates(
  rows: Row[],
  existing: Item[],
  opts: { hasSerialNumbers: boolean; serialField?: string }
): ImportPriceMatch {
  const keyOf = (record: Record<string, unknown>) => {
    if (opts.hasSerialNumbers) return importSerialKey(record, opts.serialField)
    const key = bulkPriceGroupKey(record)
    return key.startsWith('|') ? '' : key // no product name: never match
  }

  const byKey = new Map<string, Item[]>()
  for (const item of existing) {
    const key = keyOf(item)
    if (!key) continue
    byKey.set(key, [...(byKey.get(key) ?? []), item])
  }

  const updates: ImportPriceUpdate[] = []
  const matchedRows = new Set<number>()
  const seen = new Set<string>()
  let lockedCount = 0

  for (const row of rows) {
    const key = keyOf(row.data)
    const items = key ? byKey.get(key) : undefined
    if (!items) continue
    matchedRows.add(row.rowNumber)
    if (seen.has(key)) continue // the first row for a product decides its price
    seen.add(key)

    const unitPrice = amount(pick(row.data, PRICE_KEYS))
    const costPrice = amount(pick(row.data, COST_KEYS))
    if (unitPrice === undefined && costPrice === undefined) continue
    const change: BulkPriceChange = {
      ...(unitPrice !== undefined && { unitPrice: { mode: 'set', value: unitPrice } }),
      ...(costPrice !== undefined && { costPrice: { mode: 'set', value: costPrice } }),
    }

    for (const item of items) {
      const plan = planItemPriceChange(item, change)
      if (
        plan.skipped === 'sold' ||
        plan.skipped === 'on_loan' ||
        plan.skipped === 'awaiting_payment'
      ) {
        // Only count it if the file actually asks for a different price.
        const differs =
          (unitPrice !== undefined && unitPrice !== plan.before.price) ||
          (costPrice !== undefined && costPrice !== plan.before.cost)
        if (differs) lockedCount++
        continue
      }
      if (plan.skipped) continue
      const serial = pick(item, SERIAL_KEYS, opts.serialField)
      updates.push({
        itemId: item.id,
        rowNumber: row.rowNumber,
        label: `${bulkPriceGroupLabel(item)}${serial !== undefined ? ` · Serial ${serial}` : ''}`,
        // Only send what changes, so an unchanged cost is not rewritten.
        ...(plan.priceChanged && { unitPrice }),
        ...(plan.costChanged && { costPrice }),
        plan,
      })
    }
  }

  return { updates, matchedRows, lockedCount }
}
