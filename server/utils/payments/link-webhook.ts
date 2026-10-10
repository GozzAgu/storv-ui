import type { DocumentReference, Firestore } from 'firebase-admin/firestore'
import type {
  PaymentFlag,
  PaymentLinkAttempt,
  PaymentLinkV2,
  PaymentRecord,
  PaystackEventRecord,
} from '~/types/payments-v2'
import { PAYMENTS_V2_CURRENCY } from '~/utils/money-kobo'
import { computePaymentSummary } from '~/utils/payment-summary'
import { buildReceiptView, type ReceiptView } from '~/server/utils/receipt-view'
import { storeDocRef, type AuditEventInput } from './audit-log'
import { parseCheckoutReference } from './link-token'
import { LINKS_COLLECTION } from './links'
import { isOversold, planStockCommit, type StockIssue } from './link-stock'
import { notifyLinkProblem, notifyPaymentReceived } from './notify'
import { opsAlert, type OpsAlertDeps } from './ops-alert'
import type { PaystackCall } from './payout'
import { checkVerifiedCharge, type VerifiedCharge, type VerifyFailure } from './paystack-verify'
import {
  legacyBalanceMirror,
  PaymentServiceError,
  readReceiptContext,
  recordPayments,
  transitionPayment,
  transitionPaymentsBatch,
  TX_OPTIONS,
} from './records'
import type { PaymentActor } from './state-machine'
import { settleTradeLoanPayment } from '../trade/loans'
import { notifyTradeSalePaid } from '../trade/sales'

export const PAYSTACK_EVENTS_COLLECTION = 'paystackEvents'
export const SYSTEM_PAYSTACK_ACTOR: PaymentActor = {
  uid: 'system:paystack',
  name: 'Paystack',
  role: 'system',
}

export type LinkChargeOutcome =
  | 'applied'
  | 'applied_late'
  | 'applied_duplicate'
  | 'already_processed'
  | 'disabled'
  | 'unknown_reference'
  | 'verify_unavailable'
  | 'verify_failed'
  | 'apply_failed'

export interface LinkChargeResult {
  /** 200 tells Paystack to stop; 500 makes it retry (72 hours live, 10 hours test). */
  httpStatus: 200 | 500
  outcome: LinkChargeOutcome
}

export interface LinkChargeDeps {
  paystack: PaystackCall
  /** Payments V2 gate; when off the event is kept retryable so nothing is lost. */
  enabled: boolean
  now?: () => Date
  /** Sends the payer's receipt; omitted when email delivery is not configured. */
  sendPayerReceipt?: (toEmail: string, view: ReceiptView) => Promise<void>
  /** Ops email for problems a person must check; without it they are logged only. */
  alerts?: OpsAlertDeps
}

const eventDocId = (type: string, reference: string) => `${type}_${reference}`

function alertLog(fields: Record<string, unknown>): void {
  console.error(JSON.stringify({ tag: 'payments-alert', ...fields }))
}

/** Only `processed` is skipped; anything else is attempted again. */
async function receiveEvent(
  db: Firestore,
  ref: DocumentReference,
  reference: string,
  linkId: string | null,
  now: string
): Promise<'new' | 'processed'> {
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const prev = snap.data() as PaystackEventRecord | undefined
    if (prev?.state === 'processed') return 'processed'
    const record: PaystackEventRecord = {
      type: 'charge.success',
      reference,
      linkId,
      state: 'received',
      outcome: prev?.outcome ?? null,
      deliveries: (prev?.deliveries ?? 0) + 1,
      firstReceivedAt: prev?.firstReceivedAt ?? now,
      lastReceivedAt: now,
      processedAt: null,
      duplicatePaymentId: prev?.duplicatePaymentId ?? null,
    }
    tx.set(ref, record)
    return 'new'
  }, TX_OPTIONS)
}

async function finishEvent(
  ref: DocumentReference,
  state: PaystackEventRecord['state'],
  outcome: string,
  now: string
): Promise<void> {
  await ref.set(
    { state, outcome, processedAt: state === 'processed' ? now : null },
    { merge: true }
  )
}

/** Thrown inside the apply transaction to abort it and take another path. */
class ApplyRedirect extends Error {
  constructor(readonly kind: 'already' | 'duplicate') {
    super(kind)
  }
}

interface ApplyResult {
  late: boolean
  flags: PaymentFlag[]
  stockIssues: StockIssue[]
  saleCompleted: boolean
}

