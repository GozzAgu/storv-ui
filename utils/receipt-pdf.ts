import type { jsPDF } from 'jspdf'

/**
 * The printable / downloadable / emailed receipt (A4). Laid out like a professional invoice:
 * the shop's letterhead, a clear receipt number and status, who it was for, an itemised table,
 * totals with every amount shown in full (₦7,000,000.00, never "₦7m"), the trade-in taken,
 * the shop's policies, and a footer on every page.
 *
 * Pure: takes plain data and draws it, so it can be tested and rendered outside the app.
 */

export interface ReceiptPdfItem {
  name: string
  /** Short facts printed under the name, e.g. "SN: 1", "Brand: Honda". */
  details: string[]
  quantity: number
  unitPrice: number
  /** Price before a discount, when the line was discounted. */
  originalUnitPrice?: number
  /** e.g. "10% off" or "₦5,000.00 off". */
  discountLabel?: string
  amount: number
}

export type ReceiptPdfStatus = 'completed' | 'pending' | 'refunded' | 'balance_due' | 'cancelled'

export interface ReceiptPdfData {
  store: {
    name: string
    branch?: string
    phone?: string
    email?: string
    /** PNG or JPEG data URL. */
    logoDataUrl?: string | null
  }
  receiptNumber: string
  date: Date
  status: ReceiptPdfStatus
  customer: { name: string; phone?: string; email?: string; address?: string }
  servedBy?: string
  items: ReceiptPdfItem[]
  totals: {
    subtotal: number
    discount?: number
    tradeInCredit?: number
    total: number
    /** "Total" or "Amount due" (after a trade-in). */
    totalLabel: string
    amountPaid?: number
    balanceDue?: number
  }
  payment: { method: string; split?: Array<{ method: string; amount: number }> }
  tradeIn?: { name: string; category?: string; details: string[] }
  notes?: string
  policies?: Array<{ title: string; text: string }>
  /** ISO 4217 code, e.g. "NGN". Drives the amount in words. */
  currency: string
  /** Formats an amount in full, e.g. ₦7,000,000.00. */
  money: (amount: number) => string
  /** Footer timestamp; defaults to now. */
  generatedAt?: Date
}

/** Font files (base64 TTF) keyed by weight. Without them the built-in Helvetica is used. */
export interface ReceiptPdfFonts {
  regular: string
  semibold: string
  bold: string
}

const FAMILY = 'StorvvSans'
const FAMILY_SEMI = 'StorvvSansSemi'

type RGB = [number, number, number]
const INK: RGB = [17, 17, 19]
const TEXT: RGB = [55, 55, 60]
const MUTED: RGB = [113, 113, 122]
const FAINT: RGB = [161, 161, 170]
const RULE: RGB = [228, 228, 231]
const BAND: RGB = [244, 244, 245]

const STATUS_STYLE: Record<ReceiptPdfStatus, { label: string; fill: RGB; ink: RGB }> = {
  completed: { label: 'PAID', fill: [220, 252, 231], ink: [21, 128, 61] },
  pending: { label: 'PENDING', fill: [254, 243, 199], ink: [161, 98, 7] },
  balance_due: { label: 'BALANCE DUE', fill: [254, 243, 199], ink: [161, 98, 7] },
  refunded: { label: 'REFUNDED', fill: [254, 226, 226], ink: [185, 28, 28] },
  cancelled: { label: 'CANCELLED', fill: [244, 244, 245], ink: [82, 82, 91] },
}

export function registerReceiptPdfFonts(pdf: jsPDF, fonts: ReceiptPdfFonts | null): boolean {
  if (!fonts) return false
  try {
    pdf.addFileToVFS('StorvvSans-Regular.ttf', fonts.regular)
    pdf.addFont('StorvvSans-Regular.ttf', FAMILY, 'normal')
    pdf.addFileToVFS('StorvvSans-Bold.ttf', fonts.bold)
    pdf.addFont('StorvvSans-Bold.ttf', FAMILY, 'bold')
    pdf.addFileToVFS('StorvvSans-SemiBold.ttf', fonts.semibold)
    pdf.addFont('StorvvSans-SemiBold.ttf', FAMILY_SEMI, 'normal')
    return true
  } catch {
    return false
  }
}

