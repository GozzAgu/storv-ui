/**
 * Activity logs for security auditing: track who changed what in inventory (and future entities).
 */

import { collection, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { getActivityLogsCollection } from '~/composables/useFirestorePaths'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'

export type ActivityAction = 'created' | 'updated' | 'deleted'
export type ActivityEntityType = 'folder' | 'item' | 'items_batch'

export interface ActivityLog {
  id: string
  userId: string
  userDisplayName: string
  action: ActivityAction
  entityType: ActivityEntityType
  entityId: string
  entityName: string
  storeId: string
  createdAt: ReturnType<typeof serverTimestamp> | Date
}

export interface LogActivityParams {
  action: ActivityAction
  entityType: ActivityEntityType
  entityId: string
  entityName: string
  storeId: string
  userId: string
  userDisplayName: string
}

/** Write an activity log (fire-and-forget; does not throw). */
export async function logActivity(params: LogActivityParams): Promise<void> {
  if (import.meta.server) return
  const db = useFirestore().getFirestoreInstance()
  if (!db) return
  try {
    let userId = await getQueryUserId()
    if (!userId) {
      const { useAuthStore } = await import('~/stores/auth')
      const authStore = useAuthStore()
      userId = authStore.currentUser?.uid ?? null
    }
    if (!userId) {
      console.warn('[useActivityLog] Cannot write log: no userId (auth or getQueryUserId)')
      return
    }
    const logsRef = getActivityLogsCollection(db, userId, params.storeId)
    const logRef = doc(logsRef)
    await setDoc(logRef, {
      userId: params.userId,
      userDisplayName: params.userDisplayName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      storeId: params.storeId,
      createdAt: serverTimestamp(),
    })
  } catch (e) {
    console.warn('[useActivityLog] Failed to write activity log:', e)
  }
}

/** Default max documents to load; client-side search/pagination slice this set. */
export const ACTIVITY_LOGS_FETCH_LIMIT = 500

/** Fetch recent activity logs for the current store. */
export async function fetchActivityLogs(limitCount: number = ACTIVITY_LOGS_FETCH_LIMIT): Promise<ActivityLog[]> {
  const db = useFirestore().getFirestoreInstance()
  if (!db) return []
  let userId = await getQueryUserId()
  if (!userId) {
    const { useAuthStore } = await import('~/stores/auth')
    const authStore = useAuthStore()
    userId = authStore.currentUser?.uid ?? null
  }
  if (!userId) return []
  const storeId = await getCurrentStoreId()
  if (!storeId) return []
  const logsRef = getActivityLogsCollection(db, userId, storeId)
  const q = query(logsRef, orderBy('createdAt', 'desc'), limit(limitCount))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      userId: data.userId ?? '',
      userDisplayName: data.userDisplayName ?? 'Unknown',
      action: data.action ?? 'updated',
      entityType: data.entityType ?? 'item',
      entityId: data.entityId ?? '',
      entityName: data.entityName ?? '-',
      storeId: data.storeId ?? storeId,
      createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt),
    } as ActivityLog
  })
}

/** Resolve current user's display name for logging (super admin or staff). */
export async function getCurrentUserDisplayName(): Promise<string> {
  const { useAuthStore } = await import('~/stores/auth')
  const { useUserStore } = await import('~/stores/user')
  const { useStaffStore } = await import('~/stores/staff')
  const authStore = useAuthStore()
  const userStore = useUserStore()
  if (!authStore.currentUser) return 'Unknown'
  if (!userStore.userData) await userStore.fetchUserData(authStore.currentUser.uid)
  if (userStore.userData?.role === 'staff') {
    const staffStore = useStaffStore()
    const staff = staffStore.getCurrentStaffMember ?? (await staffStore.fetchCurrentStaffMember())
    if (staff) return `${staff.firstName} ${staff.lastName}`.trim() || staff.email || 'Staff'
    return userStore.userData?.name || 'Staff'
  }
  return userStore.userData?.name || authStore.currentUser.email || 'Admin'
}
