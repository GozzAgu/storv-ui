// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { checkVerifiedCharge } from '~/server/utils/payments/paystack-verify'
import { isLinkReference, webhookIpAllowed } from '~/server/utils/payments/webhook-guard'
import { classifyLegacyLink, fingerprint } from '~/scripts/payments/report-legacy-payment-links.mjs'

const REF = `stvp_${'a'.repeat(20)}_${'0'.repeat(16)}`
const EXPECTED = { reference: REF, amountKobo: 10_000, subaccountCode: 'ACCT_test1' }
const ok = (over: Record<string, unknown> = {}) => ({
  id: 4099260516,
  status: 'success',
  reference: REF,
  amount: 10_000,
  currency: 'NGN',
  channel: 'card',
  paid_at: '2026-10-09T10:00:00.000Z',
  fees: 250,
  subaccount: { subaccount_code: 'ACCT_test1' },
  customer: { email: 'Payer@Example.com' },
  ...over,
})

describe('checkVerifiedCharge', () => {
  it('accepts a charge that matches every stored field', () => {
    expect(checkVerifiedCharge(ok(), EXPECTED)).toEqual({
      ok: true,
      charge: {
        reference: REF,
        amountKobo: 10_000,
        transactionId: '4099260516',
        channel: 'card',
        paidAt: '2026-10-09T10:00:00.000Z',
        feesKobo: 250,
        payerEmail: 'payer@example.com',
      },
    })
  })

  it('drops a payer email that does not look like an address', () => {
    for (const customer of [{ email: 'x<script>@a.co' }, { email: 5 }, null, {}]) {
      const res = checkVerifiedCharge(ok({ customer }), EXPECTED)
      expect(res).toMatchObject({ ok: true, charge: { payerEmail: null } })
    }
  })

  it.each([
    ['failed', 'NOT_SUCCESSFUL', false],
    ['abandoned', 'NOT_SUCCESSFUL', false],
    ['reversed', 'NOT_SUCCESSFUL', false],
    ['pending', 'STILL_PENDING', true],
    ['ongoing', 'STILL_PENDING', true],
    ['processing', 'STILL_PENDING', true],
    ['queued', 'STILL_PENDING', true],
  ])('status %s → %s (retryable %s)', (status, code, retryable) => {
    expect(checkVerifiedCharge(ok({ status }), EXPECTED)).toMatchObject({
      ok: false,
      code,
      retryable,
      paystackStatus: status,
    })
  })

  it.each([
    ['another reference', { reference: `${REF.slice(0, -1)}1` }, 'REFERENCE_MISMATCH'],
    ['a foreign currency', { currency: 'USD' }, 'CURRENCY_MISMATCH'],
    ['a smaller amount', { amount: 9_999 }, 'AMOUNT_MISMATCH'],
    ['fees passed to the customer', { amount: 10_250 }, 'AMOUNT_MISMATCH'],
    ['an amount as a string', { amount: '10000' }, 'AMOUNT_MISMATCH'],
    ['a fractional amount', { amount: 10_000.5 }, 'AMOUNT_MISMATCH'],
    ["Paystack's documented unsplit shape", { subaccount: {} }, 'SUBACCOUNT_MISSING'],
    ['no subaccount', { subaccount: null }, 'SUBACCOUNT_MISSING'],
    [
      'another subaccount',
      { subaccount: { subaccount_code: 'ACCT_other' } },
      'SUBACCOUNT_MISMATCH',
    ],
    ['no transaction id', { id: undefined }, 'MALFORMED'],
  ])('fails closed on %s', (_label, over, code) => {
    expect(checkVerifiedCharge(ok(over), EXPECTED)).toMatchObject({
      ok: false,
      code,
      retryable: false,
    })
  })

  it('fails closed on a malformed body', () => {
    expect(checkVerifiedCharge(null, EXPECTED)).toMatchObject({ ok: false, code: 'MALFORMED' })
    expect(checkVerifiedCharge('x', EXPECTED)).toMatchObject({ ok: false, code: 'MALFORMED' })
    expect(checkVerifiedCharge({}, EXPECTED)).toMatchObject({ ok: false, code: 'NOT_SUCCESSFUL' })
  })

  it('tolerates missing optional fields without inventing values', () => {
    const res = checkVerifiedCharge(
      ok({ fees: undefined, paid_at: 'nonsense', channel: 5 }),
      EXPECTED
    )
    expect(res).toMatchObject({
      ok: true,
      charge: { feesKobo: null, paidAt: '', channel: 'unknown' },
    })
  })
})

describe('webhook guard', () => {
  const eventFrom = (ip: string, header?: string) =>
    ({
      node: {
        req: {
          headers: header ? { 'x-vercel-forwarded-for': header } : {},
          socket: { remoteAddress: ip },
        },
      },
    } as never)

  it('recognises only Storvv link references', () => {
    expect(isLinkReference(REF)).toBe(true)
    expect(isLinkReference('T123456')).toBe(false)
    expect(isLinkReference(`${REF}x`)).toBe(false)
    expect(isLinkReference(undefined)).toBe(false)
  })

  it('allows every IP when no allowlist is set, and only listed IPs when it is', () => {
    expect(webhookIpAllowed(eventFrom('1.2.3.4'), {} as NodeJS.ProcessEnv)).toBe(true)
    const env = { PAYSTACK_WEBHOOK_IPS: '52.31.139.75, 52.49.173.169' } as NodeJS.ProcessEnv
    expect(webhookIpAllowed(eventFrom('52.49.173.169'), env)).toBe(true)
    expect(webhookIpAllowed(eventFrom('1.2.3.4'), env)).toBe(false)
  })

  it('on Vercel trusts the platform header, not the socket', () => {
    const env = { VERCEL: '1', PAYSTACK_WEBHOOK_IPS: '52.31.139.75' } as NodeJS.ProcessEnv
    expect(webhookIpAllowed(eventFrom('10.0.0.1', '52.31.139.75'), env)).toBe(true)
    expect(webhookIpAllowed(eventFrom('52.31.139.75', '9.9.9.9'), env)).toBe(false)
  })
})

describe('legacy link report helpers', () => {
  it('never exposes the doc ID (it is the pay token)', () => {
    const token = 'f'.repeat(40)
    const fp = fingerprint(token)
    expect(fp).toMatch(/^fp:[0-9a-f]{16}$/)
    expect(fp).not.toContain(token.slice(0, 8))
  })

  it('buckets links by what the owner must act on', () => {
    const now = Date.parse('2026-10-09T00:00:00Z')
    expect(classifyLegacyLink({ status: 'unpaid', expiresAt: '2026-10-10T00:00:00Z' }, now)).toBe(
      'open'
    )
    expect(classifyLegacyLink({ status: 'unpaid', expiresAt: '2026-10-08T00:00:00Z' }, now)).toBe(
      'unpaid_expired'
    )
    expect(classifyLegacyLink({ status: 'paid', inventoryApplied: true }, now)).toBe('paid')
    expect(classifyLegacyLink({ status: 'paid', inventoryApplied: false }, now)).toBe(
      'paid_needs_review'
    )
    expect(classifyLegacyLink({ status: 'paid', settleError: 'sold' }, now)).toBe(
      'paid_needs_review'
    )
    expect(classifyLegacyLink({ status: 'expired' }, now)).toBe('expired')
  })
})
