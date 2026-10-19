import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const m = vi.hoisted(() => ({
  query: {} as Record<string, string>,
  headers: {} as Record<string, string>,
  body: {} as Record<string, unknown>,
  slug: 'ada',
  docs: {} as Record<string, Record<string, unknown> | undefined>,
  writes: [] as string[],
  readAccess: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  getQuery: () => m.query,
  getHeader: (_e: unknown, name: string) => m.headers[name.toLowerCase()],
  getRouterParam: () => m.slug,
  readBody: async () => m.body,
}))
vi.mock('~/server/utils/rate-limit', () => ({ assertRateLimit: async () => undefined }))
vi.mock('~/server/utils/store-auth', () => ({ requireStoreReadAccess: m.readAccess }))

function fakeDoc(path: string): unknown {
  return {
    collection: (name: string) => fakeCollection(`${path}/${name}`),
    get: async () => ({ exists: m.docs[path] !== undefined, data: () => m.docs[path] }),
    set: async () => {
      m.writes.push(path)
    },
  }
}
function fakeCollection(path: string) {
  return { doc: (id: string) => fakeDoc(`${path}/${id}`) }
}
vi.mock('~/server/utils/firebase-admin', () => ({
  getAdminFirestore: () => ({ collection: (name: string) => fakeCollection(name) }),
  getAdminAuth: () => ({
    verifyIdToken: async (token: string) => {
      if (token === 'owner-token') return { uid: 'owner1' }
      if (token === 'staff-token') return { uid: 'staff1' }
      if (token === 'other-token') return { uid: 'other' }
      throw new Error('bad token')
    },
  }),
}))

import slugAvailable from '~/server/api/storefront/slug-available.get'
import viewPing from '~/server/api/storefront/[slug]/view.post'

const event = {} as H3Event

describe('GET /api/storefront/slug-available', () => {
  beforeEach(() => {
    m.docs = { 'storefronts/ada': { ownerUid: 'owner1', storeId: 's1' } }
    m.headers = {}
    m.readAccess.mockImplementation(async (uid: string) => {
      if (uid !== 'staff1') throw new Error('forbidden')
    })
  })

  it('answers only available or not for anonymous callers, even with ownerUid', async () => {
    m.query = { slug: 'ada', ownerUid: 'owner1' }
    expect(await slugAvailable(event)).toEqual({ available: false })
    m.query = { slug: 'free-slug', ownerUid: 'owner1' }
    expect(await slugAvailable(event)).toEqual({ available: true })
  })

  it('treats a slug as available to its signed-in owner or store staff', async () => {
    m.query = { slug: 'ada' }
    m.headers = { authorization: 'Bearer owner-token' }
    expect(await slugAvailable(event)).toEqual({ available: true })
    m.headers = { authorization: 'Bearer staff-token' }
    expect(await slugAvailable(event)).toEqual({ available: true })
  })

  it('reports taken to other accounts and invalid tokens', async () => {
    m.query = { slug: 'ada', ownerUid: 'owner1' }
    m.headers = { authorization: 'Bearer other-token' }
    expect(await slugAvailable(event)).toEqual({ available: false })
    m.headers = { authorization: 'Bearer forged' }
    expect(await slugAvailable(event)).toEqual({ available: false })
  })
})

describe('POST /api/storefront/[slug]/view', () => {
  beforeEach(() => {
    m.writes = []
    m.slug = 'ada'
    m.docs = {
      'storefronts/ada': { isPublished: true, ownerUid: 'owner1', storeId: 's1' },
      'storefrontListings/ada/items/mine': { isListed: true, ownerUid: 'owner1', storeId: 's1' },
      'storefrontListings/ada/items/planted': {
        isListed: true,
        ownerUid: 'intruder',
        storeId: 'x',
      },
    }
  })

  it('counts views on the store owner’s own listings', async () => {
    m.body = { listingId: 'mine' }
    expect(await viewPing(event)).toEqual({ success: true })
    expect(m.writes).toHaveLength(2)
  })

  it('refuses a listing written by another account', async () => {
    m.body = { listingId: 'planted' }
    await expect(viewPing(event)).rejects.toMatchObject({ statusCode: 404 })
    expect(m.writes).toHaveLength(0)
  })
})
