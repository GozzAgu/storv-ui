import type { DocumentReference, Firestore, Transaction } from 'firebase-admin/firestore'
import type {
  PaymentEventType,
  PaymentFlag,
  PaymentKind,
  PaymentRecord,
  PaymentStatus,
  PaymentSummary,
} from '~/types/payments-v2'
import {
  isPaymentsCurrency,
  koboToNaira,
  nairaToKobo,
  PAYMENTS_V2_CURRENCY,
} from '~/utils/money-kobo'
import { computePaymentSummary, outstandingKobo } from '~/utils/payment-summary'
import {
  appendAuditEvents,
  mirrorToActivityLog,
  readChainHead,
  storeDocRef,
  type AuditEventInput,
} from './audit-log'
import type { ChainHead } from './audit-hash'
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

export const TX_OPTIONS = { maxAttempts: 15 }
const CLOSED_RECEIPT_STATUSES = new Set(['cancelled', 'refunded'])
const MAX_TENDERS = 5
export const MAX_BATCH_TRANSITIONS = 100
const PROOF_RETENTION_MONTHS = 12

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

export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export interface ReceiptContext {
  id: string
  ref: DocumentReference
  receiptNumber: string
  legacyStatus: string
  totalKobo: number
  payments: PaymentRecord[]
  legacyPayments: unknown[]
  summaryVersion: number
}

/** Reads the receipt and every payment on it. Call before any write in the transaction. */
export async function readReceiptContext(
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
    id: receiptId,
    ref,
    receiptNumber: String(receipt.receiptNumber || ''),
    legacyStatus: String(receipt.status || ''),
    totalKobo: nairaToKobo(Number(receipt.total) || 0),
    payments: paymentsSnap.docs.map((d) => ({ ...(d.data() as PaymentRecord), id: d.id })),
    legacyPayments: Array.isArray(receipt.payments) ? receipt.payments : [],
    summaryVersion: Number(receipt.paymentSummary?.version) || 0,
  }
}

function summaryUpdate(ctx: ReceiptContext, payments: PaymentRecord[]) {
  const summary = computePaymentSummary(ctx.totalKobo, payments, ctx.summaryVersion + 1)
  return { summary, update: { paymentSummary: summary } as Record<string, unknown> }
}

/**
 * Balance-due sales complete once fully recorded (confirmed + awaiting covers the total), as the
 * counter flow does today. Legacy fields mirror the V2 money so existing screens stay right; a
 * later rejection reopens the V2 status (and alerts) but leaves the legacy status completed.
 */
export function legacyBalanceMirror(
  ctx: ReceiptContext,
  summary: PaymentSummary,
  added: readonly PaymentRecord[],
  now: string
): { update: Record<string, unknown>; completed: boolean } {
  if (ctx.legacyStatus !== 'balance_due') return { update: {}, completed: false }
  const recordedKobo = summary.netPaidKobo + summary.awaitingKobo
  const completed = recordedKobo >= ctx.totalKobo
  const update: Record<string, unknown> = {
    amountPaid: koboToNaira(Math.min(recordedKobo, ctx.totalKobo)),
    balanceDue: koboToNaira(Math.max(0, ctx.totalKobo - recordedKobo)),
    payments: [
      ...ctx.legacyPayments,
      ...added.map((p) => ({
        amount: koboToNaira(p.amountKobo),
        method: p.methodLabel,
        paidAt: new Date(now),
        recordedBy: p.recordedBy,
        paymentId: p.id,
      })),
    ],
    updatedAt: new Date(now),
  }
  if (completed) {
    update.status = 'completed'
    update.completedAt = new Date(now)
    if (added.length) update.paymentMethod = added[added.length - 1]!.methodLabel
  }
  return { update, completed }
}

export interface TenderInput {
  kind: PaymentKind
  methodLabel: string
  amountKobo: number
}

export interface RecordPaymentsInput {
  ownerId: string
  storeId: string
  receiptId: string
  tenders: TenderInput[]
  currency: string
  actor: PaymentActor
  linkId?: string | null
  reference?: string | null
  /** Late Paystack money only; everything else respects the overpayment cap. */
  allowOverpayment?: boolean
  /** One tender only: its amount becomes whatever the sale has left to pay, read in the transaction. */
  fillOutstanding?: boolean
  /**
   * Extra writes in the same transaction (e.g. the link and token docs), after every read and
   * after the cap check. Must not read. Throwing aborts the whole transaction.
   */
  stage?: (
    tx: Transaction,
    staged: { ctx: ReceiptContext; before: PaymentSummary; added: PaymentRecord[]; now: string }
  ) => void
}