/** "Seven million naira only", for the line under the total on naira receipts. */
export function amountInWords(amount: number, currency: string): string | null {
  if (!Number.isFinite(amount) || amount < 0 || amount >= 1e15) return null
  const units: Record<string, [string, string]> = {
    NGN: ['naira', 'kobo'],
    GHS: ['cedis', 'pesewas'],
    USD: ['dollars', 'cents'],
    GBP: ['pounds', 'pence'],
    EUR: ['euros', 'cents'],
  }
  const unit = units[currency.toUpperCase()]
  if (!unit) return null
  const whole = Math.floor(amount + 1e-9)
  const minor = Math.round((amount - whole) * 100)
  const words = numberToWords(whole)
  const head = `${words.charAt(0).toUpperCase()}${words.slice(1)} ${unit[0]}`
  return minor > 0 ? `${head}, ${numberToWords(minor)} ${unit[1]} only` : `${head} only`
}

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const SCALES: Array<[number, string]> = [
  [1e12, 'trillion'],
  [1e9, 'billion'],
  [1e6, 'million'],
  [1e3, 'thousand'],
]

function underThousand(n: number): string {
  const parts: string[] = []
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  if (hundreds) parts.push(`${ONES[hundreds]} hundred`)
  if (rest) {
    const tens =
      rest < 20
        ? ONES[rest]!
        : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${ONES[rest % 10]}` : ''}`
    parts.push(hundreds ? `and ${tens}` : tens)
  }
  return parts.join(' ')
}

