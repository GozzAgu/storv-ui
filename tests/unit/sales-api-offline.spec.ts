import { beforeEach, describe, expect, it, vi } from 'vitest'

const authFetch = vi.fn()
const auth = { currentUser: { uid: 'amaka' } as { uid: string } | null }

vi.mock('~/composables/useAuthenticatedFetch', () => ({
  useAuthenticatedFetch: () => ({ authFetch }),
}))
vi.mock('~/composables/useFirestorePaths', () => ({ getQueryUserId: async () => 'owner1' }))
vi.mock('~/composables/useCurrentStore', () => ({ getCurrentStoreId: async () => 's1' }))
vi.mock('~/stores/auth', () => ({ useAuthStore: () => auth }))

const { useSalesApi, flushQueuedSales } = await import('~/composables/useSalesApi')
const outbox = await import('~/utils/sales-outbox')

const body = {
  saleId: 'sale1',
  source: 'pos' as const,
  lines: [{ itemId: 'usb', quantity: 2 }],
  payment: { method: 'Cash' },
}

function goOffline(offline: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => !offline })
}

describe('selling offline', () => {
  beforeEach(() => {
    localStorage.clear()
    authFetch.mockReset()
    // The request never gets an answer: the connection is down.
    authFetch.mockRejectedValue(new TypeError('Failed to fetch'))
    auth.currentUser = { uid: 'amaka' }
    goOffline(true)
  })

  it('queues the sale with the total the customer saw', async () => {
    const outcome = await useSalesApi().createSale(body, {
      summary: '2 items · ₦10,000',
      clientTotal: 10_000,
    })
    expect(outcome).toEqual({ status: 'queued', saleId: 'sale1' })
    expect(outbox.listQueuedSales('amaka')[0]).toMatchObject({
      saleId: 'sale1',
      clientTotal: 10_000,
    })
  })

  it('stops saving sales once the till hasn’t reached Storvv for three days', async () => {
    outbox.markServerReached('amaka', Date.now() - outbox.MAX_OFFLINE_SELLING_MS - 60_000)
    await expect(
      useSalesApi().createSale(body, { summary: 'x', clientTotal: 10_000 })
    ).rejects.toMatchObject({ code: 'OFFLINE_TOO_LONG' })
    expect(outbox.listQueuedSales('amaka')).toHaveLength(0)
  })
})

describe('syncing offline sales', () => {
  beforeEach(() => {
    localStorage.clear()
    authFetch.mockReset()
    auth.currentUser = { uid: 'amaka' }
    goOffline(false)
  })

  it('marks each one as a replay with the till’s time, total and label', async () => {
    outbox.enqueueSale('amaka', {
      saleId: 'sale1',
      ownerUserId: 'owner1',
      storeId: 's1',
      body: { ...body },
      queuedAt: '2026-10-21T09:00:00.000Z',
      summary: '2 items · ₦10,000',
      clientTotal: 10_000,
      attempts: 0,
    })
    authFetch.mockResolvedValue({ created: true })
    const result = await flushQueuedSales(authFetch)
    expect(result.recorded).toHaveLength(1)
    expect(authFetch).toHaveBeenCalledWith(
      '/api/sales/create',
      expect.objectContaining({
        body: expect.objectContaining({
          offlineReplay: true,
          clientCreatedAt: '2026-10-21T09:00:00.000Z',
          clientTotal: 10_000,
          offlineSummary: '2 items · ₦10,000',
          ownerUserId: 'owner1',
          storeId: 's1',
        }),
      })
    )
    expect(outbox.listQueuedSales('amaka')).toHaveLength(0)
  })

  it('moves a sale the server refuses to the list the owner can review', async () => {
    outbox.enqueueSale('amaka', {
      saleId: 'sale2',
      ownerUserId: 'owner1',
      storeId: 's1',
      body: { ...body, saleId: 'sale2' },
      queuedAt: new Date().toISOString(),
      summary: '2 items',
      attempts: 0,
    })
    authFetch.mockRejectedValue({
      statusCode: 409,
      data: { message: 'Not enough USB-C in stock.', data: { code: 'INSUFFICIENT_STOCK' } },
    })
    const result = await flushQueuedSales(authFetch)
    expect(result.failed[0]!.message).toBe('Not enough USB-C in stock.')
    expect(outbox.listFailedSales('amaka')[0]!.saleId).toBe('sale2')
  })
})
