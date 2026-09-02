import {
  doc,
  setDoc,
  type DocumentReference,
  type Firestore,
  type SetOptions,
} from 'firebase/firestore'

export type OfflineWriteResult = 'synced' | 'queued'

export interface QueuedFirestoreWrite {
  id: string
  type: 'set'
  documentPath: string
  data: Record<string, unknown>
  merge: boolean
  timestamp: number
}

export const OFFLINE_QUEUE_STORAGE_KEY = 'storv_pending_operations'

/** Strip Firestore field helpers before persisting queued writes. */
export function serializeFirestorePayload(
  value: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) continue
    if (entry instanceof Date) {
      out[key] = entry.toISOString()
      continue
    }
    out[key] = entry
  }
  return out
}

export function documentRefFromPath(db: Firestore, documentPath: string) {
  const segments = documentPath.split('/').filter(Boolean)
  if (segments.length < 2 || segments.length % 2 !== 0) {
    throw new Error(`Invalid Firestore document path: ${documentPath}`)
  }
  return doc(db, ...(segments as [string, ...string[]]))
}

export async function applyQueuedWrite(db: Firestore, op: QueuedFirestoreWrite) {
  const docRef = documentRefFromPath(db, op.documentPath)
  const options: SetOptions | undefined = op.merge ? { merge: true } : undefined
  await setDoc(docRef, op.data, options)
}

export function isOfflineWriteError(error: unknown, online: boolean): boolean {
  if (!online) return true
  const code = (error as { code?: string })?.code
  return code === 'unavailable' || code === 'deadline-exceeded'
}

export async function setDocumentWithOfflineQueue(
  docRef: DocumentReference,
  data: Record<string, unknown>,
  options: {
    merge?: boolean
    isOnline: { value: boolean }
    queue: (op: Omit<QueuedFirestoreWrite, 'id' | 'timestamp'>) => void
    dequeuePath: (documentPath: string) => void
  }
): Promise<OfflineWriteResult> {
  try {
    await setDoc(docRef, data, options.merge ? { merge: true } : undefined)
    options.dequeuePath(docRef.path)
    return 'synced'
  } catch (error: unknown) {
    if (!isOfflineWriteError(error, options.isOnline.value)) {
      throw error
    }
    options.queue({
      type: 'set',
      documentPath: docRef.path,
      data: serializeFirestorePayload(data),
      merge: options.merge ?? false,
    })
    return 'queued'
  }
}
