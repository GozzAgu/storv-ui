import type { InventoryItem } from '~/stores/inventory'

/** Case-insensitive field lookup for dynamic inventory templates */
export function getInventoryItemField(item: InventoryItem, fieldName: string): string {
  const record = item as Record<string, unknown>
  if (record[fieldName]) return String(record[fieldName])
  const key = Object.keys(record).find((k) => k.toLowerCase() === fieldName.toLowerCase())
  return key ? String(record[key]) : ''
}

/** Display label for receipt / picker UIs (brand+model, then name-like fields) */
export function getInventoryItemDisplayName(item: InventoryItem): string {
  const brand = getInventoryItemField(item, 'brand')
  const model = getInventoryItemField(item, 'model')
  if (brand || model) {
    return [brand, model].filter(Boolean).join(' ').trim()
  }
  const nameField = Object.keys(item).find(
    (key) =>
      key.toLowerCase().includes('name') || key.toLowerCase().includes('item') || key === 'title'
  )
  if (nameField) {
    const v = (item as Record<string, unknown>)[nameField]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
  }
  return `Item ${item.id.slice(0, 8)}`
}

const FOLDER_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-primary-400',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
  yellow: 'bg-yellow-500',
}

export function getFolderColorClass(color: string): string {
  return FOLDER_COLOR_MAP[color] || 'bg-gray-500'
}
