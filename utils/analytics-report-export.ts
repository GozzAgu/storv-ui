export type AnalyticsExportProduct = {
  name: string
  quantity: number
  revenue: number
}

export type AnalyticsExportCustomer = {
  name: string
  email: string
  orders: number
  totalSpent: number
}

export type AnalyticsExportReturn = {
  receiptNumber: string
  date: Date
  amount: number
  reason?: string
}

export type AnalyticsReportSnapshot = {
  periodLabel: string
  selectedPeriod: string
  formatCurrency: (value: number) => string
  formatReturnDate: (date: Date) => string
  totalRevenue: number
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  lowStockCount: number
  repeatPurchaseRate: number
  refundedCount: number
  refundAmount: number
  refundRate: number
  topProducts: AnalyticsExportProduct[]
  topCustomers: AnalyticsExportCustomer[]
  recentReturns: AnalyticsExportReturn[]
  /** Optional company branding on the PDF cover header. */
  businessName?: string
  companyLogoUrl?: string
}

const INK = { r: 26, g: 21, b: 35 }
const MUTED = { r: 107, g: 114, b: 128 }
const RULE = { r: 229, g: 231, b: 235 }
const SURFACE = { r: 249, g: 250, b: 251 }
const ACCENT = { r: 26, g: 21, b: 35 }

type PdfDoc = import('jspdf').jsPDF

function setInk(doc: PdfDoc) {
  doc.setTextColor(INK.r, INK.g, INK.b)
}

function setMuted(doc: PdfDoc) {
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
}

function drawHairline(doc: PdfDoc, x1: number, y: number, x2: number) {
  doc.setDrawColor(RULE.r, RULE.g, RULE.b)
  doc.setLineWidth(0.25)
  doc.line(x1, y, x2, y)
}

async function tryLoadImageDataUrl(url: string): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const format: 'PNG' | 'JPEG' =
      blob.type.includes('png') || url.toLowerCase().includes('.png') ? 'PNG' : 'JPEG'
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('read failed'))
      reader.readAsDataURL(blob)
    })
    if (!dataUrl.startsWith('data:image')) return null
    return { dataUrl, format }
  } catch {
    return null
  }
}

function truncate(doc: PdfDoc, text: string, maxWidth: number): string {
  const raw = String(text || '')
  if (doc.getTextWidth(raw) <= maxWidth) return raw
  let trimmed = raw
  while (trimmed.length > 1 && doc.getTextWidth(`${trimmed}…`) > maxWidth) {
    trimmed = trimmed.slice(0, -1)
  }
  return `${trimmed}…`
}

