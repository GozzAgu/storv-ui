import { FieldValue, type DocumentReference, type Transaction } from 'firebase-admin/firestore'
import type { NotificationType } from '~/stores/notifications'
import type { StoreActor } from './actor'
import { sanitizeActivityDetails, type ActivityDetails } from '~/utils/activity-details'

/**
 * Activity log entry written by the server inside the sale's transaction, so it can't be
 * skipped or attributed to someone else (staff no longer write sale logs themselves).
 */
export function logSaleActivity(
  tx: Transaction,
  actor: StoreActor,
  entry: {
    action: 'created' | 'updated' | 'deleted'
    entityType: string
    entityId: string
    entityName: string
    /** What exactly happened, for the Activity page's detail card. */
    details?: ActivityDetails
  }
): void {
  const details = sanitizeActivityDetails(entry.details)
  tx.create(actor.store.collection('activityLogs').doc(), {
    userId: actor.uid,
    userDisplayName: actor.displayName,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    entityName: entry.entityName.slice(0, 300),
    storeId: actor.storeId,
    source: 'server',
    ...(details && { details }),
    createdAt: FieldValue.serverTimestamp(),
  })
}

/**
 * Store feed entry, written after the change has committed. Failures are logged, never thrown.
 */
export async function notifyStore(
  store: DocumentReference,
  input: {
    ownerId: string
    actorUid: string
    type: NotificationType
    title: string
    message: string
    metadata?: Record<string, string | number | null>
  }
): Promise<void> {
  try {
    await store.collection('notifications').add({
      type: input.type,
      title: input.title,
      message: input.message.slice(0, 500),
      userId: input.ownerId,
      actorId: input.actorUid,
      read: false,
      metadata: input.metadata ?? {},
      source: 'server',
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error('[sales] notification failed', err instanceof Error ? err.message : err)
  }
}

/** The items on a stored receipt, as Activity detail lines. */
export function receiptActivityLines(receipt: Record<string, unknown>): ActivityDetails['lines'] {
  const items = Array.isArray(receipt.items) ? receipt.items.slice(0, 60) : []
  return items.map((raw) => {
    const line = (raw ?? {}) as Record<string, unknown>
    const meta = [
      line.serialNo ? `SN ${line.serialNo}` : '',
      typeof line.model === 'string' ? line.model : '',
      line.sku ? `SKU ${line.sku}` : '',
    ]
      .filter(Boolean)
      .join(' · ')
    const price = Number(line.price)
    const list = Number(line.listPrice)
    return {
      name: String(line.itemName || 'Product'),
      ...(meta && { meta }),
      qty: Number(line.quantity) || 1,
      ...(Number.isFinite(price) && { amount: price }),
      ...(line.priceChanged === true &&
        Number.isFinite(list) && {
          was: list,
          note: `Price changed by ${String(line.priceChangedByName || 'staff')}`,
        }),
    }
  })
}

/** Receipt number, customer and total: the facts every sale-related entry starts with. */
export function receiptActivityFacts(
  receipt: Record<string, unknown>,
  receiptId: string
): NonNullable<ActivityDetails['facts']> {
  return [
    { label: 'Receipt', value: String(receipt.receiptNumber || receiptId) },
    { label: 'Customer', value: String(receipt.customerName || 'Walk-in Customer') },
    { label: 'Sale total', value: Number(receipt.total) || 0, money: true },
  ]
}

export const receiptActivityLink = (receiptId: string) => ({
  label: 'View sale',
  path: `/receipts?receipt=${encodeURIComponent(receiptId)}`,
})
