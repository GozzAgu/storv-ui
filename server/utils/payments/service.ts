import type { Firestore } from 'firebase-admin/firestore'
import type { PaymentPermissions, PaymentRecord, TillCountRecord } from '~/types/payments-v2'
import { PAYMENT_PERMISSION_ACTIONS } from '~/types/payments-v2'
import { PAYMENTS_V2_CURRENCY } from '~/utils/money-kobo'
import { computePaymentSummary } from '~/utils/payment-summary'
import { appendAuditEvents, readChainHead, storeDocRef } from './audit-log'
import { assertDocId, readPaymentPermissions, requireAccess, type PaymentsAccess } from './access'
import { notifyAwaitingConfirmation, notifyPaymentRejected, notifyTillDifference } from './notify'
import {
  formatNaira,
  PaymentServiceError,
  readReceiptContext,
  recordPayments,
  transitionPaymentsBatch,
  TX_OPTIONS,
  type BatchResult,
  type RecordPaymentsResult,
} from './records'
import { kindForTender, readPaymentSettings } from './settings'

const LAGOS_OFFSET = '+01:00'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function text(value: unknown, field: string, max: number, required = false): string | null {
  if (value == null || value === '') {
    if (required) throw new PaymentServiceError('INVALID_INPUT', 400, `${field} is required`)
    return null
  }
  if (typeof value !== 'string')
    throw new PaymentServiceError('INVALID_INPUT', 400, `${field} is invalid`)
  const trimmed = value.trim()
  if (required && !trimmed)
    throw new PaymentServiceError('INVALID_INPUT', 400, `${field} is required`)
  return trimmed ? trimmed.slice(0, max) : null
}

function kobo(value: unknown, field: string, allowZero = false): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    (!allowZero && value === 0)
  ) {
    throw new PaymentServiceError('INVALID_AMOUNT', 400, `${field} must be a whole number of kobo`)
  }
  return value
}

function idList(value: unknown, field: string): string[] {
  if (value == null) return []
  if (!Array.isArray(value))
    throw new PaymentServiceError('INVALID_INPUT', 400, `${field} must be a list`)
  return value.map((v) => assertDocId(v, field))
}

/** Business day in Lagos time, as [start, end) ISO instants. */
export function lagosDayRange(businessDate: string): { start: string; end: string } {
  if (!DATE_PATTERN.test(businessDate)) {
    throw new PaymentServiceError('INVALID_INPUT', 400, 'businessDate must be YYYY-MM-DD')
  }
  const start = new Date(`${businessDate}T00:00:00${LAGOS_OFFSET}`)
  if (Number.isNaN(start.getTime())) {
    throw new PaymentServiceError('INVALID_INPUT', 400, 'businessDate is not a real date')
  }
  return { start: start.toISOString(), end: new Date(start.getTime() + 86_400_000).toISOString() }
}

export function lagosToday(now: Date = new Date()): string {
  return new Date(now.getTime() + 3_600_000).toISOString().slice(0, 10)
}

const scopeOf = (access: PaymentsAccess) => ({
  ownerId: access.ownerId,
  storeId: access.storeId,
  actorUid: access.actor.uid,
})

// ---------------------------------------------------------------- record

export async function recordManualPayments(
  db: Firestore,
  access: PaymentsAccess,
  input: { receiptId: unknown; tenders: unknown }
): Promise<RecordPaymentsResult> {
  requireAccess(access.canRecord, 'You cannot record payments')
  const receiptId = assertDocId(input.receiptId, 'receiptId')
  if (!Array.isArray(input.tenders)) {
    throw new PaymentServiceError('INVALID_INPUT', 400, 'tenders must be a list')
  }
  const store = storeDocRef(db, access.ownerId, access.storeId)
  const settings = await readPaymentSettings(store)
  const tenders = input.tenders.map((raw) => {
    const t = (raw ?? {}) as { methodLabel?: unknown; amountKobo?: unknown }
    const methodLabel = text(t.methodLabel, 'methodLabel', 60, true)!
    return {
      kind: kindForTender(methodLabel, settings),
      methodLabel,
      amountKobo: kobo(t.amountKobo, 'amountKobo'),
    }
  })

  const result = await recordPayments(db, {
    ownerId: access.ownerId,
    storeId: access.storeId,
    receiptId,
    tenders,
    currency: PAYMENTS_V2_CURRENCY,
    actor: access.actor,
  })
  const awaiting = result.payments.filter((p) => p.status === 'awaiting_confirmation').length
  if (awaiting) await notifyAwaitingConfirmation(db, scopeOf(access), receiptId, awaiting)
  return result
}

