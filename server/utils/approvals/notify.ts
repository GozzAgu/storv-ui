import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import type { NotificationType } from '~/stores/notifications'
import type { StaffAdminGrants } from '~/types/staff-permissions'
import { normalizeStaffAdminGrants } from '~/utils/staff-permissions'

const storeRef = (db: Firestore, ownerId: string, storeId: string) =>
  db.collection('users').doc(ownerId).collection('stores').doc(storeId)

/**
 * The owner plus the branch's active admins (optionally only those holding `grant`): the people
 * who can act on something waiting for approval in that branch.
 */
export async function branchApproverUids(
  db: Firestore,
  ownerId: string,
  storeId: string,
  grant?: keyof StaffAdminGrants
): Promise<string[]> {
  const snap = await storeRef(db, ownerId, storeId)
    .collection('members')
    .where('admin', '==', true)
    .get()
  const admins = snap.docs
    .filter((d) => d.data().status === 'active')
    .filter((d) => !grant || normalizeStaffAdminGrants(d.data().adminGrants)[grant])
    .map((d) => d.id)
  return [ownerId, ...admins.filter((uid) => uid !== ownerId)]
}

/**
 * Targeted feed entry, written after the change has committed. Only `recipientUids` see it, minus
 * whoever caused it. Failures are logged and swallowed: the approval itself already happened.
 */
export async function notifyUsers(
  db: Firestore,
  input: {
    ownerId: string
    storeId: string
    actorUid: string
    recipientUids: string[]
    type: NotificationType
    title: string
    message: string
    metadata: Record<string, string | number | null>
  }
): Promise<void> {
  const recipients = [...new Set(input.recipientUids)].filter(
    (uid) => uid && uid !== input.actorUid
  )
  if (!recipients.length) return
  try {
    await storeRef(db, input.ownerId, input.storeId)
      .collection('notifications')
      .add({
        type: input.type,
        title: input.title,
        message: input.message.slice(0, 500),
        userId: input.ownerId,
        actorId: input.actorUid,
        recipientUids: recipients,
        read: false,
        metadata: input.metadata,
        source: 'server',
        createdAt: FieldValue.serverTimestamp(),
      })
  } catch (err) {
    console.error(
      JSON.stringify({
        tag: 'approval-notify-failed',
        type: input.type,
        error: err instanceof Error ? err.message : 'unknown',
      })
    )
  }
}
