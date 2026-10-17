import { describe, expect, it } from 'vitest'
import type { Receipt } from '~/stores/receipts'
import { summarizeDaySales, type DaySalesOptions } from '~/utils/day-sales-summary'

let seq = 0
function sale(overrides: Partial<Receipt>): Receipt {
  seq += 1
  return {
    id: `r${seq}`,
    receiptNumber: `R-${seq}`,
    customerName: 'Walk-in',
    customerEmail: '',
    date: new Date('2026-10-17T10:00:00'),
    items: [],
    itemsCount: 0,
    total: 0,
    paymentMethod: 'Cash',
    status: 'completed',
    folderId: 'phones',
    itemIds: [],
    storeId: 's1',
    createdAt: new Date('2026-10-17T10:00:00'),
    createdBy: 'owner',
    ...overrides,
  }
}

const owner: DaySalesOptions = {
  day: new Date('2026-10-17T15:00:00'),
  now: new Date('2026-10-17T13:00:00'),
  viewerUid: 'owner',
  mode: 'everyone',
  canViewStoreTotals: true,
}

const receipts: Receipt[] = [
  sale({
    total: 485000,
    paymentMethod: 'Bank Transfer',
    actualCreator: 'amaka',
    createdByUserName: 'Amaka',
    items: [
      { itemId: 'i1', itemName: 'iPhone 13', quantity: 1, price: 485000, serialNo: 'IMEI-1' },
    ],
  }),
  sale({
    date: new Date('2026-10-17T11:30:00'),
    total: 25000,
    splitPayments: [
      { method: 'Cash', amount: 10000 },
      { method: 'card (pos)', amount: 15000 },
    ],
    actualCreator: 'tunde',
    createdByUserName: 'Tunde',
    items: [
      { itemId: 'i2', itemName: 'USB-C charger', quantity: 2, price: 8500, folderId: 'acc' },
      { itemId: 'i3', itemName: 'iPhone 13 case', quantity: 1, price: 8000, folderId: 'acc' },
    ],
  }),
  sale({
    date: new Date('2026-10-17T12:15:00'),
    total: 120000,
    status: 'balance_due',
    amountPaid: 50000,
    balanceDue: 70000,
    payments: [{ amount: 50000, method: 'Cash', paidAt: new Date('2026-10-17T12:15:00') }],
    actualCreator: 'amaka',
    createdByUserName: 'Amaka',
    items: [
      { itemId: 'i4', itemName: 'iPhone 13', quantity: 1, price: 120000, serialNo: 'IMEI-2' },
    ],
  }),
  sale({ total: 30000, status: 'refunded', actualCreator: 'tunde' }),
  sale({ total: 99000, status: 'cancelled' }),
  sale({ total: 77000, status: 'pending' }),
  // Yesterday: one sale before 1pm, one after.
  sale({ date: new Date('2026-10-16T09:00:00'), total: 200000 }),
  sale({ date: new Date('2026-10-16T18:00:00'), total: 900000 }),
  // Tomorrow, never counted.
  sale({ date: new Date('2026-10-18T09:00:00'), total: 1 }),
]

