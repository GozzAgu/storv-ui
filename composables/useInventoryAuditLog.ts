import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import type { InventoryAuditField, InventoryAuditLog } from '~/types/growth'
import { getCurrentUserDisplayName } from '~/composables/useActivityLog'

export function getInventoryAuditLogsCollection(
  db: ReturnType<ReturnType<typeof useFirestore>['getFirestoreInstance']>,
  userId: string,
  storeId: string
) {
  return collection(db!, 'users', userId, 'stores', storeId, 'inventoryAuditLogs')
}

/** Micro-friendly price/name audit trail (all plans). */
export async function logInventoryAudit(params: {
  itemId: string
  itemName: string
  field: InventoryAuditField
  previousValue?: string | number | null
  newValue?: string | number | null
  storeId: string
}): Promise<void> {
  if (import.meta.server) return
  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) return

  const db = useFirestore().getFirestoreInstance()
  if (!db) return

  const userId = await getQueryUserId()
  if (!userId) return

  const { useAuthStore } = await import('~/stores/auth')
  const authStore = useAuthStore()
  const actorUid = authStore.currentUser?.uid ?? userId
  const userDisplayName = await getCurrentUserDisplayName().catch(() => 'Unknown')

  try {
    const logsRef = getInventoryAuditLogsCollection(db, userId, params.storeId)
    await setDoc(doc(logsRef), {
      userId: actorUid,
      userDisplayName,
      itemId: params.itemId,
      itemName: params.itemName,
      field: params.field,
      previousValue: params.previousValue ?? null,
      newValue: params.newValue ?? null,
      storeId: params.storeId,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    if (import.meta.dev) console.warn('[inventoryAudit]', error)
  }
}

export async function fetchInventoryAuditLogs(
  limitCount = 50
): Promise<InventoryAuditLog[]> {
  const db = useFirestore().getFirestoreInstance()
  if (!db) return []
  const userId = await getQueryUserId()
  if (!userId) return []
  const storeId = await getCurrentStoreId()
  if (!storeId) return []

  const logsRef = getInventoryAuditLogsCollection(db, userId, storeId)
  const q = query(logsRef, orderBy('createdAt', 'desc'), limit(limitCount))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((entry) => {
    const data = entry.data()
    return {
      id: entry.id,
      userId: data.userId ?? '',
      userDisplayName: data.userDisplayName ?? 'Unknown',
      itemId: data.itemId ?? '',
      itemName: data.itemName ?? '',
      field: data.field ?? 'price',
      previousValue: data.previousValue,
      newValue: data.newValue,
      storeId: data.storeId ?? storeId,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    } as InventoryAuditLog
  })
}

export function inventoryAuditFieldLabel(field: InventoryAuditField): string {
  if (field === 'price') return 'Selling price'
  if (field === 'cost') return 'Cost price'
  if (field === 'quantity') return 'Quantity'
  return 'Product name'
}
