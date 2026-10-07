import { describe, expect, it } from 'vitest'
import type { PaymentStatus } from '~/types/payments-v2'
import { PAYMENT_STATUSES } from '~/types/payments-v2'
import {
  allowedTargets,
  checkTransition,
  planCreation,
  type PaymentActor,
} from '~/server/utils/payments/state-machine'

const system: PaymentActor = { uid: 'system:paystack', name: 'Paystack', role: 'system' }
const owner: PaymentActor = { uid: 'owner1', name: 'Owner', role: 'owner' }
const cashier: PaymentActor = { uid: 'cashier1', name: 'Cashier', role: 'member' }
const checker: PaymentActor = { uid: 'checker1', name: 'Checker', role: 'member', canConfirm: true }
const refunder: PaymentActor = {
  uid: 'refunder1',
  name: 'Refunder',
  role: 'member',
  canRefund: true,
}
const linkManager: PaymentActor = {
  uid: 'mgr1',
  name: 'Manager',
  role: 'member',
  canManageLinks: true,
}

const payment = (status: PaymentStatus, recordedBy = 'cashier1', refundedKobo = 0) => ({
  status,
  recordedBy,
  amountKobo: 10_000,
  refundedKobo,
})

const EXPECTED_EDGES: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['confirmed', 'failed', 'expired'],
  awaiting_confirmation: ['confirmed', 'rejected'],
  confirmed: ['partially_refunded', 'refunded'],
  failed: [],
  expired: ['confirmed'],
  rejected: [],
  partially_refunded: ['partially_refunded', 'refunded'],
  refunded: [],
}

describe('transition table', () => {
  it('allows exactly the planned edges', () => {
    for (const from of PAYMENT_STATUSES) {
      expect(allowedTargets(from).sort()).toEqual([...EXPECTED_EDGES[from]].sort())
    }
  })

  it('every unlisted pair is INVALID_TRANSITION for every actor', () => {
    for (const from of PAYMENT_STATUSES) {
      for (const to of PAYMENT_STATUSES) {
        if (EXPECTED_EDGES[from].includes(to)) continue
        for (const actor of [system, owner, cashier, checker, refunder, linkManager]) {
          const r = checkTransition({
            payment: payment(from),
            to,
            actor,
            reason: 'x',
            refundKobo: 1,
          })
          expect(r.ok, `${from}→${to} by ${actor.uid}`).toBe(false)
          if (!r.ok) expect(['INVALID_TRANSITION', 'INVALID_REFUND']).toContain(r.code)
        }
      }
    }
  })

  it('terminal states have no exits', () => {
    for (const s of ['failed', 'rejected', 'refunded'] as const)
      expect(allowedTargets(s)).toEqual([])
  })
})

