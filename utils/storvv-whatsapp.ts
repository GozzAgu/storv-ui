import { STORVV_CONTACT } from './marketing-seo'

/**
 * A wa.me chat link to Storvv's own WhatsApp, optionally with a message already typed, so every
 * "Chat on WhatsApp" on the site goes to the same number.
 */
export function storvvWhatsappLink(message?: string): string {
  const digits = STORVV_CONTACT.phone.replace(/\D/g, '')
  return message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`
}
