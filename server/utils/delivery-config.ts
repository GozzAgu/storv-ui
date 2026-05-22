import { useRuntimeConfig } from '#imports'

export function getResendConfig() {
  const config = useRuntimeConfig()
  return {
    apiKey: String(config.resendApiKey || process.env.RESEND_API_KEY || '').trim(),
    from: String(config.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'receipts@storvv.com').trim(),
  }
}

export function isResendConfigured(): boolean {
  return !!getResendConfig().apiKey
}

export function getWhatsAppCloudConfig() {
  const config = useRuntimeConfig()
  return {
    accessToken: String(
      config.whatsappCloudAccessToken || process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || ''
    ).trim(),
    phoneNumberId: String(
      config.whatsappCloudPhoneNumberId || process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || ''
    ).trim(),
    apiVersion: String(
      config.whatsappCloudApiVersion || process.env.WHATSAPP_CLOUD_API_VERSION || 'v21.0'
    ).trim(),
  }
}

export function isWhatsAppCloudConfigured(): boolean {
  const { accessToken, phoneNumberId } = getWhatsAppCloudConfig()
  return !!(accessToken && phoneNumberId)
}
