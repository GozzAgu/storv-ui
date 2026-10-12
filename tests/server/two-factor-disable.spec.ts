import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const state = vi.hoisted(() => ({
  authOptions: undefined as Record<string, unknown> | undefined,
  authTime: 0,
  totpValid: true,
  cleared: [] as string[],
}))

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  readBody: async () => ({ totpCode: '123456' }),
}))
vi.mock('~/server/utils/store-auth', () => ({
  requireAuth: async (_event: unknown, options: Record<string, unknown>) => {
    state.authOptions = options
    return { uid: 'owner', authTime: state.authTime, twoFactorEnabled: true }
  },
  requireFreshTotp: async () => {
    if (!state.totpValid)
      throw Object.assign(new Error('Invalid verification code'), { statusCode: 401 })
  },
}))
vi.mock('~/server/utils/rate-limit', () => ({ assertRateLimit: async () => undefined }))
vi.mock('~/server/utils/two-factor', () => ({
  clearTwoFactor: async (uid: string) => {
    state.cleared.push(uid)
  },
}))

import disableHandler from '~/server/api/auth/2fa/disable.post'

const now = () => Math.floor(Date.now() / 1000)
const run = () => disableHandler({} as H3Event)

describe('disabling 2FA', () => {
  beforeEach(() => {
    state.authOptions = undefined
    state.authTime = now()
    state.totpValid = true
    state.cleared = []
  })

  it('accepts a fresh sign-in that has not passed 2FA yet and relies on the code', async () => {
    await expect(run()).resolves.toEqual({ success: true })
    expect(state.authOptions).toMatchObject({
      requireVerifiedEmail: true,
      allowPendingTwoFactor: true,
    })
    expect(state.cleared).toEqual(['owner'])
  })

  it('refuses a stale sign-in, so the password must have just been confirmed', async () => {
    state.authTime = now() - 10 * 60
    await expect(run()).rejects.toMatchObject({ statusCode: 401 })
    expect(state.cleared).toEqual([])
  })

  it('refuses a wrong authenticator code', async () => {
    state.totpValid = false
    await expect(run()).rejects.toMatchObject({ statusCode: 401 })
    expect(state.cleared).toEqual([])
  })
})
