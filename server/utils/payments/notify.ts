import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { storeDocRef } from './audit-log'
import { formatNaira } from './records'

export type PaymentNotificationType =
  | 'payment_awaiting_confirmation'
  | 'payment_rejected'
  | 'till_count_difference'
  | 'payout_changed'
  | 'payment_link_sale_cancelled'
  | 'payment_link_problem'

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

/** A link sale's last link expired or was revoked with nothing paid: order closed, stock back. */
export async function notifyLinkSaleCancelled(
  db: Firestore,
  scope: { ownerId: string; storeId: string; actorUid: string },
  receiptId: string,
  receiptNumber: string,
  mode: 'expired' | 'revoked'
): Promise<void> {
  const label = receiptNumber ? `Order ${receiptNumber}` : 'An order'
  await writeNotification(db, {
    ...scope,
    type: 'payment_link_sale_cancelled',
    title: mode === 'expired' ? 'Payment link expired' : 'Payment link revoked',
    message: `${label} was not paid, so it was cancelled and its items are back in stock.`,
    recipientUids: [scope.ownerId],
    metadata: { receiptId },
  })
}

/** Owner-only: a link payment that was late, repeated, unverifiable or left stock to check. */
export async function notifyLinkProblem(
  db: Firestore,
  scope: { ownerId: string; storeId: string },
  receiptId: string,
  receiptNumber: string,
  message: string
): Promise<void> {
  await writeNotification(db, {
    ...scope,
    actorUid: 'system:paystack',
    type: 'payment_link_problem',
    title: receiptNumber ? `Check sale ${receiptNumber}` : 'Check a link payment',
    message,
    recipientUids: [scope.ownerId],
    metadata: { receiptId },
  })
}

export type EmailSender = (params: { toEmail: string; subject: string; html: string }) => Promise<void>

/**
 * Owner-only alert for a payout account change: an in-app entry plus an email to the owner's
 * sign-in address. Only the bank name and last 4 digits are included. Email failure is logged
 * with a dedicated tag (the change has already committed and is in the audit chain).
 */
export async function alertPayoutChanged(
  db: Firestore,
  sendEmail: EmailSender,
  input: {
    ownerId: string
    storeId: string
    ownerEmail: string | undefined
    bankName: string
    last4: string
    previousLast4: string
    replaced: boolean
  }
): Promise<{ emailed: boolean }> {
  const target = `${input.bankName || 'your bank'} ending ${input.last4}`
  const message = input.replaced
    ? `Payouts now go to ${target}${input.previousLast4 ? ` (was ending ${input.previousLast4})` : ''}.`
    : `Payouts now go to ${target}.`
  await writeNotification(db, {
    ownerId: input.ownerId,
    storeId: input.storeId,
    actorUid: input.ownerId,
    type: 'payout_changed',
    title: input.replaced ? 'Payout account changed' : 'Payout account connected',
    message,
    recipientUids: [input.ownerId],
    metadata: { last4: input.last4 },
  })

  const logFailure = (reason: string) =>
    console.error(
      JSON.stringify({
        tag: 'payments-payout-alert-failed',
        ownerId: input.ownerId,
        storeId: input.storeId,
        reason,
      })
    )
  if (!input.ownerEmail) {
    logFailure('owner has no email')
    return { emailed: false }
  }
  const safe = message.replace(/[<>&"']/g, '')
  try {
    await sendEmail({
      toEmail: input.ownerEmail,
      subject: input.replaced ? 'Your Storvv payout account was changed' : 'Payout account connected',
      html: `<p>${safe}</p><p>If you did not make this change, sign in to Storvv, change your password and reconnect your own bank account straight away.</p>`,
    })
    return { emailed: true }
  } catch (err) {
    logFailure(err instanceof Error ? err.message.slice(0, 200) : 'unknown')
    return { emailed: false }
  }
}
