import { FieldValue, type DocumentReference, type Transaction } from 'firebase-admin/firestore'
import type { NotificationType } from '~/stores/notifications'
import type { StoreActor } from './actor'

/**
 * Activity log entry written by the server inside the sale's transaction, so it can't be
 * skipped or attributed to someone else (staff no longer write sale logs themselves).
 */
export function logSaleActivity(
  tx: Transaction,
  actor: StoreActor,
  entry: { action: 'created' | 'updated' | 'deleted'; entityType: string; entityId: string; entityName: string }
): void {
  tx.create(actor.store.collection('activityLogs').doc(), {
    userId: actor.uid,
    userDisplayName: actor.displayName,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    entityName: entry.entityName.slice(0, 300),
    storeId: actor.storeId,
    source: 'server',
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
