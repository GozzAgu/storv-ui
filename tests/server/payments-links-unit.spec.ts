import { describe, expect, it } from 'vitest'
import {
  generateLinkToken,
  hashLinkToken,
  ipHashSalt,
  newCheckoutReference,
  parseCheckoutReference,
  resolveLinkExpiry,
  tokenHashFromParam,
} from '~/server/utils/payments/link-token'
import { requirePaystackLiveAllowed } from '~/server/utils/payments/config'
import { isPublicPayPath, isV2LinkToken, scrubPayPath } from '~/utils/pay-path'

const LINK_ID = 'A'.repeat(20)

describe('link tokens', () => {
  it('generates 43-character tokens and stores only their hash', () => {
    const { token, hash } = generateLinkToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(hash).toBe(hashLinkToken(token))
    expect(hash).not.toContain(token)
    expect(isV2LinkToken(token)).toBe(true)
    expect(isV2LinkToken('a'.repeat(40))).toBe(false)
  })

  it('treats malformed tokens as not found', () => {
    expect(tokenHashFromParam('short')).toBeNull()
    expect(tokenHashFromParam('a'.repeat(44))).toBeNull()
    expect(tokenHashFromParam(undefined)).toBeNull()
    expect(tokenHashFromParam('a'.repeat(43))).toBe(hashLinkToken('a'.repeat(43)))
  })

  it('bounds expiry to 1 hour .. 7 days, default 24 hours', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    expect(resolveLinkExpiry(undefined, now)).toBe('2026-01-02T00:00:00.000Z')
    expect(resolveLinkExpiry(1, now)).toBe('2026-01-01T01:00:00.000Z')
    expect(resolveLinkExpiry(168, now)).toBe('2026-01-08T00:00:00.000Z')
    for (const bad of [0, 169, 2.5, 'abc', -1]) expect(() => resolveLinkExpiry(bad, now)).toThrow()
  })

  it('builds references from the link ID, never the token', () => {
    const ref = newCheckoutReference(LINK_ID)
    expect(parseCheckoutReference(ref)).toEqual({ linkId: LINK_ID, reference: ref })
    expect(parseCheckoutReference('stvp_bad')).toBeNull()
    expect(() => newCheckoutReference('short')).toThrow()
  })
})

describe('pay path scrubbing', () => {
  const token = 'Ab_-'.repeat(10) + 'xyz'
  it('removes tokens from page, API and legacy paths but keeps the return page', () => {
    expect(scrubPayPath(`https://app.storvv.com/pay/${token}?x=1`)).toBe(
      'https://app.storvv.com/pay/[token]?x=1'
    )
    expect(scrubPayPath(`/api/paylink/${token}/checkout`)).toBe('/api/paylink/[token]/checkout')
    expect(scrubPayPath(`/api/pay/${'a'.repeat(40)}/verify`)).toBe('/api/pay/[token]/verify')
    expect(scrubPayPath('/pay/return?ref=stvp_x')).toBe('/pay/return?ref=stvp_x')
    expect(scrubPayPath('/api/paylink/return?ref=stvp_x')).toBe('/api/paylink/return?ref=stvp_x')
    expect(isPublicPayPath('/pay/abc')).toBe(true)
    expect(isPublicPayPath('/payments/awaiting')).toBe(false)
  })
})

describe('IP hash salt', () => {
  it('fails closed without a long secret salt', () => {
    expect(ipHashSalt({} as NodeJS.ProcessEnv)).toBeNull()
    expect(ipHashSalt({ PAYMENTS_IP_HASH_SALT: 'storvv-pay' } as NodeJS.ProcessEnv)).toBeNull()
    expect(ipHashSalt({ PAYMENTS_IP_HASH_SALT: 'x'.repeat(16) } as NodeJS.ProcessEnv)).toBe(
      'x'.repeat(16)
    )
  })
})

describe('Paystack live gate for payout routes', () => {
  it('lets test keys through and blocks live keys without approval', async () => {
    await expect(
      requirePaystackLiveAllowed({ PAYSTACK_SECRET_KEY: 'sk_test_x' } as NodeJS.ProcessEnv)
    ).resolves.toBeUndefined()
    await expect(requirePaystackLiveAllowed({} as NodeJS.ProcessEnv)).resolves.toBeUndefined()
    await expect(
      requirePaystackLiveAllowed({ PAYSTACK_SECRET_KEY: 'sk_live_x' } as NodeJS.ProcessEnv)
    ).rejects.toMatchObject({ statusCode: 503, data: { code: 'PAYSTACK_LIVE_BLOCKED' } })
    await expect(
      requirePaystackLiveAllowed({
        PAYSTACK_SECRET_KEY: 'sk_live_x',
        PAYMENTS_V2_ALLOW_LIVE: '1',
      } as NodeJS.ProcessEnv)
    ).rejects.toMatchObject({ statusCode: 503 })
  })
})