export function numberToWords(n: number): string {
  n = Math.floor(n)
  if (n === 0) return 'zero'
  const parts: string[] = []
  let rest = n
  for (const [size, name] of SCALES) {
    if (rest >= size) {
      parts.push(`${underThousand(Math.floor(rest / size))} ${name}`)
      rest %= size
    }
  }
  if (rest)
    parts.push(parts.length && rest < 100 ? `and ${underThousand(rest)}` : underThousand(rest))
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function formatDateTime(date: Date): { date: string; time: string } {
  return {
    date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

export function renderReceiptPdf(pdf: jsPDF, data: ReceiptPdfData, fonts: ReceiptPdfFonts | null) {
  const hasFonts = registerReceiptPdfFonts(pdf, fonts)
  // Helvetica can't draw ₦: spell the code instead of printing a broken glyph.
  const money = (n: number) => {
    const text = data.money(n)
    return hasFonts ? text : text.replace(/₦\s?/g, 'NGN ')
  }
  const font = (weight: 'regular' | 'semibold' | 'bold') => {
    if (!hasFonts) pdf.setFont('helvetica', weight === 'regular' ? 'normal' : 'bold')
    else if (weight === 'semibold') pdf.setFont(FAMILY_SEMI, 'normal')
    else pdf.setFont(FAMILY, weight === 'bold' ? 'bold' : 'normal')
  }
  const color = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2])

  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 18
  const R = W - M
  const CW = W - M * 2
  const FOOTER_SPACE = 22
  let y = M

  const text = (
    value: string,
    x: number,
    yy: number,
    opts: {
      size: number
      weight?: 'regular' | 'semibold' | 'bold'
      ink?: RGB
      align?: 'left' | 'right' | 'center'
      spacing?: number
    }
  ) => {
    font(opts.weight ?? 'regular')
    pdf.setFontSize(opts.size)
    color(opts.ink ?? TEXT)
    // Helvetica has no true minus sign: a hyphen reads the same and prints cleanly
    const printable = hasFonts ? value : value.replace(/\u2212/g, '-')
    pdf.text(printable, x, yy, { align: opts.align ?? 'left', charSpace: opts.spacing ?? 0 })
  }
  const wrap = (
    value: string,
    width: number,
    size: number,
    weight: 'regular' | 'semibold' | 'bold' = 'regular'
  ) => {
    font(weight)
    pdf.setFontSize(size)
    return pdf.splitTextToSize(value, width) as string[]
  }
  const rule = (yy: number, c: RGB = RULE, width = 0.25, x1 = M, x2 = R) => {
    pdf.setDrawColor(c[0], c[1], c[2])
    pdf.setLineWidth(width)
    pdf.line(x1, yy, x2, yy)
  }
  const label = (value: string, x: number, yy: number, align: 'left' | 'right' = 'left') =>
    text(value.toUpperCase(), x, yy, {
      size: 7,
      weight: 'semibold',
      ink: MUTED,
      align,
      spacing: 0.25,
    })

  // ── Letterhead ─────────────────────────────────────────────────────────
  let leftX = M
  if (data.store.logoDataUrl) {
    try {
      const format = /^data:image\/jpe?g/i.test(data.store.logoDataUrl) ? 'JPEG' : 'PNG'
      pdf.addImage(data.store.logoDataUrl, format, M, y - 1, 16, 16, undefined, 'FAST')
      leftX = M + 21
    } catch {
      /* no logo */
    }
  }
  const storeLines: Array<[string, number, 'regular' | 'bold', RGB]> = [
    [data.store.name || 'Store', 14, 'bold', INK],
  ]
  if (data.store.branch) storeLines.push([data.store.branch, 8.5, 'regular', MUTED])
  const contact = [data.store.phone, data.store.email].filter(Boolean).join('  ·  ')
  if (contact) storeLines.push([contact, 8.5, 'regular', MUTED])
  let sy = y + 4
  for (const [value, size, weight, ink] of storeLines) {
    const lines = wrap(value, 92, size, weight)
    for (const line of lines) {
      text(line, leftX, sy, { size, weight, ink })
      sy += size === 14 ? 6 : 4.2
    }
  }

  text('RECEIPT', R, y + 5.5, { size: 22, weight: 'bold', ink: INK, align: 'right', spacing: 0.6 })
  const status = STATUS_STYLE[data.status] ?? STATUS_STYLE.completed
  font('semibold')
  pdf.setFontSize(7.5)
  const pillW = pdf.getTextWidth(status.label) + 0.25 * status.label.length + 7
  pdf.setFillColor(status.fill[0], status.fill[1], status.fill[2])
  pdf.roundedRect(R - pillW, y + 9.5, pillW, 6, 3, 3, 'F')
  text(status.label, R - pillW / 2, y + 13.65, {
    size: 7.5,
    weight: 'semibold',
    ink: status.ink,
    align: 'center',
    spacing: 0.25,
  })

  y = Math.max(sy, y + 22) + 4
  rule(y, INK, 0.6)
  y += 8

  // ── Receipt facts and who it's for ─────────────────────────────────────
  const when = formatDateTime(data.date)
  const colW = CW / 3
  const cols: Array<{ title: string; lines: Array<{ value: string; strong?: boolean }> }> = [
    {
      title: 'Billed to',
      lines: [
        { value: data.customer.name || 'Walk-in customer', strong: true },
        ...[data.customer.phone, data.customer.email, data.customer.address]
          .filter((v): v is string => !!v && !!v.trim())
          .map((value) => ({ value })),
      ],
    },
    {
      title: 'Receipt',
      lines: [
        { value: data.receiptNumber, strong: true },
        { value: `${when.date}, ${when.time}` },
        ...(data.servedBy ? [{ value: `Served by ${data.servedBy}` }] : []),
      ],
    },
    {
      title: 'Payment',
      lines: data.payment.split?.length
        ? [
            { value: 'Split payment', strong: true },
            ...data.payment.split.map((p) => ({ value: `${p.method}  ${money(p.amount)}` })),
          ]
        : [{ value: data.payment.method || 'Cash', strong: true }],
    },
  ]
  let colBottom = y
  cols.forEach((col, i) => {
    const x = M + colW * i
    label(col.title, x, y)
    let cy = y + 5.5
    for (const line of col.lines) {
      for (const part of wrap(
        line.value,
        colW - 6,
        line.strong ? 10 : 9,
        line.strong ? 'semibold' : 'regular'
      )) {
        text(part, x, cy, {
          size: line.strong ? 10 : 9,
          weight: line.strong ? 'semibold' : 'regular',
          ink: line.strong ? INK : TEXT,
        })
        cy += line.strong ? 5 : 4.4
      }
    }
    colBottom = Math.max(colBottom, cy)
  })
  y = colBottom + 6

  // ── Items ──────────────────────────────────────────────────────────────
  const qtyX = M + CW * 0.55
  const unitX = M + CW * 0.765
  const nameW = CW * 0.47
  const tableHead = () => {
    pdf.setFillColor(BAND[0], BAND[1], BAND[2])
    pdf.roundedRect(M, y, CW, 8.5, 1.5, 1.5, 'F')
    label('Item', M + 4, y + 5.5)
    label('Qty', qtyX, y + 5.5, 'right')
    label('Unit price', unitX, y + 5.5, 'right')
    label('Amount', R - 4, y + 5.5, 'right')
    y += 14.5
  }
  const footer = (page: number, pages: number) => {
    const fy = H - 14
    rule(fy - 5)
    text('Thank you for your business.', M, fy, { size: 8.5, weight: 'semibold', ink: INK })
    text(`Page ${page} of ${pages}`, R, fy, { size: 7.5, ink: FAINT, align: 'right' })
    const stamp = (data.generatedAt ?? new Date()).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    text(`${data.receiptNumber}  ·  Issued with Storvv on ${stamp}  ·  storvv.com`, M, fy + 4.5, {
      size: 7,
      ink: FAINT,
    })
  }
  const ensure = (needed: number, repeatHead = false) => {
    if (y + needed <= H - FOOTER_SPACE) return
    pdf.addPage()
    y = M
    if (repeatHead) tableHead()
  }

  tableHead()
  data.items.forEach((item, index) => {
    const nameLines = wrap(item.name, nameW, 10, 'semibold')
    // Non-breaking spaces inside each fact, so "Warranty: 12 months" never splits across lines
    const detailText = item.details.map((d) => d.replace(/ /g, '\u00A0')).join('   ·   ')
    const detailLines = detailText ? wrap(detailText, nameW, 8) : []
    const extra = item.discountLabel ? 1 : 0
    const blockH = nameLines.length * 5 + detailLines.length * 4 + extra * 4.2 + 2
    ensure(blockH + 4, true)

    let ry = y
    nameLines.forEach((line) => {
      text(line, M + 4, ry, { size: 10, weight: 'semibold', ink: INK })
      ry += 5
    })
    detailLines.forEach((line) => {
      text(line, M + 4, ry - 0.6, { size: 8, ink: MUTED })
      ry += 4
    })
    if (item.discountLabel) {
      text(item.discountLabel, M + 4, ry - 0.4, { size: 8, weight: 'semibold', ink: [21, 128, 61] })
      ry += 4.2
    }

    text(String(item.quantity), qtyX, y, { size: 10, ink: INK, align: 'right' })
    text(money(item.unitPrice), unitX, y, { size: 10, ink: INK, align: 'right' })
    if (item.originalUnitPrice && item.originalUnitPrice > item.unitPrice) {
      const was = money(item.originalUnitPrice)
      text(was, unitX, y + 4.4, { size: 8, ink: FAINT, align: 'right' })
      font('regular')
      pdf.setFontSize(8)
      const wasW = pdf.getTextWidth(was)
      pdf.setDrawColor(FAINT[0], FAINT[1], FAINT[2])
      pdf.setLineWidth(0.2)
      pdf.line(unitX - wasW, y + 3.3, unitX, y + 3.3)
    }
    text(money(item.amount), R - 4, y, { size: 10, weight: 'semibold', ink: INK, align: 'right' })

    y = Math.max(ry, y + 6) + 2
    if (index < data.items.length - 1) rule(y - 2.5, RULE, 0.2, M + 4, R - 4)
    y += 3
  })

  // ── Totals ─────────────────────────────────────────────────────────────
  y += 2
  rule(y - 3)
  const rows: Array<{ label: string; value: string; tone?: 'credit' }> = [
    { label: 'Subtotal', value: money(data.totals.subtotal) },
  ]
  if (data.totals.discount)
    rows.push({ label: 'Discount', value: `−${money(data.totals.discount)}`, tone: 'credit' })
  if (data.totals.tradeInCredit)
    rows.push({
      label: 'Trade-in credit',
      value: `−${money(data.totals.tradeInCredit)}`,
      tone: 'credit',
    })

  const words = amountInWords(data.totals.total, data.currency)
  const totalsX = M + CW * 0.52
  const blockH = rows.length * 6 + 16 + (data.totals.balanceDue !== undefined ? 13 : 0)
  ensure(blockH + 4)
  const top = y + 2
  let ty = top + 3
  for (const row of rows) {
    text(row.label, totalsX + 4, ty, { size: 9.5, ink: TEXT })
    text(row.value, R - 4, ty, {
      size: 9.5,
      ink: row.tone === 'credit' ? [21, 128, 61] : INK,
      align: 'right',
    })
    ty += 6
  }
  ty += 1
  pdf.setFillColor(INK[0], INK[1], INK[2])
  pdf.roundedRect(totalsX, ty - 5.5, R - totalsX, 11, 2, 2, 'F')
  text(data.totals.totalLabel, totalsX + 4, ty + 1.6, {
    size: 10.5,
    weight: 'semibold',
    ink: [255, 255, 255],
  })
  text(money(data.totals.total), R - 4, ty + 1.8, {
    size: 13,
    weight: 'bold',
    ink: [255, 255, 255],
    align: 'right',
  })
  ty += 11
  if (data.totals.balanceDue !== undefined) {
    text('Amount paid', totalsX + 4, ty, { size: 9.5, ink: TEXT })
    text(money(data.totals.amountPaid ?? 0), R - 4, ty, { size: 9.5, ink: INK, align: 'right' })
    ty += 6
    text('Balance due', totalsX + 4, ty, { size: 10, weight: 'semibold', ink: [161, 98, 7] })
    text(money(data.totals.balanceDue), R - 4, ty, {
      size: 10,
      weight: 'semibold',
      ink: [161, 98, 7],
      align: 'right',
    })
    ty += 6
  }

  // Amount in words, beside the totals
  if (words) {
    label('Amount in words', M, top + 3)
    let wy = top + 8.5
    for (const line of wrap(words, CW * 0.46, 9, 'semibold')) {
      text(line, M, wy, { size: 9, weight: 'semibold', ink: INK })
      wy += 4.6
    }
  }
  y = Math.max(ty, top + 20) + 6

  // ── Trade-in received ─────────────────────────────────────────────────
  if (data.tradeIn) {
    const details = data.tradeIn.details.map((d) => d.replace(/ /g, '\u00A0')).join('   ·   ')
    const detailLines = details ? wrap(details, CW - 16 - 50, 8.5) : []
    const boxH = 15 + detailLines.length * 4.3
    ensure(boxH + 4)
    pdf.setDrawColor(RULE[0], RULE[1], RULE[2])
    pdf.setLineWidth(0.3)
    pdf.roundedRect(M, y, CW, boxH, 2.5, 2.5, 'S')
    label(
      `Trade-in received${data.tradeIn.category ? `  ·  ${data.tradeIn.category}` : ''}`,
      M + 6,
      y + 6.5
    )
    text(data.tradeIn.name, M + 6, y + 12, { size: 10.5, weight: 'semibold', ink: INK })
    let dy = y + 16.5
    for (const line of detailLines) {
      text(line, M + 6, dy, { size: 8.5, ink: MUTED })
      dy += 4.3
    }
    if (data.totals.tradeInCredit) {
      label('Credited', R - 6, y + 6.5, 'right')
      text(`−${money(data.totals.tradeInCredit)}`, R - 6, y + 12, {
        size: 10.5,
        weight: 'semibold',
        ink: [21, 128, 61],
        align: 'right',
      })
    }
    y += boxH + 7
  }

  // ── Notes and the shop's policies ──────────────────────────────────────
  const blocks = [
    ...(data.notes?.trim() ? [{ title: 'Notes', text: data.notes.trim() }] : []),
    ...(data.policies ?? []).filter((p) => p.text.trim()),
  ]
  for (const block of blocks) {
    const lines = wrap(block.text, CW, 8.5)
    ensure(8 + Math.min(lines.length, 3) * 4)
    label(block.title, M, y)
    y += 5
    for (const line of lines) {
      ensure(4.5)
      text(line, M, y, { size: 8.5, ink: TEXT })
      y += 4.1
    }
    y += 4
  }

  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page)
    footer(page, pages)
  }
  return pdf
}

let fontCache: Promise<ReceiptPdfFonts | null> | null = null

/** Loads the receipt typeface from /fonts/receipt once per session. Null if it can't be fetched. */
export function loadReceiptPdfFonts(): Promise<ReceiptPdfFonts | null> {
  if (fontCache) return fontCache
  const get = async (weight: string) => {
    const res = await fetch(`/fonts/receipt/PlusJakartaSans-${weight}.ttf`)
    if (!res.ok) throw new Error(`font ${weight}: ${res.status}`)
    const bytes = new Uint8Array(await res.arrayBuffer())
    let binary = ''
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    }
    return btoa(binary)
  }
  fontCache = Promise.all([get('Regular'), get('SemiBold'), get('Bold')])
    .then(([regular, semibold, bold]) => ({ regular, semibold, bold }))
    .catch((err) => {
      console.warn('[receipt-pdf] typeface unavailable, using Helvetica', err)
      fontCache = null
      return null
    })
  return fontCache
}
