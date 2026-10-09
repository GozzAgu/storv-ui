import { FieldValue, type Firestore } from 'firebase-admin/firestore'

/** Server-only: paymentsCron/{job}. A stale `lastRunAt` means the job stopped (Step 6 alerts on it). */
export const CRON_HEARTBEAT_COLLECTION = 'paymentsCron'

export async function writeCronHeartbeat(
  db: Firestore,
  job: string,
  result: Record<string, number>
): Promise<void> {
  await db
    .collection(CRON_HEARTBEAT_COLLECTION)
    .doc(job)
    .set({ lastRunAt: new Date().toISOString(), result, updatedAt: FieldValue.serverTimestamp() })
}
