import { createError, defineEventHandler, readBody } from 'h3'
import { requireAuth } from '~/server/utils/store-auth'
import { detectContactChannel, isValidContactEmail } from '~/utils/contact-detect'
import { normalizeWhatsAppPhone } from '~/utils/whatsapp'
import { sendReceiptEmail } from '~/server/utils/receipt-delivery-email'
import { isResendConfigured } from '~/server/utils/delivery-config'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { isWhatsAppCloudConfigured, sendWhatsAppCloudMedia } from '~/server/utils/whatsapp-cloud'
import { assertWhatsAppSendAllowed, incrementWhatsAppUsage } from '~/server/utils/whatsapp-usage'
import { assertReceiptDeliveryAccess } from '~/server/utils/receipt-access'
import { checkReceiptAttachment } from '~/server/utils/receipt-attachment'
import { buildReceiptView, type ReceiptView } from '~/server/utils/receipt-view'
import { formatNaira } from '~/server/utils/payments/records'
import { assertRateLimit } from '~/server/utils/rate-limit'

interface DeliverBody {
  ownerUserId?: string
  storeId?: string
  receiptId?: string
  contact?: string
  attachmentBase64?: string
  attachmentMimeType?: string
  attachmentFilename?: string
  caption?: string
  receiptNumber?: string
  /** Ignored: content is built from the stored receipt. Kept for older clients. */
  receiptData?: Record<string, unknown>
}

const MAX_CAPTION = 500

/** Server-written status for a Payments V2 sale, so a sent file cannot be the only word on it. */
function v2StatusLine(view: ReceiptView): string {
  if (!view.v2 || view.balanceDueKobo === null) return ''
  const awaiting = view.payments.some((p) => p.status === 'awaiting_confirmation')
  if (view.balanceDueKobo > 0) return `Balance due: ${formatNaira(view.balanceDueKobo)}`
  return awaiting ? 'Paid (some payments awaiting confirmation)' : 'Paid in full'
}

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  await assertRateLimit(event, {
    id: 'receipts:deliver',
    limit: 20,
    windowMs: 60_000,
    uid: auth.uid,
  })

  const body = await readBody<DeliverBody>(event)

  const contact = body.contact?.trim()
  if (!contact) {
    throw createError({ statusCode: 400, message: 'contact (phone or email) is required' })
  }
  if (!body.attachmentBase64 || typeof body.attachmentBase64 !== 'string') {
    throw createError({ statusCode: 400, message: 'attachmentBase64 is required' })
  }

  const access = await assertReceiptDeliveryAccess({
    authUid: auth.uid,
    ownerUserId: body.ownerUserId || '',
    storeId: body.storeId || '',
    receiptId: body.receiptId || '',
    receiptNumber: body.receiptNumber,
  })

  const channel = detectContactChannel(contact)
  if (!channel) {
    throw createError({ statusCode: 400, message: 'Enter a valid email address or phone number' })
  }

  const view = await buildReceiptView(
    getAdminFirestore(),
    access.ownerUserId,
    access.storeId,
    access.receiptId,
    access.receipt
  )
  const attachment = checkReceiptAttachment(body.attachmentBase64, view.receiptNumber)
  const statusLine = v2StatusLine(view)
  const userCaption = (body.caption ?? '').trim().slice(0, MAX_CAPTION)
  const caption = [userCaption, statusLine].filter(Boolean).join('\n') || undefined

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
    // A V2 sale's email carries the server-built payments section instead of the browser's file.
    const sendFile = !view.v2
    await sendReceiptEmail({
      toEmail: contact,
      view,
      attachmentBuffer: sendFile ? attachment.buffer : undefined,
      attachmentFilename: sendFile ? attachment.filename : undefined,
      attachmentMimeType: sendFile ? attachment.mimeType : undefined,
      caption: userCaption || undefined,
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
      buffer: attachment.buffer,
      mimeType: attachment.mimeType,
      filename: attachment.filename,
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
