import * as XLSX from 'xlsx'
import type { TemplateField } from '~/stores/inventory'

const MAX_COLUMNS = 40
const SAMPLE_ROWS = 50

function normalizeHeader(cell: unknown): string {
 if (cell === null || cell === undefined) return ''
 return String(cell).trim()
}

function classifyLockedColumn(
 label: string,
 hasSerialNumbers: boolean
): 'name' | 'price' | 'serialNo' | 'brand' | null {
 const n = label.trim().toLowerCase().replace(/\s+/g, ' ')

 if (
 n === 'product' ||
 n === 'name' ||
 n === 'item' ||
 n === 'item name' ||
 n === 'product name' ||
 n === 'description' ||
 n === 'title' ||
 /^product\s/.test(n) ||
 /^item\s/.test(n)
 ) {
 return 'name'
 }

 if (
 n === 'price' ||
 n === 'unit price' ||
 n === 'selling price' ||
 n === 'sale price' ||
 n === 'cost' ||
 n === 'amount' ||
 n === 'rate' ||
 /\bprice\b/.test(n) ||
 /\bcost\b/.test(n) ||
 /\bamount\b/.test(n)
 ) {
 return 'price'
 }

 if (hasSerialNumbers) {
 if (
 /\bserial\b/.test(n) ||
 n.includes('imei') ||
 /\bsn\b/.test(n) ||
 n.includes('serial number')
 ) {
 return 'serialNo'
 }
 if (/\bbrand\b/.test(n) || /\bmake\b/.test(n) || n === 'model' || n.includes('product model')) {
 return 'brand'
 }
 }

 return null
}

function inferTypeFromHeader(label: string): TemplateField['type'] | null {
 const n = label.trim().toLowerCase()
 if (/\b(price|cost|amount|fee|total)\b/.test(n) || n.includes('unit price')) return 'currency'
 if (/\b(qty|quantity|stock|count)\b/.test(n)) return 'number'
 if (/\b(date|time|dob)\b/.test(n)) return 'date'
 if (/\b(yes|no|active|enabled)\b/.test(n)) return 'boolean'
 return null
}

function cellLooksBoolean(v: unknown): boolean {
 if (typeof v === 'boolean') return true
 if (typeof v !== 'string') return false
 const s = v.trim().toLowerCase()
 return ['yes', 'no', 'true', 'false', 'y', 'n', '1', '0'].includes(s)
}

function cellLooksNumber(v: unknown): boolean {
 return typeof v === 'number' && !Number.isNaN(v)
}

function cellLooksCurrency(v: unknown): boolean {
 if (typeof v === 'number') return true
 if (typeof v !== 'string') return false
 const s = v.trim()
 return /^[\$€£₦¥]?\s*[\d,]+(\.\d+)?$/.test(s) || /^\d+[.,]\d{2}$/.test(s)
}

function inferFieldTypeFromSamples(
 columnIndex: number,
 dataRows: unknown[][],
 headerLabel: string
): TemplateField['type'] {
 const fromHeader = inferTypeFromHeader(headerLabel)
 if (fromHeader) return fromHeader

 const samples: unknown[] = []
 for (let r = 0; r < dataRows.length && samples.length < SAMPLE_ROWS; r++) {
 const row = dataRows[r] as unknown[] | undefined
 const v = row?.[columnIndex]
 if (v !== '' && v !== null && v !== undefined) samples.push(v)
 }
 if (samples.length === 0) return 'text'

 let boolC = 0
 let numC = 0
 let curC = 0
 for (const v of samples) {
 if (cellLooksBoolean(v)) boolC++
 if (cellLooksNumber(v)) numC++
 if (cellLooksCurrency(v)) curC++
 }
 const n = samples.length
 if (boolC / n >= 0.65) return 'boolean'
 if (curC / n >= 0.45) return 'currency'
 if (numC / n >= 0.65) return 'number'
 return 'text'
}

function makeCustomField(
 label: string,
 columnIndex: number,
 ts: number,
 type: TemplateField['type']
): TemplateField {
 const id = `field-${ts}-${columnIndex}-${Math.random().toString(36).slice(2, 8)}`
 const base = labelToFieldName(label) || `col_${columnIndex}`
 return {
 id,
 name: base,
 label: label || `Column ${columnIndex + 1}`,
 type,
 required: false,
 }
}

function labelToFieldName(label: string): string {
 return label
 .trim()
 .toLowerCase()
 .replace(/\s+/g, '_')
 .replace(/[^a-z0-9_]/g, '')
}

function defaultNameField(ts: number): TemplateField {
 return {
 id: `field-name-${ts}`,
 name: 'name',
 label: 'Product',
 type: 'text',
 required: true,
 }
}

function defaultPriceField(ts: number): TemplateField {
 return {
 id: `field-price-${ts}`,
 name: 'price',
 label: 'Unit price',
 type: 'currency',
 required: false,
 }
}

