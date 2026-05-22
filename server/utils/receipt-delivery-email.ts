import { generateReceiptEmailHTML } from '~/server/utils/receipt-email-html'
import { getResendConfig, isResendConfigured } from '~/server/utils/delivery-config'

export { isResendConfigured }

export async function sendReceiptEmail(params: {
  toEmail: string
  receiptNumber: string
  receiptData: Record<string, unknown>
  attachmentBuffer?: Buffer
  attachmentFilename?: string
  attachmentMimeType?: string
  caption?: string
  shareUrl?: string
}): Promise<void> {
  const { apiKey, from } = getResendConfig()
  if (!apiKey) {
    throw new Error(
      'Email delivery is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL to your server environment.'
    )
  }

  const storeName = String(params.receiptData.storeBranchName || params.receiptData.storeName || 'Store')
  const html = generateReceiptEmailHTML(params.receiptData)
  const subject = `Your receipt #${params.receiptNumber} — ${storeName}`

  const intro = params.caption?.trim() || 'Please find your receipt below.'
  const linkBlock = params.shareUrl
    ? `<p><a href="${params.shareUrl}">View your receipt online</a></p>`
    : ''

  const body: Record<string, unknown> = {
    from,
    to: [params.toEmail.trim().toLowerCase()],
    subject,
    html: `<p>${intro}</p>${linkBlock}${html}`,
  }

  if (params.attachmentBuffer && params.attachmentFilename) {
    body.attachments = [
      {
        filename: params.attachmentFilename,
        content: params.attachmentBuffer.toString('base64'),
      },
    ]
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { message?: string }
    throw new Error(err.message || `Email send failed (${response.status})`)
  }
}

export async function sendReceiptAttachmentEmail(params: {
  toEmail: string
  receiptNumber: string
  receiptData: Record<string, unknown>
  attachmentBuffer: Buffer
  attachmentFilename: string
  attachmentMimeType: string
  caption?: string
  shareUrl?: string
}): Promise<void> {
  await sendReceiptEmail({
    toEmail: params.toEmail,
    receiptNumber: params.receiptNumber,
    receiptData: params.receiptData,
    attachmentBuffer: params.attachmentBuffer,
    attachmentFilename: params.attachmentFilename,
    attachmentMimeType: params.attachmentMimeType,
    caption: params.caption,
    shareUrl: params.shareUrl,
  })
}
