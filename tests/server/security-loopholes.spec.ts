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

function fakeDb(userDocs: Record<string, boolean>) {
  return {
    collection: () => ({
      doc: (id: string) => ({ get: async () => ({ exists: Boolean(userDocs[id]) }) }),
    }),
  } as never
}

function fakeAuth(users: Record<string, string>) {
  return {
    getUser: async (uid: string) => {
      if (!(uid in users)) throw Object.assign(new Error('missing'), { code: 'auth/user-not-found' })
      return { email: users[uid] }
    },
  } as never
}

describe('staff routes only act on the owner’s staff logins', () => {
  const auth = fakeAuth({ staff1: 'Ada@Shop.com', owner2: 'boss@other.com' })

  it('allows a staff login whose email matches the record', async () => {
    await expect(
      assertStaffLoginTarget(fakeDb({}), auth, 'staff1', ' ada@shop.com ')
    ).resolves.toBe(true)
  })

  it('refuses a business owner account', async () => {
    await expect(
      assertStaffLoginTarget(fakeDb({ owner2: true }), auth, 'owner2', 'boss@other.com')
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('refuses a login whose email differs from the staff record', async () => {
    await expect(
      assertStaffLoginTarget(fakeDb({}), auth, 'staff1', 'someone@else.com')
    ).rejects.toMatchObject({ statusCode: 403 })
    await expect(assertStaffLoginTarget(fakeDb({}), auth, 'staff1', undefined)).rejects.toMatchObject(
      { statusCode: 403 }
    )
  })

  it('reports a login that no longer exists', async () => {
    await expect(assertStaffLoginTarget(fakeDb({}), auth, 'gone', 'x@y.com')).resolves.toBe(false)
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