/**
 * Confirms the link's payment from a verified charge, in one transaction with: the link and
 * attempt marked paid, the receipt's legacy fields mirrored (a balance-due sale completes when
 * covered), held stock committed for a completed sale, and the event marked processed. A late
 * charge (link expired or revoked) is confirmed and flagged; if the order was already cancelled
 * its stock is left alone and only checked, so a sold item shows as `oversold`.
 */
async function applyCharge(
  db: Firestore,
  linkId: string,
  charge: VerifiedCharge,
  eventRef: DocumentReference,
  nowIso: string
): Promise<ApplyResult> {
  const linkRef = db.collection(LINKS_COLLECTION).doc(linkId)
  const attemptRef = linkRef.collection('attempts').doc(charge.reference)
  const first = (await linkRef.get()).data() as PaymentLinkV2 | undefined
  if (!first) throw new PaymentServiceError('NOT_FOUND', 404, 'Link not found')

  let result: ApplyResult = { late: false, flags: [], stockIssues: [], saleCompleted: false }

  await transitionPaymentsBatch(
    db,
    { ownerId: first.ownerId, storeId: first.storeId, actor: SYSTEM_PAYSTACK_ACTOR },
    async (tx, store) => {
      const [linkSnap, eventSnap] = await Promise.all([tx.get(linkRef), tx.get(eventRef)])
      const link = linkSnap.data() as PaymentLinkV2
      if ((eventSnap.data() as PaystackEventRecord | undefined)?.state === 'processed') {
        throw new ApplyRedirect('already')
      }
      const paymentRef = store.collection('payments').doc(link.paymentId)
      const payment = (await tx.get(paymentRef)).data() as PaymentRecord | undefined
      if (!payment) throw new PaymentServiceError('NOT_FOUND', 404, 'Payment not found')
      if (payment.status === 'confirmed' && link.paidReference === charge.reference) {
        throw new ApplyRedirect('already')
      }
      if (payment.status !== 'pending' && payment.status !== 'expired') {
        throw new ApplyRedirect('duplicate')
      }

      const flags: PaymentFlag[] = []
      if (link.status === 'revoked') flags.push('paid_after_revoke')
      else if (link.status === 'expired' || payment.status === 'expired')
        flags.push('paid_after_expiry')

      const ctx = await readReceiptContext(tx, store, link.receiptId, { allowClosed: true })
      const confirmed: PaymentRecord = { ...payment, id: link.paymentId, status: 'confirmed' }
      const after = computePaymentSummary(ctx.totalKobo, [
        ...ctx.payments.filter((p) => p.id !== link.paymentId),
        confirmed,
      ])
      const mirror = legacyBalanceMirror(ctx, after, [confirmed], nowIso)
      const receipt = (await tx.get(ctx.ref)).data() ?? {}
      const cancelled = ctx.legacyStatus === 'cancelled'
      const stock =
        mirror.completed || cancelled
          ? await planStockCommit(tx, store, link.receiptId, receipt, { write: mirror.completed })
          : null
      if (stock && isOversold(stock.issues)) flags.push('oversold')

      result = {
        late: flags.length > 0,
        flags,
        stockIssues: stock?.issues ?? [],
        saleCompleted: mirror.completed,
      }

      return {
        items: [{ paymentId: link.paymentId, to: 'confirmed', flags }],
        extraWrites: (w, at) => {
          w.update(paymentRef, { reference: charge.reference })
          if (Object.keys(mirror.update).length) w.update(ctx.ref, mirror.update)
          stock?.apply(w)
          w.update(linkRef, {
            status: 'paid',
            paidAt: at,
            paidReference: charge.reference,
            updatedAt: at,
            version: (link.version || 1) + 1,
          })
          w.set(
            attemptRef,
            {
              status: 'paid',
              paystackTransactionId: charge.transactionId,
              channel: charge.channel,
              paidAt: charge.paidAt || at,
              feesKobo: charge.feesKobo,
              verifiedAt: at,
            },
            { merge: true }
          )
          w.set(
            eventRef,
            {
              state: 'processed',
              outcome: flags.length ? 'applied_late' : 'applied',
              processedAt: at,
            },
            { merge: true }
          )
        },
        extraEvents: (at): AuditEventInput[] =>
          mirror.completed
            ? [
                {
                  type: 'sale_completed',
                  paymentId: link.paymentId,
                  receiptId: link.receiptId,
                  linkId,
                  actorUid: SYSTEM_PAYSTACK_ACTOR.uid,
                  actorKind: 'system',
                  amountKobo: null,
                  currency: null,
                  fromStatus: ctx.legacyStatus,
                  toStatus: 'completed',
                  reason: stock?.issues.length ? 'stock needs review' : null,
                  flags,
                  at,
                  subjectUid: null,
                },
              ]
            : [],
      }
    }
  )
  return result
}

