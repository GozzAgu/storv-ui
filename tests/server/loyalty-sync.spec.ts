import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, type H3Event } from 'h3'

/**
 * Minimal in-memory Firestore: enough of refs, transactions, merge-sets and increments to run
 * the real rewards sync end to end without the emulator.
 */
const mem = vi.hoisted(() => {
  const docs = new Map<string, Record<string, unknown>>()
  let auto = 0
  const INC = Symbol('inc')
  const TS = Symbol('ts')

  const isPlain = (v: unknown): v is Record<string, unknown> =>
    !!v &&
    typeof v === 'object' &&
    !(v instanceof Date) &&
    !(INC in (v as object)) &&
    !(TS in (v as object))

  function resolve(prev: unknown, next: unknown): unknown {
    if (next && typeof next === 'object' && INC in next) {
      return (typeof prev === 'number' ? prev : 0) + (next as { [INC]: number })[INC]
    }
    if (next && typeof next === 'object' && TS in next) return new Date(0)
    if (isPlain(next)) {
      const base = isPlain(prev) ? { ...prev } : {}
      for (const [k, v] of Object.entries(next)) base[k] = resolve(base[k], v)
      return base
    }
    return next
  }

  class Ref {
    constructor(public path: string) {}
    get id() {
      return this.path.split('/').pop()!
    }
    collection(name: string) {
      return new Col(`${this.path}/${name}`)
    }
    async get() {
      return snap(this)
    }
    async set(data: Record<string, unknown>) {
      docs.set(this.path, resolve(undefined, data) as never)
    }
  }
  class Col {
    constructor(public path: string) {}
    doc(id?: string) {
      return new Ref(`${this.path}/${id ?? `auto${++auto}`}`)
    }
  }

  const snap = (ref: Ref) => ({
    id: ref.id,
    exists: docs.has(ref.path),
    data: () => (docs.has(ref.path) ? structuredClone(docs.get(ref.path)) : undefined),
  })

  const db = {
    collection: (name: string) => new Col(name),
    async runTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
      const writes: (() => void)[] = []
      const tx = {
        get: async (ref: Ref) => snap(ref),
        set: (ref: Ref, data: Record<string, unknown>, opts?: { merge?: boolean }) =>
          writes.push(() =>
            docs.set(ref.path, resolve(opts?.merge ? docs.get(ref.path) : undefined, data) as never)
          ),
        create: (ref: Ref, data: Record<string, unknown>) =>
          writes.push(() => {
            if (docs.has(ref.path)) throw new Error('already exists')
            docs.set(ref.path, resolve(undefined, data) as never)
          }),
        delete: (ref: Ref) => writes.push(() => docs.delete(ref.path)),
      }
      const result = await fn(tx)
      for (const w of writes) w()
      return result
    },
  }

  return {
    docs,
    db,
    FieldValue: {
      increment: (n: number) => ({ [INC]: n }),
      serverTimestamp: () => ({ [TS]: true }),
    },
    reset() {
      docs.clear()
      auto = 0
    },
  }
})

vi.mock('firebase-admin/firestore', () => ({ FieldValue: mem.FieldValue }))

const route = vi.hoisted(() => ({ uid: 'owner1', memberActive: true, rateLimited: [] as string[] }))
vi.mock('~/server/utils/firebase-admin', () => ({ getAdminFirestore: () => mem.db }))
vi.mock('~/server/utils/rate-limit', () => ({
  assertRateLimit: async (_e: unknown, opts: { id: string }) => {
    route.rateLimited.push(opts.id)
  },
}))
vi.mock('~/server/utils/store-auth', () => ({
  requireAuth: async () => ({ uid: route.uid }),
  requireStoreReadAccess: async (uid: string, owner: string) => {
    if (uid !== owner && !route.memberActive) {
      throw createError({ statusCode: 403, message: 'Inactive store membership' })
    }
  },
}))

import { syncLoyaltyBestEffort, syncLoyaltyForReceipt } from '~/server/utils/loyalty/sync'
import syncRoute from '~/server/api/loyalty/sync.post'
import saveSettingsRoute from '~/server/api/loyalty/settings.post'
import membersRoute from '~/server/api/loyalty/members.get'
import { LOYALTY_DEFAULT_SETTINGS } from '~/utils/loyalty'

