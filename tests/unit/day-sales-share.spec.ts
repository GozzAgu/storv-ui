import { describe, expect, it } from 'vitest'
import { buildDaySalesShareText } from '~/utils/day-sales-share'
import type { DaySalesSummary } from '~/utils/day-sales-summary'

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`

function summary(overrides: Partial<DaySalesSummary> = {}): DaySalesSummary {
  return {
    mode: 'everyone',
    count: 3,
    sold: 630000,
    collected: 560000,
    owed: 70000,
    refunds: { count: 0, amount: 0 },
    tenders: [
      { method: 'Bank Transfer', amount: 485000 },
      { method: 'Cash', amount: 75000 },
    ],
    products: [
      { key: 'a', name: 'iPhone 13', quantity: 2, amount: 605000, serials: ['IMEI-1'] },
      { key: 'b', name: 'USB-C charger', quantity: 2, amount: 17000, serials: [] },
    ],
    reductions: 0,
    sellers: [{ uid: 'amaka', name: 'Amaka', count: 2, amount: 605000 }],
    comparison: { previousSold: 0, change: 0, changePct: null, sameTimeCutoff: null },
    ...overrides,
  }
}

const input = { storeName: 'Ikeja', day: new Date('2026-10-17T12:00:00'), formatCurrency: naira }

describe('buildDaySalesShareText', () => {
  it('writes a WhatsApp summary that names the date', () => {
    const text = buildDaySalesShareText(summary(), input)
    const lines = text.split('\n')
    expect(lines[0]).toMatch(/^\*Ikeja · .*17.*2026\*$/)
    expect(text).toContain('Sold ₦630,000 from 3 sales')
    expect(text).toContain('Collected ₦560,000 · Still owed ₦70,000')
    expect(text).toContain('*Paid by*\nBank Transfer ₦485,000\nCash ₦75,000')
    expect(text).toContain('*Top sellers*\niPhone 13 ×2 · ₦605,000')
    expect(text).toContain('*Who sold*\nAmaka · 2 sales · ₦605,000')
    expect(lines.at(-1)).toBe('Sent from Storvv')
  })

  it('never leaks IMEIs into the shared text', () => {
    expect(buildDaySalesShareText(summary(), input)).not.toContain('IMEI')
  })

  it('marks a personal summary and leaves out other people', () => {
    const text = buildDaySalesShareText(summary({ mode: 'mine', sellers: [] }), input)
    expect(text.split('\n')[0]).toMatch(/^\*My sales · Ikeja/)
    expect(text).not.toContain('Who sold')
  })

  it('mentions refunds only when there were some', () => {
    expect(buildDaySalesShareText(summary(), input)).not.toContain('Refunds')
    const text = buildDaySalesShareText(summary({ refunds: { count: 1, amount: 30000 } }), input)
    expect(text).toContain('Refunds: 1 (₦30,000)')
  })

  it('keeps the product list short', () => {
    const products = Array.from({ length: 8 }, (_, i) => ({
      key: `p${i}`,
      name: `Product ${i}`,
      quantity: 1,
      amount: 1000 - i,
      serials: [],
    }))
    const text = buildDaySalesShareText(summary({ products }), input)
    expect(text).toContain('Product 4')
    expect(text).not.toContain('Product 5 ')
    expect(text).toContain('+3 more products')
  })

  it('reads well for a single sale', () => {
    const text = buildDaySalesShareText(summary({ count: 1 }), input)
    expect(text).toContain('from 1 sale\n')
  })
})