export function downloadAnalyticsCsv(snapshot: AnalyticsReportSnapshot) {
  let csvContent = 'Analytics & Sales Report\n'
  csvContent += `Period: ${snapshot.periodLabel}\n`
  csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`

  csvContent += 'Key Metrics\n'
  csvContent += 'Metric,Value\n'
  csvContent += `Total Revenue,${snapshot.totalRevenue}\n`
  csvContent += `Total Sales,${snapshot.totalSales}\n`
  csvContent += `Total Orders,${snapshot.totalOrders}\n`
  csvContent += `Average Order Value,${snapshot.averageOrderValue}\n`
  csvContent += `Low Stock Items,${snapshot.lowStockCount}\n`
  csvContent += `Repeat Purchase Rate,${snapshot.repeatPurchaseRate.toFixed(1)}%\n\n`

  csvContent += 'Top Products\n'
  csvContent += 'Product,Quantity,Revenue\n'
  snapshot.topProducts.slice(0, 10).forEach((product) => {
    csvContent += `"${product.name}",${product.quantity},${product.revenue}\n`
  })
  csvContent += '\n'

  csvContent += 'Top Customers\n'
  csvContent += 'Customer Name,Email,Orders,Total Spent\n'
  snapshot.topCustomers.slice(0, 10).forEach((customer) => {
    csvContent += `"${customer.name}","${customer.email}",${customer.orders},${customer.totalSpent}\n`
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `analytics-report-${snapshot.selectedPeriod}-${Date.now()}.csv`
  )
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadAnalyticsPdf(snapshot: AnalyticsReportSnapshot) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 16
  const contentWidth = pageWidth - marginX * 2
  const bottomSafe = pageHeight - 16
  let y = 16
  let pageNum = 1

  const generatedLabel = new Date().toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const businessName = (snapshot.businessName || '').trim() || 'Storvv'
  const logo = snapshot.companyLogoUrl
    ? await tryLoadImageDataUrl(snapshot.companyLogoUrl)
    : null

  const paintFooter = () => {
    drawHairline(doc, marginX, pageHeight - 12, pageWidth - marginX)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setMuted(doc)
    doc.text(businessName, marginX, pageHeight - 7)
    doc.text(`Page ${pageNum}`, pageWidth - marginX, pageHeight - 7, { align: 'right' })
  }

  const newPage = () => {
    paintFooter()
    doc.addPage()
    pageNum += 1
    y = 16
  }

  const ensureSpace = (needed: number) => {
    if (y + needed > bottomSafe) newPage()
  }

  // —— Header ——
  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, marginX, y, 12, 12)
    } catch {
      // ignore broken logo payloads
    }
  }

  const headerLeft = logo ? marginX + 16 : marginX
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setInk(doc)
  doc.text(businessName, headerLeft, y + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setMuted(doc)
  doc.text('Sales analytics', headerLeft, y + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setMuted(doc)
  doc.text(snapshot.periodLabel, pageWidth - marginX, y + 5, { align: 'right' })
  doc.text(`Generated ${generatedLabel}`, pageWidth - marginX, y + 10, { align: 'right' })

  y += 18
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.rect(marginX, y, contentWidth, 0.6, 'F')
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  setInk(doc)
  doc.text('Sales report', marginX, y)
  y += 10

  // —— Highlight metrics ——
  const highlights: Array<{ label: string; value: string }> = [
    { label: 'Revenue', value: snapshot.formatCurrency(snapshot.totalRevenue) },
    { label: 'Orders', value: String(snapshot.totalOrders) },
    { label: 'Avg. order', value: snapshot.formatCurrency(snapshot.averageOrderValue) },
  ]

  const gap = 4
  const cardW = (contentWidth - gap * 2) / 3
  const cardH = 22
  ensureSpace(cardH + 8)

  highlights.forEach((card, i) => {
    const x = marginX + i * (cardW + gap)
    doc.setFillColor(SURFACE.r, SURFACE.g, SURFACE.b)
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setMuted(doc)
    doc.text(card.label.toUpperCase(), x + 4, y + 7)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    setInk(doc)
    doc.text(truncate(doc, card.value, cardW - 8), x + 4, y + 16)
  })
  y += cardH + 10

  // —— Secondary metrics ——
  const secondary: Array<[string, string]> = [
    ['Units sold', String(snapshot.totalSales)],
    ['Low stock items', String(snapshot.lowStockCount)],
    ['Refunds', String(snapshot.refundedCount)],
    ['Refund amount', snapshot.formatCurrency(snapshot.refundAmount)],
    ['Refund rate', `${snapshot.refundRate.toFixed(1)}%`],
    ['Repeat purchase', `${snapshot.repeatPurchaseRate.toFixed(1)}%`],
  ]

  ensureSpace(8 + Math.ceil(secondary.length / 2) * 7)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setInk(doc)
  doc.text('Details', marginX, y)
  y += 5
  drawHairline(doc, marginX, y, pageWidth - marginX)
  y += 6

  const colW = contentWidth / 2
  secondary.forEach(([label, value], index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = marginX + col * colW
    const rowY = y + row * 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setMuted(doc)
    doc.text(label, x, rowY)
    doc.setFont('helvetica', 'bold')
    setInk(doc)
    doc.text(value, x + colW - 4, rowY, { align: 'right' })
  })
  y += Math.ceil(secondary.length / 2) * 7 + 8

  type TableColumn = {
    key: string
    label: string
    width: number
    align?: 'left' | 'right'
  }

  const drawTable = (
    title: string,
    columns: TableColumn[],
    rows: Record<string, string>[]
  ) => {
    if (rows.length === 0) return

    ensureSpace(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    setInk(doc)
    doc.text(title, marginX, y)
    y += 5

    const rowH = 7
    const headerH = 8

    const drawHeader = () => {
      doc.setFillColor(SURFACE.r, SURFACE.g, SURFACE.b)
      doc.rect(marginX, y, contentWidth, headerH, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      setMuted(doc)
      let x = marginX + 3
      columns.forEach((col) => {
        const textX = col.align === 'right' ? x + col.width - 3 : x
        doc.text(col.label.toUpperCase(), textX, y + 5.2, {
          align: col.align === 'right' ? 'right' : 'left',
        })
        x += col.width
      })
      y += headerH
    }

    drawHeader()

    rows.forEach((row, rowIndex) => {
      ensureSpace(rowH + 2)
      if (y === 16) {
        // After page break, redraw section context lightly
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        setInk(doc)
        doc.text(`${title} (continued)`, marginX, y)
        y += 5
        drawHeader()
      }

      if (rowIndex % 2 === 1) {
        doc.setFillColor(252, 252, 253)
        doc.rect(marginX, y, contentWidth, rowH, 'F')
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      setInk(doc)
      let x = marginX + 3
      columns.forEach((col) => {
        const cell = truncate(doc, row[col.key] || '', col.width - 4)
        const textX = col.align === 'right' ? x + col.width - 3 : x
        doc.text(cell, textX, y + 4.8, {
          align: col.align === 'right' ? 'right' : 'left',
        })
        x += col.width
      })
      y += rowH
    })

    drawHairline(doc, marginX, y, pageWidth - marginX)
    y += 10
  }

  drawTable(
    'Top products',
    [
      { key: 'name', label: 'Product', width: contentWidth * 0.52 },
      { key: 'qty', label: 'Qty', width: contentWidth * 0.16, align: 'right' },
      { key: 'revenue', label: 'Revenue', width: contentWidth * 0.32, align: 'right' },
    ],
    snapshot.topProducts.slice(0, 10).map((p) => ({
      name: p.name,
      qty: String(p.quantity),
      revenue: snapshot.formatCurrency(p.revenue),
    }))
  )

  drawTable(
    'Top customers',
    [
      { key: 'name', label: 'Customer', width: contentWidth * 0.52 },
      { key: 'orders', label: 'Orders', width: contentWidth * 0.16, align: 'right' },
      { key: 'spent', label: 'Total spent', width: contentWidth * 0.32, align: 'right' },
    ],
    snapshot.topCustomers.slice(0, 10).map((c) => ({
      name: c.name,
      orders: String(c.orders),
      spent: snapshot.formatCurrency(c.totalSpent),
    }))
  )

  drawTable(
    'Recent returns',
    [
      { key: 'receipt', label: 'Receipt', width: contentWidth * 0.22 },
      { key: 'date', label: 'Date', width: contentWidth * 0.2 },
      { key: 'amount', label: 'Amount', width: contentWidth * 0.22, align: 'right' },
      { key: 'reason', label: 'Reason', width: contentWidth * 0.36 },
    ],
    snapshot.recentReturns.map((ret) => ({
      receipt: ret.receiptNumber,
      date: snapshot.formatReturnDate(ret.date),
      amount: `-${snapshot.formatCurrency(ret.amount)}`,
      reason: ret.reason || '—',
    }))
  )

  paintFooter()
  doc.save(`analytics-report-${snapshot.selectedPeriod}-${Date.now()}.pdf`)
}
