import { normalizeWhatsAppPhone } from '~/utils/whatsapp'
import { getWhatsAppCloudConfig, isWhatsAppCloudConfigured } from '~/server/utils/delivery-config'

export { isWhatsAppCloudConfigured }

export async function sendWhatsAppCloudMedia(params: {
  toPhone: string
  buffer: Buffer
  mimeType: string
  filename: string
  caption?: string
}): Promise<void> {
  const { accessToken, phoneNumberId, apiVersion } = getWhatsAppCloudConfig()
  if (!accessToken || !phoneNumberId) {
    throw new Error('WhatsApp Business API is not configured on the server.')
  }

  const to = normalizeWhatsAppPhone(params.toPhone)
  if (!to) throw new Error('Invalid WhatsApp phone number')

  const isPdf = params.mimeType === 'application/pdf' || params.filename.endsWith('.pdf')
  const isImage = params.mimeType.startsWith('image/')
  const waType = isPdf ? 'application/pdf' : isImage ? params.mimeType : 'application/octet-stream'

  const uploadForm = new FormData()
  uploadForm.append('messaging_product', 'whatsapp')
  uploadForm.append('type', waType)
  uploadForm.append(
    'file',
    new Blob([new Uint8Array(params.buffer)], { type: params.mimeType }),
    params.filename
  )

  const uploadRes = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: uploadForm,
    }
  )

  const uploadJson = (await uploadRes.json()) as { id?: string; error?: { message?: string } }
  if (!uploadRes.ok || !uploadJson.id) {
    throw new Error(uploadJson.error?.message || 'Failed to upload media to WhatsApp')
  }

  const messageBody = isPdf
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: {
          id: uploadJson.id,
          filename: params.filename,
          caption: params.caption?.slice(0, 1024) || undefined,
        },
      }
    : {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: {
          id: uploadJson.id,
          caption: params.caption?.slice(0, 1024) || undefined,
        },
      }

  const sendRes = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody),
    }
  )

  const sendJson = (await sendRes.json()) as { error?: { message?: string } }
  if (!sendRes.ok) {
    throw new Error(sendJson.error?.message || 'Failed to send WhatsApp message')
  }
}