/**
 * A second successful charge on a link that is already paid (two checkouts both completed).
 * The money is real: record it as its own Paystack payment, confirm it flagged
 * `duplicate_payment` (and `overpaid`), and alert the owner to refund one. The created payment
 * ID is stored on the event first, so a retry confirms the same record instead of adding another.
 */
async function applyDuplicate(
  db: Firestore,
  link: PaymentLinkV2,
  linkId: string,
  charge: VerifiedCharge,
  eventRef: DocumentReference
): Promise<void> {
  const prior = (await eventRef.get()).data() as PaystackEventRecord | undefined
  let paymentId = prior?.duplicatePaymentId ?? null
  if (!paymentId) {
    const res = await recordPayments(db, {
      ownerId: link.ownerId,
      storeId: link.storeId,
      receiptId: link.receiptId,
      currency: PAYMENTS_V2_CURRENCY,
      actor: SYSTEM_PAYSTACK_ACTOR,
      linkId,
      reference: charge.reference,
      allowOverpayment: true,
      tenders: [
        {
          kind: 'paystack_link',
          methodLabel: 'Payment link (repeat)',
          amountKobo: charge.amountKobo,
        },
      ],
      stage: (tx, { added }) => {
        tx.set(eventRef, { duplicatePaymentId: added[0]!.id }, { merge: true })
      },
    })
    paymentId = res.payments[0]!.paymentId
  }
  try {
    await transitionPayment(db, {
      ownerId: link.ownerId,
      storeId: link.storeId,
      actor: SYSTEM_PAYSTACK_ACTOR,
      paymentId,
      to: 'confirmed',
      flags: ['duplicate_payment'],
    })
  } catch (err) {
    if (!(err instanceof PaymentServiceError && err.code === 'INVALID_TRANSITION')) throw err
  }
  await markAttemptPaid(db, linkId, charge)
}

async function markAttemptPaid(db: Firestore, linkId: string, charge: VerifiedCharge) {
  await db
    .collection(LINKS_COLLECTION)
    .doc(linkId)
    .collection('attempts')
    .doc(charge.reference)
    .set(
      {
        status: 'paid',
        paystackTransactionId: charge.transactionId,
        channel: charge.channel,
        paidAt: charge.paidAt || new Date().toISOString(),
        feesKobo: charge.feesKobo,
        verifiedAt: new Date().toISOString(),
      },
      { merge: true }
    )
}

type PayerReceiptStatus = NonNullable<PaymentLinkAttempt['payerReceipt']>['status']

/**
 * One receipt email to the payer, built from stored data, to the address in Paystack's verify
 * response. The address is used here and dropped: only the outcome is stored on the attempt,
 * which is claimed first so a second run never sends again. A cancelled sale gets none.
 * Never throws: the payment is already applied.
 */
async function sendPayerReceiptOnce(
  db: Firestore,
  link: PaymentLinkV2,
  linkId: string,
  charge: VerifiedCharge,
  deps: LinkChargeDeps
): Promise<void> {
  if (!deps.sendPayerReceipt) return
  const attemptRef = db
    .collection(LINKS_COLLECTION)
    .doc(linkId)
    .collection('attempts')
    .doc(charge.reference)
  const stamp = () => (deps.now ? deps.now() : new Date()).toISOString()
  const finish = (status: PayerReceiptStatus) =>
    attemptRef.update({ payerReceipt: { status, at: stamp() } })
  try {
    const claimed = await db.runTransaction(async (tx) => {
      const attempt = (await tx.get(attemptRef)).data() as PaymentLinkAttempt | undefined
      if (!attempt || attempt.payerReceipt) return false
      tx.update(attemptRef, { payerReceipt: { status: 'sending', at: stamp() } })
      return true
    })
    if (!claimed) return
    if (!charge.payerEmail) return void (await finish('no_address'))
    const receipt = (
      await storeDocRef(db, link.ownerId, link.storeId)
        .collection('receipts')
        .doc(link.receiptId)
        .get()
    ).data()
    if (!receipt || receipt.status === 'cancelled') return void (await finish('skipped'))
    const view = await buildReceiptView(db, link.ownerId, link.storeId, link.receiptId, receipt)
    await deps.sendPayerReceipt(charge.payerEmail, view)
    await finish('sent')
  } catch {
    console.error(
      JSON.stringify({ tag: 'payments-payer-receipt-failed', reference: charge.reference })
    )
    await finish('failed').catch(() => undefined)
  }
}

