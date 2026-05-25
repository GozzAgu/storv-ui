import { createError, defineEventHandler, readBody } from 'h3'
import { requireAuth } from '~/server/utils/store-auth'
import { isResendConfigured } from '~/server/utils/delivery-config'
import { sendReceiptEmail } from '~/server/utils/receipt-delivery-email'
import { assertWhatsAppSendAllowed, incrementWhatsAppUsage } from '~/server/utils/whatsapp-usage'

interface SendEmailBody {
 receiptId?: string
 receiptNumber?: string
 customerEmail?: string
 receiptData?: Record<string, unknown>
 pdfBase64?: string
}

export default defineEventHandler(async (event) => {
 const auth = await requireAuth(event)
 const body = await readBody<SendEmailBody>(event)

 const customerEmail = body.customerEmail?.trim()
 const receiptData = body.receiptData
 const receiptNumber = body.receiptNumber?.trim() || 'receipt'

 if (!customerEmail) {
 throw createError({ statusCode: 400, message: 'Customer email is required' })
 }
 if (!receiptData || typeof receiptData !== 'object') {
 throw createError({ statusCode: 400, message: 'Receipt data is required' })
 }
 if (!isResendConfigured()) {
 throw createError({
 statusCode: 503,
 message:
 'Email sending is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL to your server environment.',
 })
 }

 await assertWhatsAppSendAllowed(auth.uid)

 let attachmentBuffer: Buffer | undefined
 let attachmentFilename: string | undefined

 if (body.pdfBase64 && typeof body.pdfBase64 === 'string') {
 attachmentBuffer = Buffer.from(body.pdfBase64, 'base64')
 if (attachmentBuffer.length === 0) {
 throw createError({ statusCode: 400, message: 'PDF attachment is empty' })
 }
 attachmentFilename = `receipt-${receiptNumber}.pdf`.replace(/[^\w.-]+/g, '_')
 }

 await sendReceiptEmail({
 toEmail: customerEmail,
 receiptNumber,
 receiptData,
 attachmentBuffer,
 attachmentFilename,
 attachmentMimeType: 'application/pdf',
 caption: 'Please find your receipt attached.',
 })

 await incrementWhatsAppUsage(auth.uid)

 return {
 success: true,
 message: `Receipt sent to ${customerEmail}`,
 receiptId: body.receiptId,
 }
})
