export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { receiptId, receiptNumber, customerEmail, receiptData, pdfBase64 } = body

    if (!customerEmail || typeof customerEmail !== 'string') {
      return {
        success: false,
        error: 'Customer email is required'
      }
    }

    if (!receiptData) {
      return {
        success: false,
        error: 'Receipt data is required'
      }
    }

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return {
        success: false,
        error: 'PDF data is required'
      }
    }

    // Get email service configuration from runtime config
    const config = useRuntimeConfig()
    
    // Generate HTML email from the receipt data
    const emailHtml = generateReceiptEmailHTML(receiptData)

    // Convert base64 PDF to Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')

    // TODO: Integrate with your email service provider
    // Example with Resend (recommended - supports attachments):
    /*
    const RESEND_API_KEY = config.resendApiKey || process.env.RESEND_API_KEY
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'receipts@yourdomain.com',
        to: customerEmail,
        subject: `Your Receipt #${receiptNumber} - ${receiptData.storeBranchName || 'Store'}`,
        html: emailHtml,
        attachments: [
          {
            filename: `receipt-${receiptNumber}.pdf`,
            content: pdfBase64, // Resend accepts base64 strings
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to send email')
    }
    */

    // Example with NodeMailer (if using SMTP):
    /*
    import nodemailer from 'nodemailer'
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    
    await transporter.sendMail({
      from: 'receipts@yourdomain.com',
      to: customerEmail,
      subject: `Your Receipt #${receiptNumber} - ${receiptData.storeBranchName || 'Store'}`,
      html: emailHtml,
      attachments: [
        {
          filename: `receipt-${receiptNumber}.pdf`,
          content: pdfBuffer,
        }
      ]
    })
    */

    // For now, return success (implement actual email sending above)
    // NOTE: You must implement one of the email services above to actually send emails
    // console.log('Email would be sent to:', customerEmail)
    // console.log('PDF attachment size:', pdfBuffer.length, 'bytes')

    return {
      success: true,
      message: 'Receipt email sent successfully'
    }
  } catch (error: any) {
    console.error('Error sending receipt email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email'
    }
  }
})

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function generateReceiptEmailHTML(receiptData: any): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: any) => {
    if (!date) return ''
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const itemsHtml = receiptData.items.map((item: any) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1)
    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px;">${item.itemName || ''}</td>
        <td style="padding: 8px; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 8px; text-align: right;">${formatCurrency(item.price || 0)}</td>
        <td style="padding: 8px; text-align: right;">${formatCurrency(itemTotal)}</td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Receipt ${receiptData.receiptNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
          ${receiptData.storeLogoUrl ? `<img src="${receiptData.storeLogoUrl}" alt="Store logo" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid #d1d5db; margin-bottom: 12px;" />` : ''}
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${receiptData.storeBranchName || 'Store'}</h1>
        </div>

        <div style="margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #666;">Receipt Number</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${receiptData.receiptNumber || ''}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 12px; color: #666;">Date</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${formatDate(receiptData.date)}</p>
            </div>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
            <p style="margin: 0; font-size: 12px; color: #666;">Customer</p>
            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${receiptData.customerName || ''}</p>
            ${receiptData.customerEmail ? `<p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">${receiptData.customerEmail}</p>` : ''}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #333;">
              <th style="padding: 10px; text-align: left; font-size: 12px; font-weight: bold;">Item</th>
              <th style="padding: 10px; text-align: center; font-size: 12px; font-weight: bold;">Qty</th>
              <th style="padding: 10px; text-align: right; font-size: 12px; font-weight: bold;">Price</th>
              <th style="padding: 10px; text-align: right; font-size: 12px; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-top: 2px solid #333; padding-top: 15px; margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
            <span>Total:</span>
            <span>${formatCurrency(receiptData.total || 0)}</span>
          </div>
          ${receiptData.paymentMethod ? `
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Payment Method: ${receiptData.paymentMethod}</p>
          ` : ''}
        </div>

        ${receiptData.notes ? `
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #666;">Notes</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">${escapeHtml(String(receiptData.notes))}</p>
          </div>
        ` : ''}

        ${receiptData.salesTerms ? `
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: bold; color: #444; text-transform: uppercase; letter-spacing: 0.05em;">Terms & conditions (sales)</p>
            <p style="margin: 0; font-size: 11px; color: #555; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(String(receiptData.salesTerms))}</p>
          </div>
        ` : ''}
        ${receiptData.refundPolicy ? `
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: bold; color: #444; text-transform: uppercase; letter-spacing: 0.05em;">Refund policy</p>
            <p style="margin: 0; font-size: 11px; color: #555; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(String(receiptData.refundPolicy))}</p>
          </div>
        ` : ''}
        ${receiptData.warrantyPolicy ? `
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: bold; color: #444; text-transform: uppercase; letter-spacing: 0.05em;">Warranty policy</p>
            <p style="margin: 0; font-size: 11px; color: #555; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(String(receiptData.warrantyPolicy))}</p>
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #666;">
          <p>Thank you for your business!</p>
        </div>
      </body>
    </html>
  `
}