// ---------------------------------------------------------------- confirm / reject / refund

export async function decidePayment(
  db: Firestore,
  access: PaymentsAccess,
  input: { paymentId: unknown; decision: 'confirm' | 'reject'; reason?: unknown }
): Promise<BatchResult> {
  requireAccess(access.canConfirm, 'You cannot confirm payments')
  const paymentId = assertDocId(input.paymentId, 'paymentId')
  const reason = text(input.reason, 'reason', 500, input.decision === 'reject')

  const result = await transitionPaymentsBatch(
    db,
    { ownerId: access.ownerId, storeId: access.storeId, actor: access.actor },
    async (tx, store) => {
      if (input.decision === 'confirm') {
        const [snap, settings] = await Promise.all([
          tx.get(store.collection('payments').doc(paymentId)),
          readPaymentSettings(store, tx),
        ])
        if (!snap.exists) throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
        if (snap.data()?.kind === 'cash' && settings.cashConfirmation === 'end_of_day') {
          throw new PaymentServiceError(
            'USE_TILL_COUNT',
            409,
            'Cash is confirmed by the end-of-day till count'
          )
        }
      }
      return {
        items: [{ paymentId, to: input.decision === 'confirm' ? 'confirmed' : 'rejected', reason }],
      }
    }
  )
  if (input.decision === 'reject') {
    const item = result.items[0]!
    await notifyPaymentRejected(db, scopeOf(access), item.receiptId, item.amountKobo)
  }
  return result
}

export async function refundPayment(
  db: Firestore,
  access: PaymentsAccess,
  input: { paymentId: unknown; amountKobo: unknown; reason: unknown }
): Promise<BatchResult> {
  requireAccess(access.canRefund, 'You cannot refund payments')
  const paymentId = assertDocId(input.paymentId, 'paymentId')
  const amountKobo = kobo(input.amountKobo, 'amountKobo')
  const reason = text(input.reason, 'reason', 500, true)
  return transitionPaymentsBatch(
    db,
    { ownerId: access.ownerId, storeId: access.storeId, actor: access.actor },
    async (tx, store) => {
      const snap = await tx.get(store.collection('payments').doc(paymentId))
      if (!snap.exists) throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
      const p = snap.data() as PaymentRecord
      const full = (p.refundedKobo ?? 0) + amountKobo === p.amountKobo
      return {
        items: [
          {
            paymentId,
            to: full ? 'refunded' : 'partially_refunded',
            reason,
            refundKobo: amountKobo,
          },
        ],
      }
    }
  )
}

/**
 * Cancel or mark refunded a sale that has V2 payments. Only once no money is held against it:
 * everything confirmed has been refunded and nothing is awaiting or pending.
 */
