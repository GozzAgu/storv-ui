import { afterEach, describe, expect, it, vi } from 'vitest'
import { createError, type H3Event } from 'h3'

const state = vi.hoisted(() => ({
  gateOn: true,
  authed: true,
  rateLimitCalls: [] as unknown[],
  accessError: null as Error | null,
}))

vi.mock('~/server/utils/firebase-admin', () => ({
  getAdminFirestore: () => ({}),
  getAdminAuth: vi.fn(),
}))
vi.mock('~/server/utils/payments/config', () => ({
  requirePaymentsV2: async () => {
    if (!state.gateOn) throw createError({ statusCode: 404, message: 'Not found' })
  },
}))
vi.mock('~/server/utils/store-auth', () => ({
  requireAuth: vi.fn(async () => {
    if (!state.authed)
      throw createError({ statusCode: 401, message: 'Missing or invalid Authorization header' })
    return { uid: 'u1' }
  }),
}))
vi.mock('~/server/utils/rate-limit', () => ({
  assertRateLimit: async (_event: unknown, opts: unknown) => {
    state.rateLimitCalls.push(opts)
  },
}))
vi.mock('~/server/utils/payments/access', () => ({
  resolvePaymentsAccess: vi.fn(async () => {
    if (state.accessError) throw state.accessError
    return { ownerId: 'o1', storeId: 's1', isOwner: true }
  }),
}))

import { definePaymentsRoute } from '~/server/utils/payments/http'
import { requireAuth } from '~/server/utils/store-auth'
import { PaymentServiceError } from '~/server/utils/payments/records'

function getEvent(url = '/api/payments/access?ownerUserId=o1&storeId=s1'): H3Event {
  return {
    path: url,
    method: 'GET',
    context: {},
    node: { req: { url, method: 'GET', headers: {} }, res: {} },
  } as unknown as H3Event
}

const route = definePaymentsRoute(
  { method: 'GET', rateLimit: { id: 'payments:test', limit: 5, windowMs: 1000 } },
  async ({ access, input }) => ({ access, input })
)

async function statusOf(promise: Promise<unknown>) {
  const err = (await promise.then(
    () => null,
    (e: unknown) => e
  )) as { statusCode?: number; data?: { code?: string } } | null
  return err
}

describe('definePaymentsRoute', () => {
  afterEach(() => {
    state.gateOn = true
    state.authed = true
    state.rateLimitCalls = []
    state.accessError = null
  })

  it('returns 404 when Payments V2 is off, before looking at auth', async () => {
    state.gateOn = false
    const err = await statusOf(route(getEvent()) as Promise<unknown>)
    expect(err?.statusCode).toBe(404)
    expect(requireAuth).not.toHaveBeenCalled()
  })

  it('returns 401 when signed out', async () => {
    state.authed = false
    const err = await statusOf(route(getEvent()) as Promise<unknown>)
    expect(err?.statusCode).toBe(401)
    expect(state.rateLimitCalls).toHaveLength(0)
  })

  it('rate limits per uid and requires the distributed limiter', async () => {
    await route(getEvent())
    expect(state.rateLimitCalls).toEqual([
      { id: 'payments:test', limit: 5, windowMs: 1000, uid: 'u1', requireDistributed: true },
    ])
  })

  it('maps service errors to their status and code (cross-store → 404)', async () => {
    state.accessError = new PaymentServiceError('NOT_FOUND', 404, 'Not found')
    const err = await statusOf(route(getEvent()) as Promise<unknown>)
    expect(err?.statusCode).toBe(404)
    expect(err?.data?.code).toBe('NOT_FOUND')
  })

  it('passes the parsed scope to the handler', async () => {
    const res = (await route(getEvent())) as { input: Record<string, unknown> }
    expect(res.input).toMatchObject({ ownerUserId: 'o1', storeId: 's1' })
  })
})
