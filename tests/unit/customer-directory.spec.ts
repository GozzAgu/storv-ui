import { describe, expect, it } from 'vitest'
import {
  buildCustomerDirectory,
  filterCustomerDirectory,
  sortCustomerDirectory,
} from '~/utils/customer-directory'

const receipts = [
  { id: 'r1', customerName: 'Ada Obi', customerEmail: 'ADA@x.com', total: 100, date: new Date('2026-01-02') },
  { id: 'r2', customerName: 'Ada O.', customerEmail: 'ada@x.com', customerPhone: '0803', total: 50, date: new Date('2026-03-01') },
  { id: 'r3', customerName: 'Tunde', customerPhone: '0812', total: 300, date: { toDate: () => new Date('2026-02-01') } },
  { id: 'r4', customerName: '', total: 10, date: new Date() },
]

describe('customer directory', () => {
  it('groups sales by email and keeps the first contact details', () => {
    const customers = buildCustomerDirectory(receipts)
    expect(customers).toHaveLength(2)
    const ada = customers.find((c) => c.id === 'ada@x.com')!
    expect(ada.name).toBe('Ada Obi')
    expect(ada.receipts).toEqual(['r1', 'r2'])
    expect(ada.totalSpent).toBe(150)
    expect(ada.phone).toBe('0803')
    expect(ada.firstOrderDate.toISOString().slice(0, 10)).toBe('2026-01-02')
    expect(ada.lastOrderDate.toISOString().slice(0, 10)).toBe('2026-03-01')
    expect(ada.contactKey).toBe('email:ada@x.com')
  })

  it('filters by name, email or phone and sorts', () => {
    const customers = buildCustomerDirectory(receipts)
    expect(filterCustomerDirectory(customers, '0812').map((c) => c.name)).toEqual(['Tunde'])
    expect(sortCustomerDirectory([...customers], 'spent')[0]!.name).toBe('Tunde')
    expect(sortCustomerDirectory([...customers], 'lastOrder')[0]!.name).toBe('Ada Obi')
    expect(sortCustomerDirectory([...customers], 'name')[0]!.name).toBe('Ada Obi')
  })
})
