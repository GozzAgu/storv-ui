import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const m = vi.hoisted(() => ({
  body: {} as unknown,
  headers: {} as Record<string, string>,
  params: {} as Record<string, string>,
  docs: {} as Record<string, Record<string, unknown>>,
  added: [] as Array<{ path: string; data: Record<string, unknown> }>,
  updates: [] as Array<{ path: string; data: Record<string, unknown> }>,
  status: 200,
  auth: { uid: 'u1', email: 'team@storvv.com', emailVerified: true } as Record<string, unknown>,
  sent: [] as unknown[],
}))

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  readBody: async () => m.body,
  getHeader: (_e: unknown, name: string) => m.headers[name.toLowerCase()],
  getRouterParam: (_e: unknown, name: string) => m.params[name],
  setResponseStatus: (_e: unknown, code: number) => {
    m.status = code
  },
}))
vi.mock('~/server/utils/rate-limit', () => ({ assertRateLimit: async () => undefined }))
vi.mock('~/server/utils/store-auth', () => ({ requireAuth: async () => m.auth }))
vi.mock('~/server/utils/delivery-config', () => ({
  getResendConfig: () => ({ apiKey: 're_test', from: 'hello@storvv.com' }),
}))
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => '__ts__',
    increment: (n: number) => ({ __inc: n }),
  },
}))

function applyUpdate(target: Record<string, unknown>, data: Record<string, unknown>) {
  for (const [path, value] of Object.entries(data)) {
    const keys = path.split('.')
    let node = target
    for (const key of keys.slice(0, -1)) {
      node[key] = (node[key] as Record<string, unknown>) ?? {}
      node = node[key] as Record<string, unknown>
    }
    const last = keys[keys.length - 1]
    const inc = (value as { __inc?: number })?.__inc
    node[last] = inc !== undefined ? (Number(node[last]) || 0) + inc : value
  }
}

function docRef(path: string) {
  return {
    id: path.split('/').pop(),
    get: async () => ({ exists: path in m.docs, data: () => m.docs[path] }),
    set: (data: Record<string, unknown>) => {
      m.docs[path] = { ...data }
    },
    update: async (data: Record<string, unknown>) => {
      if (!(path in m.docs)) throw new Error('missing')
      m.updates.push({ path, data })
      applyUpdate(m.docs[path], data)
    },
  }
}

let autoId = 0
const db = {
  collection: (name: string) => ({
    doc: (id: string) => docRef(`${name}/${id}`),
    add: async (data: Record<string, unknown>) => {
      const id = `lead${++autoId}`
      m.docs[`${name}/${id}`] = data
      m.added.push({ path: `${name}/${id}`, data })
      return { id }
    },
    orderBy: () => ({
      limit: () => ({
        get: async () => ({
          docs: Object.entries(m.docs)
            .filter(([p]) => p.startsWith(`${name}/`))
            .map(([p, data]) => ({ id: p.split('/')[1], data: () => data })),
        }),
      }),
    }),
  }),
  runTransaction: async (fn: (tx: unknown) => Promise<void>) => {
    const ops: Array<() => void> = []
    await fn({
      get: (ref: ReturnType<typeof docRef>) => ref.get(),
      set: (ref: ReturnType<typeof docRef>, data: Record<string, unknown>) =>
        ops.push(() => ref.set(data)),
      update: (ref: ReturnType<typeof docRef>, data: Record<string, unknown>) =>
        ops.push(() => applyUpdate(m.docs[`demoSessions/${ref.id}`], data)),
    })
    ops.forEach((op) => op())
  },
}
vi.mock('~/server/utils/firebase-admin', () => ({ getAdminFirestore: () => db }))

vi.stubGlobal('useRuntimeConfig', () => ({
  demoLeadsNotifyEmail: 'sales@storvv.com',
  storvvTeamEmails: 'team@storvv.com, boss@storvv.com',
}))

import track from '~/server/api/demo/track.post'
import leads from '~/server/api/demo/leads.post'
import insights from '~/server/api/demo/insights.get'
import setStatus from '~/server/api/demo/leads/[id].patch'

const event = {} as H3Event
const VISITOR = 'v'.repeat(32)
const SESSION = 's'.repeat(32)

beforeEach(() => {
  m.body = {}
  m.headers = { 'user-agent': 'Mozilla/5.0 (iPhone)' }
  m.params = {}
  m.docs = {}
  m.added = []
  m.updates = []
  m.status = 200
  m.auth = { uid: 'u1', email: 'team@storvv.com', emailVerified: true }
  m.sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: { body: string }) => {
      m.sent.push(JSON.parse(init.body))
      return { ok: true, json: async () => ({}) }
    })
  )
})

