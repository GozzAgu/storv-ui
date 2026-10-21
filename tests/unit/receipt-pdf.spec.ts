// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { jsPDF } from 'jspdf'
import {
  amountInWords,
  numberToWords,
  renderReceiptPdf,
  type ReceiptPdfData,
} from '~/utils/receipt-pdf'
import { getInventoryItemDetailLines } from '~/composables/useReceiptProductDetails'
import type { InventoryItem } from '~/stores/inventory'

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
})

const data: ReceiptPdfData = {
  store: { name: 'Polanco Motors', branch: 'Lagos, HQ, Lekki', phone: '08000000000' },
  receiptNumber: 'REC-V5NWM8JP',
  date: new Date('2026-10-21T22:27:00'),
  status: 'completed',
  customer: { name: 'Kunle', email: 'kunle@me.com' },
  items: [
    {
      name: 'Civic Honda',
      details: ['SN: 1'],
      quantity: 1,
      unitPrice: 9_000_000,
      amount: 9_000_000,
    },
  ],
  totals: {
    subtotal: 9_000_000,
    tradeInCredit: 2_000_000,
    total: 7_000_000,
    totalLabel: 'Amount due',
  },
  payment: { method: 'Cash' },
  tradeIn: { name: 'BMX', category: 'Bicycles', details: ['SN: 224'] },
  currency: 'NGN',
  money: (n) => naira.format(n),
}

describe('amount in words', () => {
  it('reads out naira and kobo the way a receipt does', () => {
    expect(amountInWords(7_000_000, 'NGN')).toBe('Seven million naira only')
    expect(amountInWords(12_582_500.5, 'NGN')).toBe(
      'Twelve million five hundred and eighty-two thousand five hundred naira, fifty kobo only'
    )
    expect(amountInWords(1_000_015, 'NGN')).toBe('One million and fifteen naira only')
  })

  it('handles the edges', () => {
    expect(numberToWords(0)).toBe('zero')
    expect(numberToWords(110)).toBe('one hundred and ten')
    expect(amountInWords(5, 'XYZ')).toBeNull()
    expect(amountInWords(-1, 'NGN')).toBeNull()
  })
})

describe('receipt PDF', () => {
  it('prints every amount in full, never shortened to millions', () => {
    // Without the embedded typeface the text stays searchable, with ₦ spelled as NGN.
    const out = renderReceiptPdf(new jsPDF('p', 'mm', 'a4'), data, null).output()
    for (const amount of ['NGN 9,000,000.00', 'NGN 2,000,000.00', 'NGN 7,000,000.00']) {
      expect(out).toContain(amount)
    }
    expect(out).not.toMatch(/NGN \d+m\b/)
    expect(out).toContain('Seven million naira only')
    expect(out).toContain('PAID')
    expect(out).toContain('Page 1 of 1')
  })

  it('runs onto a second page with the table header repeated', () => {
    const many = {
      ...data,
      items: Array.from({ length: 30 }, (_, i) => ({
        name: `Phone ${i}`,
        details: ['IMEI: 3569381104500' + i],
        quantity: 1,
        unitPrice: 100_000,
        amount: 100_000,
      })),
    }
    const pdf = renderReceiptPdf(new jsPDF('p', 'mm', 'a4'), many, null)
    const pages = pdf.getNumberOfPages()
    expect(pages).toBeGreaterThan(1)
    // Every page that carries items starts with the column headings
    expect(pdf.output().match(/UNIT PRICE/g)!.length).toBeGreaterThanOrEqual(2)
    expect(pdf.output()).toContain(`Page ${pages} of ${pages}`)
  })
})

describe('trade-in details on the customer’s copy', () => {
  it('leave out the resale price, cost and buyback flags', () => {
    const item = {
      id: 'x',
      name: 'BMX',
      serialNo: '224',
      brand: 'BMX',
      price: 900_000,
      unitCost: 2_000_000,
      buyback: false,
      swapIn: true,
      engineNumber: '242',
    } as unknown as InventoryItem
    const lines = getInventoryItemDetailLines(item, { omitLineItemFields: true })
    expect(lines).toEqual(expect.arrayContaining(['SN: 224', 'Brand: BMX', 'Engine Number: 242']))
    expect(lines.join(' ')).not.toMatch(/Price|Unit Cost|Buyback|Swap/)
  })
})
