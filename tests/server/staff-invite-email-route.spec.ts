import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const m = vi.hoisted(() => ({
  body: {} as Record<string, unknown>,
  docs: {} as Record<string, Record<string, unknown> | undefined>,
  sendCredentials: vi.fn(),
  sendReset: vi.fn(),
  resetLink: vi.fn(),
  rateLimit: vi.fn(),
}))

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  readBody: async () => m.body,
}))
vi.mock('~/server/utils/store-auth', () => ({ requireAuth: async () => ({ uid: 'owner1' }) }))
vi.mock('~/server/utils/rate-limit', () => ({ assertRateLimit: m.rateLimit }))
vi.mock('~/server/utils/staff-admin', () => ({
  resolveStaffManager: async () => ({ uid: 'owner1', isOwner: true }),
  assertCanManageTarget: () => undefined,
}))
vi.mock('~/server/utils/staff-login-target', () => ({
  assertStaffLoginTarget: async () => false,
}))
vi.mock('~/server/utils/staff-invite-email', () => ({
  isResendConfigured: () => true,
  sendStaffCredentialsInviteEmail: m.sendCredentials,
  sendStaffResetLinkInviteEmail: m.sendReset,
  generateStaffPasswordResetLink: m.resetLink,
}))

function fakeDoc(path: string): unknown {
  return {
    collection: (name: string) => fakeCollection(`${path}/${name}`),
    get: async () => ({ exists: m.docs[path] !== undefined, data: () => m.docs[path] }),
  }
}
function fakeCollection(path: string) {
  return { doc: (id: string) => fakeDoc(`${path}/${id}`) }
}
vi.mock('~/server/utils/firebase-admin', () => ({
  getAdminFirestore: () => ({ collection: (name: string) => fakeCollection(name) }),
  getAdminAuth: () => ({}),
}))
vi.stubGlobal('useRuntimeConfig', () => ({ public: { appOrigin: 'https://app.storvv.com' } }))

import handler from '~/server/api/staff/send-invite-email.post'

const STAFF = 'users/owner1/stores/s1/departments/d1/staff/st1'
const event = {} as H3Event

async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise
  } catch (err) {
    return (err as { statusCode?: number }).statusCode
  }
  return undefined
}

describe('POST /api/staff/send-invite-email', () => {
  beforeEach(() => {
    m.docs = {
      'users/owner1': { name: 'Ada', storeDetails: { storeName: 'Ada Phones' } },
      'users/owner1/stores/s1/departments/d1': { name: 'Sales floor' },
      [STAFF]: { email: 'Staff@Example.com', firstName: 'Tunde', lastName: 'Bello' },
    }
    m.body = {
      ownerUserId: 'owner1',
      storeId: 's1',
      departmentId: 'd1',
      staffId: 'st1',
      staffEmail: 'victim@elsewhere.com',
      staffName: '<b>Click here</b>',
      businessName: 'Your Bank',
      temporaryPassword: 'Temp-pass-123',
      mode: 'credentials',
    }
  })

  it('sends to the saved email with names from saved records, ignoring the body', async () => {
    await handler(event)
    expect(m.sendCredentials).toHaveBeenCalledTimes(1)
    expect(m.sendCredentials.mock.calls[0][0]).toMatchObject({
      toEmail: 'staff@example.com',
      staffName: 'Tunde Bello',
      businessName: 'Ada Phones',
      departmentName: 'Sales floor',
      temporaryPassword: 'Temp-pass-123',
    })
  })

  it('refuses when the staff record has no email', async () => {
    m.docs[STAFF] = { firstName: 'Tunde' }
    expect(await statusOf(handler(event))).toBe(400)
    expect(m.sendCredentials).not.toHaveBeenCalled()
  })

  it('falls back to the owner name when there is no store name', async () => {
    m.docs['users/owner1'] = { name: 'Ada' }
    await handler(event)
    expect(m.sendCredentials.mock.calls[0][0].businessName).toBe('Ada')
  })

  it('applies a per-account daily cap', async () => {
    await handler(event)
    expect(m.rateLimit).toHaveBeenCalledWith(
      event,
      expect.objectContaining({ uid: 'owner1', limit: 30, windowMs: 86_400_000 })
    )
  })
})
