export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function generateReceiptEmailHTML(receiptData: Record<string, unknown>): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  const formatDate = (date: unknown) => {
    if (!date) return ''
    const d =
      date &&
      typeof date === 'object' &&
      'toDate' in date &&
      typeof (date as { toDate?: () => Date }).toDate === 'function'
        ? (date as { toDate: () => Date }).toDate()
        : new Date(date as string)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const items = Array.isArray(receiptData.items) ? receiptData.items : []
  const itemsHtml = items
    .map((item: Record<string, unknown>) => {
      const price = Number(item.price) || 0
      const qty = Number(item.quantity) || 1
      const itemTotal = price * qty
      return `
 <tr style="border-bottom: 1px solid #e5e7eb;">
 <td style="padding: 8px;">${escapeHtml(String(item.itemName || ''))}</td>
 <td style="padding: 8px; text-align: center;">${qty}</td>
 <td style="padding: 8px; text-align: right;">${formatCurrency(price)}</td>
 <td style="padding: 8px; text-align: right;">${formatCurrency(itemTotal)}</td>
 </tr>
 `
    })
    .join('')

  return `
 <!DOCTYPE html>
 <html>
 <head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Receipt ${escapeHtml(String(receiptData.receiptNumber || ''))}</title>
 </head>
 <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
 <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
 <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${escapeHtml(
   String(receiptData.storeName || receiptData.businessName || 'Store')
 )}</h1>
 ${
   receiptData.storeBranchName
     ? `<p style="margin: 4px 0 0; font-size: 14px; color: #666;">${escapeHtml(
         String(receiptData.storeBranchName)
       )}</p>`
     : ''
 }
 </div>
 <p style="font-size: 14px;">Hi ${escapeHtml(String(receiptData.customerName || 'Customer'))},</p>
 <p style="font-size: 14px;">Please find your receipt attached.</p>
 <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
 <thead>
 <tr style="border-bottom: 2px solid #333;">
 <th style="padding: 10px; text-align: left;">Item</th>
 <th style="padding: 10px; text-align: center;">Qty</th>
 <th style="padding: 10px; text-align: right;">Price</th>
 <th style="padding: 10px; text-align: right;">Total</th>
 </tr>
 </thead>
 <tbody>${itemsHtml}</tbody>
 </table>
 <p style="font-size: 18px; font-weight: bold; text-align: right;">Total: ${formatCurrency(
   Number(receiptData.total) || 0
 )}</p>
 <p style="font-size: 12px; color: #666;">Receipt #${escapeHtml(
   String(receiptData.receiptNumber || '')
 )} · ${formatDate(receiptData.date)}</p>
 <p style="margin-top: 24px; font-size: 12px; color: #666;">Thank you for your business. Storvv</p>
 </body>
 </html>
 `
}