export async function closeSale(
  db: Firestore,
  access: PaymentsAccess,
  input: { receiptId: unknown; action: unknown; reason: unknown }
): Promise<{ status: 'cancelled' | 'refunded' }> {
  requireAccess(access.isOwner || access.canRefund, 'You cannot close sales with payments')
  const receiptId = assertDocId(input.receiptId, 'receiptId')
  if (input.action !== 'cancel' && input.action !== 'refund') {
    throw new PaymentServiceError('INVALID_INPUT', 400, 'action must be cancel or refund')
  }
  const reason = text(input.reason, 'reason', 500, true)!
  const status = input.action === 'cancel' ? 'cancelled' : 'refunded'
  const store = storeDocRef(db, access.ownerId, access.storeId)

  await db.runTransaction(async (tx) => {
    const ctx = await readReceiptContext(tx, store, receiptId)
    const head = await readChainHead(tx, store)
    // The client moves stock only after this succeeds, so closing twice must fail.
    const open = status === 'cancelled' ? ['balance_due', 'pending'] : ['completed']
    if (!open.includes(ctx.legacyStatus)) {
      throw new PaymentServiceError(
        'SALE_NOT_OPEN',
        409,
        status === 'cancelled'
          ? 'Only outstanding orders can be cancelled'
          : 'Only completed sales can be refunded'
      )
    }
    const summary = computePaymentSummary(ctx.totalKobo, ctx.payments)
    if (summary.netPaidKobo > 0 || summary.awaitingKobo > 0 || summary.pendingKobo > 0) {
      throw new PaymentServiceError(
        'MONEY_HELD',
        409,
        'Refund or reject every payment on this sale before closing it'
      )
    }
    const now = new Date().toISOString()
    tx.update(ctx.ref, {
      status,
      ...(status === 'refunded' ? { refundReason: reason } : { cancelReason: reason }),
      updatedAt: new Date(now),
    })
    appendAuditEvents(tx, store, head, [
      {
        type: 'sale_cancelled',
        paymentId: null,
        receiptId,
        linkId: null,
        actorUid: access.actor.uid,
        actorKind: access.actor.role,
        amountKobo: null,
        currency: null,
        fromStatus: ctx.legacyStatus || null,
        toStatus: status,
        reason,
        flags: [],
        at: now,
        subjectUid: null,
      },
    ])
  }, TX_OPTIONS)
  return { status }
}

// ---------------------------------------------------------------- awaiting list

export interface AwaitingPaymentDto {
  id: string
  receiptId: string
  kind: PaymentRecord['kind']
  methodLabel: string
  amountKobo: number
  recordedBy: string
  recordedByName: string
  createdAt: string
  hasProof: boolean
  isOwnEntry: boolean
  confirmViaTillCount: boolean
}

