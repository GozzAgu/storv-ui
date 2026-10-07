import type { DocumentReference, Firestore, Transaction } from 'firebase-admin/firestore'
import type {
  PaymentEventType,
  PaymentFlag,
  PaymentKind,
  PaymentRecord,
  PaymentStatus,
  PaymentSummary,
} from '~/types/payments-v2'
import { isPaymentsCurrency, nairaToKobo, PAYMENTS_V2_CURRENCY } from '~/utils/money-kobo'
import { computePaymentSummary, outstandingKobo } from '~/utils/payment-summary'
import {
  appendAuditEvents,
  mirrorToActivityLog,
  readChainHead,
  storeDocRef,
  type AuditEventInput,
} from './audit-log'
import {
  checkTransition,
  planCreation,
  TRANSITION_ERROR_STATUS,
  type PaymentActor,
} from './state-machine'

export class PaymentServiceError extends Error {
  constructor(readonly code: string, readonly statusCode: number, message: string) {
    super(message)
    this.name = 'PaymentServiceError'
  }
}

const TX_OPTIONS = { maxAttempts: 15 }
const CLOSED_RECEIPT_STATUSES = new Set(['cancelled', 'refunded'])

const EVENT_TEXT: Record<PaymentEventType, string> = {
  created: 'Payment link created',
  claimed: 'Payment recorded',
  paid: 'Payment received',
  confirmed: 'Payment confirmed',
  rejected: 'Payment rejected',
  failed: 'Payment failed',
  expired: 'Payment link expired',
  revoked: 'Payment link revoked',
  refunded: 'Payment refunded',
}

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

interface ReceiptContext {
  ref: DocumentReference
  receiptNumber: string
  totalKobo: number
  payments: PaymentRecord[]
  summaryVersion: number
}

/** Reads the receipt and every payment on it. Call before any write in the transaction. */
async function readReceiptContext(
  tx: Transaction,
  store: DocumentReference,
  receiptId: string,
  options: { allowClosed?: boolean } = {}
): Promise<ReceiptContext> {
  const ref = store.collection('receipts').doc(receiptId)
  const [receiptSnap, paymentsSnap] = await Promise.all([
    tx.get(ref),
    tx.get(store.collection('payments').where('receiptId', '==', receiptId)),
  ])
  if (!receiptSnap.exists) throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
  const receipt = receiptSnap.data() ?? {}
  if (!options.allowClosed && CLOSED_RECEIPT_STATUSES.has(String(receipt.status))) {
    throw new PaymentServiceError('RECEIPT_CLOSED', 409, 'This sale is cancelled or refunded')
  }
  return {
    ref,
    receiptNumber: String(receipt.receiptNumber || ''),
    totalKobo: nairaToKobo(Number(receipt.total) || 0),
    payments: paymentsSnap.docs.map((d) => ({ ...(d.data() as PaymentRecord), id: d.id })),
    summaryVersion: Number(receipt.paymentSummary?.version) || 0,
  }
}

function writeSummary(
  tx: Transaction,
  ctx: ReceiptContext,
  payments: PaymentRecord[]
): PaymentSummary {
  const summary = computePaymentSummary(ctx.totalKobo, payments, ctx.summaryVersion + 1)
  tx.update(ctx.ref, { paymentSummary: summary })
  return summary
}

export interface RecordPaymentInput {
  ownerId: string
  storeId: string
  receiptId: string
  kind: PaymentKind
  methodLabel: string
  amountKobo: number
  currency: string
  actor: PaymentActor
  linkId?: string | null
  reference?: string | null
  /** Late Paystack money only; everything else respects the overpayment cap. */
  allowOverpayment?: boolean
}

export interface PaymentWriteResult {
  paymentId: string
  status: PaymentStatus
  flags: PaymentFlag[]
  summary: PaymentSummary
}

export async function recordPayment(
  db: Firestore,
  input: RecordPaymentInput
): Promise<PaymentWriteResult> {
  if (!isPaymentsCurrency(input.currency)) {
    throw new PaymentServiceError('UNSUPPORTED_CURRENCY', 400, 'Payments are only supported in NGN')
  }
  if (!Number.isSafeInteger(input.amountKobo) || input.amountKobo <= 0) {
    throw new PaymentServiceError('INVALID_AMOUNT', 400, 'Amount must be more than zero')
  }
  const plan = planCreation(input.kind, input.actor)
  if (!plan.ok) throw new PaymentServiceError(plan.code, 403, plan.message)

  const store = storeDocRef(db, input.ownerId, input.storeId)
  return db.runTransaction(async (tx) => {
    const ctx = await readReceiptContext(tx, store, input.receiptId)
    const head = await readChainHead(tx, store)

    const before = computePaymentSummary(ctx.totalKobo, ctx.payments)
    if (!input.allowOverpayment && input.amountKobo > outstandingKobo(before)) {
      throw new PaymentServiceError(
        'OVERPAYMENT',
        409,
        'Amount is more than the sale has left to pay'
      )
    }

    const now = new Date().toISOString()
    const ref = store.collection('payments').doc()
    const confirmed = plan.status === 'confirmed'
    const payment: PaymentRecord = {
      id: ref.id,
      ownerId: input.ownerId,
      storeId: input.storeId,
      receiptId: input.receiptId,
      kind: input.kind,
      methodLabel: input.methodLabel.trim().slice(0, 60),
      amountKobo: input.amountKobo,
      currency: PAYMENTS_V2_CURRENCY,
      status: plan.status,
      refundedKobo: 0,
      flags: [],
      recordedBy: input.actor.uid,
      recordedByName: input.actor.name,
      autoConfirmedReason: plan.autoConfirmedReason,
      confirmedBy: confirmed ? input.actor.uid : null,
      confirmedAt: confirmed ? now : null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      linkId: input.linkId ?? null,
      reference: input.reference ?? null,
      statusHistory: [
        {
          from: null,
          to: plan.status,
          at: now,
          by: input.actor.uid,
          reason: plan.autoConfirmedReason,
        },
      ],
      createdAt: now,
      updatedAt: now,
      version: 1,
    }

    const summary = writeSummary(tx, ctx, [...ctx.payments, payment])
    tx.create(ref, payment)
    appendAuditEvents(
      tx,
      store,
      head,
      plan.events.map(
        (type): AuditEventInput => ({
          type,
          paymentId: ref.id,
          receiptId: input.receiptId,
          linkId: payment.linkId,
          actorUid: input.actor.uid,
          actorKind: input.actor.role,
          amountKobo: input.amountKobo,
          currency: PAYMENTS_V2_CURRENCY,
          fromStatus: type === 'confirmed' ? 'awaiting_confirmation' : null,
          toStatus: type === 'claimed' ? 'awaiting_confirmation' : plan.status,
          reason: type === 'confirmed' ? plan.autoConfirmedReason : null,
          flags: [],
          at: now,
        })
      )
    )
    const lastEvent = plan.events[plan.events.length - 1]!
    mirrorToActivityLog(tx, store, {
      actorUid: input.actor.uid,
      actorName: input.actor.name,
      storeId: input.storeId,
      paymentId: ref.id,
      summaryText: `${EVENT_TEXT[lastEvent]}${
        confirmed ? ' (recorded by owner)' : ''
      }: ${formatNaira(input.amountKobo)} ${payment.methodLabel}${
        ctx.receiptNumber ? `, receipt ${ctx.receiptNumber}` : ''
      }`,
      isCreate: true,
    })
    return { paymentId: ref.id, status: plan.status, flags: [], summary }
  }, TX_OPTIONS)
}

