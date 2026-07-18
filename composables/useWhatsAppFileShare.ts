import { openWhatsApp, normalizeWhatsAppPhone } from '~/utils/whatsapp'
import { copyImageBlobToClipboard, downloadBlob } from '~/utils/file-share'

export type WhatsAppShareAttachmentFormat = 'pdf' | 'image'

export interface WhatsAppClientFallbackResult {
  success: boolean
  method: 'clipboard_whatsapp' | 'download_whatsapp'
}

function pasteHint(): string {
  if (!import.meta.client) return 'Paste the receipt in the chat and send.'
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  return isMac
    ? 'Paste the receipt in the chat (⌘V) and tap Send.'
    : 'Paste the receipt in the chat (Ctrl+V) and tap Send.'
}

/**
 * Opens the customer's WhatsApp chat (wa.me) and prepares the receipt file.
 * Does not use the system share sheet — WhatsApp is rarely listed there on desktop.
 */
export async function deliverReceiptViaClientWhatsApp(params: {
  file: File
  phone: string
  caption?: string
}): Promise<WhatsAppClientFallbackResult> {
  const phone = normalizeWhatsAppPhone(params.phone)
  if (!phone) return { success: false, method: 'download_whatsapp' }

  const baseCaption = params.caption?.trim() || 'Your receipt from us'
  const isImage = params.file.type.startsWith('image/')

  if (isImage) {
    const copied = await copyImageBlobToClipboard(params.file)
    if (copied) {
      openWhatsApp(phone, `${baseCaption}\n\n${pasteHint()}`)
      return { success: true, method: 'clipboard_whatsapp' }
    }
  }

  downloadBlob(params.file, params.file.name)
  openWhatsApp(
    phone,
    `${baseCaption}\n\nThe receipt file was saved to your device. In WhatsApp, tap 📎 and attach "${params.file.name}".`
  )
  return { success: true, method: 'download_whatsapp' }
}