export interface RecordPaymentsResult {
  payments: { paymentId: string; status: PaymentStatus; amountKobo: number }[]
  summary: PaymentSummary
  saleCompleted: boolean
}

/** Records one or more tenders on a receipt in one transaction (split payments land together). */
export async function recordPayments(
  db: Firestore,
  input: RecordPaymentsInput
): Promise<RecordPaymentsResult> {
  if (!isPaymentsCurrency(input.currency)) {
    throw new PaymentServiceError('UNSUPPORTED_CURRENCY', 400, 'Payments are only supported in NGN')
  }
  if (!input.tenders.length || input.tenders.length > MAX_TENDERS) {
    throw new PaymentServiceError(
      'INVALID_AMOUNT',
      400,
      `Record between 1 and ${MAX_TENDERS} payments`
    )
  }
  if (input.fillOutstanding && input.tenders.length !== 1) {
    throw new PaymentServiceError('INVALID_AMOUNT', 400, 'Only one payment can fill the balance')
  }
  for (const t of input.tenders) {
    if (input.fillOutstanding) continue
    if (!Number.isSafeInteger(t.amountKobo) || t.amountKobo <= 0) {
      throw new PaymentServiceError('INVALID_AMOUNT', 400, 'Amount must be more than zero')
    }
  }
  const plans = input.tenders.map((t) => planCreation(t.kind, input.actor))
  for (const plan of plans) {
    if (!plan.ok) throw new PaymentServiceError(plan.code, 403, plan.message)
  }

  const store = storeDocRef(db, input.ownerId, input.storeId)
  return db.runTransaction(async (tx) => {
    const ctx = await readReceiptContext(tx, store, input.receiptId)
    const head = await readChainHead(tx, store)

    const before = computePaymentSummary(ctx.totalKobo, ctx.payments)
    const tenders = input.fillOutstanding
      ? [{ ...input.tenders[0]!, amountKobo: outstandingKobo(before) }]
      : input.tenders
    if (input.fillOutstanding && tenders[0]!.amountKobo <= 0) {
      throw new PaymentServiceError('NOTHING_OUTSTANDING', 409, 'This sale has nothing left to pay')
    }
    const totalKobo = tenders.reduce((sum, t) => sum + t.amountKobo, 0)
    if (!input.allowOverpayment && totalKobo > outstandingKobo(before)) {
      throw new PaymentServiceError(
        'OVERPAYMENT',
        409,
        'Amount is more than the sale has left to pay'
      )
    }

    const now = new Date().toISOString()
    const added: PaymentRecord[] = []
    const events: AuditEventInput[] = []
    tenders.forEach((tender, i) => {
      const plan = plans[i]!
      if (!plan.ok) return
      const ref = store.collection('payments').doc()
      const confirmed = plan.status === 'confirmed'
      const payment: PaymentRecord = {
        id: ref.id,
        ownerId: input.ownerId,
        storeId: input.storeId,
        receiptId: input.receiptId,
        kind: tender.kind,
        methodLabel: tender.methodLabel.trim().slice(0, 60),
        amountKobo: tender.amountKobo,
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
        proofPath: null,
        decidedAt: confirmed ? now : null,
      }
      added.push(payment)
      const { id: _id, ...stored } = payment
      tx.create(ref, stored)
      for (const type of plan.events) {
        events.push({
          type,
          paymentId: ref.id,
          receiptId: input.receiptId,
          linkId: payment.linkId,
          actorUid: input.actor.uid,
          actorKind: input.actor.role,
          amountKobo: tender.amountKobo,
          currency: PAYMENTS_V2_CURRENCY,
          fromStatus: type === 'confirmed' ? 'awaiting_confirmation' : null,
          toStatus: type === 'claimed' ? 'awaiting_confirmation' : plan.status,
          reason: type === 'confirmed' ? plan.autoConfirmedReason : null,
          flags: [],
          at: now,
          subjectUid: null,
        })
      }
      const lastEvent = plan.events[plan.events.length - 1]!
      mirrorToActivityLog(tx, store, {
        actorUid: input.actor.uid,
        actorName: input.actor.name,
        storeId: input.storeId,
        paymentId: ref.id,
        summaryText: `${EVENT_TEXT[lastEvent]}${
          confirmed ? ' (recorded by owner)' : ''
        }: ${formatNaira(tender.amountKobo)} ${payment.methodLabel}${
          ctx.receiptNumber ? `, receipt ${ctx.receiptNumber}` : ''
        }`,
        isCreate: true,
      })
    })

    const { summary, update } = summaryUpdate(ctx, [...ctx.payments, ...added])
    const isManual = input.tenders.every((t) => t.kind !== 'paystack_link')
    const legacy = isManual
      ? legacyBalanceMirror(ctx, summary, added, now)
      : { update: {}, completed: false }
    tx.update(ctx.ref, { ...update, ...legacy.update })
    appendAuditEvents(tx, store, head, events)
    input.stage?.(tx, { ctx, before, added, now })

    return {
      payments: added.map((p) => ({ paymentId: p.id, status: p.status, amountKobo: p.amountKobo })),
      summary,
      saleCompleted: legacy.completed,
    }
  }, TX_OPTIONS)
}