export async function listAwaiting(
  db: Firestore,
  access: PaymentsAccess
): Promise<AwaitingPaymentDto[]> {
  requireAccess(access.canConfirm, 'You cannot confirm payments')
  const store = storeDocRef(db, access.ownerId, access.storeId)
  const [snap, settings] = await Promise.all([
    store.collection('payments').where('status', '==', 'awaiting_confirmation').limit(500).get(),
    readPaymentSettings(store),
  ])
  return snap.docs
    .map((d) => {
      const p = d.data() as PaymentRecord
      return {
        id: d.id,
        receiptId: p.receiptId,
        kind: p.kind,
        methodLabel: p.methodLabel,
        amountKobo: p.amountKobo,
        recordedBy: p.recordedBy,
        recordedByName: p.recordedByName,
        createdAt: p.createdAt,
        hasProof: Boolean(p.proofPath),
        isOwnEntry: p.recordedBy === access.actor.uid,
        confirmViaTillCount: p.kind === 'cash' && settings.cashConfirmation === 'end_of_day',
      }
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

// ---------------------------------------------------------------- permissions

/** Owner only (the route also asks for a fresh 2FA code). Every change is an audit event. */
export async function setMemberPaymentPermissions(
  db: Firestore,
  access: PaymentsAccess,
  input: { memberUid: unknown; permissions: unknown }
): Promise<PaymentPermissions> {
  if (!access.isOwner)
    throw new PaymentServiceError('FORBIDDEN', 403, 'Only the owner can change payment permissions')
  const memberUid = assertDocId(input.memberUid, 'memberUid')
  if (memberUid === access.ownerId) {
    throw new PaymentServiceError(
      'INVALID_INPUT',
      400,
      'The owner always has every payment permission'
    )
  }
  const raw = (input.permissions ?? {}) as Record<string, unknown>
  for (const action of PAYMENT_PERMISSION_ACTIONS) {
    if (typeof raw[action] !== 'boolean') {
      throw new PaymentServiceError(
        'INVALID_INPUT',
        400,
        `permissions.${action} must be true or false`
      )
    }
  }
  const next = readPaymentPermissions(raw)
  const store = storeDocRef(db, access.ownerId, access.storeId)
  const memberRef = store.collection('members').doc(memberUid)

  await db.runTransaction(async (tx) => {
    const memberSnap = await tx.get(memberRef)
    if (!memberSnap.exists) throw new PaymentServiceError('NOT_FOUND', 404, 'Not found')
    const head = await readChainHead(tx, store)
    const before = readPaymentPermissions(memberSnap.data()?.permissions?.payments)
    const now = new Date().toISOString()
    const changes = PAYMENT_PERMISSION_ACTIONS.filter((a) => before[a] !== next[a])
    if (!changes.length) return
    tx.update(memberRef, { 'permissions.payments': next, updatedAt: new Date(now) })
    appendAuditEvents(
      tx,
      store,
      head,
      changes.map((action) => ({
        type: next[action] ? 'permission_granted' : 'permission_revoked',
        paymentId: null,
        receiptId: null,
        linkId: null,
        actorUid: access.actor.uid,
        actorKind: access.actor.role,
        amountKobo: null,
        currency: null,
        fromStatus: null,
        toStatus: null,
        reason: `payments.${action}`,
        flags: [],
        at: now,
        subjectUid: memberUid,
      }))
    )
  }, TX_OPTIONS)
  return next
}

// ---------------------------------------------------------------- till count

interface CashPaymentLine {
  id: string
  receiptId: string
  amountKobo: number
  recordedBy: string
  recordedByName: string
  createdAt: string
}

function cashLinesForDay(docs: FirebaseFirestore.QueryDocumentSnapshot[], businessDate: string) {
  const { start, end } = lagosDayRange(businessDate)
  return docs
    .map((d) => ({ ...(d.data() as PaymentRecord), id: d.id }))
    .filter((p) => p.kind === 'cash' && p.createdAt >= start && p.createdAt < end)
    .map(
      (p): CashPaymentLine => ({
        id: p.id,
        receiptId: p.receiptId,
        amountKobo: p.amountKobo,
        recordedBy: p.recordedBy,
        recordedByName: p.recordedByName,
        createdAt: p.createdAt,
      })
    )
}

const awaitingCashQuery = (store: FirebaseFirestore.DocumentReference) =>
  store
    .collection('payments')
    .where('status', '==', 'awaiting_confirmation')
    .where('kind', '==', 'cash')

export async function previewTillDay(
  db: Firestore,
  access: PaymentsAccess,
  businessDate: unknown
): Promise<{
  businessDate: string
  expectedKobo: number
  lines: CashPaymentLine[]
  ownEntries: CashPaymentLine[]
}> {
  requireAccess(access.canConfirm, 'You cannot confirm payments')
  const date = typeof businessDate === 'string' ? businessDate : lagosToday()
  const store = storeDocRef(db, access.ownerId, access.storeId)
  const lines = cashLinesForDay((await awaitingCashQuery(store).get()).docs, date)
  const eligible = lines.filter((l) => l.recordedBy !== access.actor.uid)
  return {
    businessDate: date,
    expectedKobo: eligible.reduce((s, l) => s + l.amountKobo, 0),
    lines: eligible,
    ownEntries: lines.filter((l) => l.recordedBy === access.actor.uid),
  }
}

/**
 * End-of-day cash: every awaiting cash payment for the day (except the counter's own) is either
 * confirmed or rejected, in one transaction, and the count is kept with its difference.
 */
export async function submitTillCount(
  db: Firestore,
  access: PaymentsAccess,
  input: {
    businessDate: unknown
    countedKobo: unknown
    confirmIds: unknown
    rejectIds: unknown
    rejectReason?: unknown
    note?: unknown
  }
): Promise<TillCountRecord & { id: string }> {
  requireAccess(access.canConfirm, 'You cannot confirm payments')
  if (typeof input.businessDate !== 'string') {
    throw new PaymentServiceError('INVALID_INPUT', 400, 'businessDate is required')
  }
  const businessDate = input.businessDate
  lagosDayRange(businessDate)
  if (businessDate > lagosToday()) {
    throw new PaymentServiceError('INVALID_INPUT', 400, 'You cannot count a future day')
  }
  const countedKobo = kobo(input.countedKobo, 'countedKobo', true)
  const confirmIds = idList(input.confirmIds, 'confirmIds')
  const rejectIds = idList(input.rejectIds, 'rejectIds')
  const rejectReason = text(input.rejectReason, 'rejectReason', 500, rejectIds.length > 0)
  const note = text(input.note, 'note', 500)

  const store = storeDocRef(db, access.ownerId, access.storeId)
  const countRef = store.collection('tillCounts').doc()
  let record!: TillCountRecord

  const result = await transitionPaymentsBatch(
    db,
    { ownerId: access.ownerId, storeId: access.storeId, actor: access.actor },
    async (tx) => {
      const settings = await readPaymentSettings(store, tx)
      if (settings.cashConfirmation !== 'end_of_day') {
        throw new PaymentServiceError(
          'TILL_COUNT_OFF',
          409,
          'This store confirms cash payments one by one'
        )
      }
      const lines = cashLinesForDay((await tx.get(awaitingCashQuery(store))).docs, businessDate)
      const eligible = new Map(
        lines.filter((l) => l.recordedBy !== access.actor.uid).map((l) => [l.id, l])
      )
      const decided = [...confirmIds, ...rejectIds]
      const covered = new Set(decided)
      if (
        covered.size !== decided.length ||
        covered.size !== eligible.size ||
        decided.some((id) => !eligible.has(id))
      ) {
        throw new PaymentServiceError(
          'TILL_COUNT_STALE',
          409,
          'The list of cash payments changed. Reload the till count and try again.'
        )
      }
      const sum = (ids: string[]) => ids.reduce((s, id) => s + eligible.get(id)!.amountKobo, 0)
      const confirmedKobo = sum(confirmIds)
      const rejectedKobo = sum(rejectIds)
      const now = new Date().toISOString()
      record = {
        businessDate,
        countedKobo,
        expectedKobo: confirmedKobo + rejectedKobo,
        confirmedKobo,
        rejectedKobo,
        differenceKobo: countedKobo - confirmedKobo,
        confirmedPaymentIds: confirmIds,
        rejectedPaymentIds: rejectIds,
        countedBy: access.actor.uid,
        countedByName: access.actor.name,
        note,
        createdAt: now,
      }
      return {
        items: [
          ...confirmIds.map((paymentId) => ({
            paymentId,
            to: 'confirmed' as const,
            reason: `till count ${businessDate}`,
          })),
          ...rejectIds.map((paymentId) => ({
            paymentId,
            to: 'rejected' as const,
            reason: rejectReason,
          })),
        ],
        extraWrites: (writeTx) => writeTx.create(countRef, record),
        extraEvents: (at) => [
          {
            type: 'till_counted',
            paymentId: null,
            receiptId: null,
            linkId: null,
            actorUid: access.actor.uid,
            actorKind: access.actor.role,
            amountKobo: countedKobo,
            currency: PAYMENTS_V2_CURRENCY,
            fromStatus: null,
            toStatus: null,
            reason: `${businessDate} expected ${formatNaira(
              record.expectedKobo
            )} confirmed ${formatNaira(confirmedKobo)} difference ${formatNaira(
              record.differenceKobo
            )} (${countRef.id})`,
            flags: [],
            at,
            subjectUid: null,
          },
        ],
      }
    }
  )

  if (record.differenceKobo !== 0) {
    await notifyTillDifference(
      db,
      scopeOf(access),
      countRef.id,
      businessDate,
      record.differenceKobo
    )
  }
  for (const item of result.items.filter((i) => i.status === 'rejected')) {
    await notifyPaymentRejected(db, scopeOf(access), item.receiptId, item.amountKobo)
  }
  return { ...record, id: countRef.id }
}
