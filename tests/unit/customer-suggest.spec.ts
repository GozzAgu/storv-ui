import { describe, expect, it } from 'vitest'
import { suggestCustomers } from '~/utils/customer-suggest'

const customers = [
  { id: '1', name: 'Ada Obi', email: 'ada@example.com', phone: '+234 803 123 4567' },
  { id: '2', name: 'Bisi Ade', email: 'bisi@shop.ng', phone: '08091112222' },
  { id: '3', name: 'Chidi Okafor', email: undefined, phone: undefined },
  { id: '4', name: 'Tunde Adams', email: 'tunde.ada@mail.com', phone: '07011112222' },
]
const ids = (list: Array<{ id: string }>) => list.map((c) => c.id)

describe('suggestCustomers', () => {
  it('matches names case-insensitively with prefix matches first', () => {
    expect(ids(suggestCustomers(customers, 'name', 'ada'))).toEqual(['1', '4'])
    expect(ids(suggestCustomers(customers, 'name', 'CHI'))).toEqual(['3'])
  })

  it('matches email only on the email field and needs two characters', () => {
    expect(suggestCustomers(customers, 'email', 'a')).toEqual([])
    expect(ids(suggestCustomers(customers, 'email', 'ada'))).toEqual(['1', '4'])
    expect(ids(suggestCustomers(customers, 'email', 'shop.ng'))).toEqual(['2'])
  })

  it('matches phones across local and international formats', () => {
    expect(ids(suggestCustomers(customers, 'phone', '0803'))).toEqual(['1'])
    expect(ids(suggestCustomers(customers, 'phone', '+234 809'))).toEqual(['2'])
    expect(ids(suggestCustomers(customers, 'phone', '1112222'))).toEqual(['2', '4'])
  })

  it('needs three digits before suggesting phones', () => {
    expect(suggestCustomers(customers, 'phone', '08')).toEqual([])
    expect(suggestCustomers(customers, 'phone', 'abc')).toEqual([])
  })

  it('returns nothing for blank input and caps the list', () => {
    expect(suggestCustomers(customers, 'name', '   ')).toEqual([])
    expect(suggestCustomers(customers, 'name', 'a', 2)).toHaveLength(2)
  })
})