describe('POST /api/demo/track', () => {
  it('stores nothing: demo activity is no longer written to Firestore', async () => {
    m.body = {
      visitorId: VISITOR,
      sessionId: SESSION,
      events: [
        { type: 'page', path: '/demo/dashboard', seconds: 40 },
        { type: 'action', name: 'sale_created' },
      ],
    }
    await track(event)
    expect(m.status).toBe(204)
    expect(m.docs).toEqual({})

    // Old tabs may still send a beacon (text body, or junk): it is accepted and dropped.
    m.body = 'not json'
    expect(await track(event)).toBeNull()
    expect(m.docs).toEqual({})
  })
})

describe('POST /api/demo/leads', () => {
  it('emails the team and saves nothing to Firestore', async () => {
    m.body = {
      name: 'Ada Obi',
      business: 'Ada Gadgets',
      phone: '+234 803 000 0000',
      source: 'demo_exit',
      visitorId: VISITOR,
      sessionId: SESSION,
    }
    await expect(leads(event)).resolves.toEqual({ success: true })

    expect(m.added).toHaveLength(0)
    expect(m.docs).toEqual({})

    const email = m.sent[0] as { to: string[]; subject: string; html: string }
    expect(email.to).toEqual(['sales@storvv.com'])
    expect(email.subject).toContain('Ada Obi (Ada Gadgets)')
    expect(email.html).toContain('+2348030000000')
  })

  it('tells the visitor when the email could not be sent, so the request is not lost', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))
    )
    m.body = { name: 'Ada', email: 'ada@shop.ng' }
    await expect(leads(event)).rejects.toMatchObject({ statusCode: 503 })
    expect(m.added).toHaveLength(0)
  })

  it('escapes what visitors type in the email', async () => {
    m.body = { name: '<img src=x onerror=alert(1)>', email: 'ada@shop.ng' }
    await leads(event)
    const email = m.sent[0] as { html: string }
    expect(email.html).not.toContain('<img')
    expect(email.html).toContain('&lt;img')
  })

  it('quietly drops bot submissions and rejects invalid ones', async () => {
    m.body = { name: 'Bot', email: 'bot@x.io', website: 'http://spam' }
    await expect(leads(event)).resolves.toEqual({ success: true })
    expect(m.added).toHaveLength(0)

    m.body = { name: 'Ada' }
    await expect(leads(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { field: 'phone' },
    })
  })
})

describe('Team-only routes', () => {
  beforeEach(() => {
    m.docs['demoLeads/l1'] = { name: 'Ada', status: 'new', activity: null }
    m.docs[`demoSessions/${SESSION}`] = {
      visitorId: VISITOR,
      activeSeconds: 720,
      pages: { dashboard: { views: 1, seconds: 720 } },
    }
  })

  it('lets a team member see requests and visits', async () => {
    const data = await insights(event)
    expect(data.leads).toHaveLength(1)
    expect(data.leads[0]).toMatchObject({ name: 'Ada', interest: 'hot' })
    expect(data.sessions[0]).toMatchObject({ activeSeconds: 720, interest: 'hot' })
  })

  it('refuses anyone not on the team, or with an unverified email', async () => {
    m.auth = { uid: 'u2', email: 'owner@shop.ng', emailVerified: true }
    await expect(insights(event)).rejects.toMatchObject({ statusCode: 403 })
    m.auth = { uid: 'u3', email: 'team@storvv.com', emailVerified: false }
    await expect(insights(event)).rejects.toMatchObject({ statusCode: 403 })
    m.params = { id: 'l1' }
    m.body = { status: 'contacted' }
    await expect(setStatus(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(m.docs['demoLeads/l1'].status).toBe('new')
  })

  it('lets the team move a request along, with known statuses only', async () => {
    m.auth = { uid: 'u4', email: 'Boss@Storvv.com', emailVerified: true }
    m.params = { id: 'l1' }
    m.body = { status: 'booked' }
    await setStatus(event)
    expect(m.docs['demoLeads/l1']).toMatchObject({
      status: 'booked',
      statusChangedBy: 'Boss@Storvv.com',
    })

    m.body = { status: 'deleted' }
    await expect(setStatus(event)).rejects.toMatchObject({ statusCode: 400 })
    m.params = { id: '../users/x' }
    await expect(setStatus(event)).rejects.toMatchObject({ statusCode: 400 })
  })
})