function defaultSerialField(ts: number): TemplateField {
 return {
 id: `field-serialNo-${ts}`,
 name: 'serialNo',
 label: 'Serial Number',
 type: 'text',
 required: true,
 }
}

function defaultBrandField(ts: number): TemplateField {
 return {
 id: `field-brand-${ts}`,
 name: 'brand',
 label: 'Product model',
 type: 'text',
 required: true,
 }
}

/**
 * Reorder: name, price, middle columns (Excel order), then serial + brand when applicable.
 */
function finalizeFieldOrder(
 columnOrderFields: TemplateField[],
 hasSerialNumbers: boolean,
 ts: number
): TemplateField[] {
 const name =
 columnOrderFields.find((f) => f.name === 'name') ?? defaultNameField(ts)
 const price =
 columnOrderFields.find((f) => f.name === 'price') ?? defaultPriceField(ts)
 const serial = columnOrderFields.find(
 (f) => f.name === 'serialNo' || f.name === 'serialNumber'
 )
 const brand = columnOrderFields.find((f) => f.name === 'brand')

 const lockedNames = new Set([
 'name',
 'price',
 'serialNo',
 'serialNumber',
 'brand',
 'model',
 ])
 const middle = columnOrderFields.filter((f) => !lockedNames.has(f.name))

 const out: TemplateField[] = [name, price, ...middle]

 if (hasSerialNumbers) {
 out.push(serial ?? defaultSerialField(ts))
 out.push(brand ?? defaultBrandField(ts))
 }

 return out
}

export function parseTemplateFieldsFromExcelArrayBuffer(
 buffer: ArrayBuffer,
 options: { hasSerialNumbers: boolean }
): TemplateField[] {
 const workbook = XLSX.read(buffer, { type: 'array' })
 const sheetName = workbook.SheetNames[0]
 if (!sheetName) {
 throw new Error('The workbook has no sheets.')
 }
 const worksheet = workbook.Sheets[sheetName]
 if (!worksheet) {
 throw new Error('Could not read the first worksheet.')
 }

 const jsonData = XLSX.utils.sheet_to_json(worksheet, {
 header: 1,
 defval: '',
 }) as unknown[][]

 if (!jsonData.length) {
 throw new Error('The sheet is empty. Add a header row in row 1.')
 }

 const headerRow = jsonData[0] as unknown[]
 const dataRows = jsonData.slice(1) as unknown[][]

 const headers: string[] = []
 const colCount = Math.min(headerRow.length, MAX_COLUMNS)
 for (let c = 0; c < colCount; c++) {
 headers.push(normalizeHeader(headerRow[c]))
 }
 while (headers.length && !headers[headers.length - 1]) {
 headers.pop()
 }

 const nonEmpty = headers.filter(Boolean)
 if (nonEmpty.length === 0) {
 throw new Error(
 'No column headers found in row 1. Put titles in the first row of the sheet.'
 )
 }

 const ts = Date.now()
 let hasName = false
 let hasPrice = false
 let hasSerial = false
 let hasBrand = false

 const columnOrderFields: TemplateField[] = []

 for (let c = 0; c < headers.length; c++) {
 const label = headers[c]!
 if (!label) continue

 const locked = classifyLockedColumn(label, options.hasSerialNumbers)
 const inferred = inferFieldTypeFromSamples(c, dataRows, label)

 if (locked === 'name') {
 if (hasName) {
 columnOrderFields.push(makeCustomField(label, c, ts, inferred))
 continue
 }
 hasName = true
 columnOrderFields.push({
 id: `field-name-${ts}-${c}`,
 name: 'name',
 label: label,
 type: 'text',
 required: true,
 })
 continue
 }

 if (locked === 'price') {
 if (hasPrice) {
 columnOrderFields.push(makeCustomField(label, c, ts, inferred))
 continue
 }
 hasPrice = true
 columnOrderFields.push({
 id: `field-price-${ts}-${c}`,
 name: 'price',
 label: label,
 type: 'currency',
 required: false,
 })
 continue
 }

 if (locked === 'serialNo') {
 if (hasSerial) {
 columnOrderFields.push(makeCustomField(label, c, ts, 'text'))
 continue
 }
 hasSerial = true
 columnOrderFields.push({
 id: `field-serialNo-${ts}-${c}`,
 name: 'serialNo',
 label: label,
 type: 'text',
 required: true,
 })
 continue
 }

 if (locked === 'brand') {
 if (hasBrand) {
 columnOrderFields.push(makeCustomField(label, c, ts, inferred))
 continue
 }
 hasBrand = true
 columnOrderFields.push({
 id: `field-brand-${ts}-${c}`,
 name: 'brand',
 label: label,
 type: 'text',
 required: true,
 })
 continue
 }

 columnOrderFields.push(makeCustomField(label, c, ts, inferred))
 }

 return finalizeFieldOrder(columnOrderFields, options.hasSerialNumbers, ts)
}
