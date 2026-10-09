import { createError, defineEventHandler, readBody } from 'h3'
import { requireAuth } from '~/server/utils/store-auth'
import { isResendConfigured } from '~/server/utils/delivery-config'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { sendReceiptEmail } from '~/server/utils/receipt-delivery-email'
import { assertReceiptDeliveryAccess } from '~/server/utils/receipt-access'
import { checkReceiptAttachment } from '~/server/utils/receipt-attachment'
import { buildReceiptView } from '~/server/utils/receipt-view'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { isValidContactEmail } from '~/utils/contact-detect'

interface SendEmailBody {
  ownerUserId?: string
  storeId?: string
  receiptId?: string
  receiptNumber?: string
  customerEmail?: string
  /** Ignored: the email is built from the stored receipt. Kept for older clients. */
  receiptData?: Record<string, unknown>
  pdfBase64?: string
}

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  await assertRateLimit(event, {
    id: 'receipts:send-email',
    limit: 20,
    windowMs: 60_000,
    uid: auth.uid,
  })

  const body = await readBody<SendEmailBody>(event)

  const customerEmail = body.customerEmail?.trim()

  if (!customerEmail || !isValidContactEmail(customerEmail)) {
    throw createError({ statusCode: 400, message: 'A valid customer email is required' })
  }
  if (!isResendConfigured()) {
    throw createError({
      statusCode: 503,
      message:
        'Email sending is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL to your server environment.',
    })
  }

  const access = await assertReceiptDeliveryAccess({
    authUid: auth.uid,
    ownerUserId: body.ownerUserId || '',
    storeId: body.storeId || '',
    receiptId: body.receiptId || '',
    receiptNumber: body.receiptNumber,
  })
  const view = await buildReceiptView(
    getAdminFirestore(),
    access.ownerUserId,
    access.storeId,
    access.receiptId,
    access.receipt
  )

  // A Payments V2 sale's money lines must come from the server, so the browser's PDF is not sent.
  const attachment =
    !view.v2 && body.pdfBase64
      ? checkReceiptAttachment(body.pdfBase64, view.receiptNumber, ['application/pdf'])
      : null

  await sendReceiptEmail({
    toEmail: customerEmail,
    view,
    attachmentBuffer: attachment?.buffer,
    attachmentFilename: attachment?.filename,
    attachmentMimeType: attachment?.mimeType,
    caption: attachment ? 'Please find your receipt attached.' : 'Here is your receipt.',
  })

  return {
    success: true,
    message: `Receipt sent to ${customerEmail}`,
    receiptId: access.receiptId,
  }
})
