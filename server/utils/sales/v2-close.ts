import { createError } from 'h3'
import type { Firestore } from 'firebase-admin/firestore'
import { assertId, type StoreActor } from './actor'

/**
 * Payments V2 sales are closed by the payments service (it refuses while money is held and
 * writes the audit trail); stock is then moved by the sales routes. Does nothing for other sales
 * or when the sale is already closed.
 */
export async function closeV2SaleIfNeeded(
  db: Firestore,
  uid: string,
  actor: StoreActor,
  receiptIdRaw: unknown,
  action: 'refund' | 'cancel',
  reason: unknown
): Promise<void> {
  const receiptId = assertId(receiptIdRaw, 'receiptId')
  const snap = await actor.store.collection('receipts').doc(receiptId).get()
  const receipt = snap.data()
  if (!receipt) throw createError({ statusCode: 404, message: 'Receipt not found' })
  const v2 = receipt.paymentsV2 === true || receipt.paymentSummary != null
  if (!v2) return
  const closed = action === 'refund' ? receipt.status === 'refunded' : receipt.status === 'cancelled'
  if (closed) return

  const { getPaymentsV2Gate } = await import('~/server/utils/payments/config')
  if (!(await getPaymentsV2Gate()).enabled) {
    throw createError({
      statusCode: 409,
      message:
        'This sale has Payments V2 records, which are switched off. Nothing was changed; try again once payments are back on.',
    })
  }
  const { resolvePaymentsAccess } = await import('~/server/utils/payments/access')
  const { closeSale } = await import('~/server/utils/payments/service')
  const { toHttpError } = await import('~/server/utils/payments/http')
  try {
    const access = await resolvePaymentsAccess(db, uid, actor.ownerId, actor.storeId)
    await closeSale(db, access, {
      receiptId,
      action,
      reason: typeof reason === 'string' && reason.trim() ? reason : action === 'refund' ? 'Refunded' : 'Cancelled',
    })
  } catch (err) {
    throw toHttpError(err)
  }
}
