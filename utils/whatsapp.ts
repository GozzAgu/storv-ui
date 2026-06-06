/**
 * Normalize phone for wa.me (digits only, with country code when possible).
 * Defaults Nigeria (+234) when local numbers start with 0.
 */
export function normalizeWhatsAppPhone(raw: string, defaultCountryCode = '234'): string {
 let digits = raw.replace(/\D/g, '')
 if (!digits) return ''

 if (digits.startsWith('00')) {
 digits = digits.slice(2)
 }

 if (digits.startsWith('0') && defaultCountryCode) {
 digits = `${defaultCountryCode}${digits.slice(1)}`
 }

 return digits
}

export function isValidWhatsAppPhone(raw: string): boolean {
 const digits = normalizeWhatsAppPhone(raw)
 return digits.length >= 10 && digits.length <= 15
}

export function buildWhatsAppUrl(phone: string, message: string): string {
 const normalized = normalizeWhatsAppPhone(phone)
 const text = encodeURIComponent(message)
 return `https://wa.me/${normalized}?text=${text}`
}

export function openWhatsApp(phone: string, message: string): void {
 const url = buildWhatsAppUrl(phone, message)
  if (import.meta.client && typeof globalThis !== 'undefined') {
    const opener = (globalThis as { open?: (url?: string, target?: string, features?: string) => unknown }).open
    opener?.(url, '_blank', 'noopener,noreferrer')
 }
}

export function formatReceiptDateForWhatsApp(date: Date | string | { toDate?: () => Date }): string {
 let d: Date
 if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
 d = date.toDate()
 } else if (date instanceof Date) {
 d = date
 } else {
 d = new Date(date as string)
 }
 return d.toLocaleString(undefined, {
 year: 'numeric',
 month: 'short',
 day: 'numeric',
 hour: '2-digit',
 minute: '2-digit',
 })
}
