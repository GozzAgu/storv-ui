import { isValidWhatsAppPhone } from '~/utils/whatsapp'

export type ContactChannel = 'email' | 'phone'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidContactEmail(value: string): boolean {
 return EMAIL_RE.test(value.trim())
}

export function detectContactChannel(input: string): ContactChannel | null {
 const trimmed = input.trim()
 if (!trimmed) return null
 if (trimmed.includes('@')) {
 return isValidContactEmail(trimmed) ? 'email' : null
 }
 return isValidWhatsAppPhone(trimmed) ? 'phone' : null
}

export function isValidContact(input: string): boolean {
 return detectContactChannel(input) !== null
}
