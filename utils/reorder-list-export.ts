import * as XLSX from 'xlsx'
import type { LowStockRow } from '~/utils/low-stock-items'

export function buildReorderListWorkbook(
  rows: LowStockRow[],
  meta?: { storeName?: string; branchName?: string }
) {
  const header = [
    'Category',
    'Product',
    'SKU / Serial',
    'Qty on hand',
    'Low-stock threshold',
    'Suggested reorder qty',
    'Notes for supplier',
  ]

  const data = rows.map((row) => [
    row.category,
    row.productName,
    row.sku || '',
    row.quantity,
    row.threshold,
    row.suggestedReorderQty,
    '',
  ])

  const ws = XLSX.utils.aoa_to_sheet([header, ...data])
  ws['!cols'] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 20 },
    { wch: 24 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reorder list')

  if (meta?.storeName || meta?.branchName) {
    const info = [
      ['Store', meta.storeName || ''],
      ['Branch', meta.branchName || ''],
      ['Generated', new Date().toLocaleString()],
    ]
    const infoWs = XLSX.utils.aoa_to_sheet(info)
    XLSX.utils.book_append_sheet(wb, infoWs, 'Info')
  }

  return wb
}

export function downloadReorderListExcel(
  rows: LowStockRow[],
  meta?: { storeName?: string; branchName?: string }
) {
  const wb = buildReorderListWorkbook(rows, meta)
  const date = new Date().toISOString().split('T')[0]
  const filename = `reorder-list_${date}.xlsx`
  XLSX.writeFile(wb, filename)
}