describe('system-only moves', () => {
  it('only Storvv confirms or fails a pending link payment', () => {
    expect(
      checkTransition({ payment: payment('pending'), to: 'confirmed', actor: system })
    ).toMatchObject({ ok: true, event: 'paid' })
    expect(
      checkTransition({ payment: payment('pending'), to: 'failed', actor: system })
    ).toMatchObject({ ok: true, event: 'failed' })
    for (const actor of [owner, checker, cashier]) {
      expect(
        checkTransition({ payment: payment('pending'), to: 'confirmed', actor })
      ).toMatchObject({ ok: false, code: 'FORBIDDEN' })
    }
  })

  it('pending → expired is expiry for Storvv and revoke for link managers', () => {
    expect(
      checkTransition({ payment: payment('pending'), to: 'expired', actor: system })
    ).toMatchObject({ ok: true, event: 'expired' })
    expect(
      checkTransition({ payment: payment('pending'), to: 'expired', actor: owner })
    ).toMatchObject({ ok: true, event: 'revoked' })
    expect(
      checkTransition({ payment: payment('pending'), to: 'expired', actor: linkManager })
    ).toMatchObject({ ok: true, event: 'revoked' })
    expect(
      checkTransition({ payment: payment('pending'), to: 'expired', actor: cashier })
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })

  it('a late payment after expiry is confirmed only with a flag', () => {
    expect(
      checkTransition({ payment: payment('expired'), to: 'confirmed', actor: system })
    ).toMatchObject({ ok: false, code: 'FLAG_REQUIRED' })
    expect(
      checkTransition({
        payment: payment('expired'),
        to: 'confirmed',
        actor: system,
        flags: ['paid_after_expiry'],
      })
    ).toMatchObject({ ok: true, event: 'paid' })
    expect(
      checkTransition({
        payment: payment('expired'),
        to: 'confirmed',
        actor: owner,
        flags: ['paid_after_revoke'],
      })
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })
})

describe('maker and checker', () => {
  it('a cashier cannot confirm their own payment', () => {
    const selfChecker = { ...checker, uid: 'cashier1' }
    expect(
      checkTransition({
        payment: payment('awaiting_confirmation'),
        to: 'confirmed',
        actor: selfChecker,
      })
    ).toMatchObject({
      ok: false,
      code: 'SELF_CONFIRM',
    })
    expect(
      checkTransition({
        payment: payment('awaiting_confirmation'),
        to: 'rejected',
        actor: selfChecker,
        reason: 'no',
      })
    ).toMatchObject({ ok: false, code: 'SELF_CONFIRM' })
  })

  it('the owner cannot confirm an entry they recorded either', () => {
    expect(
      checkTransition({
        payment: payment('awaiting_confirmation', 'owner1'),
        to: 'confirmed',
        actor: owner,
      })
    ).toMatchObject({ ok: false, code: 'SELF_CONFIRM' })
  })

  it('confirmers need the grant', () => {
    expect(
      checkTransition({
        payment: payment('awaiting_confirmation'),
        to: 'confirmed',
        actor: refunder,
      })
    ).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(
      checkTransition({ payment: payment('awaiting_confirmation'), to: 'confirmed', actor: system })
    ).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(
      checkTransition({
        payment: payment('awaiting_confirmation'),
        to: 'confirmed',
        actor: checker,
      })
    ).toMatchObject({
      ok: true,
      event: 'confirmed',
    })
    expect(
      checkTransition({ payment: payment('awaiting_confirmation'), to: 'confirmed', actor: owner })
    ).toMatchObject({ ok: true })
  })

  it('rejecting needs a reason', () => {
    expect(
      checkTransition({
        payment: payment('awaiting_confirmation'),
        to: 'rejected',
        actor: checker,
        reason: '  ',
      })
    ).toMatchObject({
      ok: false,
      code: 'REASON_REQUIRED',
    })
    expect(
      checkTransition({
        payment: payment('awaiting_confirmation'),
        to: 'rejected',
        actor: checker,
        reason: 'No money arrived',
      })
    ).toMatchObject({ ok: true, event: 'rejected' })
  })
})

describe('refunds', () => {
  it('partial then full refund tracks refundedKobo', () => {
    const first = checkTransition({
      payment: payment('confirmed'),
      to: 'partially_refunded',
      actor: owner,
      reason: 'Damaged',
      refundKobo: 4000,
    })
    expect(first).toMatchObject({ ok: true, event: 'refunded', refundedKobo: 4000 })
    const second = checkTransition({
      payment: payment('partially_refunded', 'cashier1', 4000),
      to: 'refunded',
      actor: refunder,
      reason: 'Returned',
      refundKobo: 6000,
    })
    expect(second).toMatchObject({ ok: true, refundedKobo: 10_000 })
  })

  it('manual refunds need a reason; Storvv (Paystack refund webhook) does not', () => {
    expect(
      checkTransition({
        payment: payment('confirmed'),
        to: 'refunded',
        actor: owner,
        refundKobo: 10_000,
      })
    ).toMatchObject({
      ok: false,
      code: 'REASON_REQUIRED',
    })
    expect(
      checkTransition({
        payment: payment('confirmed'),
        to: 'refunded',
        actor: system,
        refundKobo: 10_000,
      })
    ).toMatchObject({ ok: true })
  })

  it('rejects bad refund amounts', () => {
    const base = { payment: payment('confirmed'), actor: owner, reason: 'r' }
    expect(checkTransition({ ...base, to: 'partially_refunded', refundKobo: 0 })).toMatchObject({
      code: 'INVALID_REFUND',
    })
    expect(checkTransition({ ...base, to: 'partially_refunded', refundKobo: 1.5 })).toMatchObject({
      code: 'INVALID_REFUND',
    })
    expect(
      checkTransition({ ...base, to: 'partially_refunded', refundKobo: 10_001 })
    ).toMatchObject({ code: 'INVALID_REFUND' })
    expect(
      checkTransition({ ...base, to: 'partially_refunded', refundKobo: 10_000 })
    ).toMatchObject({ code: 'INVALID_REFUND' })
    expect(checkTransition({ ...base, to: 'refunded', refundKobo: 5_000 })).toMatchObject({
      code: 'INVALID_REFUND',
    })
  })

  it('cashiers without the grant cannot refund', () => {
    expect(
      checkTransition({
        payment: payment('confirmed'),
        to: 'refunded',
        actor: cashier,
        reason: 'r',
        refundKobo: 10_000,
      })
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })
})

describe('planCreation', () => {
  it('links start pending, for link managers or Storvv only', () => {
    expect(planCreation('paystack_link', linkManager)).toMatchObject({
      ok: true,
      status: 'pending',
      events: ['created'],
    })
    expect(planCreation('paystack_link', cashier)).toMatchObject({ ok: false })
  })

  it('manual payments by staff wait for a checker', () => {
    for (const kind of ['manual_transfer', 'pos', 'cash'] as const) {
      expect(planCreation(kind, cashier)).toMatchObject({
        ok: true,
        status: 'awaiting_confirmation',
        autoConfirmedReason: null,
      })
    }
  })

  it('owner-recorded payments auto-confirm and are labelled', () => {
    expect(planCreation('manual_transfer', owner)).toMatchObject({
      ok: true,
      status: 'confirmed',
      events: ['claimed', 'confirmed'],
      autoConfirmedReason: 'recorded_by_owner',
    })
  })

  it('Storvv cannot record manual payments', () => {
    expect(planCreation('cash', system)).toMatchObject({ ok: false })
  })
})