const OWNER = 'owner1'
const receiptPath = (id: string, store = 's1') => `users/${OWNER}/stores/${store}/receipts/${id}`
const memberPath = (key: string) => `users/${OWNER}/loyaltyMembers/${key}`
const ledger = () =>
  [...mem.docs.entries()]
    .filter(([p]) => p.startsWith(`users/${OWNER}/loyaltyLedger/`))
    .map(([, d]) => d)
const ADA = 'p_2348035465454'

function seedSettings(over: Record<string, unknown> = {}) {
  mem.docs.set(`users/${OWNER}/loyalty/settings`, {
    ...LOYALTY_DEFAULT_SETTINGS,
    enabled: true,
    ...over,
  })
}
function seedSale(id: string, over: Record<string, unknown> = {}, store = 's1') {
  mem.docs.set(receiptPath(id, store), {
    status: 'completed',
    total: 25_000,
    date: new Date('2026-10-12T10:00:00Z'),
    customerName: 'Ada Okonkwo',
    customerPhone: '0803 546 5454',
    ...over,
  })
}
const sync = (receiptId: string, storeId = 's1') =>
  syncLoyaltyForReceipt(
    mem.db as never,
    { ownerId: OWNER, storeId, receiptId, actorUid: 'cashier1' },
    new Date('2026-10-13T12:00:00Z')
  )

function event(method: 'GET' | 'POST', body: Record<string, unknown> = {}): H3Event {
  const url =
    method === 'GET' ? `/api/loyalty/members?${new URLSearchParams(body as never)}` : '/api/loyalty'
  return {
    path: url,
    method,
    context: {},
    _requestBody: JSON.stringify(body),
    node: {
      req: { url, method, headers: { 'content-type': 'application/json' } },
      res: {},
    },
  } as unknown as H3Event
}
async function call(handler: (e: H3Event) => unknown, e: H3Event) {
  try {
    return { ok: true as const, value: await handler(e) }
  } catch (err) {
    return { ok: false as const, status: (err as { statusCode?: number }).statusCode }
  }
}

beforeEach(() => {
  mem.reset()
  route.uid = OWNER
  route.memberActive = true
  route.rateLimited = []
  process.env.LOYALTY_ENABLED = '1'
})

describe('syncLoyaltyForReceipt', () => {
  it('awards a sale once, however many times it is synced', async () => {
    seedSettings()
    seedSale('r1')
    expect(await sync('r1')).toEqual({ pointsChange: 25, customerKey: ADA })
    expect(await sync('r1')).toEqual({ pointsChange: 0, customerKey: ADA })
    await sync('r1')
    expect(mem.docs.get(memberPath(ADA))).toMatchObject({
      points: 25,
      name: 'Ada Okonkwo',
      spendByMonth: { '2026-10': 25_000 },
    })
    expect(ledger()).toHaveLength(1)
    expect(ledger()[0]).toMatchObject({
      type: 'earn',
      points: 25,
      verified: false,
      actorUid: 'cashier1',
    })
  })

  it('reverses on refund and on delete, leaving a ledger trail', async () => {
    seedSettings()
    seedSale('r1')
    seedSale('r2', { total: 10_000 })
    await sync('r1')
    await sync('r2')
    seedSale('r1', { status: 'refunded' })
    await sync('r1')
    mem.docs.delete(receiptPath('r2'))
    await sync('r2')
    expect(mem.docs.get(memberPath(ADA))).toMatchObject({
      points: 0,
      spendByMonth: { '2026-10': 0 },
    })
    expect(ledger().map((e) => [e.type, e.points])).toEqual([
      ['earn', 25],
      ['earn', 10],
      ['reverse', -25],
      ['reverse', -10],
    ])
  })

  it('counts one customer across branches', async () => {
    seedSettings()
    seedSale('r1', {}, 's1')
    seedSale('r1', { customerPhone: '+234 803 546 5454', total: 5_000 }, 's2')
    await sync('r1', 's1')
    await sync('r1', 's2')
    expect(mem.docs.get(memberPath(ADA))?.points).toBe(30)
  })

  it('does nothing while rewards are off or for walk-in sales', async () => {
    seedSale('r1')
    expect((await sync('r1')).pointsChange).toBe(0)
    seedSettings()
    seedSale('r2', { customerPhone: '', customerEmail: '' })
    expect((await sync('r2')).pointsChange).toBe(0)
    expect(ledger()).toHaveLength(0)
  })

  it('best-effort hook is silent when the feature is off and never throws', async () => {
    seedSettings()
    seedSale('r1')
    process.env.LOYALTY_ENABLED = ''
    await syncLoyaltyBestEffort(mem.db as never, { ownerId: OWNER, storeId: 's1', actorUid: 'x' }, [
      'r1',
    ])
    expect(ledger()).toHaveLength(0)
    process.env.LOYALTY_ENABLED = '1'
    const broken = { ...mem.db, runTransaction: async () => Promise.reject(new Error('boom')) }
    await expect(
      syncLoyaltyBestEffort(broken as never, { ownerId: OWNER, storeId: 's1', actorUid: 'x' }, [
        'r1',
      ])
    ).resolves.toBeUndefined()
  })
})

