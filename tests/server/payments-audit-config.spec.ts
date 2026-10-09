import { describe, expect, it } from 'vitest'
import {
  buildAuditEvent,
  canonicalJson,
  GENESIS_HASH,
  verifyChain,
  type AuditEventBody,
  type AuditEventRecord,
} from '~/server/utils/payments/audit-hash'
import {
  evaluatePaymentsV2Gate,
  isPaystackDecisionsApproved,
  paymentLinksAllowedForPlan,
} from '~/server/utils/payments/config'
import { isValidCronAuthorization } from '~/server/utils/cron-auth'

function body(seq: number, overrides: Partial<AuditEventBody> = {}): AuditEventBody {
  return {
    seq,
    type: 'claimed',
    paymentId: `p${seq}`,
    receiptId: 'r1',
    linkId: null,
    actorUid: 'cashier1',
    actorKind: 'member',
    amountKobo: 1000 * seq,
    currency: 'NGN',
    fromStatus: null,
    toStatus: 'awaiting_confirmation',
    reason: null,
    flags: [],
    at: `2026-10-07T10:00:0${seq % 10}.000Z`,
    ...overrides,
  }
}

function chain(n: number): AuditEventRecord[] {
  const out: AuditEventRecord[] = []
  let prev = GENESIS_HASH
  for (let i = 1; i <= n; i++) {
    const e = buildAuditEvent(prev, body(i))
    out.push(e)
    prev = e.hash
  }
  return out
}

describe('canonicalJson', () => {
  it('sorts keys at every level and drops undefined', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: undefined, b: [3, { z: 1, y: 2 }] } })).toBe(
      '{"a":{"b":[3,{"y":2,"z":1}],"d":2},"b":1}'
    )
  })
})

describe('audit hash chain', () => {
  it('verifies an intact chain and reports the head', () => {
    const events = chain(5)
    expect(verifyChain(events, { head: { seq: 5, hash: events[4]!.hash } })).toEqual({
      ok: true,
      checked: 5,
      head: { seq: 5, hash: events[4]!.hash },
    })
  })

  it('reports the first edited event', () => {
    const events = chain(5)
    events[2] = { ...events[2]!, amountKobo: 1 }
    expect(verifyChain(events)).toMatchObject({
      ok: false,
      firstBreak: { seq: 3, reason: 'hash_mismatch' },
    })
  })

  it('reports a deleted event in the middle', () => {
    const events = chain(5).filter((e) => e.seq !== 2)
    expect(verifyChain(events)).toMatchObject({
      ok: false,
      firstBreak: { seq: 2, reason: 'seq_gap' },
    })
  })

  it('reports deleted events at the end through the head', () => {
    const events = chain(5)
    expect(
      verifyChain(events.slice(0, 3), { head: { seq: 5, hash: events[4]!.hash } })
    ).toMatchObject({
      ok: false,
      firstBreak: { seq: 4, reason: 'head_mismatch' },
    })
  })

  it('reports a rewritten chain through a daily anchor', () => {
    const original = chain(4)
    let prev = GENESIS_HASH
    const rewritten = original.map((e) => {
      const next = buildAuditEvent(prev, {
        ...body(e.seq),
        amountKobo: e.seq === 2 ? 1 : e.amountKobo,
      })
      prev = next.hash
      return next
    })
    expect(verifyChain(rewritten)).toMatchObject({ ok: true })
    expect(
      verifyChain(rewritten, { anchors: [{ date: '2026-10-07', seq: 3, hash: original[2]!.hash }] })
    ).toMatchObject({ ok: false, firstBreak: { seq: 3, reason: 'anchor_mismatch' } })
  })

  it('ignores extra Firestore fields like createdAt', () => {
    const events = chain(2).map((e) => ({ ...e, createdAt: { seconds: 1 } }))
    expect(verifyChain(events)).toMatchObject({ ok: true })
  })
})

describe('Payments V2 gate', () => {
  const approved = 'Payments\n\nStatus: approved\n'

  it('is off unless PAYMENTS_V2_ENABLED=1', () => {
    expect(evaluatePaymentsV2Gate({} as never, null)).toMatchObject({
      enabled: false,
      reason: 'flag_off',
    })
  })

  it('runs in test mode with only the flag', () => {
    expect(
      evaluatePaymentsV2Gate(
        { PAYMENTS_V2_ENABLED: '1', PAYSTACK_SECRET_KEY: 'sk_test_x' } as never,
        null
      )
    ).toEqual({ enabled: true, live: false })
  })

  it('blocks a live key without PAYMENTS_V2_ALLOW_LIVE', () => {
    expect(
      evaluatePaymentsV2Gate(
        { PAYMENTS_V2_ENABLED: '1', PAYSTACK_SECRET_KEY: 'sk_live_x' } as never,
        approved
      )
    ).toMatchObject({ enabled: false, reason: 'live_key_without_allow' })
  })

  it('blocks a live key until the decisions doc is approved', () => {
    const env = {
      PAYMENTS_V2_ENABLED: '1',
      PAYMENTS_V2_ALLOW_LIVE: '1',
      PAYSTACK_SECRET_KEY: 'sk_live_x',
    } as never
    expect(evaluatePaymentsV2Gate(env, null)).toMatchObject({
      enabled: false,
      reason: 'live_decisions_not_approved',
    })
    expect(evaluatePaymentsV2Gate(env, 'Status: draft')).toMatchObject({ enabled: false })
    expect(evaluatePaymentsV2Gate(env, approved)).toEqual({ enabled: true, live: true })
  })

  it('accepts only an exact Status: approved line', () => {
    expect(isPaystackDecisionsApproved('Status: approved')).toBe(true)
    expect(isPaystackDecisionsApproved('status:   Approved  ')).toBe(true)
    expect(isPaystackDecisionsApproved('Status: approved pending legal')).toBe(false)
    expect(isPaystackDecisionsApproved('Not yet. Status: approved')).toBe(false)
    expect(isPaystackDecisionsApproved('')).toBe(false)
  })

  it('the shipped decisions doc is not approved yet', async () => {
    const { readFileSync } = await import('node:fs')
    expect(
      isPaystackDecisionsApproved(readFileSync('docs/payments/paystack-decisions.md', 'utf8'))
    ).toBe(false)
  })

  it('link plans come from config, all by default', () => {
    expect(paymentLinksAllowedForPlan('storvv_micro', {} as never)).toBe(true)
    const env = { PAYMENTS_V2_LINK_PLANS: 'storvv_medium, storvv_enterprise' } as never
    expect(paymentLinksAllowedForPlan('storvv_micro', env)).toBe(false)
    expect(paymentLinksAllowedForPlan('storvv_enterprise', env)).toBe(true)
  })
})

describe('cron auth', () => {
  const secret = 'a-long-cron-secret-value'

  it('accepts only the exact bearer secret', () => {
    expect(isValidCronAuthorization(`Bearer ${secret}`, secret)).toBe(true)
    expect(isValidCronAuthorization(secret, secret)).toBe(false)
    expect(isValidCronAuthorization(`Bearer ${secret}x`, secret)).toBe(false)
    expect(isValidCronAuthorization(undefined, secret)).toBe(false)
  })

  it('refuses everything when the secret is missing or short', () => {
    expect(isValidCronAuthorization('Bearer ', '')).toBe(false)
    expect(isValidCronAuthorization('Bearer short', 'short')).toBe(false)
  })
})
