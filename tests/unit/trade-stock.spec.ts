import { describe, expect, it } from 'vitest'
import type { TradeSaleLine } from '~/types/trade'
import { MAX_TRADE_STOCK_ROWS, tradeStockRows } from '~/utils/trade-stock'

const line = (over: Partial<TradeSaleLine> = {}): TradeSaleLine => ({
  name: 'iPhone 15',
  quantity: 1,
  unitPriceKobo: 145_000_000,
  brand: '',
  model: '',
  serial: '',
  ...over,
})

const fields = (...names: string[]) => ({ template: { fields: names.map((name) => ({ name })) } })

describe('tradeStockRows', () => {
  it('serial folders get one row per unit with the seller serial and cost in naira', () => {
    const rows = tradeStockRows(
      { hasSerialNumbers: false, ...fields('brand', 'model', 'IMEI') } as never,
      [
        line({ serial: '356938035643809', brand: 'Apple', model: '15 Pro' }),
        line({ serial: '111' }),
      ],
      'sale1'
    )
    expect(rows).toEqual([
      {
        name: 'iPhone 15',
        brand: 'Apple',
        model: '15 Pro',
        IMEI: '356938035643809',
        unitCost: 1_450_000,
        tradeSaleId: 'sale1',
      },
      { name: 'iPhone 15', IMEI: '111', unitCost: 1_450_000, tradeSaleId: 'sale1' },
    ])
  })

  it('quantity folders get one row per line; plain folders one row per unit', () => {
    const bulk = tradeStockRows(
      fields('productName', 'Qty') as never,
      [line({ name: 'Charger', quantity: 20, unitPriceKobo: 450_000 })],
      's'
    )
    expect(bulk).toEqual([{ productName: 'Charger', Qty: 20, unitCost: 4_500, tradeSaleId: 's' }])

    const plain = tradeStockRows(fields() as never, [line({ quantity: 3 })], 's')
    expect(plain).toHaveLength(3)
    expect(plain[0]).toEqual({ name: 'iPhone 15', unitCost: 1_450_000, tradeSaleId: 's' })
  })

  it('serial folders without a serial column use serialNo and never copy a serial twice', () => {
    const rows = tradeStockRows(
      { hasSerialNumbers: true } as never,
      [line({ quantity: 2, serial: 'A1' })],
      's'
    )
    expect(rows.map((r) => r.serialNo)).toEqual(['A1', undefined])
  })

  it('keeps a single unit serial as serialNo when a quantity folder has no serial column', () => {
    const rows = tradeStockRows(
      fields('name', 'quantity') as never,
      [line({ serial: 'IMEI1' }), line({ quantity: 5, serial: 'IMEI2' })],
      's'
    )
    expect(rows.map((r) => [r.quantity, r.serialNo])).toEqual([
      [1, 'IMEI1'],
      [5, undefined],
    ])
  })

  it('caps the number of rows', () => {
    expect(tradeStockRows(fields() as never, [line({ quantity: 10_000 })], 's')).toHaveLength(
      MAX_TRADE_STOCK_ROWS
    )
  })
})
