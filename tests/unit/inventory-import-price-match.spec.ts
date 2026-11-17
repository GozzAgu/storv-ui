import { describe, expect, it } from 'vitest'
import { matchImportPriceUpdates } from '~/utils/inventory-import-price-match'

const acura = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: 'Acura',
  brand: 'MDX',
  serialNo: id,
  price: 15_000_000,
  unitCost: 8_000_000,
  folderId: 'acura',
  ...extra,
})
const row = (rowNumber: number, data: Record<string, unknown>) => ({ rowNumber, data })

describe('matchImportPriceUpdates: serial folders', () => {
  const existing = [acura('1'), acura('2'), acura('3', { dateOut: '2026-10-19' }), acura('4')]

  it('matches rows by serial and only lists products whose price changed', () => {
    const { updates, matchedRows, lockedCount } = matchImportPriceUpdates(
      [
        row(2, {
          name: 'Acura',
          brand: 'MDX',
          serialNo: '1',
          price: 16_000_000,
          unitCost: 8_000_000,
        }),
        row(3, {
          name: 'Acura',
          brand: 'MDX',
          serialNo: ' 2 ',
          price: 15_000_000,
          unitCost: 9_000_000,
        }),
        row(4, { name: 'Acura', brand: 'MDX', serialNo: '3', price: 16_000_000 }),
        row(5, {
          name: 'Acura',
          brand: 'MDX',
          serialNo: '4',
          price: 15_000_000,
          unitCost: 8_000_000,
        }),
        row(6, { name: 'Acura', brand: 'MDX', serialNo: '99', price: 1 }),
      ],
      existing,
      { hasSerialNumbers: true }
    )
    expect(updates.map((u) => [u.itemId, u.unitPrice, u.costPrice])).toEqual([
      ['1', 16_000_000, undefined],
      ['2', undefined, 9_000_000],
    ])
    expect(updates[0]!.label).toBe('Acura · MDX · Serial 1')
    expect([...matchedRows]).toEqual([2, 3, 4, 5])
    // Serial 3 is sold: its price stays, and the owner is told.
    expect(lockedCount).toBe(1)
  })

  it('ignores empty or zero price cells (blank cells import as 0)', () => {
    const { updates } = matchImportPriceUpdates(
      [row(2, { serialNo: '1', price: 0, unitCost: '' })],
      existing,
      { hasSerialNumbers: true }
    )
    expect(updates).toEqual([])
  })

  it('uses the template’s own serial field name', () => {
    const { updates } = matchImportPriceUpdates(
      [row(2, { imei: 'A', price: 2 })],
      [{ id: 'x', imei: 'a', price: 1 }],
      { hasSerialNumbers: true, serialField: 'imei' }
    )
    expect(updates.map((u) => u.itemId)).toEqual(['x'])
  })
})

describe('matchImportPriceUpdates: bulk folders', () => {
  it('matches on name + product model, updates every copy, first row wins', () => {
    const existing = [
      { id: 'c1', name: 'USB-C cable', brand: '1m', price: 500, quantity: 10 },
      { id: 'c2', name: 'usb-c cable', brand: '1M', price: 500, quantity: 3 },
      { id: 'c3', name: 'USB-C cable', brand: '2m', price: 800, quantity: 4 },
    ]
    const { updates, matchedRows } = matchImportPriceUpdates(
      [
        row(2, { name: 'USB-C Cable', brand: '1m', price: 600, quantity: 5 }),
        row(3, { name: 'USB-C cable', brand: '1m', price: 700, quantity: 1 }),
        row(4, { name: 'USB-C cable', brand: '2m', price: 800, quantity: 1 }),
        row(5, { name: 'Charger', brand: '', price: 900, quantity: 1 }),
      ],
      existing,
      { hasSerialNumbers: false }
    )
    expect(updates.map((u) => [u.itemId, u.unitPrice, u.rowNumber])).toEqual([
      ['c1', 600, 2],
      ['c2', 600, 2],
    ])
    expect([...matchedRows]).toEqual([2, 3, 4])
  })

  it('never matches rows without a product name', () => {
    const { matchedRows } = matchImportPriceUpdates(
      [row(2, { brand: 'X', price: 5 })],
      [{ id: 'a', brand: 'X', price: 1 }],
      { hasSerialNumbers: false }
    )
    expect(matchedRows.size).toBe(0)
  })
})
