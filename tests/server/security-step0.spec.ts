import { afterEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const userDocData = vi.hoisted(() => ({
  current: undefined as Record<string, unknown> | undefined,
}))

vi.mock('~/server/utils/firebase-admin', () => ({
  getAdminAuth: vi.fn(),
  getAdminFirestore: () => ({
    collection: () => ({
      doc: () => ({ get: async () => ({ data: () => userDocData.current }) }),
    }),
  }),
}))

import { resolveStaffWorkspaceOwnerId } from '~/server/utils/staff-workspace'
import { resolveTwoFactorEnabled } from '~/server/utils/store-auth'
import { TFA_ENABLED_CLAIM } from '~/server/utils/two-factor-claims'
import { isDevPlanSwitcherAllowed } from '~/server/utils/dev-plan-switcher'
import {
  isLegacyPaymentLinkRoute,
  legacyPaymentLinksEnabled,
} from '~/server/utils/legacy-payment-links'
import { assertRateLimit, trustedClientIp } from '~/server/utils/rate-limit'

function fakeEvent(headers: Record<string, string>, remoteAddress = '10.0.0.9'): H3Event {
  return {
    node: { req: { headers, socket: { remoteAddress } } },
  } as unknown as H3Event
}

describe('resolveStaffWorkspaceOwnerId', () => {
  it('takes the owner from the staff document path', () => {
    expect(resolveStaffWorkspaceOwnerId('users/owner1/stores/s1/departments/d1/staff/st1')).toBe(
      'owner1'
    )
  })

  it('rejects paths that are not staff documents', () => {
    expect(resolveStaffWorkspaceOwnerId('users/owner1/stores/s1')).toBeNull()
    expect(resolveStaffWorkspaceOwnerId('workspaceMembers/x/staff/a/b/c/d/e')).toBeNull()
    expect(resolveStaffWorkspaceOwnerId('')).toBeNull()
  })
})

describe('resolveTwoFactorEnabled', () => {
  afterEach(() => {
    userDocData.current = undefined
  })

  it('is enabled when the claim says so', async () => {
    userDocData.current = { twoFactorEnabled: false }
    await expect(
      resolveTwoFactorEnabled({ uid: 'u1', [TFA_ENABLED_CLAIM]: true } as never)
    ).resolves.toBe(true)
  })

  it('is still enabled when the claim is false but the server-written doc says enabled', async () => {
    userDocData.current = { twoFactorEnabled: true }
    await expect(
      resolveTwoFactorEnabled({ uid: 'u1', [TFA_ENABLED_CLAIM]: false } as never)
    ).resolves.toBe(true)
  })

  it('is off only when neither says enabled', async () => {
    userDocData.current = { twoFactorEnabled: false }
    await expect(resolveTwoFactorEnabled({ uid: 'u1' } as never)).resolves.toBe(false)
  })
})

describe('isDevPlanSwitcherAllowed', () => {
  it('refuses whenever a live Paystack key is configured', () => {
    expect(
      isDevPlanSwitcherAllowed({
        NODE_ENV: 'development',
        PAYSTACK_SECRET_KEY: 'sk_live_abc',
      } as never)
    ).toBe(false)
    expect(
      isDevPlanSwitcherAllowed({
        NUXT_PUBLIC_ALLOW_DEV_PLAN_SWITCHER: '1',
        PAYSTACK_SECRET_KEY: ' sk_live_abc ',
      } as never)
    ).toBe(false)
  })

  it('allows dev or flagged environments with a test key', () => {
    expect(
      isDevPlanSwitcherAllowed({
        NODE_ENV: 'development',
        PAYSTACK_SECRET_KEY: 'sk_test_abc',
      } as never)
    ).toBe(true)
    expect(
      isDevPlanSwitcherAllowed({
        NODE_ENV: 'production',
        NUXT_PUBLIC_ALLOW_DEV_PLAN_SWITCHER: 'true',
      } as never)
    ).toBe(true)
  })

  it('refuses in production without the flag', () => {
    expect(isDevPlanSwitcherAllowed({ NODE_ENV: 'production' } as never)).toBe(false)
  })
})

describe('legacy payment link guard', () => {
  it('matches every legacy money route', () => {
    expect(isLegacyPaymentLinkRoute('/api/pay/abc', 'GET')).toBe(true)
    expect(isLegacyPaymentLinkRoute('/api/pay/abc/initialize', 'POST')).toBe(true)
    expect(isLegacyPaymentLinkRoute('/api/pay/abc/verify?reference=x', 'GET')).toBe(true)
    expect(isLegacyPaymentLinkRoute('/api/storefront/shop/checkout', 'POST')).toBe(true)
    expect(isLegacyPaymentLinkRoute('/api/storefront/inquiries/i1/payment-link', 'post')).toBe(true)
    expect(isLegacyPaymentLinkRoute('/api/payment-links/create', 'POST')).toBe(true)
  })

  it('leaves unrelated routes alone', () => {
    expect(isLegacyPaymentLinkRoute('/api/paystack/webhook', 'POST')).toBe(false)
    expect(isLegacyPaymentLinkRoute('/api/payment-links/banks', 'GET')).toBe(false)
    expect(isLegacyPaymentLinkRoute('/api/storefront/shop/inquiries', 'POST')).toBe(false)
    expect(isLegacyPaymentLinkRoute('/api/payments-v2/anything', 'POST')).toBe(false)
    expect(isLegacyPaymentLinkRoute('/api/payable', 'GET')).toBe(false)
  })

  it('is off unless explicitly enabled', () => {
    expect(legacyPaymentLinksEnabled({} as never)).toBe(false)
    expect(legacyPaymentLinksEnabled({ LEGACY_PAYMENT_LINKS_ENABLED: 'true' } as never)).toBe(false)
    expect(legacyPaymentLinksEnabled({ LEGACY_PAYMENT_LINKS_ENABLED: '1' } as never)).toBe(true)
  })
})

describe('rate limit client identity', () => {
  it('ignores a spoofable x-forwarded-for header', () => {
    const event = fakeEvent({ 'x-forwarded-for': '1.2.3.4' })
    expect(trustedClientIp(event, {} as never)).toBe('10.0.0.9')
    expect(trustedClientIp(event, { VERCEL: '1' } as never)).toBe('10.0.0.9')
  })

  it('uses the Vercel platform header on Vercel', () => {
    const event = fakeEvent({
      'x-vercel-forwarded-for': '5.6.7.8, 9.9.9.9',
      'x-forwarded-for': '1.2.3.4',
    })
    expect(trustedClientIp(event, { VERCEL: '1' } as never)).toBe('5.6.7.8')
    expect(trustedClientIp(event, {} as never)).toBe('10.0.0.9')
  })
})

describe('rate limit fail-closed', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('refuses money routes in production without a distributed store', async () => {
    vi.stubEnv('KV_REST_API_URL', '')
    vi.stubEnv('KV_REST_API_TOKEN', '')
    vi.stubEnv('VERCEL_ENV', 'production')
    await expect(
      assertRateLimit(fakeEvent({}), {
        id: 't-closed',
        limit: 5,
        windowMs: 1000,
        requireDistributed: true,
      })
    ).rejects.toMatchObject({ statusCode: 503 })
  })

  it('falls back to memory for other routes and outside production', async () => {
    vi.stubEnv('KV_REST_API_URL', '')
    vi.stubEnv('KV_REST_API_TOKEN', '')
    vi.stubEnv('VERCEL_ENV', 'production')
    await expect(
      assertRateLimit(fakeEvent({}), { id: 't-open', limit: 5, windowMs: 1000 })
    ).resolves.toBeUndefined()

    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('NODE_ENV', 'test')
    await expect(
      assertRateLimit(fakeEvent({}), {
        id: 't-dev',
        limit: 5,
        windowMs: 1000,
        requireDistributed: true,
      })
    ).resolves.toBeUndefined()
  })

  it('returns 429 once the memory limit is hit', async () => {
    vi.stubEnv('KV_REST_API_URL', '')
    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('NODE_ENV', 'test')
    const opts = { id: 't-limit', limit: 2, windowMs: 60_000 }
    await assertRateLimit(fakeEvent({}), opts)
    await assertRateLimit(fakeEvent({}), opts)
    await expect(assertRateLimit(fakeEvent({}), opts)).rejects.toMatchObject({ statusCode: 429 })
  })
})
