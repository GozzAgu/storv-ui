import {
  getChildFolders,
  getRootFolders,
  normalizeParentId,
} from '~/utils/inventory-folder-tree'
import type { InventoryFolder, InventoryItem, TemplateField } from '~/stores/inventory'
import type { Receipt } from '~/stores/receipts'
import type { SellerLoanOut } from '~/stores/sellerLoanOuts'

export interface StoreExportMeta {
  storeName?: string
  branchName?: string
}

const ITEM_META_KEYS = new Set([
  'id',
  'folderId',
  'storeId',
  'createdAt',
  'updatedAt',
  'createdBy',
  'dateIn',
  'dateOut',
  'pendingSaleReceiptId',
  'pendingSaleAt',
  'sellerLoanOutId',
  'sellerLoanPartyName',
  'sellerLoanPartyPhone',
  'sellerLoanOutAt',
  'swapIn',
  'swapInReceiptId',
  'buyback',
  'buybackId',
  'buybackPrice',
  'unitCost',
  'discountPercentage',
  'discountAmount',
  'originalPrice',
  'discountedPrice',
])

function exportDateSuffix(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatExportDate(value: unknown): string {
  if (!value) return ''
  const date =
    value instanceof Date
      ? value
      : typeof value === 'object' && value !== null && 'toDate' in value
        ? (value as { toDate: () => Date }).toDate()
        : new Date(value as string)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'store'
}

function sanitizeSheetName(base: string, used: Set<string>): string {
  let name = base.replace(/[\\/*?:[\]]/g, '_').trim() || 'Sheet'
  if (name.length > 31) name = name.slice(0, 31)

  if (!used.has(name)) {
    used.add(name)
    return name
  }

  for (let i = 2; i < 100; i++) {
    const suffix = `_${i}`
    const candidate = `${name.slice(0, 31 - suffix.length)}${suffix}`
    if (!used.has(candidate)) {
      used.add(candidate)
      return candidate
    }
  }

  const fallback = `Sheet_${used.size + 1}`
  used.add(fallback)
  return fallback
}

function formatInventoryFieldValue(field: TemplateField, value: unknown): string | number {
  if (value === null || value === undefined) return ''
  if (field.type === 'date' && value) {
    const date = value instanceof Date ? value : new Date(String(value))
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
  if (field.type === 'boolean') return value ? 'Yes' : 'No'
  if (field.type === 'currency' || field.type === 'number') {
    return typeof value === 'number' ? value : parseFloat(String(value)) || 0
  }
  return String(value)
}

function getItemFieldValue(item: InventoryItem, field: TemplateField): unknown {
  if (item[field.name] !== undefined && item[field.name] !== null) return item[field.name]
  if (field.id && item[field.id] !== undefined && item[field.id] !== null) return item[field.id]

  const target = field.name.toLowerCase()
  const matchKey = Object.keys(item).find((key) => key.toLowerCase() === target)
  if (matchKey && item[matchKey] !== undefined && item[matchKey] !== null) return item[matchKey]

  return ''
}

function getExportFieldsForFolder(folder: InventoryFolder, items: InventoryItem[]): TemplateField[] {
  const templateFields = folder.template?.fields ?? []
  if (templateFields.length > 0) return templateFields

  const preferred = ['name', 'price', 'serialNo', 'brand', 'model', 'quantity', 'sku', 'costPrice']
  const keys = new Set<string>()
  for (const item of items.slice(0, 100)) {
    for (const key of Object.keys(item)) {
      if (!ITEM_META_KEYS.has(key)) keys.add(key)
    }
  }

  const ordered = [
    ...preferred.filter((key) => keys.has(key)),
    ...[...keys].filter((key) => !preferred.includes(key)).sort(),
  ]

  return ordered.map((name) => ({
    id: name,
    name,
    label: name,
    type: 'text' as const,
    required: false,
  }))
}

function buildFolderItemRows(
  items: InventoryItem[],
  fields: TemplateField[]
): (string | number)[][] {
  return items.map((item) =>
    fields.map((field) => formatInventoryFieldValue(field, getItemFieldValue(item, field)))
  )
}

function buildFolderInventoryRows(
  folder: InventoryFolder,
  items: InventoryItem[],
  fields: TemplateField[]
): (string | number)[][] {
  return items.map((item) => [
    folder.name,
    ...fields.map((field) => formatInventoryFieldValue(field, getItemFieldValue(item, field))),
  ])
}

/** Safe folder name for ZIP archives (one folder per inventory category). */
export function sanitizeFolderPath(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim() || 'Category'
}

export function uniqueFolderPath(base: string, used: Set<string>): string {
  let name = sanitizeFolderPath(base)
  if (!used.has(name)) {
    used.add(name)
    return name
  }

  for (let i = 2; i < 100; i++) {
    const candidate = `${name}_${i}`
    if (!used.has(candidate)) {
      used.add(candidate)
      return candidate
    }
  }

  const fallback = `${name}_${used.size + 1}`
  used.add(fallback)
  return fallback
}

function buildExportInfoText(meta: StoreExportMeta | undefined, folders: number, items: number): string {
  return [
    'Storvv inventory export',
    '=======================',
    `Store: ${meta?.storeName || ''}`,
    `Branch: ${meta?.branchName || ''}`,
    `Generated: ${new Date().toLocaleString()}`,
    `Categories: ${folders}`,
    `Total items: ${items}`,
    '',
    'Structure:',
    '- categories.xlsx — list of all categories (folders)',
    '- {Category name}/items.xlsx — products in that category',
  ].join('\n')
}

export async function buildFolderItemsWorkbook(
  folder: InventoryFolder,
  items: InventoryItem[]
) {
  const XLSX = await import('xlsx')
  const fields = getExportFieldsForFolder(folder, items)
  const headers = fields.map((field) => field.label || field.name)
  const rows = buildFolderItemRows(items, fields)
  const ws = XLSX.utils.aoa_to_sheet(
    headers.length > 0 ? [headers, ...rows] : [['Note'], ['No template fields defined for this category.']]
  )
  ws['!cols'] = (headers.length > 0 ? headers : ['Note']).map((header) => ({
    wch: Math.max(String(header).length, 14),
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Items')
  return wb
}

export async function buildCategoriesIndexWorkbook(
  folders: InventoryFolder[],
  itemsByFolderId: Record<string, InventoryItem[]>,
  meta?: StoreExportMeta
) {
  const XLSX = await import('xlsx')
  const header = ['Category', 'Parent category', 'Description', 'Item count', 'Serial tracking', 'Fields']
  const rows = folders.map((folder) => {
    const items = itemsByFolderId[folder.id] || []
    const fields = getExportFieldsForFolder(folder, items)
    const parent = folders.find((entry) => entry.id === normalizeParentId(folder.parentId))
    return [
      folder.name,
      parent?.name || '',
      folder.description || '',
      items.length,
      folder.hasSerialNumbers ? 'Yes' : 'No',
      fields.map((field) => field.label || field.name).join(', '),
    ]
  })

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  ws['!cols'] = header.map((col) => ({ wch: Math.max(col.length + 2, 14) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Categories')
  appendInfoSheet(wb, meta, XLSX)
  return wb
}

async function workbookToArrayBuffer(wb: import('xlsx').WorkBook): Promise<ArrayBuffer> {
  const XLSX = await import('xlsx')
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
}

function downloadBlob(blob: Blob, filename: string) {
  if (!import.meta.client) return
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function buildInventoryZip(
  folders: InventoryFolder[],
  itemsByFolderId: Record<string, InventoryItem[]>,
  meta?: StoreExportMeta
): Promise<{ blob: Blob; rootName: string; folderCount: number; itemCount: number }> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const rootName = buildStoreExportFilename('inventory', meta?.branchName).replace(/\.xlsx$/, '')
  const root = zip.folder(rootName)
  if (!root) throw new Error('Could not create export archive.')

  const usedTopLevelPaths = new Set<string>()
  let itemCount = 0

  const categoriesWb = await buildCategoriesIndexWorkbook(folders, itemsByFolderId, meta)
  root.file('categories.xlsx', await workbookToArrayBuffer(categoriesWb))

  for (const parentFolder of getRootFolders(folders)) {
    const children = getChildFolders(folders, parentFolder.id)

    if (children.length > 0) {
      const parentPath = uniqueFolderPath(parentFolder.name || parentFolder.id, usedTopLevelPaths)
      const parentZip = root.folder(parentPath)
      if (!parentZip) continue

      const usedChildPaths = new Set<string>()
      for (const child of children) {
        const items = itemsByFolderId[child.id] || []
        itemCount += items.length
        const childPath = uniqueFolderPath(child.name || child.id, usedChildPaths)
        const childZip = parentZip.folder(childPath)
        if (!childZip) continue
        const itemsWb = await buildFolderItemsWorkbook(child, items)
        childZip.file('items.xlsx', await workbookToArrayBuffer(itemsWb))
      }
      continue
    }

    const items = itemsByFolderId[parentFolder.id] || []
    itemCount += items.length
    const folderPath = uniqueFolderPath(parentFolder.name || parentFolder.id, usedTopLevelPaths)
    const folderZip = root.folder(folderPath)
    if (!folderZip) continue
    const itemsWb = await buildFolderItemsWorkbook(parentFolder, items)
    folderZip.file('items.xlsx', await workbookToArrayBuffer(itemsWb))
  }

  root.file('README.txt', buildExportInfoText(meta, folders.length, itemCount))

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  return { blob, rootName, folderCount: folders.length, itemCount }
}

function appendInfoSheet(
  wb: import('xlsx').WorkBook,
  meta: StoreExportMeta | undefined,
  XLSX: typeof import('xlsx')
) {
  const info = [
    ['Store', meta?.storeName || ''],
    ['Branch', meta?.branchName || ''],
    ['Generated', new Date().toLocaleString()],
  ]
  const infoWs = XLSX.utils.aoa_to_sheet(info)
  XLSX.utils.book_append_sheet(wb, infoWs, 'Info')
}

export async function buildInventoryWorkbook(
  folders: InventoryFolder[],
  itemsByFolderId: Record<string, InventoryItem[]>,
  meta?: StoreExportMeta
) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const usedSheetNames = new Set<string>()

  const exportFolders = folders.filter((folder) => (itemsByFolderId[folder.id]?.length ?? 0) > 0)
  const foldersToRender = exportFolders.length > 0 ? exportFolders : folders

  const allProductsHeader = ['Category', 'Name', 'Price', 'Serial', 'Brand', 'Model']
  const allProductRows: (string | number)[][] = []

  for (const folder of foldersToRender) {
    const items = itemsByFolderId[folder.id] || []
    const fields = getExportFieldsForFolder(folder, items)
    if (fields.length === 0 && items.length === 0) continue

    for (const item of items) {
      allProductRows.push([
        folder.name,
        String(getItemFieldValue(item, { id: 'name', name: 'name', label: 'Name', type: 'text', required: false }) || ''),
        formatInventoryFieldValue(
          { id: 'price', name: 'price', label: 'Price', type: 'currency', required: false },
          getItemFieldValue(item, { id: 'price', name: 'price', label: 'Price', type: 'currency', required: false })
        ),
        String(getItemFieldValue(item, { id: 'serialNo', name: 'serialNo', label: 'Serial', type: 'text', required: false }) || ''),
        String(getItemFieldValue(item, { id: 'brand', name: 'brand', label: 'Brand', type: 'text', required: false }) || ''),
        String(getItemFieldValue(item, { id: 'model', name: 'model', label: 'Model', type: 'text', required: false }) || ''),
      ])
    }

    const headers = ['Category', ...fields.map((field) => field.label || field.name)]
    const rows = buildFolderInventoryRows(folder, items, fields)
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = headers.map((header) => ({
      wch: Math.max(String(header).length, 14),
    }))

    const sheetName = sanitizeSheetName(folder.name || folder.id, usedSheetNames)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }

  if (allProductRows.length > 0) {
    const summaryWs = XLSX.utils.aoa_to_sheet([allProductsHeader, ...allProductRows])
    summaryWs['!cols'] = allProductsHeader.map((header) => ({
      wch: Math.max(header.length, 14),
    }))
    const summarySheetName = sanitizeSheetName('All products', usedSheetNames)
    XLSX.utils.book_append_sheet(wb, summaryWs, summarySheetName)
    const summaryIndex = wb.SheetNames.indexOf(summarySheetName)
    if (summaryIndex > 0) {
      wb.SheetNames.splice(summaryIndex, 1)
      wb.SheetNames.unshift(summarySheetName)
    }
  }

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Category', 'Note'],
      ['', 'No inventory products were found for this branch.'],
    ])
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
  }

  appendInfoSheet(wb, meta, XLSX)
  return wb
}

export async function buildReceiptsWorkbook(receipts: Receipt[], meta?: StoreExportMeta) {
  const XLSX = await import('xlsx')
  const header = [
    'Receipt #',
    'Date',
    'Customer',
    'Phone',
    'Email',
    'Status',
    'Payment method',
    'Receipt total',
    'Amount paid',
    'Balance due',
    'Item',
    'Serial / SKU',
    'Qty',
    'Unit price',
    'Line total',
    'Notes',
  ]

  const rows: (string | number)[][] = []
  for (const receipt of receipts) {
    const items = receipt.items?.length ? receipt.items : []
    if (items.length === 0) {
      rows.push([
        receipt.receiptNumber,
        formatExportDate(receipt.date),
        receipt.customerName,
        receipt.customerPhone || '',
        receipt.customerEmail || '',
        receipt.status,
        receipt.paymentMethod,
        receipt.total,
        receipt.amountPaid ?? '',
        receipt.balanceDue ?? '',
        '',
        '',
        '',
        '',
        '',
        receipt.notes || '',
      ])
      continue
    }

    for (const item of items) {
      rows.push([
        receipt.receiptNumber,
        formatExportDate(receipt.date),
        receipt.customerName,
        receipt.customerPhone || '',
        receipt.customerEmail || '',
        receipt.status,
        receipt.paymentMethod,
        receipt.total,
        receipt.amountPaid ?? '',
        receipt.balanceDue ?? '',
        item.itemName,
        item.serialNo || item.sku || '',
        item.quantity,
        item.price,
        item.quantity * item.price,
        receipt.notes || '',
      ])
    }
  }

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  ws['!cols'] = header.map((col) => ({ wch: Math.max(col.length + 2, 14) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sales')
  appendInfoSheet(wb, meta, XLSX)
  return wb
}

export async function buildBuybacksWorkbook(buybacks: CustomerBuyback[], meta?: StoreExportMeta) {
  const XLSX = await import('xlsx')
  const header = [
    'Date',
    'Customer',
    'Phone',
    'Email',
    'Status',
    'Item',
    'Purchase price',
    'Payment method',
    'Notes',
    'Category ID',
    'Inventory item ID',
  ]

  const rows = buybacks.map((buyback) => [
    formatExportDate(buyback.createdAt),
    buyback.customerName,
    buyback.customerPhone,
    buyback.customerEmail,
    buyback.status,
    buyback.itemSummary,
    buyback.purchasePrice,
    buyback.paymentMethod,
    buyback.notes,
    buyback.folderId,
    buyback.inventoryItemId,
  ])

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  ws['!cols'] = header.map((col) => ({ wch: Math.max(col.length + 2, 14) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Buybacks')
  appendInfoSheet(wb, meta, XLSX)
  return wb
}

export async function buildStockLoansWorkbook(loans: SellerLoanOut[], meta?: StoreExportMeta) {
  const XLSX = await import('xlsx')
  const header = [
    'Loan ID',
    'Status',
    'Borrower',
    'Phone',
    'Notes',
    'Created',
    'Returned',
    'Sold',
    'Item',
    'Category ID',
    'Inventory item ID',
  ]

  const rows: (string | number)[][] = []
  for (const loan of loans) {
    const lines = loan.lines?.length ? loan.lines : []
    if (lines.length === 0) {
      rows.push([
        loan.id,
        loan.status,
        loan.partyName,
        loan.partyPhone,
        loan.partyNotes,
        formatExportDate(loan.createdAt),
        formatExportDate(loan.returnedAt),
        formatExportDate(loan.soldAt),
        '',
        '',
        '',
      ])
      continue
    }

    for (const line of lines) {
      rows.push([
        loan.id,
        loan.status,
        loan.partyName,
        loan.partyPhone,
        loan.partyNotes,
        formatExportDate(loan.createdAt),
        formatExportDate(loan.returnedAt),
        formatExportDate(loan.soldAt),
        line.itemSummary,
        line.folderId,
        line.inventoryItemId,
      ])
    }
  }

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  ws['!cols'] = header.map((col) => ({ wch: Math.max(col.length + 2, 14) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Stock loans')
  appendInfoSheet(wb, meta, XLSX)
  return wb
}

export async function downloadWorkbook(wb: import('xlsx').WorkBook, filename: string) {
  const XLSX = await import('xlsx')
  XLSX.writeFile(wb, filename)
}

export function buildStoreExportFilename(label: string, branchName?: string): string {
  const branchPart = sanitizeFilenamePart(branchName || 'branch').toLowerCase()
  return `${branchPart}_${label}_${exportDateSuffix()}.xlsx`
}

export function buildStoreExportZipFilename(label: string, branchName?: string): string {
  return buildStoreExportFilename(label, branchName).replace(/\.xlsx$/, '.zip')
}

export async function downloadInventoryExport(
  folders: InventoryFolder[],
  itemsByFolderId: Record<string, InventoryItem[]>,
  meta?: StoreExportMeta
) {
  const { blob, folderCount, itemCount } = await buildInventoryZip(folders, itemsByFolderId, meta)
  const filename = buildStoreExportZipFilename('inventory', meta?.branchName)
  downloadBlob(blob, filename)
  return { filename, folders: folderCount, items: itemCount }
}

export async function downloadReceiptsExport(receipts: Receipt[], meta?: StoreExportMeta) {
  const wb = await buildReceiptsWorkbook(receipts, meta)
  const filename = buildStoreExportFilename('sales', meta?.branchName)
  await downloadWorkbook(wb, filename)
  return { filename, count: receipts.length }
}

export async function downloadBuybacksExport(buybacks: CustomerBuyback[], meta?: StoreExportMeta) {
  const wb = await buildBuybacksWorkbook(buybacks, meta)
  const filename = buildStoreExportFilename('buybacks', meta?.branchName)
  await downloadWorkbook(wb, filename)
  return { filename, count: buybacks.length }
}

export async function downloadStockLoansExport(loans: SellerLoanOut[], meta?: StoreExportMeta) {
  const wb = await buildStockLoansWorkbook(loans, meta)
  const filename = buildStoreExportFilename('stock-loans', meta?.branchName)
  await downloadWorkbook(wb, filename)
  return { filename, count: loans.length }
}

export function delayBetweenDownloads(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
