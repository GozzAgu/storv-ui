import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { storeDocRef } from './audit-log'
import { formatNaira } from './records'

export type PaymentNotificationType =
  | 'payment_awaiting_confirmation'
  | 'payment_rejected'
  | 'till_count_difference'

interface NotifyInput {
  ownerId: string
  storeId: string
  type: PaymentNotificationType
  title: string
  message: string
  actorUid: string
  recipientUids: string[]
  metadata: Record<string, string | number | null>
}

/** Owner plus active members holding payments.confirm. */
export async function confirmerUids(
  db: Firestore,
  ownerId: string,
  storeId: string
): Promise<string[]> {
  const snap = await storeDocRef(db, ownerId, storeId)
    .collection('members')
    .where('permissions.payments.confirm', '==', true)
    .get()
  const uids = snap.docs.filter((d) => d.data().status === 'active').map((d) => d.id)
  return [ownerId, ...uids.filter((u) => u !== ownerId)]
}

/**
 * Server-written feed entry. No customer names, phone numbers or account numbers: the feed is
 * readable by every member of the store. Failures are logged, never thrown, because the money
 * change has already committed.
 */
async function writeNotification(db: Firestore, input: NotifyInput): Promise<void> {
  try {
    await storeDocRef(db, input.ownerId, input.storeId).collection('notifications').add({
      type: input.type,
      title: input.title,
      message: input.message,
      userId: input.ownerId,
      actorId: input.actorUid,
      recipientUids: input.recipientUids,
      read: false,
      metadata: input.metadata,
      source: 'payments_v2',
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error(
      JSON.stringify({
        tag: 'payments-notify-failed',
        type: input.type,
        ownerId: input.ownerId,
        storeId: input.storeId,
        error: err instanceof Error ? err.message : 'unknown',
      })
    )
  }
}

export async function notifyAwaitingConfirmation(
  db: Firestore,
  scope: { ownerId: string; storeId: string; actorUid: string },
  receiptId: string,
  count: number
): Promise<void> {
  const recipients = (await confirmerUids(db, scope.ownerId, scope.storeId)).filter(
    (uid) => uid !== scope.actorUid
  )
  if (!recipients.length) return
  await writeNotification(db, {
    ...scope,
    type: 'payment_awaiting_confirmation',
    title: 'Payment to confirm',
    message:
      count === 1
        ? 'A recorded payment is waiting for confirmation.'
        : `${count} recorded payments are waiting for confirmation.`,
    recipientUids: recipients,
    metadata: { receiptId },
  })
}

export async function notifyPaymentRejected(
  db: Firestore,
  scope: { ownerId: string; storeId: string; actorUid: string },
  receiptId: string,
  amountKobo: number
): Promise<void> {
  await writeNotification(db, {
    ...scope,
    type: 'payment_rejected',
    title: 'Payment rejected',
    message: `A recorded payment of ${formatNaira(
      amountKobo
    )} was rejected. The sale has money outstanding again.`,
    recipientUids: [scope.ownerId],
    metadata: { receiptId },
  })
}

export async function notifyTillDifference(
  db: Firestore,
  scope: { ownerId: string; storeId: string; actorUid: string },
  tillCountId: string,
  businessDate: string,
  differenceKobo: number
): Promise<void> {
  const direction = differenceKobo < 0 ? 'short' : 'over'
  await writeNotification(db, {
    ...scope,
    type: 'till_count_difference',
    title: 'Till count difference',
    message: `The cash count for ${businessDate} was ${formatNaira(
      Math.abs(differenceKobo)
    )} ${direction}.`,
    recipientUids: [scope.ownerId],
    metadata: { tillCountId, businessDate, differenceKobo },
  })
}
