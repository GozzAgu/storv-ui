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

/** Normalize typographic dashes in log summaries (em/en dash → comma or ASCII hyphen) for clearer Activity Logs UI. */
export function normalizeActivityLogText(value: string): string {
 return String(value ?? '')
 .replace(/\s*\u2014\s*/g, ', ')
 .replace(/\s*\u2013\s*/g, ' - ')
}

export function activityActionLabel(action: ActivityAction): string {
 if (action === 'created') return 'Created'
 if (action === 'deleted') return 'Deleted'
 return 'Updated'
}

export function activityEntityTypeLabel(type: ActivityEntityType): string {
 if (type === 'items_batch') return 'Batch'
 if (type === 'folder') return 'Folder'
 return 'Item'
}

export function activityActionBadgeClass(action: ActivityAction): string {
 const base =
 'inline-flex shrink-0 items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-medium leading-none'
 if (action === 'created') {
 return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300`
 }
 if (action === 'deleted') {
 return `${base} bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300`
 }
 return `${base} bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300`
}

/** Primary line for compact activity previews (dashboard, widgets). */
export function activityLogPreviewTitle(
  log: Pick<ActivityLog, 'action' | 'entityType' | 'entityName'>
): string {
  const name = normalizeActivityLogText(log.entityName).trim()
  if (name && name !== '-') return name
  return `${activityActionLabel(log.action)} ${activityEntityTypeLabel(log.entityType).toLowerCase()}`
}

/**
 * Secondary detail for audit tables (no raw Firestore IDs).
 * Pass `folderName` when entityId is a folder id (batch ops) for clearer context.
 */
export function activityLogDetailSubtitle(
  log: Pick<ActivityLog, 'entityType' | 'entityName' | 'action'>,
  options?: { folderName?: string | null }
): string | null {
  const name = normalizeActivityLogText(log.entityName).trim()
  const folderName = options?.folderName?.trim()

  if (log.entityType === 'items_batch') {
    if (folderName) return folderName
    if (name && name !== '-') return null
    return 'Batch update'
  }

  if (log.entityType === 'folder') {
    if (folderName && folderName !== name) return folderName
    return null
  }

  if (log.entityType === 'item') {
    if (name && name !== '-') return null
    return `${activityActionLabel(log.action)} inventory item`
  }

  return null
}

/** Write an activity log (fire-and-forget; does not throw). */
export async function logActivity(params: LogActivityParams): Promise<void> {
 if (import.meta.server) return
 const { isDemoModeActive } = await import('~/utils/demo-mode')
 if (isDemoModeActive()) return

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
 entityName: normalizeActivityLogText(params.entityName),
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
 const { isDemoModeActive } = await import('~/utils/demo-mode')
 if (isDemoModeActive()) {
 const { getDemoActivityLogs } = await import('~/utils/demo-bridge')
 const { getCurrentStoreId } = await import('~/composables/useCurrentStore')
 const storeId = (await getCurrentStoreId()) ?? ''
 return getDemoActivityLogs(storeId).slice(0, limitCount)
 }

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
 entityName: normalizeActivityLogText((data.entityName as string | undefined) ?? '-'),
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