describe('/api/loyalty routes', () => {
  it('404 when the server switch is off', async () => {
    process.env.LOYALTY_ENABLED = ''
    const res = await call(
      syncRoute,
      event('POST', { ownerUserId: OWNER, storeId: 's1', receiptId: 'r1' })
    )
    expect(res).toEqual({ ok: false, status: 404 })
  })

  it('lets staff sync a sale but never pass an amount', async () => {
    seedSettings()
    seedSale('r1')
    route.uid = 'cashier1'
    const res = await call(
      syncRoute,
      event('POST', {
        ownerUserId: OWNER,
        storeId: 's1',
        receiptId: 'r1',
        points: 9999,
        amount: 1e9,
      })
    )
    expect(res).toMatchObject({ ok: true, value: { pointsChange: 25 } })
    expect(mem.docs.get(memberPath(ADA))?.points).toBe(25)
  })

  it('refuses inactive staff and bad ids', async () => {
    route.uid = 'cashier1'
    route.memberActive = false
    expect(
      await call(syncRoute, event('POST', { ownerUserId: OWNER, storeId: 's1', receiptId: 'r1' }))
    ).toEqual({ ok: false, status: 403 })
    route.memberActive = true
    expect(
      await call(syncRoute, event('POST', { ownerUserId: OWNER, storeId: 's1', receiptId: '../x' }))
    ).toEqual({ ok: false, status: 400 })
  })

  it('only the owner can change the rules', async () => {
    const settings = { ...LOYALTY_DEFAULT_SETTINGS, enabled: true }
    route.uid = 'cashier1'
    expect(
      await call(saveSettingsRoute, event('POST', { ownerUserId: OWNER, storeId: 's1', settings }))
    ).toEqual({ ok: false, status: 403 })
    route.uid = OWNER
    expect(
      await call(
        saveSettingsRoute,
        event('POST', {
          ownerUserId: OWNER,
          storeId: 's1',
          settings: { ...settings, spendPerPoint: 0 },
        })
      )
    ).toEqual({ ok: false, status: 400 })
    expect(
      await call(saveSettingsRoute, event('POST', { ownerUserId: OWNER, storeId: 's1', settings }))
    ).toMatchObject({ ok: true })
    expect(mem.docs.get(`users/${OWNER}/loyalty/settings`)).toMatchObject({
      enabled: true,
      updatedBy: OWNER,
    })
  })

  it('looks a customer up by phone with their tier', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-13T12:00:00Z'))
    seedSettings()
    seedSale('r1', { total: 600_000 })
    await sync('r1')
    const res = await call(
      membersRoute,
      event('GET', { ownerUserId: OWNER, storeId: 's1', phone: '+2348035465454' })
    )
    expect(res).toMatchObject({
      ok: true,
      value: { member: { points: 600, tier: { id: 'silver' }, next: { name: 'Gold' } } },
    })
    vi.useRealTimers()
  })
})
