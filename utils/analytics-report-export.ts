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
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Analytics & Sales Report', 14, 20)
  doc.setFontSize(10)
  doc.text(`Period: ${snapshot.periodLabel}`, 14, 28)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34)

  let yPos = 44

  doc.setFontSize(14)
  doc.text('Key Metrics', 14, yPos)
  yPos += 8

  doc.setFontSize(10)
  const metrics = [
    ['Total Revenue', snapshot.formatCurrency(snapshot.totalRevenue)],
    ['Total Sales', snapshot.totalSales.toString()],
    ['Total Orders', snapshot.totalOrders.toString()],
    ['Average Order Value', snapshot.formatCurrency(snapshot.averageOrderValue)],
    ['Low Stock Items', snapshot.lowStockCount.toString()],
    ['Refunded Count', snapshot.refundedCount.toString()],
    ['Refund Amount', snapshot.formatCurrency(snapshot.refundAmount)],
    ['Refund Rate', `${snapshot.refundRate.toFixed(1)}%`],
    ['Repeat Purchase Rate', `${snapshot.repeatPurchaseRate.toFixed(1)}%`],
  ]

  metrics.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 20, yPos)
    yPos += 6
  })

  yPos += 4

  if (snapshot.topProducts.length > 0) {
    doc.setFontSize(14)
    doc.text('Top Products', 14, yPos)
    yPos += 8
    doc.setFontSize(12)
    doc.text('Product', 20, yPos)
    doc.text('Quantity', 100, yPos)
    doc.text('Revenue', 150, yPos)
    yPos += 6
    doc.setFontSize(10)

    snapshot.topProducts.slice(0, 10).forEach((product) => {
      if (yPos > 280) {
        doc.addPage()
        yPos = 20
      }
      doc.text(product.name.substring(0, 30), 20, yPos)
      doc.text(product.quantity.toString(), 100, yPos)
      doc.text(snapshot.formatCurrency(product.revenue), 150, yPos)
      yPos += 6
    })
    yPos += 4
  }

  if (snapshot.topCustomers.length > 0) {
    doc.setFontSize(14)
    doc.text('Top Customers', 14, yPos)
    yPos += 8
    doc.setFontSize(12)
    doc.text('Customer', 20, yPos)
    doc.text('Orders', 100, yPos)
    doc.text('Total Spent', 150, yPos)
    yPos += 6
    doc.setFontSize(10)

    snapshot.topCustomers.slice(0, 10).forEach((customer) => {
      if (yPos > 280) {
        doc.addPage()
        yPos = 20
      }
      doc.text(customer.name.substring(0, 30), 20, yPos)
      doc.text(customer.orders.toString(), 100, yPos)
      doc.text(snapshot.formatCurrency(customer.totalSpent), 150, yPos)
      yPos += 6
    })
    yPos += 4
  }

  if (snapshot.recentReturns.length > 0) {
    doc.setFontSize(14)
    doc.text('Recent Returns', 14, yPos)
    yPos += 8
    doc.setFontSize(12)
    doc.text('Receipt #', 20, yPos)
    doc.text('Date', 60, yPos)
    doc.text('Amount', 110, yPos)
    doc.text('Reason', 150, yPos)
    yPos += 6
    doc.setFontSize(10)

    snapshot.recentReturns.forEach((ret) => {
      if (yPos > 280) {
        doc.addPage()
        yPos = 20
      }
      doc.text(ret.receiptNumber, 20, yPos)
      doc.text(snapshot.formatReturnDate(ret.date), 60, yPos)
      doc.text('-' + snapshot.formatCurrency(ret.amount), 110, yPos)
      doc.text((ret.reason || '-').substring(0, 25), 150, yPos)
      yPos += 6
    })
  }

  doc.save(`analytics-report-${snapshot.selectedPeriod}-${Date.now()}.pdf`)
}