describe('summarizeDaySales', () => {
  const summary = summarizeDaySales(receipts, owner)

  it('counts completed and part-paid sales, and nothing else', () => {
    expect(summary.count).toBe(3)
    expect(summary.sold).toBe(630000)
  })

  it('tallies: sold is collected plus still owed', () => {
    expect(summary.collected).toBe(560000)
    expect(summary.owed).toBe(70000)
    expect(summary.collected + summary.owed).toBe(summary.sold)
  })

  it('splits collected money by payment method, merging the same method', () => {
    expect(summary.tenders).toEqual([
      { method: 'Bank Transfer', amount: 485000 },
      { method: 'Cash', amount: 60000 },
      { method: 'card (pos)', amount: 15000 },
    ])
    expect(summary.tenders.reduce((s, t) => s + t.amount, 0)).toBe(summary.collected)
  })

  it('groups products, keeps IMEIs, and lists the biggest sellers first', () => {
    expect(summary.products.map((p) => [p.name, p.quantity, p.amount])).toEqual([
      ['iPhone 13', 2, 605000],
      ['USB-C charger', 2, 17000],
      ['iPhone 13 case', 1, 8000],
    ])
    expect(summary.products[0]!.serials).toEqual(['IMEI-1', 'IMEI-2'])
  })

  it('shows what checkout discounts took off the product lines', () => {
    expect(summary.reductions).toBe(0)
    const discounted = summarizeDaySales(
      [
        sale({
          total: 25000,
          items: [
            { itemId: 'a', itemName: 'Case', quantity: 2, price: 8500 },
            { itemId: 'b', itemName: 'Charger', quantity: 1, price: 12000 },
          ],
        }),
      ],
      owner
    )
    expect(discounted.reductions).toBe(4000)
  })

  it('reports refunds on their own', () => {
    expect(summary.refunds).toEqual({ count: 1, amount: 30000 })
  })

  it('breaks the day down by who sold', () => {
    expect(summary.sellers).toEqual([
      { uid: 'amaka', name: 'Amaka', count: 2, amount: 605000 },
      { uid: 'tunde', name: 'Tunde', count: 1, amount: 25000 },
    ])
  })

  it('compares with yesterday up to the same time of day', () => {
    expect(summary.comparison.previousSold).toBe(200000)
    expect(summary.comparison.change).toBe(430000)
    expect(summary.comparison.changePct).toBe(215)
    expect(summary.comparison.sameTimeCutoff).toEqual(new Date('2026-10-16T13:00:00'))
  })

  it('compares a past day with the whole day before it', () => {
    const past = summarizeDaySales(receipts, {
      ...owner,
      day: new Date('2026-10-17T08:00:00'),
      now: new Date('2026-10-20T08:00:00'),
    })
    expect(past.comparison.previousSold).toBe(1100000)
    expect(past.comparison.sameTimeCutoff).toBeNull()
  })

  it('shows only your own sales in "mine" mode, with no seller breakdown', () => {
    const mine = summarizeDaySales(receipts, { ...owner, viewerUid: 'amaka', mode: 'mine' })
    expect(mine.count).toBe(2)
    expect(mine.sold).toBe(605000)
    expect(mine.sellers).toEqual([])
  })

  it('keeps staff without the Financial figures grant on their own sales', () => {
    const staff = summarizeDaySales(receipts, {
      ...owner,
      viewerUid: 'tunde',
      mode: 'everyone',
      canViewStoreTotals: false,
    })
    expect(staff.mode).toBe('mine')
    expect(staff.sold).toBe(25000)
    expect(staff.refunds).toEqual({ count: 1, amount: 30000 })
    expect(staff.sellers).toEqual([])
  })

  it('handles an empty day', () => {
    const empty = summarizeDaySales([], owner)
    expect(empty).toMatchObject({
      count: 0,
      sold: 0,
      collected: 0,
      owed: 0,
      tenders: [],
      products: [],
    })
    expect(empty.comparison.changePct).toBeNull()
  })

  it('splits a sale paid off in instalments across the methods actually used', () => {
    const paidOff = summarizeDaySales(
      [
        sale({
          total: 100000,
          paymentMethod: 'Cash',
          payments: [
            { amount: 60000, method: 'Bank Transfer', paidAt: new Date('2026-10-17T09:00:00') },
            { amount: 40000, method: 'Cash', paidAt: new Date('2026-10-17T12:00:00') },
          ],
        }),
      ],
      owner
    )
    expect(paidOff.tenders).toEqual([
      { method: 'Bank Transfer', amount: 60000 },
      { method: 'Cash', amount: 40000 },
    ])
  })

  it('reads Firestore timestamps and date strings', () => {
    const mixed = summarizeDaySales(
      [
        sale({ date: { toDate: () => new Date('2026-10-17T09:00:00') }, total: 100 }),
        sale({ date: '2026-10-17T09:30:00', total: 200 }),
      ],
      owner
    )
    expect(mixed.sold).toBe(300)
  })
})