export interface RecordPaymentInput extends Omit<RecordPaymentsInput, 'tenders'> {
  kind: PaymentKind
  methodLabel: string
  amountKobo: number
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
  const { kind, methodLabel, amountKobo, ...rest } = input
  const res = await recordPayments(db, { ...rest, tenders: [{ kind, methodLabel, amountKobo }] })
  const first = res.payments[0]!
  return { paymentId: first.paymentId, status: first.status, flags: [], summary: res.summary }
}

export interface TransitionItem {
  paymentId: string
  to: PaymentStatus
  reason?: string | null
  flags?: PaymentFlag[]
  refundKobo?: number
}

export interface BatchPlan {
  items: TransitionItem[]
  /** Extra audit events (e.g. a till count), appended after the payment events. */
  extraEvents?: (now: string) => AuditEventInput[]
  /** Extra writes in the same transaction, after all reads. */
  extraWrites?: (tx: Transaction, now: string) => void
}

export interface BatchItemResult {
  paymentId: string
  receiptId: string
  status: PaymentStatus
  flags: PaymentFlag[]
  amountKobo: number
  kind: PaymentKind
}

export interface BatchResult {
  items: BatchItemResult[]
  summaries: Record<string, PaymentSummary>
}

/**
 * Applies several transitions in one transaction. `prepare` runs first and may do its own reads
 * (e.g. find the day's cash payments); it must not write.
 */
