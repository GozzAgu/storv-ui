/** Days after signup before showing the in-app NPS prompt. */
export const NPS_PROMPT_AFTER_DAYS = 7

/** WhatsApp support line (wa.me link without +). Override via env in future. */
export const STORVV_SUPPORT_WHATSAPP = '2348000000000'

export const STORVV_SUPPORT_EMAIL = 'support@storvv.com'

export function supportWhatsAppUrl(message?: string) {
  const text = encodeURIComponent(message || 'Hi Storvv, I need help with my store.')
  return `https://wa.me/${STORVV_SUPPORT_WHATSAPP}?text=${text}`
}
