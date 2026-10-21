import { beforeEach, describe, expect, it } from 'vitest'
import {
  MAX_OFFLINE_SELLING_MS,
  canSellOffline,
  clearSalesOutbox,
  enqueueSale,
  lastServerContact,
  listFailedSales,
  listQueuedSales,
  markSaleFailed,
  markServerReached,
  outboxVersion,
  requeueFailedSale,
  type QueuedSale,
} from '~/utils/sales-outbox'

const sale = (saleId: string, extra: Partial<QueuedSale> = {}): QueuedSale => ({
  saleId,
  ownerUserId: 'owner1',
  storeId: 's1',
  body: { saleId, lines: [{ itemId: 'usb', quantity: 1 }] },
  queuedAt: new Date().toISOString(),
  summary: '1 item · ₦5,000',
  clientTotal: 5_000,
  attempts: 0,
  ...extra,
})

describe('sales outbox', () => {
  beforeEach(() => localStorage.clear())

  it('keeps each user’s sales apart and tells screens when it changes', () => {
    const before = outboxVersion.value
    enqueueSale('amaka', sale('a1'))
    enqueueSale('tunde', sale('t1'))
    expect(listQueuedSales('amaka').map((s) => s.saleId)).toEqual(['a1'])
    expect(listQueuedSales('tunde').map((s) => s.saleId)).toEqual(['t1'])
    expect(outboxVersion.value).toBeGreaterThan(before)
  })

  it('puts a refused sale back in the queue with a fresh start', () => {
    enqueueSale('amaka', sale('a1', { attempts: 3 }))
    markSaleFailed('amaka', listQueuedSales('amaka')[0]!, 'Not enough USB-C in stock.')
    expect(listQueuedSales('amaka')).toHaveLength(0)
    expect(listFailedSales('amaka')[0]!.lastError).toBe('Not enough USB-C in stock.')

    requeueFailedSale('amaka', 'a1')
    expect(listFailedSales('amaka')).toHaveLength(0)
    const [again] = listQueuedSales('amaka')
    expect(again!.attempts).toBe(0)
    expect(again!.lastError).toBeUndefined()
    expect(again!.clientTotal).toBe(5_000)
    expect('failedAt' in again!).toBe(false)
  })

  it('on sign-out forgets refused sales, and waiting ones only when told to', () => {
    enqueueSale('amaka', sale('waiting'))
    enqueueSale('amaka', sale('refused'))
    markSaleFailed('amaka', listQueuedSales('amaka')[1]!, 'Too old')

    clearSalesOutbox('amaka')
    expect(listFailedSales('amaka')).toHaveLength(0)
    expect(listQueuedSales('amaka').map((s) => s.saleId)).toEqual(['waiting'])

    clearSalesOutbox('amaka', { includeQueued: true })
    expect(listQueuedSales('amaka')).toHaveLength(0)
    expect(Object.keys(localStorage).filter((k) => k.includes('amaka'))).toEqual([])
  })
})

describe('offline selling limit', () => {
  beforeEach(() => localStorage.clear())

  it('allows selling offline until the server hasn’t been reached for three days', () => {
    const now = Date.now()
    expect(canSellOffline('amaka', now)).toBe(true) // never recorded: don't lock anyone out
    markServerReached('amaka', now - MAX_OFFLINE_SELLING_MS + 60_000)
    expect(canSellOffline('amaka', now)).toBe(true)
    expect(canSellOffline('amaka', now + 120_000)).toBe(false)
  })

  it('never moves the last contact backwards or into the future', () => {
    const now = Date.now()
    markServerReached('amaka', now - 1_000)
    markServerReached('amaka', now - 3_600_000) // an older token arriving late
    expect(lastServerContact('amaka')).toBe(now - 1_000)
    markServerReached('amaka', now + 86_400_000) // a till clock in the future
    expect(lastServerContact('amaka')!).toBeLessThanOrEqual(Date.now())
    markServerReached('amaka', Number.NaN)
    expect(lastServerContact('amaka')).not.toBeNaN()
  })
})