export async function transitionPaymentsBatch(
  db: Firestore,
  scope: { ownerId: string; storeId: string; actor: PaymentActor },
  prepare: (tx: Transaction, store: DocumentReference) => Promise<BatchPlan>
): Promise<BatchResult> {
  const { actor } = scope
  const store = storeDocRef(db, scope.ownerId, scope.storeId)

  return db.runTransaction(async (tx) => {
    const plan = await prepare(tx, store)
    if (!plan.items.length)
      throw new PaymentServiceError('NOTHING_TO_DO', 400, 'No payments selected')
    if (plan.items.length > MAX_BATCH_TRANSITIONS) {
      throw new PaymentServiceError(
        'TOO_MANY',
        400,
        `At most ${MAX_BATCH_TRANSITIONS} payments at once`
      )
    }
    const ids = plan.items.map((i) => i.paymentId)
    if (new Set(ids).size !== ids.length) {
      throw new PaymentServiceError('DUPLICATE_PAYMENT_ID', 400, 'A payment is listed twice')
    }

    const paymentSnaps = await tx.getAll(...ids.map((id) => store.collection('payments').doc(id)))
    const receiptIds = new Set<string>()
    for (const snap of paymentSnaps) {
      if (!snap.exists) throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
      receiptIds.add(String(snap.data()?.receiptId))
    }
    // Money that really moved (system) must still be recorded on a since-closed sale.
    const contexts = new Map<string, ReceiptContext>()
    for (const receiptId of receiptIds) {
      contexts.set(
        receiptId,
        await readReceiptContext(tx, store, receiptId, { allowClosed: actor.role === 'system' })
      )
    }
    const head: ChainHead = await readChainHead(tx, store)

    const now = new Date().toISOString()
    const working = new Map<string, PaymentRecord[]>()
    for (const [receiptId, ctx] of contexts) working.set(receiptId, [...ctx.payments])

    const events: AuditEventInput[] = []
    const results: BatchItemResult[] = []
    const writes: { ref: DocumentReference; data: Omit<PaymentRecord, 'id'> }[] = []

    for (const item of plan.items) {
      const snap = paymentSnaps.find((s) => s.id === item.paymentId)!
      const payment = { ...(snap.data() as PaymentRecord), id: snap.id }
      const ctx = contexts.get(payment.receiptId)!
      const reason = item.reason?.trim() ? item.reason.trim().slice(0, 500) : null
      const result = checkTransition({
        payment,
        to: item.to,
        actor,
        reason,
        flags: item.flags,
        refundKobo: item.refundKobo,
      })
      if (!result.ok) {
        throw new PaymentServiceError(
          result.code,
          TRANSITION_ERROR_STATUS[result.code],
          result.message
        )
      }

      const flags = new Set<PaymentFlag>([...(payment.flags ?? []), ...(item.flags ?? [])])
      const next: PaymentRecord = {
        ...payment,
        status: item.to,
        refundedKobo: result.refundedKobo,
        updatedAt: now,
        version: (payment.version || 1) + 1,
        statusHistory: [
          ...(payment.statusHistory ?? []),
          { from: payment.status, to: item.to, at: now, by: actor.uid, reason },
        ],
      }
      if (item.to === 'confirmed') {
        next.confirmedBy = actor.uid
        next.confirmedAt = now
      }
      if (item.to === 'rejected') {
        next.rejectedBy = actor.uid
        next.rejectedAt = now
        next.rejectionReason = reason
      }
      if (item.to === 'confirmed' || item.to === 'rejected') {
        next.decidedAt = now
        if (payment.proofPath) next.proofDeleteAfter = addMonths(now, PROOF_RETENTION_MONTHS)
      }

      const list = working.get(payment.receiptId)!
      const others = list.filter((p) => p.id !== payment.id)
      if (item.to === 'confirmed') {
        const after = computePaymentSummary(ctx.totalKobo, [...others, next])
        if (after.overpaidKobo > 0) flags.add('overpaid')
      }
      next.flags = [...flags]
      working.set(payment.receiptId, [...others, next])

      const { id: _id, ...stored } = next
      writes.push({ ref: snap.ref, data: stored })
      const shownKobo = result.event === 'refunded' ? item.refundKobo ?? 0 : payment.amountKobo
      events.push({
        type: result.event,
        paymentId: payment.id,
        receiptId: payment.receiptId,
        linkId: payment.linkId ?? null,
        actorUid: actor.uid,
        actorKind: actor.role,
        amountKobo: shownKobo,
        currency: PAYMENTS_V2_CURRENCY,
        fromStatus: payment.status,
        toStatus: item.to,
        reason,
        flags: next.flags,
        at: now,
        subjectUid: null,
      })
      mirrorToActivityLog(tx, store, {
        actorUid: actor.uid,
        actorName: actor.name,
        storeId: scope.storeId,
        paymentId: payment.id,
        summaryText: `${EVENT_TEXT[result.event]}: ${formatNaira(shownKobo)} ${
          payment.methodLabel
        }${ctx.receiptNumber ? `, receipt ${ctx.receiptNumber}` : ''}`,
        isCreate: false,
      })
      results.push({
        paymentId: payment.id,
        receiptId: payment.receiptId,
        status: item.to,
        flags: next.flags,
        amountKobo: payment.amountKobo,
        kind: payment.kind,
      })
    }

    const summaries: Record<string, PaymentSummary> = {}
    for (const [receiptId, ctx] of contexts) {
      const { summary, update } = summaryUpdate(ctx, working.get(receiptId)!)
      summaries[receiptId] = summary
      tx.update(ctx.ref, update)
    }
    for (const w of writes) tx.set(w.ref, w.data)
    plan.extraWrites?.(tx, now)
    appendAuditEvents(tx, store, head, [...events, ...(plan.extraEvents?.(now) ?? [])])

    return { items: results, summaries }
  }, TX_OPTIONS)
}

export interface TransitionPaymentInput extends TransitionItem {
  ownerId: string
  storeId: string
  actor: PaymentActor
}

export async function transitionPayment(
  db: Firestore,
  input: TransitionPaymentInput
): Promise<PaymentWriteResult> {
  const { ownerId, storeId, actor, ...item } = input
  const res = await transitionPaymentsBatch(db, { ownerId, storeId, actor }, async () => ({
    items: [item],
  }))
  const first = res.items[0]!
  return {
    paymentId: first.paymentId,
    status: first.status,
    flags: first.flags,
    summary: res.summaries[first.receiptId]!,
  }
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString()
}
