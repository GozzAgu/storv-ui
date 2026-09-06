import type { StorefrontInquiryType } from '~/types/storefront'

const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/

export function normalizeInquiryPhone(raw: string): string {
  return String(raw || '').trim().replace(/\s+/g, ' ')
}

export function isValidInquiryPhone(raw: string): boolean {
  const phone = normalizeInquiryPhone(raw)
  if (!PHONE_RE.test(phone)) return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export function normalizeInquiryName(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80)
}

export function normalizeInquiryNote(raw: string | undefined): string | undefined {
  const note = String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 500)
  return note || undefined
}

export function parseInquiryType(raw: unknown): StorefrontInquiryType | null {
  if (raw === 'contact' || raw === 'reserve') return raw
  return null
}

export function validateInquiryPayload(input: {
  type?: unknown
  customerName?: unknown
  customerPhone?: unknown
  customerNote?: unknown
  listingId?: unknown
}): { ok: true; data: ValidatedInquiryPayload } | { ok: false; message: string } {
  const type = parseInquiryType(input.type)
  if (!type) return { ok: false, message: 'Choose contact or reserve.' }

  const customerName = normalizeInquiryName(String(input.customerName || ''))
  if (customerName.length < 2) return { ok: false, message: 'Enter your name.' }

  const customerPhone = normalizeInquiryPhone(String(input.customerPhone || ''))
  if (!isValidInquiryPhone(customerPhone)) {
    return { ok: false, message: 'Enter a valid phone number.' }
  }

  const listingId = String(input.listingId || '').trim()
  if (!listingId) return { ok: false, message: 'Missing product.' }

  return {
    ok: true,
    data: {
      type,
      customerName,
      customerPhone,
      customerNote: normalizeInquiryNote(
        input.customerNote != null ? String(input.customerNote) : undefined
      ),
      listingId,
    },
  }
}

export type ValidatedInquiryPayload = {
  type: StorefrontInquiryType
  customerName: string
  customerPhone: string
  customerNote?: string
  listingId: string
}
