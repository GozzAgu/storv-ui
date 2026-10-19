import { createError } from 'h3'
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore'
import { planHasFeature } from '~/types/subscription'
import { computeBalanceDue, isBalanceFullyPaid, roundMoney } from '~/utils/receipt-balance'
import { planStockCommit } from '~/server/utils/payments/link-stock'
import { assertId, forbid, type StoreActor } from './actor'
import { logSaleActivity } from './records'
import { planHoldRelease, planStockReturn } from './stock'

/**
 * Balance-due payments, cancels and refunds. These used to be client writes guarded only by
 * field lists; now the amounts, the status change and the stock move happen in one transaction.
 */

function bad(message: string, code = 'INVALID_INPUT'): never {
  throw createError({ statusCode: 400, message, data: { code } })
}
function conflict(message: string, code: string): never {
  throw createError({ statusCode: 409, message, data: { code } })
}

export function canCloseSales(actor: StoreActor): boolean {
  return (
    actor.isOwner ||
    actor.isAdmin ||
    actor.permissions.receipts.refund === true ||
    actor.permissions.receipts.edit === true
  )
}

function isV2(receipt: Record<string, unknown>): boolean {
  return receipt.paymentsV2 === true || (receipt.paymentSummary !== undefined && receipt.paymentSummary !== null)
}

/** Records part of what a customer owes on a (non Payments V2) balance-due sale. */
export async function recordBalancePayment(
  db: Firestore,
  actor: StoreActor,
  input: { receiptId: unknown; amount: unknown; method: unknown }
): Promise<{ completed: boolean; amountPaid: number; balanceDue: number }> {
  if (!actor.isOwner && !actor.permissions.receipts.create) {
    forbid('You don’t have permission to record payments.')
  }
  const receiptId = assertId(input.receiptId, 'receiptId')
  const amount = roundMoney(Number(input.amount))
  if (!Number.isFinite(amount) || amount <= 0) bad('Payment amount must be greater than zero')
  const method = (typeof input.method === 'string' ? input.method.trim().slice(0, 60) : '') || 'Cash'
  const ref = actor.store.collection('receipts').doc(receiptId)

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw createError({ statusCode: 404, message: 'Receipt not found' })
    const receipt = snap.data() ?? {}
    if (isV2(receipt)) conflict('Record this payment from the sale’s Payments section.', 'USE_PAYMENTS_V2')
    if (receipt.status !== 'balance_due') conflict('This sale is not awaiting payment.', 'NOT_BALANCE_DUE')

    const total = Number(receipt.total) || 0
    const prevPaid = typeof receipt.amountPaid === 'number' ? receipt.amountPaid : 0
    const newPaid = roundMoney(prevPaid + amount)
    if (newPaid > total + 0.01) bad('Payment exceeds the amount owed')
    const completed = isBalanceFullyPaid(total, newPaid)

    // Completing commits the held stock; read it before writing anything.
    const stock = completed
      ? await planStockCommit(tx, actor.store, receiptId, { ...receipt, status: 'completed' }, { write: true })
      : null

    const payments = Array.isArray(receipt.payments) ? [...receipt.payments] : []
    payments.push({ amount, method, paidAt: Timestamp.now(), recordedBy: actor.uid })
    tx.update(ref, {
      amountPaid: newPaid,
      balanceDue: completed ? 0 : computeBalanceDue(total, newPaid),
      payments,
      updatedAt: FieldValue.serverTimestamp(),
      ...(completed && {
        status: 'completed',
        paymentMethod: method,
        completedAt: FieldValue.serverTimestamp(),
        stockCommittedAt: FieldValue.serverTimestamp(),
        ...(stock?.issues.length && { stockIssues: stock.issues }),
      }),
    })
    stock?.apply(tx)
    if (planHasFeature(actor.plan, 'activity_logs')) {
      logSaleActivity(tx, actor, {
        action: 'updated',
        entityType: 'receipt',
        entityId: receiptId,
        entityName: `Payment of ${amount.toLocaleString()} (${method}) on ${receipt.receiptNumber || receiptId}${
          completed ? ': paid in full, stock released' : ''
        }`,
      })
    }
    return { completed, amountPaid: newPaid, balanceDue: completed ? 0 : computeBalanceDue(total, newPaid) }
  })
}

/**
 * Cancels a balance-due order and frees its items. Needs the refund grant: cancelling after a
 * deposit is taken is how money would go missing. Payments V2 sales are closed by its service
 * first (it refuses while money is held), then their holds are released here.
 */
