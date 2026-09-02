import { ref, computed } from 'vue'
import { CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import { useFirestore } from './useFirestore'
import {
  collection,
  doc,
  setDoc,
} from 'firebase/firestore'
import {
  applyQueuedWrite,
  documentRefFromPath,
  OFFLINE_QUEUE_STORAGE_KEY,
  type QueuedFirestoreWrite,
} from '~/utils/offline-firestore'

/** @deprecated Legacy flat-collection queue entry. */
interface LegacyPendingOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  collection: string
  docId?: string
  data?: Record<string, unknown>
  timestamp: number
}

type PendingOperation = QueuedFirestoreWrite | LegacyPendingOperation

function isQueuedWrite(op: PendingOperation): op is QueuedFirestoreWrite {
  return 'documentPath' in op && op.type === 'set'
}

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const pendingOperations = ref<PendingOperation[]>([])
const isSyncing = ref(false)
let offlineSyncInitialized = false

function loadPendingOperationsFromStorage() {
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY)
    if (stored) {
      pendingOperations.value = JSON.parse(stored) as PendingOperation[]
    }
  } catch (error) {
    console.error('Error loading pending operations:', error)
  }
}

function savePendingOperationsToStorage() {
  try {
    localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(pendingOperations.value))
  } catch (error) {
    console.error('Error saving pending operations:', error)
  }
}

function queueOperationGlobal(operation: Omit<QueuedFirestoreWrite, 'id' | 'timestamp'>) {
  const pendingOp: QueuedFirestoreWrite = {
    ...operation,
    timestamp: Date.now(),
    id: `set_${operation.documentPath}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  }
  pendingOperations.value.push(pendingOp)
  savePendingOperationsToStorage()
  if (isOnline.value) {
    void syncPendingOperationsGlobal()
  }
}

function dequeuePathGlobal(documentPath: string) {
  pendingOperations.value = pendingOperations.value.filter(
    (op) => !isQueuedWrite(op) || op.documentPath !== documentPath
  )
  savePendingOperationsToStorage()
}

async function syncPendingOperationsGlobal() {
  const db = useFirestore().getFirestoreInstance()
  if (!isOnline.value || isSyncing.value || !db || pendingOperations.value.length === 0) {
    return
  }

  isSyncing.value = true
  const operations = [...pendingOperations.value]
  const failed: PendingOperation[] = []

  for (const op of operations) {
    try {
      if (isQueuedWrite(op)) {
        await applyQueuedWrite(db, op)
      } else if (op.type === 'create' && op.data && op.docId) {
        await setDoc(doc(db, op.collection, op.docId), op.data)
      } else if (op.type === 'update' && op.data && op.docId) {
        await setDoc(doc(db, op.collection, op.docId), op.data, { merge: true })
      } else if (op.type === 'delete' && op.docId) {
        const { deleteDoc } = await import('firebase/firestore')
        await deleteDoc(doc(db, op.collection, op.docId))
      }
      pendingOperations.value = pendingOperations.value.filter((entry) => entry.id !== op.id)
    } catch {
      failed.push(op)
    }
  }

  savePendingOperationsToStorage()
  isSyncing.value = false

  if (failed.length === 0 && isOnline.value && pendingOperations.value.length > 0) {
    await syncPendingOperationsGlobal()
  }
}

/** App-wide offline queue bootstrap (called from plugins/04.offline.client.ts). */
export function initOfflineSync() {
  if (typeof window === 'undefined' || offlineSyncInitialized) return
  offlineSyncInitialized = true

  loadPendingOperationsFromStorage()

  const handleOnline = () => {
    isOnline.value = true
    void syncPendingOperationsGlobal()
  }

  const handleOffline = () => {
    isOnline.value = false
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  if (isOnline.value) {
    void syncPendingOperationsGlobal()
  }
}

export async function writeDocumentWithOfflineSupport(
  docRef: ReturnType<typeof doc>,
  data: Record<string, unknown>,
  options?: { merge?: boolean }
) {
  const { setDocumentWithOfflineQueue } = await import('~/utils/offline-firestore')
  return setDocumentWithOfflineQueue(docRef, data, {
    merge: options?.merge,
    isOnline,
    queue: queueOperationGlobal,
    dequeuePath: dequeuePathGlobal,
  })
}

export const useOfflineMode = () => {
  const db = useFirestore().getFirestoreInstance()
  const pendingCount = computed(() => pendingOperations.value.length)

  const queueOperation = (operation: Omit<QueuedFirestoreWrite, 'id' | 'timestamp'>) => {
    queueOperationGlobal(operation)
  }

  const syncPendingOperations = () => syncPendingOperationsGlobal()

  const createDoc = async (collectionName: string, data: Record<string, unknown>, docId?: string) => {
    if (!db) {
      throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
    }

    try {
      const docRef = docId ? doc(db, collectionName, docId) : doc(collection(db, collectionName))
      await setDoc(docRef, data)
      dequeuePathGlobal(docRef.path)
      return docRef.id
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code
      if (!isOnline.value || code === 'unavailable') {
        const docRef = docId ? doc(db, collectionName, docId) : doc(collection(db, collectionName))
        queueOperationGlobal({
          type: 'set',
          documentPath: docRef.path,
          data,
          merge: false,
        })
        return docId || docRef.id
      }
      throw error
    }
  }

  const updateDoc = async (collectionName: string, docId: string, data: Record<string, unknown>) => {
    if (!db) {
      throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
    }

    const docRef = doc(db, collectionName, docId)
    const result = await writeDocumentWithOfflineSupport(docRef, data, { merge: true })
    if (result === 'queued') return
  }

  const deleteDocOffline = async (collectionName: string, docId: string) => {
    if (!db) {
      throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
    }

    try {
      const docRef = doc(db, collectionName, docId)
      await setDoc(docRef, { deleted: true, deletedAt: new Date() }, { merge: true })
      dequeuePathGlobal(docRef.path)
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code
      if (!isOnline.value || code === 'unavailable') {
        queueOperationGlobal({
          type: 'set',
          documentPath: doc(db, collectionName, docId).path,
          data: { deleted: true, deletedAt: new Date().toISOString() },
          merge: true,
        })
      } else {
        throw error
      }
    }
  }

  return {
    isOnline,
    isSyncing,
    pendingOperations,
    pendingCount,
    createDoc,
    updateDoc,
    deleteDoc: deleteDocOffline,
    syncPendingOperations,
    queueOperation,
    writeDocument: writeDocumentWithOfflineSupport,
    documentRefFromPath: (path: string) => (db ? documentRefFromPath(db, path) : null),
  }
}
