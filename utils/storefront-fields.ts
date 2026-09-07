/**
 * Hard denylist + allowlist helpers for storefront public fields.
 * Default deny: only explicitly allowlisted template fields are projected.
 */

const HARD_DENY_FIELD_NAMES = new Set(
  [
    'unitcost',
    'unit_cost',
    'cost',
    'costprice',
    'cost_price',
    'buybackprice',
    'buyback_price',
    'serialno',
    'serial_no',
    'serialnumber',
    'serial_number',
    'imei',
    'imei2',
    'supplier',
    'vendor',
    'wholesaler',
    'notes',
    'note',
    'internalnotes',
    'internal_notes',
    'staffnotes',
    'staff_notes',
    'profit',
    'cogs',
    'acquisition',
    'purchaseprice',
    'purchase_price',
    'wholesale',
    'invoice',
    'invoiceid',
  ].map((s) => s.toLowerCase())
)

const HARD_DENY_LABEL_FRAGMENTS = [
  'imei',
  'serial',
  'supplier',
  'vendor',
  'cost price',
  'unit cost',
  'wholesale',
  'internal note',
  'staff note',
  'buyback price',
  'cogs',
]

/** System / identity keys that must never be copied as customer attributes. */
const SYSTEM_KEYS = new Set([
  'id',
  'folderid',
  'storeid',
  'createdby',
  'createdat',
  'updatedat',
  'datein',
  'dateout',
  'pendingsalereceiptid',
  'pendingsaleat',
  'sellerloanoutid',
  'sellerloanpartyname',
  'sellerloanpartyphone',
  'sellerloanoutat',
  'swapin',
  'swapinreceiptid',
  'buyback',
  'buybackid',
  'buybackprice',
  'unitcost',
  'discountpercentage',
  'discountamount',
  'originalprice',
  'discountedprice',
  'storefrontlisted',
  'imageurl',
  'name',
  'price',
])

export function normalizeStorefrontFieldKey(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

export function isHardDeniedStorefrontField(fieldName: string, label?: string): boolean {
  const key = normalizeStorefrontFieldKey(fieldName)
  if (!key) return true
  if (HARD_DENY_FIELD_NAMES.has(key)) return true

  const labelNorm = String(label || '')
    .trim()
    .toLowerCase()
  if (labelNorm && HARD_DENY_LABEL_FRAGMENTS.some((frag) => labelNorm.includes(frag))) {
    return true
  }
  return false
}

/** Fields always used for title/price. not listed as optional attributes. */
export function isCoreStorefrontField(fieldName: string): boolean {
  const key = normalizeStorefrontFieldKey(fieldName)
  return key === 'name' || key === 'price' || key === 'itemname'
}

export function canAllowlistStorefrontField(fieldName: string, label?: string): boolean {
  if (isCoreStorefrontField(fieldName)) return false
  if (isHardDeniedStorefrontField(fieldName, label)) return false
  const key = normalizeStorefrontFieldKey(fieldName)
  if (SYSTEM_KEYS.has(key)) return false
  return true
}

export function filterAllowlistedFieldIds(
  fieldIds: string[],
  fields: Array<{ id: string; name: string; label: string }>
): string[] {
  const byId = new Map(fields.map((f) => [f.id, f]))
  const out: string[] = []
  for (const id of fieldIds) {
    const field = byId.get(id)
    if (!field) continue
    if (!canAllowlistStorefrontField(field.name, field.label)) continue
    out.push(id)
  }
  return out
}

/** Sensible defaults when enabling a category for the first time. */
export const DEFAULT_PUBLIC_FIELD_CANDIDATES = [
  'description',
  'color',
  'colour',
  'size',
  'grade',
  'condition',
  'brand',
  'model',
  'sku',
  'storage',
  'ram',
  'warranty',
]

export function suggestDefaultPublicFieldIds(
  fields: Array<{ id: string; name: string; label: string }>
): string[] {
  const suggested: string[] = []
  for (const field of fields) {
    if (!canAllowlistStorefrontField(field.name, field.label)) continue
    const key = normalizeStorefrontFieldKey(field.name)
    const labelKey = normalizeStorefrontFieldKey(field.label)
    if (DEFAULT_PUBLIC_FIELD_CANDIDATES.some((c) => key.includes(c) || labelKey.includes(c))) {
      suggested.push(field.id)
    }
  }
  return suggested
}
