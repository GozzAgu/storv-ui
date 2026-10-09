// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  body: {} as Record<string, unknown>,
  view: {} as Record<string, unknown>,
  sendReceiptEmail: vi.fn(),
  sendWhatsApp: vi.fn(),
  buildReceiptView: vi.fn(),
}))

vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return {
    ...actual,
    defineEventHandler: (fn: unknown) => fn,
    readBody: async () => m.body,
  }
})
vi.mock('~/server/utils/store-auth', () => ({ requireAuth: async () => ({ uid: 'cashier' }) }))
vi.mock('~/server/utils/rate-limit', () => ({ assertRateLimit: async () => undefined }))
vi.mock('~/server/utils/firebase-admin', () => ({ getAdminFirestore: () => ({}) }))
vi.mock('~/server/utils/delivery-config', () => ({ isResendConfigured: () => true }))
vi.mock('~/server/utils/receipt-access', () => ({
  assertReceiptDeliveryAccess: async () => ({
    ownerUserId: 'o1',
    storeId: 's1',
    receiptId: 'r1',
    receipt: { receiptNumber: 'R-1' },
  }),
}))
vi.mock('~/server/utils/receipt-view', () => ({ buildReceiptView: m.buildReceiptView }))
vi.mock('~/server/utils/receipt-delivery-email', () => ({ sendReceiptEmail: m.sendReceiptEmail }))
vi.mock('~/server/utils/whatsapp-cloud', () => ({
  isWhatsAppCloudConfigured: () => true,
  sendWhatsAppCloudMedia: m.sendWhatsApp,
}))
vi.mock('~/server/utils/whatsapp-usage', () => ({
  assertWhatsAppSendAllowed: async () => undefined,
  incrementWhatsAppUsage: async () => undefined,
}))

const { checkReceiptAttachment } = await import('~/server/utils/receipt-attachment')
const { generateReceiptEmailHTML } = await import('~/server/utils/receipt-email-html')
const { safeCaptionHtml } = await vi.importActual<
  typeof import('~/server/utils/receipt-delivery-email')
>('~/server/utils/receipt-delivery-email')

const PDF = Buffer.from('%PDF-1.4\n%fake\n').toString('base64')
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]).toString('base64')
const HTML = Buffer.from('<html><a href="https://evil.test">Pay here</a></html>').toString('base64')
const EXE = Buffer.from('MZ\x90\x00binary').toString('base64')

const LEGACY_VIEW = { receiptNumber: 'R-1', storeName: 'Shop', v2: false, payments: [] }
const V2_VIEW = {
  receiptNumber: 'R-1',
  storeName: 'Shop',
  v2: true,
  payments: [
    {
      methodLabel: 'Transfer',
      amountKobo: 5_000,
      status: 'awaiting_confirmation',
      refundedKobo: 0,
    },
  ],
  balanceDueKobo: 5_000,
}

async function callRoute(path: string, body: Record<string, unknown>) {
  m.body = body
  const handler = (await import(path)).default as (e: unknown) => Promise<unknown>
  return handler({}).then(
    (value) => ({ value, error: null as null | { statusCode?: number; message?: string } }),
    (error) => ({ value: null, error })
  )
}

describe('receipt attachments', () => {
  it('accepts real PDFs and images and names the file on the server', () => {
    expect(checkReceiptAttachment(PDF, 'R/1 <x>')).toMatchObject({
      mimeType: 'application/pdf',
      filename: 'receipt-R_1_x_.pdf',
    })
    expect(checkReceiptAttachment(PNG, 'R-1')).toMatchObject({
      mimeType: 'image/png',
      filename: 'receipt-R-1.png',
    })
  })

  it.each([
    ['HTML', HTML],
    ['an executable', EXE],
    ['empty', ''],
  ])('refuses %s', (_label, data) => {
    expect(() => checkReceiptAttachment(data, 'R-1')).toThrow()
  })

  it('can be limited to PDF only', () => {
    expect(() => checkReceiptAttachment(PNG, 'R-1', ['application/pdf'])).toThrow(/must be a PDF/)
  })

  it('refuses attachments over 12MB before decoding them', () => {
    const big = 'A'.repeat(17 * 1024 * 1024)
    expect(() => checkReceiptAttachment(big, 'R-1')).toThrow(/too large/)
  })
})

