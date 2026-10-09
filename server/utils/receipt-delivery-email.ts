import { escapeHtml, generateReceiptEmailHTML } from '~/server/utils/receipt-email-html'
import { getResendConfig, isResendConfigured } from '~/server/utils/delivery-config'
import type { ReceiptView } from '~/server/utils/receipt-view'

export { isResendConfigured }

const MAX_CAPTION = 500

/** Plain text only: the caption is typed by the sender and lands in an email from Storvv's domain. */
export function safeCaptionHtml(caption: string | undefined, fallback: string): string {
  const text = (caption ?? '').trim().slice(0, MAX_CAPTION) || fallback
  return escapeHtml(text).replace(/'/g, '&#39;')
}

function safeShareLink(url: string | undefined): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return ''
    return `<p><a href="${escapeHtml(parsed.toString())}">View your receipt online</a></p>`
  } catch {
    return ''
  }
}

export async function sendReceiptEmail(params: {
  toEmail: string
  /** Built on the server from stored data (buildReceiptView); never the browser's copy. */
  view: ReceiptView
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

  const attached = Boolean(params.attachmentBuffer && params.attachmentFilename)
  const view = params.view
  const html = generateReceiptEmailHTML(view as unknown as Record<string, unknown>, { attached })
  const subject = `Your receipt #${view.receiptNumber || 'receipt'} from ${view.storeName}`.replace(
    /[\r\n]+/g,
    ' '
  )

  const intro = safeCaptionHtml(
    params.caption,
    attached ? 'Please find your receipt attached.' : 'Here is your receipt.'
  )

  const body: Record<string, unknown> = {
    from,
    to: [params.toEmail.trim().toLowerCase()],
    subject,
    html: `<p>${intro}</p>${safeShareLink(params.shareUrl)}${html}`,
  }

  if (attached) {
    body.attachments = [
      {
        filename: params.attachmentFilename,
        content: params.attachmentBuffer!.toString('base64'),
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
