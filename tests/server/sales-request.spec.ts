// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  MAX_OFFLINE_AGE_MS,
  parseCreateSaleRequest,
  receiptNumberFor,
  resolveSaleDate,
} from '~/server/utils/sales/create-sale'

const base = { saleId: 'AbCdEfGh12345678ijkl', lines: [{ itemId: 'usb', quantity: 1 }] }

describe('parseCreateSaleRequest', () => {
  it('ignores a client time and total on a live sale, so it can’t be backdated', () => {
    const input = parseCreateSaleRequest({
      ...base,
      clientCreatedAt: new Date(Date.now() - 86_400_000).toISOString(),
      clientTotal: 10,
    })
    expect(input.offlineReplay).toBe(false)
    expect(input.clientCreatedAt).toBeUndefined()
    expect(input.clientTotal).toBeUndefined()
  })

  it('keeps the till’s time and total for an offline replay', () => {
    const at = new Date(Date.now() - 3_600_000).toISOString()
    const input = parseCreateSaleRequest({
      ...base,
      offlineReplay: true,
      clientCreatedAt: at,
      clientTotal: 25_000.005,
    })
    expect(input.offlineReplay).toBe(true)
    expect(input.clientCreatedAt).toBe(at)
    expect(input.clientTotal).toBe(25_000.01)
  })

  it('only treats a literal true as a replay', () => {
    expect(parseCreateSaleRequest({ ...base, offlineReplay: 'true' }).offlineReplay).toBe(false)
    expect(parseCreateSaleRequest({ ...base, offlineReplay: 1 }).offlineReplay).toBe(false)
  })

  it('refuses a negative or absurd client total', () => {
    expect(() =>
      parseCreateSaleRequest({ ...base, offlineReplay: true, clientTotal: -1 })
    ).toThrow()
    expect(() =>
      parseCreateSaleRequest({ ...base, offlineReplay: true, clientTotal: 1e13 })
    ).toThrow()
  })
})

describe('resolveSaleDate', () => {
  const now = Date.parse('2026-10-21T12:00:00Z')

  it('is now without a client time', () => {
    expect(resolveSaleDate(undefined, now).getTime()).toBe(now)
  })

  it('refuses sales older than the offline limit and future-dated ones', () => {
    expect(() =>
      resolveSaleDate(new Date(now - MAX_OFFLINE_AGE_MS - 1).toISOString(), now)
    ).toThrow()
    expect(() => resolveSaleDate(new Date(now + 10 * 60_000).toISOString(), now)).toThrow()
  })
})

describe('receiptNumberFor', () => {
  it('is short, readable and taken from the sale ID', () => {
    expect(receiptNumberFor('AbCdEfGh12345678ijkl')).toBe('REC-ABCDEFGH')
    expect(receiptNumberFor('a-b_c1d2e3f4g5')).toBe('REC-ABC1D2E3')
  })

  it('differs for sales made in the same millisecond', () => {
    expect(receiptNumberFor('Xy12aaaaaaaaaaaaaaaa')).not.toBe(
      receiptNumberFor('Zq98aaaaaaaaaaaaaaaa')
    )
  })
})
