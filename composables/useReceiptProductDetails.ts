import type { InventoryItem } from '~/stores/inventory'
import type { ReceiptItem } from '~/stores/receipts'

export const DETAIL_LABELS: Record<string, string> = {
  serialNo: 'SN',
  serialNumber: 'SN',
  serial: 'SN',
  imei: 'IMEI',
  imei1: 'IMEI',
  imeiNo: 'IMEI',
  imei2: 'IMEI 2',
  secondImei: 'IMEI 2',
  imeiNo2: 'IMEI 2',
  sku: 'SKU',
  brand: 'Brand',
  model: 'Model',
  barcode: 'Barcode',
  color: 'Color',
  capacity: 'Capacity',
  storage: 'Storage',
  ram: 'RAM',
  batteryHealth: 'Battery Health',
  processor: 'Processor',
  condition: 'Condition',
  warranty: 'Warranty',
}

export const DETAIL_ORDER = [
  'serialNo', 'serialNumber', 'serial',
  'imei', 'imei1', 'imeiNo',
  'imei2', 'secondImei', 'imeiNo2',
  'brand', 'model', 'sku', 'barcode', 'color', 'capacity', 'storage', 'ram',
] as const

export function getReceiptProductDetails(item: InventoryItem): Record<string, string | number | boolean> {
  const details: Record<string, string | number | boolean> = {}
  const excludedKeys = new Set([
    'id', 'createdAt', 'updatedAt', 'createdBy', 'folderId', 'storeId', 'dateIn', 'dateOut', 'allowedDepartments', 'customFields',
  ])

  const normalizedAliases: Array<[string, string[]]> = [
    ['serialNo', ['serialNo', 'serialNumber', 'serial']],
    ['imei', ['imei', 'imei1', 'imeiNo']],
    ['imei2', ['imei2', 'secondImei', 'imeiNo2']],
    ['brand', ['brand']],
    ['model', ['model']],
    ['sku', ['sku']],
    ['barcode', ['barcode']],
    ['color', ['color']],
    ['capacity', ['capacity', 'storage']],
    ['ram', ['ram']],
  ]

  for (const [normalizedKey, aliases] of normalizedAliases) {
    const key = aliases.find((alias) => {
      const value = (item as Record<string, unknown>)[alias]
      return value !== undefined && value !== null && String(value).trim() !== ''
    })
    if (!key) continue
    const normalizedValue = (item as Record<string, unknown>)[key]
    if (normalizedValue === undefined) continue
    details[normalizedKey] = normalizedValue as string | number | boolean
    excludedKeys.add(key)
  }

  for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
    if (excludedKeys.has(key)) continue
    if (value === undefined || value === null) continue
    if (Array.isArray(value) || typeof value === 'object') continue
    const text = String(value).trim()
    if (!text) continue
    details[key] = value as string | number | boolean
  }

  return details
}

/** Omit inventory/system fields echoed into product snapshots (not helpful on printed receipts). */
const HIDDEN_RECEIPT_DETAIL_KEYS = new Set<string>([
  'swapIn',
  'swapInReceiptId',
])

/** Shown as the swap-in headline; omit from repeated detail rows. */
const INVENTORY_PRIMARY_NAME_KEYS = new Set(['name', 'title', 'productName', 'itemName'])

export function getProductDetailLines(item: ReceiptItem): string[] {
  const raw: Record<string, unknown> = {
    ...(item.productDetails || {}),
    serialNo: item.serialNo,
    brand: item.brand,
    model: item.model,
    sku: item.sku,
  }

  const seen = new Set<string>()
  const lines: string[] = []
  for (const key of DETAIL_ORDER) {
    if (HIDDEN_RECEIPT_DETAIL_KEYS.has(key)) continue
    const value = raw[key]
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (!text) continue
    const label = DETAIL_LABELS[key] || key
    const normalized = `${label}:${text.toLowerCase()}`
    if (seen.has(normalized)) continue
    seen.add(normalized)
    lines.push(`${label}: ${text}`)
  }

  for (const [key, value] of Object.entries(raw)) {
    if ((DETAIL_ORDER as readonly string[]).includes(key)) continue
    if (HIDDEN_RECEIPT_DETAIL_KEYS.has(key)) continue
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (!text) continue
    const label = DETAIL_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
    const normalized = `${label}:${text.toLowerCase()}`
    if (seen.has(normalized)) continue
    seen.add(normalized)
    lines.push(`${label}: ${text}`)
  }

  return lines
}

export function getInventoryItemDisplayName(item: InventoryItem): string {
  const raw = item as Record<string, unknown>
  for (const k of ['name', 'title', 'productName', 'itemName'] as const) {
    const v = raw[k]
    if (v === undefined || v === null) continue
    const text = String(v).trim()
    if (text) return text
  }
  const brand = String(raw.brand ?? '').trim()
  const model = String(raw.model ?? '').trim()
  if (brand && model) return `${brand} ${model}`
  if (brand) return brand
  if (model) return model
  return 'Trade-in device'
}

export function getInventoryItemDetailLines(item: InventoryItem): string[] {
  const raw: Record<string, unknown> = getReceiptProductDetails(item) as Record<string, unknown>
  const seen = new Set<string>()
  const lines: string[] = []
  for (const key of DETAIL_ORDER) {
    if (HIDDEN_RECEIPT_DETAIL_KEYS.has(key) || INVENTORY_PRIMARY_NAME_KEYS.has(key)) continue
    const value = raw[key]
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (!text) continue
    const label = DETAIL_LABELS[key] || key
    const normalized = `${label}:${text.toLowerCase()}`
    if (seen.has(normalized)) continue
    seen.add(normalized)
    lines.push(`${label}: ${text}`)
  }

  for (const [key, value] of Object.entries(raw)) {
    if ((DETAIL_ORDER as readonly string[]).includes(key)) continue
    if (HIDDEN_RECEIPT_DETAIL_KEYS.has(key) || INVENTORY_PRIMARY_NAME_KEYS.has(key)) continue
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (!text) continue
    const label = DETAIL_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
    const normalized = `${label}:${text.toLowerCase()}`
    if (seen.has(normalized)) continue
    seen.add(normalized)
    lines.push(`${label}: ${text}`)
  }

  return lines
}