export async function cancelBalanceDue(
  db: Firestore,
  actor: StoreActor,
  input: { receiptId: unknown; reason?: unknown }
): Promise<void> {
  if (!canCloseSales(actor)) forbid('You don’t have permission to cancel orders.')
  const receiptId = assertId(input.receiptId, 'receiptId')
  const reason = typeof input.reason === 'string' ? input.reason.trim().slice(0, 500) : ''
  const ref = actor.store.collection('receipts').doc(receiptId)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw createError({ statusCode: 404, message: 'Receipt not found' })
    const receipt = snap.data() ?? {}
    const v2 = isV2(receipt)
    if (v2 ? receipt.status !== 'cancelled' : receipt.status !== 'balance_due') {
      conflict(
        v2 ? 'Close this sale from its Payments section first.' : 'Only outstanding orders can be cancelled.',
        'NOT_CANCELLABLE'
      )
    }
    if (receipt.holdReleasedAt) return
    const plan = await planHoldRelease(tx, actor.store, receiptId, receipt)
    tx.update(ref, {
      ...(!v2 && { status: 'cancelled', balanceDue: 0 }),
      ...(reason && !v2 && { cancelReason: reason }),
      holdReleasedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    plan.apply(tx)
    if (planHasFeature(actor.plan, 'activity_logs')) {
      logSaleActivity(tx, actor, {
        action: 'updated',
        entityType: 'receipt',
        entityId: receiptId,
        entityName: `Cancelled order ${receipt.receiptNumber || receiptId}; ${plan.count} item(s) released${
          reason ? `: ${reason}` : ''
        }`,
      })
    }
  })
}

/**
 * Refunds a completed sale and returns its stock, once. Payments V2 sales are closed by its
 * service first; this then returns their stock.
 */
export async function refundSale(
  db: Firestore,
  actor: StoreActor,
  input: { receiptId: unknown; reason?: unknown }
): Promise<void> {
  if (!canCloseSales(actor)) forbid('You don’t have permission to refund sales.')
  const receiptId = assertId(input.receiptId, 'receiptId')
  const reason = typeof input.reason === 'string' ? input.reason.trim().slice(0, 500) : ''
  const ref = actor.store.collection('receipts').doc(receiptId)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw createError({ statusCode: 404, message: 'Receipt not found' })
    const receipt = snap.data() ?? {}
    const v2 = isV2(receipt)
    if (receipt.stockReturnedAt) return
    if (v2 ? receipt.status !== 'refunded' : receipt.status !== 'completed') {
      conflict(
        v2 ? 'Close this sale from its Payments section first.' : 'Only completed sales can be refunded.',
        'NOT_REFUNDABLE'
      )
    }
    if (receipt.tradeLoanId) conflict('Partner-loan sales are settled with the partner.', 'PARTNER_LOAN_SALE')
    const plan = await planStockReturn(tx, actor.store, receipt)
    tx.update(ref, {
      ...(!v2 && {
        status: 'refunded',
        notes: reason ? `Returned: ${reason}` : 'Returned',
        ...(reason && { refundReason: reason }),
      }),
      stockReturnedAt: FieldValue.serverTimestamp(),
      refundedBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
    })
    plan.apply(tx)
    if (planHasFeature(actor.plan, 'activity_logs')) {
      logSaleActivity(tx, actor, {
        action: 'updated',
        entityType: 'receipt',
        entityId: receiptId,
        entityName: `Refunded ${receipt.receiptNumber || receiptId}; ${plan.count} item(s) back in stock${
          reason ? `: ${reason}` : ''
        }`,
      })
    }
  })
}

/**
 * Payments V2: once its service marks a balance-due sale completed, commit the held stock on the
 * server (it used to be the client's job). Safe to call more than once.
 */
export async function commitCompletedSaleStock(
  db: Firestore,
  ownerId: string,
  storeId: string,
  receiptId: string
): Promise<void> {
  const store = db.collection('users').doc(ownerId).collection('stores').doc(storeId)
  const ref = store.collection('receipts').doc(receiptId)
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const receipt = snap.data()
    // Only a held (balance-due) sale that just completed: completedAt is set when it does. A sale
    // paid in full at the till already took its stock and must never be committed again.
    if (!receipt || receipt.status !== 'completed' || receipt.stockCommittedAt) return
    if (!receipt.completedAt) return
    const plan = await planStockCommit(tx, store, receiptId, receipt, { write: true })
    tx.update(ref, {
      stockCommittedAt: FieldValue.serverTimestamp(),
      ...(plan.issues.length && { stockIssues: plan.issues }),
    })
    plan.apply(tx)
  })
}
