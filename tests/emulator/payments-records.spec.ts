// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import {
  PaymentServiceError,
  recordPayment,
  transitionPayment,
} from '~/server/utils/payments/records'
import {
  createDailyAnchor,
  storeDocRef,
  verifyStoreAuditChain,
} from '~/server/utils/payments/audit-log'
import { buildAuditEvent, GENESIS_HASH, pickAuditBody } from '~/server/utils/payments/audit-hash'
import type { PaymentActor } from '~/server/utils/payments/state-machine'

const system: PaymentActor = { uid: 'system:paystack', name: 'Paystack', role: 'system' }
const owner = (uid: string): PaymentActor => ({ uid, name: 'Owner', role: 'owner' })
const cashier: PaymentActor = { uid: 'cashier1', name: 'Cashier', role: 'member' }
const checker: PaymentActor = { uid: 'checker1', name: 'Checker', role: 'member', canConfirm: true }

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)(
  'payments service (Firestore emulator)',
  () => {
    let app: App
    let db: Firestore

    beforeAll(() => {
      app = initializeApp({ projectId: 'storv-ui-test-payments' }, `payments-${randomUUID()}`)
      db = getFirestore(app)
    })

    afterAll(async () => {
      await deleteApp(app)
    })

    /** Fresh owner per test so tests never share chains or receipts. */
    async function seed(totalNaira = 50, status = 'completed') {
      const ownerId = `owner-${randomUUID()}`
      const store = storeDocRef(db, ownerId, 's1')
      await store.set({ ownerId, name: 'Main' })
      await store.collection('receipts').doc('r1').set({
        receiptNumber: 'R-1',
        total: totalNaira,
        status,
        storeId: 's1',
        customerName: 'Jane Secret',
      })
      return { ownerId, store, base: { ownerId, storeId: 's1', receiptId: 'r1', currency: 'NGN' } }
    }

    const summaryOf = async (store: FirebaseFirestore.DocumentReference) =>
      (await store.collection('receipts').doc('r1').get()).data()?.paymentSummary
    const eventCount = async (store: FirebaseFirestore.DocumentReference) =>
      (await store.collection('paymentEvents').get()).size

    async function expectCode(promise: Promise<unknown>, code: string) {
      await expect(promise).rejects.toBeInstanceOf(PaymentServiceError)
      await expect(promise).rejects.toMatchObject({ code })
    }

    it('a cashier payment waits for confirmation and is logged once', async () => {
      const { store, base } = await seed()
      const res = await recordPayment(db, {
        ...base,
        kind: 'manual_transfer',
        methodLabel: 'Bank Transfer',
        amountKobo: 5000,
        actor: cashier,
      })
      expect(res.status).toBe('awaiting_confirmation')
      expect(res.summary).toMatchObject({
        status: 'awaiting_confirmation',
        awaitingKobo: 5000,
        balanceKobo: 5000,
      })

      const payment = (await store.collection('payments').doc(res.paymentId).get()).data()
      expect(payment).toMatchObject({
        recordedBy: 'cashier1',
        amountKobo: 5000,
        currency: 'NGN',
        confirmedBy: null,
      })
      expect(await eventCount(store)).toBe(1)
      expect(await verifyStoreAuditChain(db, base.ownerId, 's1')).toMatchObject({
        ok: true,
        checked: 1,
      })

      const logs = await store.collection('activityLogs').get()
      expect(logs.size).toBe(1)
      const log = logs.docs[0]!.data()
      expect(log).toMatchObject({
        entityType: 'payment',
        source: 'payments_v2',
        userId: 'cashier1',
      })
      expect(JSON.stringify(log)).not.toContain('Jane Secret')
    })

    it('owner-recorded payments auto-confirm, labelled, with claimed + confirmed events', async () => {
      const { ownerId, store, base } = await seed()
      const res = await recordPayment(db, {
        ...base,
        kind: 'cash',
        methodLabel: 'Cash',
        amountKobo: 5000,
        actor: owner(ownerId),
      })
      expect(res.status).toBe('confirmed')
      expect(res.summary.status).toBe('paid')
      const payment = (await store.collection('payments').doc(res.paymentId).get()).data()
      expect(payment).toMatchObject({
        autoConfirmedReason: 'recorded_by_owner',
        confirmedBy: ownerId,
      })
      const events = (await store.collection('paymentEvents').orderBy('seq').get()).docs.map(
        (d) => d.data().type
      )
      expect(events).toEqual(['claimed', 'confirmed'])
    })

    it('maker and checker: no self-confirm; a checker confirms', async () => {
      const { store, base } = await seed()
      const { paymentId } = await recordPayment(db, {
        ...base,
        kind: 'pos',
        methodLabel: 'POS',
        amountKobo: 5000,
        actor: cashier,
      })
      await expectCode(
        transitionPayment(db, {
          ...base,
          paymentId,
          to: 'confirmed',
          actor: { ...cashier, canConfirm: true },
        }),
        'SELF_CONFIRM'
      )
      const done = await transitionPayment(db, {
        ...base,
        paymentId,
        to: 'confirmed',
        actor: checker,
      })
      expect(done.summary.status).toBe('paid')
      const payment = (await store.collection('payments').doc(paymentId).get()).data()
      expect(payment).toMatchObject({ status: 'confirmed', confirmedBy: 'checker1', version: 2 })
      expect(payment?.statusHistory).toHaveLength(2)
    })

    it('a rejected payment needs a reason and stops counting', async () => {
      const { base } = await seed()
      const { paymentId } = await recordPayment(db, {
        ...base,
        kind: 'manual_transfer',
        methodLabel: 'Transfer',
        amountKobo: 5000,
        actor: cashier,
      })
      await expectCode(
        transitionPayment(db, { ...base, paymentId, to: 'rejected', actor: checker }),
        'REASON_REQUIRED'
      )
      const res = await transitionPayment(db, {
        ...base,
        paymentId,
        to: 'rejected',
        actor: checker,
        reason: 'No money arrived',
      })
      expect(res.summary).toMatchObject({ status: 'unpaid', awaitingKobo: 0 })
    })

    it('enforces the overpayment cap across confirmed, awaiting and pending money', async () => {
      const { base } = await seed()
      await expectCode(
        recordPayment(db, {
          ...base,
          kind: 'cash',
          methodLabel: 'Cash',
          amountKobo: 5001,
          actor: cashier,
        }),
        'OVERPAYMENT'
      )
      await recordPayment(db, {
        ...base,
        kind: 'cash',
        methodLabel: 'Cash',
        amountKobo: 3000,
        actor: cashier,
      })
      await expectCode(
        recordPayment(db, {
          ...base,
          kind: 'paystack_link',
          methodLabel: 'Link',
          amountKobo: 2500,
          actor: system,
        }),
        'OVERPAYMENT'
      )
      await expect(
        recordPayment(db, {
          ...base,
          kind: 'paystack_link',
          methodLabel: 'Link',
          amountKobo: 2000,
          actor: system,
        })
      ).resolves.toMatchObject({ status: 'pending' })
    })

    it('rejects other currencies, closed sales and unknown receipts', async () => {
      const { base } = await seed()
      await expectCode(
        recordPayment(db, {
          ...base,
          currency: 'USD',
          kind: 'cash',
          methodLabel: 'Cash',
          amountKobo: 100,
          actor: cashier,
        }),
        'UNSUPPORTED_CURRENCY'
      )
      await expectCode(
        recordPayment(db, {
          ...base,
          receiptId: 'nope',
          kind: 'cash',
          methodLabel: 'Cash',
          amountKobo: 100,
          actor: cashier,
        }),
        'NOT_FOUND'
      )
      const closed = await seed(50, 'cancelled')
      await expectCode(
        recordPayment(db, {
          ...closed.base,
          kind: 'cash',
          methodLabel: 'Cash',
          amountKobo: 100,
          actor: cashier,
        }),
        'RECEIPT_CLOSED'
      )
    })

    it('C-SUM-1: two balance payments at the same moment both land with a correct summary', async () => {
      const { ownerId, store, base } = await seed()
      const results = await Promise.all([
        recordPayment(db, {
          ...base,
          kind: 'cash',
          methodLabel: 'Cash',
          amountKobo: 2000,
          actor: cashier,
        }),
        recordPayment(db, {
          ...base,
          kind: 'pos',
          methodLabel: 'POS',
          amountKobo: 3000,
          actor: { ...cashier, uid: 'cashier2' },
        }),
      ])
      expect(results.map((r) => r.status)).toEqual([
        'awaiting_confirmation',
        'awaiting_confirmation',
      ])
      expect(await summaryOf(store)).toMatchObject({
        awaitingKobo: 5000,
        paymentCount: 2,
        version: 2,
      })
      expect(await eventCount(store)).toBe(2)
      expect(await verifyStoreAuditChain(db, ownerId, 's1')).toMatchObject({ ok: true, checked: 2 })
    })

    it('C-MC-1: simultaneous confirm and reject, only one wins', async () => {
      const { ownerId, store, base } = await seed()
      const { paymentId } = await recordPayment(db, {
        ...base,
        kind: 'manual_transfer',
        methodLabel: 'Transfer',
        amountKobo: 5000,
        actor: cashier,
      })
      const outcomes = await Promise.allSettled([
        transitionPayment(db, { ...base, paymentId, to: 'confirmed', actor: checker }),
        transitionPayment(db, {
          ...base,
          paymentId,
          to: 'rejected',
          actor: owner(ownerId),
          reason: 'Not seen',
        }),
      ])
      const winners = outcomes.filter((o) => o.status === 'fulfilled')
      expect(winners).toHaveLength(1)
      const loser = outcomes.find((o) => o.status === 'rejected') as PromiseRejectedResult
      expect(loser.reason).toMatchObject({ code: 'INVALID_TRANSITION' })
      const final = (await store.collection('payments').doc(paymentId).get()).data()?.status
      expect(final).toBe((winners[0] as PromiseFulfilledResult<{ status: string }>).value.status)
      expect(await eventCount(store)).toBe(2)
    })

    it('10 parallel system confirmations of one link payment give exactly one confirmation', async () => {
      const { ownerId, store, base } = await seed()
      const { paymentId } = await recordPayment(db, {
        ...base,
        kind: 'paystack_link',
        methodLabel: 'Link',
        amountKobo: 5000,
        actor: system,
      })
      const outcomes = await Promise.allSettled(
        Array.from({ length: 10 }, () =>
          transitionPayment(db, { ...base, paymentId, to: 'confirmed', actor: system })
        )
      )
      expect(outcomes.filter((o) => o.status === 'fulfilled')).toHaveLength(1)
      for (const o of outcomes) {
        if (o.status === 'rejected') expect(o.reason).toMatchObject({ code: 'INVALID_TRANSITION' })
      }
      expect(await summaryOf(store)).toMatchObject({ status: 'paid', confirmedKobo: 5000 })
      expect(await eventCount(store)).toBe(2)
      expect(await verifyStoreAuditChain(db, ownerId, 's1')).toMatchObject({ ok: true })
    })

    it('a late link payment after expiry is confirmed, flagged, and marks overpayment', async () => {
      const { ownerId, base } = await seed()
      const link = await recordPayment(db, {
        ...base,
        kind: 'paystack_link',
        methodLabel: 'Link',
        amountKobo: 5000,
        actor: system,
      })
      await transitionPayment(db, {
        ...base,
        paymentId: link.paymentId,
        to: 'expired',
        actor: system,
      })
      await recordPayment(db, {
        ...base,
        kind: 'cash',
        methodLabel: 'Cash',
        amountKobo: 5000,
        actor: owner(ownerId),
      })
      const late = await transitionPayment(db, {
        ...base,
        paymentId: link.paymentId,
        to: 'confirmed',
        actor: system,
        flags: ['paid_after_expiry'],
      })
      expect(late.flags.sort()).toEqual(['overpaid', 'paid_after_expiry'])
      expect(late.summary).toMatchObject({ status: 'overpaid', overpaidKobo: 5000 })
    })

    it('late Storvv money is still recorded on a sale cancelled in the meantime', async () => {
      const { store, base } = await seed()
      const link = await recordPayment(db, {
        ...base,
        kind: 'paystack_link',
        methodLabel: 'Link',
        amountKobo: 5000,
        actor: system,
      })
      await store.collection('receipts').doc('r1').update({ status: 'cancelled' })
      await expect(
        transitionPayment(db, {
          ...base,
          paymentId: link.paymentId,
          to: 'confirmed',
          actor: system,
        })
      ).resolves.toMatchObject({ status: 'confirmed' })
    })

    it('partial then full refunds', async () => {
      const { ownerId, base } = await seed()
      const { paymentId } = await recordPayment(db, {
        ...base,
        kind: 'cash',
        methodLabel: 'Cash',
        amountKobo: 5000,
        actor: owner(ownerId),
      })
      const partial = await transitionPayment(db, {
        ...base,
        paymentId,
        to: 'partially_refunded',
        actor: owner(ownerId),
        reason: 'One item returned',
        refundKobo: 2000,
      })
      expect(partial.summary).toMatchObject({
        status: 'partially_refunded',
        refundedKobo: 2000,
        balanceKobo: 2000,
      })
      const full = await transitionPayment(db, {
        ...base,
        paymentId,
        to: 'refunded',
        actor: owner(ownerId),
        reason: 'All returned',
        refundKobo: 3000,
      })
      expect(full.summary).toMatchObject({ status: 'refunded', netPaidKobo: 0 })
    })

    it('the verifier reports the first edited event', async () => {
      const { ownerId, store, base } = await seed()
      for (let i = 0; i < 3; i++) {
        await recordPayment(db, {
          ...base,
          kind: 'cash',
          methodLabel: 'Cash',
          amountKobo: 1000,
          actor: cashier,
        })
      }
      await store.collection('paymentEvents').doc('000000000002').update({ amountKobo: 1 })
      expect(await verifyStoreAuditChain(db, ownerId, 's1')).toMatchObject({
        ok: false,
        firstBreak: { seq: 2, reason: 'hash_mismatch' },
      })
    })

    it('daily anchors are created once and catch a fully rewritten chain', async () => {
      const { ownerId, store, base } = await seed()
      for (let i = 0; i < 2; i++) {
        await recordPayment(db, {
          ...base,
          kind: 'cash',
          methodLabel: 'Cash',
          amountKobo: 1000,
          actor: cashier,
        })
      }
      expect(await createDailyAnchor(db, ownerId, 's1', '2026-10-07')).toMatchObject({
        created: true,
        anchor: { seq: 2 },
      })
      expect(await createDailyAnchor(db, ownerId, 's1', '2026-10-07')).toMatchObject({
        created: false,
      })
      expect(await verifyStoreAuditChain(db, ownerId, 's1')).toMatchObject({ ok: true })

      // An attacker with Admin access rewrites every event and the head consistently.
      const docs = (await store.collection('paymentEvents').orderBy('seq').get()).docs
      let prev = GENESIS_HASH
      for (const d of docs) {
        const body = pickAuditBody(d.data())
        const forged = buildAuditEvent(prev, { ...body, amountKobo: 1 })
        await d.ref.set(forged)
        prev = forged.hash
      }
      await store.collection('paymentAudit').doc('head').set({ seq: docs.length, hash: prev })
      expect(await verifyStoreAuditChain(db, ownerId, 's1')).toMatchObject({
        ok: false,
        firstBreak: { reason: 'anchor_mismatch', seq: 2 },
      })
    })
  }
)
