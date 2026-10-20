import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const twoFactor = vi.hoisted(() => ({
  existingSecret: null as string | null,
  saved: vi.fn(),
  body: {} as Record<string, unknown>,
}))

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  readBody: async () => twoFactor.body,
}))
vi.mock('~/server/utils/store-auth', () => ({ requireAuth: async () => ({ uid: 'victim' }) }))
vi.mock('~/server/utils/rate-limit', () => ({ assertRateLimit: async () => undefined }))
vi.mock('~/server/utils/two-factor', () => ({
  getTwoFactorSecret: async () => twoFactor.existingSecret,
  saveTwoFactorSecret: twoFactor.saved,
}))

import setupHandler from '~/server/api/auth/2fa/setup.post'
import { assertStaffLoginTarget } from '~/server/utils/staff-login-target'
import { isListingOfStore } from '~/server/utils/storefront-public-dto'

describe('2FA setup cannot replace an existing authenticator', () => {
  beforeEach(() => {
    twoFactor.saved.mockReset()
    twoFactor.body = { secret: 'JBSWY3DPEHPK3PXPJBSWY3DP', code: '123456', method: 'totp' }
  })

  it('refuses when the account already has a secret, before checking the code', async () => {
    twoFactor.existingSecret = 'EXISTINGSECRETEXISTING'
    await expect(setupHandler({} as H3Event)).rejects.toMatchObject({
      statusCode: 409,
      data: { code: 'TFA_ALREADY_ENABLED' },
    })
    expect(twoFactor.saved).not.toHaveBeenCalled()
  })

  it('still lets an account without 2FA reach code validation', async () => {
    twoFactor.existingSecret = null
    await expect(setupHandler({} as H3Event)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid verification code',
    })
  })
})

/** `staff`: the staff records naming a login, as [owner, createdAt]. */
function fakeDb(userDocs: Record<string, boolean>, staff: Array<[string, string]> = []) {
  return {
    collection: () => ({
      doc: (id: string) => ({ get: async () => ({ exists: Boolean(userDocs[id]) }) }),
    }),
    collectionGroup: () => ({
      where: () => ({
        limit: () => ({
          get: async () => ({
            docs: staff.map(([owner, createdAt], i) => ({
              ref: { path: `users/${owner}/stores/s1/departments/d1/staff/st${i}` },
              data: () => ({ createdAt: new Date(createdAt) }),
            })),
          }),
        }),
      }),
    }),
  } as never
}

const LOGIN_CREATED = '2026-10-01T10:00:00.000Z'

function fakeAuth(users: Record<string, { email: string; owner?: string }>) {
  const claims = new Map<string, Record<string, unknown>>()
  return {
    stamped: claims,
    getUser: async (uid: string) => {
      if (!(uid in users))
        throw Object.assign(new Error('missing'), { code: 'auth/user-not-found' })
      const user = users[uid]!
      return {
        email: user.email,
        customClaims: claims.get(uid) ?? (user.owner ? { staffOwner: user.owner } : {}),
        metadata: { creationTime: LOGIN_CREATED },
      }
    },
    setCustomUserClaims: async (uid: string, value: Record<string, unknown>) => {
      claims.set(uid, value)
    },
  }
}

describe('staff routes only act on the owner’s staff logins', () => {
  const sameTime = { ownerUserId: 'owner1', staffCreatedAt: new Date(LOGIN_CREATED) }

  it('allows a staff login created for this business', async () => {
    const auth = fakeAuth({ staff1: { email: 'Ada@Shop.com', owner: 'owner1' } })
    await expect(
      assertStaffLoginTarget(fakeDb({}), auth as never, 'staff1', ' ada@shop.com ', sameTime)
    ).resolves.toBe(true)
  })

  it('refuses another business’s staff login even when the email matches', async () => {
    const auth = fakeAuth({ staff1: { email: 'ada@shop.com', owner: 'owner2' } })
    await expect(
      assertStaffLoginTarget(fakeDb({}), auth as never, 'staff1', 'ada@shop.com', sameTime)
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('accepts an older login made with this staff record, and records its business', async () => {
    const auth = fakeAuth({ staff1: { email: 'ada@shop.com' } })
    await expect(
      assertStaffLoginTarget(fakeDb({}), auth as never, 'staff1', 'ada@shop.com', sameTime)
    ).resolves.toBe(true)
    expect(auth.stamped.get('staff1')).toMatchObject({ staffOwner: 'owner1' })
  })

  it('accepts an existing staff member re-added later, when only this business has them', async () => {
    const auth = fakeAuth({ staff1: { email: 'ada@shop.com' } })
    const db = fakeDb({}, [['owner1', '2026-10-05T10:00:00.000Z']])
    await expect(
      assertStaffLoginTarget(db, auth as never, 'staff1', 'ada@shop.com', {
        ownerUserId: 'owner1',
        staffCreatedAt: new Date('2026-10-05T10:00:00.000Z'),
      })
    ).resolves.toBe(true)
    expect(auth.stamped.get('staff1')).toMatchObject({ staffOwner: 'owner1' })
  })

  it('refuses a business that pointed its record at another business’s login later', async () => {
    const auth = fakeAuth({ staff1: { email: 'ada@shop.com' } })
    // The real employer created the record with the login; the other one added theirs days later.
    const db = fakeDb({}, [
      ['owner1', LOGIN_CREATED],
      ['attacker', '2026-10-05T10:00:00.000Z'],
    ])
    await expect(
      assertStaffLoginTarget(db, auth as never, 'staff1', 'ada@shop.com', {
        ownerUserId: 'attacker',
        staffCreatedAt: new Date('2026-10-05T10:00:00.000Z'),
      })
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('refuses a business owner account', async () => {
    const auth = fakeAuth({ owner2: { email: 'boss@other.com' } })
    await expect(
      assertStaffLoginTarget(
        fakeDb({ owner2: true }),
        auth as never,
        'owner2',
        'boss@other.com',
        sameTime
      )
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('refuses a login whose email differs from the staff record', async () => {
    const auth = fakeAuth({ staff1: { email: 'ada@shop.com', owner: 'owner1' } })
    await expect(
      assertStaffLoginTarget(fakeDb({}), auth as never, 'staff1', 'someone@else.com', sameTime)
    ).rejects.toMatchObject({ statusCode: 403 })
    await expect(
      assertStaffLoginTarget(fakeDb({}), auth as never, 'staff1', undefined, sameTime)
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('reports a login that no longer exists', async () => {
    await expect(
      assertStaffLoginTarget(fakeDb({}), fakeAuth({}) as never, 'gone', 'x@y.com', sameTime)
    ).resolves.toBe(false)
  })
})

describe('storefront listings belong to the storefront owner', () => {
  it('matches only the same owner and store', () => {
    expect(isListingOfStore({ ownerUid: 'u1', storeId: 's1' }, 'u1', 's1')).toBe(true)
    expect(isListingOfStore({ ownerUid: 'u2', storeId: 's2' }, 'u1', 's1')).toBe(false)
    expect(isListingOfStore({ ownerUid: 'u1', storeId: 's2' }, 'u1', 's1')).toBe(false)
    expect(isListingOfStore({ ownerUid: '', storeId: '' }, undefined, undefined)).toBe(false)
  })
})
