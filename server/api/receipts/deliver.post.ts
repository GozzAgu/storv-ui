import { createError, defineEventHandler, readBody } from 'h3'
import { requireAuth } from '~/server/utils/store-auth'
import { detectContactChannel, isValidContactEmail } from '~/utils/contact-detect'
import { normalizeWhatsAppPhone } from '~/utils/whatsapp'
import { sendReceiptAttachmentEmail } from '~/server/utils/receipt-delivery-email'
import { isResendConfigured } from '~/server/utils/delivery-config'
import { isWhatsAppCloudConfigured, sendWhatsAppCloudMedia } from '~/server/utils/whatsapp-cloud'
import { assertWhatsAppSendAllowed, incrementWhatsAppUsage } from '~/server/utils/whatsapp-usage'

interface DeliverBody {
  contact?: string
  attachmentBase64?: string
  attachmentMimeType?: string
  attachmentFilename?: string
  caption?: string
  receiptNumber?: string
  receiptData?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody<DeliverBody>(event)

  const contact = body.contact?.trim()
  const attachmentBase64 = body.attachmentBase64
  const attachmentMimeType = body.attachmentMimeType?.trim()
  const attachmentFilename = body.attachmentFilename?.trim()
  const receiptNumber = body.receiptNumber?.trim() || 'receipt'

  if (!contact) {
    throw createError({ statusCode: 400, message: 'contact (phone or email) is required' })
  }
  if (!attachmentBase64 || typeof attachmentBase64 !== 'string') {
    throw createError({ statusCode: 400, message: 'attachmentBase64 is required' })
  }
  if (!attachmentMimeType || !attachmentFilename) {
    throw createError({ statusCode: 400, message: 'attachmentMimeType and attachmentFilename are required' })
  }

  const channel = detectContactChannel(contact)
  if (!channel) {
    throw createError({ statusCode: 400, message: 'Enter a valid email address or phone number' })
  }

  const buffer = Buffer.from(attachmentBase64, 'base64')
  if (buffer.length === 0) {
    throw createError({ statusCode: 400, message: 'Attachment is empty' })
  }
  if (buffer.length > 12 * 1024 * 1024) {
    throw createError({ statusCode: 400, message: 'Attachment is too large (max 12MB)' })
  }

  const caption = body.caption?.trim()
  const receiptData = body.receiptData || {}

  await assertWhatsAppSendAllowed(auth.uid)

  if (channel === 'email') {
    if (!isValidContactEmail(contact)) {
      throw createError({ statusCode: 400, message: 'Invalid email address' })
    }
    if (!isResendConfigured()) {
      throw createError({
        statusCode: 503,
        message:
          'Email sending is not configured on the server. Add RESEND_API_KEY and RESEND_FROM_EMAIL, or send to a WhatsApp number instead.',
      })
    }
    await sendReceiptAttachmentEmail({
      toEmail: contact,
      receiptNumber,
      receiptData,
      attachmentBuffer: buffer,
      attachmentFilename,
      attachmentMimeType,
      caption,
    })
    await incrementWhatsAppUsage(auth.uid)
    return {
      success: true,
      channel: 'email',
      method: 'resend',
      message: `Receipt sent to ${contact}`,
    }
  }

  const normalizedPhone = normalizeWhatsAppPhone(contact)
  if (!normalizedPhone) {
    throw createError({ statusCode: 400, message: 'Invalid phone number' })
  }

  if (isWhatsAppCloudConfigured()) {
    await sendWhatsAppCloudMedia({
      toPhone: contact,
      buffer,
      mimeType: attachmentMimeType,
      filename: attachmentFilename,
      caption,
    })
    await incrementWhatsAppUsage(auth.uid)
    return {
      success: true,
      channel: 'whatsapp',
      method: 'whatsapp_cloud',
      message: `Receipt sent to WhatsApp ${normalizedPhone}`,
    }
  }

  return {
    success: false,
    fallback: 'whatsapp_client',
    channel: 'whatsapp',
    normalizedPhone,
    message:
      'WhatsApp Business API is not configured. WhatsApp will open for this number. Paste or attach the receipt there.',
  }
})