describe('receipt email content', () => {
  it('escapes the sender caption', () => {
    expect(safeCaptionHtml('<a href="https://evil.test">Pay</a> it\'s', 'x')).toBe(
      '&lt;a href=&quot;https://evil.test&quot;&gt;Pay&lt;/a&gt; it&#39;s'
    )
    expect(safeCaptionHtml('   ', 'Fallback')).toBe('Fallback')
    expect(safeCaptionHtml('a'.repeat(900), 'x')).toHaveLength(500)
  })

  it('shows server payment lines and balance for a V2 sale, escaped', () => {
    const html = generateReceiptEmailHTML({
      ...V2_VIEW,
      payments: [
        { methodLabel: '<b>Card</b>', amountKobo: 5_000, status: 'confirmed', refundedKobo: 0 },
        {
          methodLabel: 'Transfer',
          amountKobo: 5_000,
          status: 'awaiting_confirmation',
          refundedKobo: 0,
        },
      ],
    })
    expect(html).toContain('&lt;b&gt;Card&lt;/b&gt;')
    expect(html).toContain('Awaiting confirmation')
    expect(html).toContain('Balance due')
    expect(html).toContain('Here is your receipt.')
  })

  it('shows no payments section for a pre-V2 sale', () => {
    const html = generateReceiptEmailHTML(
      { ...LEGACY_VIEW, payments: [{ methodLabel: 'X' }] },
      { attached: true }
    )
    expect(html).not.toContain('Payments</h2>')
    expect(html).toContain('Please find your receipt attached.')
  })
})

describe('/api/receipts/send-email', () => {
  beforeEach(() => vi.clearAllMocks())

  it('ignores the browser receipt data and sends the server-built receipt with the PDF', async () => {
    m.buildReceiptView.mockResolvedValue(LEGACY_VIEW)
    const { error } = await callRoute('~/server/api/receipts/send-email.post', {
      ownerUserId: 'o1',
      storeId: 's1',
      receiptId: 'r1',
      customerEmail: 'buyer@example.com',
      receiptData: { total: 1, businessName: 'Bank of Phish', status: 'completed' },
      pdfBase64: PDF,
    })
    expect(error).toBeNull()
    const sent = m.sendReceiptEmail.mock.calls[0]![0]
    expect(sent.view).toBe(LEGACY_VIEW)
    expect(sent.attachmentFilename).toBe('receipt-R-1.pdf')
    expect(JSON.stringify(sent)).not.toContain('Bank of Phish')
  })

  it('does not attach the browser PDF to a V2 sale', async () => {
    m.buildReceiptView.mockResolvedValue(V2_VIEW)
    await callRoute('~/server/api/receipts/send-email.post', {
      ownerUserId: 'o1',
      storeId: 's1',
      receiptId: 'r1',
      customerEmail: 'buyer@example.com',
      pdfBase64: PDF,
    })
    const sent = m.sendReceiptEmail.mock.calls[0]![0]
    expect(sent.view).toBe(V2_VIEW)
    expect(sent.attachmentBuffer).toBeUndefined()
  })

  it('refuses a non-PDF attachment', async () => {
    m.buildReceiptView.mockResolvedValue(LEGACY_VIEW)
    const { error } = await callRoute('~/server/api/receipts/send-email.post', {
      ownerUserId: 'o1',
      storeId: 's1',
      receiptId: 'r1',
      customerEmail: 'buyer@example.com',
      pdfBase64: HTML,
    })
    expect(error?.statusCode).toBe(400)
    expect(m.sendReceiptEmail).not.toHaveBeenCalled()
  })
})

describe('/api/receipts/deliver', () => {
  beforeEach(() => vi.clearAllMocks())
  const base = { ownerUserId: 'o1', storeId: 's1', receiptId: 'r1' }

  it('refuses an HTML attachment even when labelled as an image', async () => {
    m.buildReceiptView.mockResolvedValue(LEGACY_VIEW)
    const { error } = await callRoute('~/server/api/receipts/deliver.post', {
      ...base,
      contact: '+2348012345678',
      attachmentBase64: HTML,
      attachmentMimeType: 'image/png',
      attachmentFilename: 'receipt.png',
    })
    expect(error?.statusCode).toBe(400)
    expect(m.sendWhatsApp).not.toHaveBeenCalled()
  })

  it('adds the server payment status to a V2 WhatsApp caption and sets type and name itself', async () => {
    m.buildReceiptView.mockResolvedValue(V2_VIEW)
    await callRoute('~/server/api/receipts/deliver.post', {
      ...base,
      contact: '+2348012345678',
      attachmentBase64: PNG,
      attachmentMimeType: 'application/x-msdownload',
      attachmentFilename: 'invoice.exe',
      caption: 'Thanks!',
    })
    expect(m.sendWhatsApp).toHaveBeenCalledWith(
      expect.objectContaining({
        mimeType: 'image/png',
        filename: 'receipt-R-1.png',
        caption: 'Thanks!\nBalance due: ₦50.00',
      })
    )
  })

  it('emails a V2 sale without the browser file', async () => {
    m.buildReceiptView.mockResolvedValue(V2_VIEW)
    await callRoute('~/server/api/receipts/deliver.post', {
      ...base,
      contact: 'buyer@example.com',
      attachmentBase64: PDF,
      caption: '<script>x</script>',
    })
    const sent = m.sendReceiptEmail.mock.calls[0]![0]
    expect(sent.attachmentBuffer).toBeUndefined()
    expect(sent.view).toBe(V2_VIEW)
  })
})