export interface TransitionPaymentInput {
  ownerId: string
  storeId: string
  paymentId: string
  to: PaymentStatus
  actor: PaymentActor
  reason?: string | null
  flags?: PaymentFlag[]
  refundKobo?: number
}

export async function transitionPayment(
  db: Firestore,
  input: TransitionPaymentInput
): Promise<PaymentWriteResult> {
  const store = storeDocRef(db, input.ownerId, input.storeId)
  const paymentRef = store.collection('payments').doc(input.paymentId)

  return db.runTransaction(async (tx) => {
    const paymentSnap = await tx.get(paymentRef)
    if (!paymentSnap.exists) throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
    const payment = { ...(paymentSnap.data() as PaymentRecord), id: paymentSnap.id }
    // Money that really moved (system) must still be recorded on a since-closed sale.
    const ctx = await readReceiptContext(tx, store, payment.receiptId, {
      allowClosed: input.actor.role === 'system',
    })
    const head = await readChainHead(tx, store)

    const reason = input.reason?.trim() ? input.reason.trim().slice(0, 500) : null
    const result = checkTransition({
      payment,
      to: input.to,
      actor: input.actor,
      reason,
      flags: input.flags,
      refundKobo: input.refundKobo,
    })
    if (!result.ok) {
      throw new PaymentServiceError(
        result.code,
        TRANSITION_ERROR_STATUS[result.code],
        result.message
      )
    }

    const now = new Date().toISOString()
    const flags = new Set<PaymentFlag>([...(payment.flags ?? []), ...(input.flags ?? [])])
    const next: PaymentRecord = {
      ...payment,
      status: input.to,
      refundedKobo: result.refundedKobo,
      updatedAt: now,
      version: (payment.version || 1) + 1,
      statusHistory: [
        ...(payment.statusHistory ?? []),
        { from: payment.status, to: input.to, at: now, by: input.actor.uid, reason },
      ],
    }
    if (input.to === 'confirmed') {
      next.confirmedBy = input.actor.uid
      next.confirmedAt = now
    }
    if (input.to === 'rejected') {
      next.rejectedBy = input.actor.uid
      next.rejectedAt = now
      next.rejectionReason = reason
    }

    const others = ctx.payments.filter((p) => p.id !== payment.id)
    if (input.to === 'confirmed') {
      const after = computePaymentSummary(ctx.totalKobo, [...others, next])
      if (after.overpaidKobo > 0) flags.add('overpaid')
    }
    next.flags = [...flags]

    const summary = writeSummary(tx, ctx, [...others, next])
    const { id: _id, ...stored } = next
    tx.set(paymentRef, stored)
    appendAuditEvents(tx, store, head, [
      {
        type: result.event,
        paymentId: payment.id,
        receiptId: payment.receiptId,
        linkId: payment.linkId ?? null,
        actorUid: input.actor.uid,
        actorKind: input.actor.role,
        amountKobo: result.event === 'refunded' ? input.refundKobo ?? 0 : payment.amountKobo,
        currency: PAYMENTS_V2_CURRENCY,
        fromStatus: payment.status,
        toStatus: input.to,
        reason,
        flags: next.flags,
        at: now,
      },
    ])
    const shownKobo = result.event === 'refunded' ? input.refundKobo ?? 0 : payment.amountKobo
    mirrorToActivityLog(tx, store, {
      actorUid: input.actor.uid,
      actorName: input.actor.name,
      storeId: input.storeId,
      paymentId: payment.id,
      summaryText: `${EVENT_TEXT[result.event]}: ${formatNaira(shownKobo)} ${payment.methodLabel}${
        ctx.receiptNumber ? `, receipt ${ctx.receiptNumber}` : ''
      }`,
      isCreate: false,
    })
    return { paymentId: payment.id, status: input.to, flags: next.flags, summary }
  }, TX_OPTIONS)
}