const VERIFY_PROBLEM_TEXT: Partial<Record<VerifyFailure, string>> = {
  AMOUNT_MISMATCH: 'the amount paid did not match the link',
  CURRENCY_MISMATCH: 'the currency was not NGN',
  SUBACCOUNT_MISSING: 'Paystack did not confirm it went to your payout account',
  SUBACCOUNT_MISMATCH: 'it did not go to your payout account',
  REFERENCE_MISMATCH: 'the reference did not match',
  MALFORMED: 'Paystack returned an unexpected response',
}

/**
 * charge.success for a Storvv link reference (`stvp_...`). Signature is checked by the caller.
 * Flow: record the delivery → verify with Paystack server-side → check every field against the
 * stored attempt → apply in one transaction. Fails closed: nothing is confirmed unless verify
 * matches; outages return 500 so Paystack retries; mismatches stop retrying and alert.
 */
export async function handleLinkCharge(
  db: Firestore,
  rawReference: unknown,
  deps: LinkChargeDeps
): Promise<LinkChargeResult> {
  const now = () => (deps.now ? deps.now() : new Date()).toISOString()
  const parsed = parseCheckoutReference(rawReference)
  if (!parsed) return { httpStatus: 200, outcome: 'unknown_reference' }
  const { linkId, reference } = parsed
  const alert = (name: string, fields: Record<string, string | number | null> = {}) =>
    opsAlert(db, name, reference, { reference, ...fields }, deps.alerts)
  const eventRef = db
    .collection(PAYSTACK_EVENTS_COLLECTION)
    .doc(eventDocId('charge.success', reference))

  if ((await receiveEvent(db, eventRef, reference, linkId, now())) === 'processed') {
    return { httpStatus: 200, outcome: 'already_processed' }
  }
  if (!deps.enabled) {
    await finishEvent(eventRef, 'failed_retryable', 'disabled', now())
    alertLog({ alert: 'link-charge-while-disabled', reference })
    return { httpStatus: 500, outcome: 'disabled' }
  }

  const linkRef = db.collection(LINKS_COLLECTION).doc(linkId)
  const [linkSnap, attemptSnap] = await Promise.all([
    linkRef.get(),
    linkRef.collection('attempts').doc(reference).get(),
  ])
  const link = linkSnap.data() as PaymentLinkV2 | undefined
  const attempt = attemptSnap.data() as PaymentLinkAttempt | undefined
  if (!link || !attempt) {
    await finishEvent(eventRef, 'failed_permanent', 'unknown_reference', now())
    await alert('link-charge-unknown-reference')
    return { httpStatus: 200, outcome: 'unknown_reference' }
  }

  let raw: unknown
  try {
    raw = await deps.paystack(`/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
    })
  } catch {
    await finishEvent(eventRef, 'failed_retryable', 'verify_unavailable', now())
    alertLog({ alert: 'link-verify-unavailable', reference })
    return { httpStatus: 500, outcome: 'verify_unavailable' }
  }

  const check = checkVerifiedCharge(raw, {
    reference,
    amountKobo: attempt.amountKobo,
    subaccountCode: attempt.subaccountCode,
  })
  if (!check.ok) {
    const state = check.retryable ? 'failed_retryable' : 'failed_permanent'
    await finishEvent(eventRef, state, `verify_failed:${check.code}`, now())
    const fields = { code: check.code, paystackStatus: check.paystackStatus }
    if (check.retryable || check.code === 'NOT_SUCCESSFUL') {
      alertLog({ alert: 'link-verify-failed', reference, ...fields })
    } else {
      await alert('link-verify-failed', fields)
    }
    if (!check.retryable) {
      if (check.code === 'NOT_SUCCESSFUL') {
        await linkRef
          .collection('attempts')
          .doc(reference)
          .set({ status: 'failed' }, { merge: true })
      } else {
        await notifyLinkProblem(
          db,
          { ownerId: link.ownerId, storeId: link.storeId },
          link.receiptId,
          link.receiptNumber,
          `A Paystack payment on this link was not accepted because ${
            VERIFY_PROBLEM_TEXT[check.code] ?? 'it could not be verified'
          }. It was not added to the sale; contact Storvv support with this sale number.`
        )
      }
    }
    return { httpStatus: check.retryable ? 500 : 200, outcome: 'verify_failed' }
  }
  // The stored attempt is what checkout sent; the link must still agree with it.
  if (attempt.subaccountCode !== link.subaccountCode || attempt.amountKobo !== link.amountKobo) {
    await finishEvent(eventRef, 'failed_permanent', 'verify_failed:LINK_MISMATCH', now())
    await alert('link-attempt-mismatch')
    return { httpStatus: 200, outcome: 'verify_failed' }
  }

  try {
    const applied = await applyCharge(db, linkId, check.charge, eventRef, now())
    if (applied.late || applied.stockIssues.length) {
      await notifyLinkProblem(
        db,
        { ownerId: link.ownerId, storeId: link.storeId },
        link.receiptId,
        link.receiptNumber,
        lateMessage(applied)
      )
    } else {
      await notifyPaymentReceived(
        db,
        { ownerId: link.ownerId, storeId: link.storeId },
        {
          receiptId: link.receiptId,
          receiptNumber: link.receiptNumber,
          amountKobo: check.charge.amountKobo,
          linkCreatorUid: link.createdBy,
        }
      )
    }
    await sendPayerReceiptOnce(db, link, linkId, check.charge, deps)
    await notifyTradeSalePaid(db, linkId)
    await settleTradeLoanPayment(db, linkId)
    return { httpStatus: 200, outcome: applied.late ? 'applied_late' : 'applied' }
  } catch (err) {
    if (err instanceof ApplyRedirect && err.kind === 'already') {
      await finishEvent(eventRef, 'processed', 'already_processed', now())
      return { httpStatus: 200, outcome: 'already_processed' }
    }
    try {
      if (err instanceof ApplyRedirect) {
        await applyDuplicate(db, link, linkId, check.charge, eventRef)
        await finishEvent(eventRef, 'processed', 'applied_duplicate', now())
        await notifyLinkProblem(
          db,
          { ownerId: link.ownerId, storeId: link.storeId },
          link.receiptId,
          link.receiptNumber,
          'This link was paid twice. Both payments are recorded; refund one from your Paystack dashboard.'
        )
        return { httpStatus: 200, outcome: 'applied_duplicate' }
      }
      throw err
    } catch (applyErr) {
      const code = applyErr instanceof PaymentServiceError ? applyErr.code : 'UNKNOWN'
      // A sale closed since (cancelled or refunded) cannot take a repeat payment: stop and alert.
      const permanent = code === 'RECEIPT_CLOSED'
      await finishEvent(
        eventRef,
        permanent ? 'failed_permanent' : 'failed_retryable',
        `apply_failed:${code}`,
        now()
      )
      await alert('link-apply-failed', { code })
      if (permanent) {
        await notifyLinkProblem(
          db,
          { ownerId: link.ownerId, storeId: link.storeId },
          link.receiptId,
          link.receiptNumber,
          'A customer paid this link again after the sale was closed. Refund them from your Paystack dashboard.'
        )
      }
      return { httpStatus: permanent ? 200 : 500, outcome: 'apply_failed' }
    }
  }
}

const STOCK_TEXT: Record<StockIssue['reason'], string> = {
  already_sold: 'already sold',
  held_by_other: 'held for another sale',
  insufficient_stock: 'short of stock',
  missing_item: 'no longer in inventory',
  on_loan: 'out on a stock loan',
}

function lateMessage(applied: ApplyResult): string {
  const parts: string[] = []
  if (applied.flags.includes('paid_after_revoke')) parts.push('was paid after the link was revoked')
  else if (applied.flags.includes('paid_after_expiry'))
    parts.push('was paid after the link expired')
  if (applied.stockIssues.length) {
    const reasons = [...new Set(applied.stockIssues.map((i) => STOCK_TEXT[i.reason]))].join(', ')
    parts.push(`has ${applied.stockIssues.length} item(s) to check (${reasons})`)
  }
  return `This sale ${parts.join(
    ' and '
  )}. The payment is recorded; check the sale and refund the customer if needed.`
}
