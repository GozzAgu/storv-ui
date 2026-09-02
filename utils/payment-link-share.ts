import { buildWhatsAppUrl, normalizeWhatsAppPhone } from '~/utils/whatsapp'
import { formatNaira } from '~/utils/naira'

export interface PaymentLinkShareInput {
  url: string
  invoiceNumber: string
  customerName?: string
  customerPhone?: string
  total: number
}

export type PaymentLinkShareResult = 'system' | 'whatsapp' | 'clipboard' | 'cancelled'

export function buildPaymentLinkShareMessage(link: PaymentLinkShareInput): string {
  const greeting = link.customerName?.trim() ? `Hi ${link.customerName.trim()},\n\n` : ''
  return `${greeting}Here is your invoice ${link.invoiceNumber} for ${formatNaira(
    link.total
  )}.\n\nPay securely here:\n${link.url}`
}

function canUseWebShare(): boolean {
  return import.meta.client && typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (!import.meta.client) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Share a payment link using the OS share sheet when available (iOS/Android),
 * otherwise WhatsApp to the customer phone, then clipboard.
 */
export async function sharePaymentLink(link: PaymentLinkShareInput): Promise<PaymentLinkShareResult> {
  const message = buildPaymentLinkShareMessage(link)
  const title = `Invoice ${link.invoiceNumber}`

  if (canUseWebShare()) {
    try {
      await navigator.share({
        title,
        text: message,
        url: link.url,
      })
      return 'system'
    } catch (error: unknown) {
      if ((error as { name?: string })?.name === 'AbortError') {
        return 'cancelled'
      }
    }
  }

  const phone = normalizeWhatsAppPhone(link.customerPhone || '')
  if (phone && import.meta.client) {
    const url = buildWhatsAppUrl(link.customerPhone || phone, message)
    window.open(url, '_blank', 'noopener,noreferrer')
    return 'whatsapp'
  }

  if (await copyToClipboard(`${message}`)) {
    return 'clipboard'
  }

  return 'cancelled'
}

export function openWhatsAppPaymentLink(link: PaymentLinkShareInput): void {
  if (!import.meta.client) return
  const message = buildPaymentLinkShareMessage(link)
  const phone = link.customerPhone || ''
  const url = phone
    ? buildWhatsAppUrl(phone, message)
    : `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
