import { createError } from 'h3'

export const RECEIPT_ATTACHMENT_MAX_BYTES = 12 * 1024 * 1024

interface Kind {
  mime: string
  ext: string
  matches: (b: Buffer) => boolean
}

const KINDS: Kind[] = [
  {
    mime: 'application/pdf',
    ext: 'pdf',
    matches: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-',
  },
  {
    mime: 'image/png',
    ext: 'png',
    matches: (b) =>
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/jpeg',
    ext: 'jpg',
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    matches: (b) =>
      b.subarray(0, 4).toString('latin1') === 'RIFF' &&
      b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
]

export interface ReceiptAttachment {
  buffer: Buffer
  mimeType: string
  filename: string
}

const bad = (message: string) => createError({ statusCode: 400, message })

/**
 * A receipt attachment sent from Storvv's domain must really be a PDF or image: the type comes
 * from the file's first bytes (the browser's label is ignored), the size is capped and the
 * filename is set here.
 */
export function checkReceiptAttachment(
  base64: unknown,
  receiptNumber: string,
  allowed: readonly string[] = KINDS.map((k) => k.mime)
): ReceiptAttachment {
  if (typeof base64 !== 'string' || !base64) throw bad('Attachment is required')
  if (base64.length > Math.ceil((RECEIPT_ATTACHMENT_MAX_BYTES * 4) / 3) + 4) {
    throw bad('Attachment is too large (max 12MB)')
  }
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length === 0) throw bad('Attachment is empty')
  if (buffer.length > RECEIPT_ATTACHMENT_MAX_BYTES) throw bad('Attachment is too large (max 12MB)')
  const kind = KINDS.find((k) => k.matches(buffer))
  if (!kind || !allowed.includes(kind.mime)) {
    throw bad(
      allowed.length === 1
        ? 'The receipt must be a PDF'
        : 'Only PDF, PNG, JPEG or WebP receipts can be sent'
    )
  }
  const safeNumber = (receiptNumber || 'receipt').replace(/[^\w-]+/g, '_').slice(0, 40) || 'receipt'
  return { buffer, mimeType: kind.mime, filename: `receipt-${safeNumber}.${kind.ext}` }
}
