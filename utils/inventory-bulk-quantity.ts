export type BulkFolderLike = { template?: { fields?: Array<{ name?: string }> } } | undefined

export function getTemplateQuantityFieldName(folder: BulkFolderLike): string | null {
  const fields = folder?.template?.fields
  if (!Array.isArray(fields)) return null
  const f = fields.find(
    (field) =>
      field?.name && (field.name.toLowerCase() === 'quantity' || field.name.toLowerCase() === 'qty')
  )
  return f?.name ?? null
}

/**
 * Which Firestore field holds bulk stock, and its numeric value.
 * Prefer template quantity/qty name; fall back to common stock fields.
 */
export function resolveBulkStockFieldAndValue(
  item: Record<string, unknown> & { id?: string },
  folder: BulkFolderLike
): { fieldKey: string; value: number } | null {
  const templateName = getTemplateQuantityFieldName(folder)
  const record = item as Record<string, unknown>

  if (templateName) {
    const key =
      Object.keys(record).find((k) => k.toLowerCase() === templateName.toLowerCase()) ??
      templateName
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') {
      const n =
        typeof record[key] === 'number' ? (record[key] as number) : parseFloat(String(record[key]))
      if (!Number.isNaN(n)) return { fieldKey: key, value: n }
    }
  }

  for (const name of ['stock', 'Stock', 'quantity', 'Quantity', 'qty', 'Qty']) {
    const key = Object.keys(record).find((k) => k.toLowerCase() === name.toLowerCase())
    if (key && record[key] !== undefined && record[key] !== null && record[key] !== '') {
      const n =
        typeof record[key] === 'number' ? (record[key] as number) : parseFloat(String(record[key]))
      if (!Number.isNaN(n)) return { fieldKey: key, value: n }
    }
  }
  return null
}

/** Server-side: raw Firestore item map (same resolution rules). */
export function resolveBulkStockFieldAndValueFromMap(
  data: Record<string, unknown>,
  folderTemplateFields: Array<{ name?: string }> | undefined
): { fieldKey: string; value: number } | null {
  let templateName: string | null = null
  if (Array.isArray(folderTemplateFields)) {
    const f = folderTemplateFields.find(
      (field) =>
        field?.name &&
        (field.name.toLowerCase() === 'quantity' || field.name.toLowerCase() === 'qty')
    )
    templateName = f?.name ?? null
  }

  if (templateName) {
    const key =
      Object.keys(data).find((k) => k.toLowerCase() === templateName!.toLowerCase()) ?? templateName
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      const n =
        typeof data[key] === 'number' ? (data[key] as number) : parseFloat(String(data[key]))
      if (!Number.isNaN(n)) return { fieldKey: key, value: n }
    }
  }

  for (const name of ['stock', 'Stock', 'quantity', 'Quantity', 'qty', 'Qty']) {
    const key = Object.keys(data).find((k) => k.toLowerCase() === name.toLowerCase())
    if (key && data[key] !== undefined && data[key] !== null && data[key] !== '') {
      const n =
        typeof data[key] === 'number' ? (data[key] as number) : parseFloat(String(data[key]))
      if (!Number.isNaN(n)) return { fieldKey: key, value: n }
    }
  }
  return null
}
