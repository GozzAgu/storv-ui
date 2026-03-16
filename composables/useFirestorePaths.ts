/**
 * Helper functions to get Firestore collection/document paths for hierarchical structure:
 * Users -> Stores -> Departments -> Staff -> Inventory, Receipts, Customers
 */

import { collection, doc, CollectionReference, DocumentReference } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

/**
 * Get stores collection path: users/{userId}/stores
 */
export function getStoresCollection(db: Firestore, userId: string): CollectionReference {
  return collection(db, 'users', userId, 'stores')
}

/**
 * Get a specific store document: users/{userId}/stores/{storeId}
 */
export function getStoreDocument(db: Firestore, userId: string, storeId: string): DocumentReference {
  return doc(db, 'users', userId, 'stores', storeId)
}

/**
 * Get departments collection path: users/{userId}/stores/{storeId}/departments
 */
export function getDepartmentsCollection(db: Firestore, userId: string, storeId: string): CollectionReference {
  return collection(db, 'users', userId, 'stores', storeId, 'departments')
}

/**
 * Get a specific department document: users/{userId}/stores/{storeId}/departments/{departmentId}
 */
export function getDepartmentDocument(db: Firestore, userId: string, storeId: string, departmentId: string): DocumentReference {
  return doc(db, 'users', userId, 'stores', storeId, 'departments', departmentId)
}

/**
 * Get staff collection path: users/{userId}/stores/{storeId}/departments/{departmentId}/staff
 */
export function getStaffCollection(db: Firestore, userId: string, storeId: string, departmentId: string): CollectionReference {
  return collection(db, 'users', userId, 'stores', storeId, 'departments', departmentId, 'staff')
}

/**
 * Get a specific staff document: users/{userId}/stores/{storeId}/departments/{departmentId}/staff/{staffId}
 */
export function getStaffDocument(db: Firestore, userId: string, storeId: string, departmentId: string, staffId: string): DocumentReference {
  return doc(db, 'users', userId, 'stores', storeId, 'departments', departmentId, 'staff', staffId)
}

/**
 * Get inventory folders collection path: users/{userId}/stores/{storeId}/inventoryFolders
 */
export function getInventoryFoldersCollection(db: Firestore, userId: string, storeId: string): CollectionReference {
  return collection(db, 'users', userId, 'stores', storeId, 'inventoryFolders')
}

/**
 * Get a specific inventory folder document: users/{userId}/stores/{storeId}/inventoryFolders/{folderId}
 */
export function getInventoryFolderDocument(db: Firestore, userId: string, storeId: string, folderId: string): DocumentReference {
  return doc(db, 'users', userId, 'stores', storeId, 'inventoryFolders', folderId)
}

/**
 * Get inventory items collection path: users/{userId}/stores/{storeId}/inventoryItems
 */
export function getInventoryItemsCollection(db: Firestore, userId: string, storeId: string): CollectionReference {
  return collection(db, 'users', userId, 'stores', storeId, 'inventoryItems')
}

/**
 * Get a specific inventory item document: users/{userId}/stores/{storeId}/inventoryItems/{itemId}
 */
export function getInventoryItemDocument(db: Firestore, userId: string, storeId: string, itemId: string): DocumentReference {
  return doc(db, 'users', userId, 'stores', storeId, 'inventoryItems', itemId)
}

/**
 * Get receipts collection path: users/{userId}/stores/{storeId}/receipts
 */
export function getReceiptsCollection(db: Firestore, userId: string, storeId: string): CollectionReference {
  return collection(db, 'users', userId, 'stores', storeId, 'receipts')
}

/**
 * Get a specific receipt document: users/{userId}/stores/{storeId}/receipts/{receiptId}
 */
export function getReceiptDocument(db: Firestore, userId: string, storeId: string, receiptId: string): DocumentReference {
  return doc(db, 'users', userId, 'stores', storeId, 'receipts', receiptId)
}

/**
 * Get customers collection path: users/{userId}/stores/{storeId}/customers
 */
export function getCustomersCollection(db: Firestore, userId: string, storeId: string): CollectionReference {
  return collection(db, 'users', userId, 'stores', storeId, 'customers')
}

/**
 * Get a specific customer document: users/{userId}/stores/{storeId}/customers/{customerId}
 */
export function getCustomerDocument(db: Firestore, userId: string, storeId: string, customerId: string): DocumentReference {
  return doc(db, 'users', userId, 'stores', storeId, 'customers', customerId)
}

/**
 * Get notifications collection path: users/{userId}/stores/{storeId}/notifications
 */
export function getNotificationsCollection(db: Firestore, userId: string, storeId: string): CollectionReference {
  return collection(db, 'users', userId, 'stores', storeId, 'notifications')
}

/**
 * Get a specific notification document: users/{userId}/stores/{storeId}/notifications/{notificationId}
 */
export function getNotificationDocument(db: Firestore, userId: string, storeId: string, notificationId: string): DocumentReference {
  return doc(db, 'users', userId, 'stores', storeId, 'notifications', notificationId)
}

/**
 * Get activity logs collection path: users/{userId}/stores/{storeId}/activityLogs
 * Used for security auditing (who changed what in inventory, etc.)
 */
export function getActivityLogsCollection(db: Firestore, userId: string, storeId: string): CollectionReference {
  return collection(db, 'users', userId, 'stores', storeId, 'activityLogs')
}

/**
 * Helper to get userId for queries (superadmin's UID)
 * For staff, returns their superadmin's UID from staff document
 */
export async function getQueryUserId(): Promise<string | null> {
  if (import.meta.server) return null

  const { useAuthStore } = await import('~/stores/auth')
  const { useUserStore } = await import('~/stores/user')
  const authStore = useAuthStore()
  const userStore = useUserStore()

  if (!authStore.currentUser) return null

  // Fetch user data if not loaded
  if (!userStore.userData) {
    await userStore.fetchUserData(authStore.currentUser.uid)
  }

  let userId = authStore.currentUser.uid

  // If staff, get the super admin UID from the staff document
  // First try legacy collection (for migration), then try cache, then search hierarchical structure
  if (userStore.userData?.role === 'staff') {
    const { useFirestore } = await import('./useFirestore')
    const db = useFirestore().getFirestoreInstance()
    if (db) {
      // First try legacy collection (faster if staff exists there)
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const staffRef = collection(db, 'staff')
        const staffQuery = query(staffRef, where('authUid', '==', userId))
        const staffSnapshot = await getDocs(staffQuery)

        if (!staffSnapshot.empty && staffSnapshot.docs[0]) {
          const staffData = staffSnapshot.docs[0].data()
          if (staffData.createdBy) {
            userId = staffData.createdBy
            console.log('[useFirestorePaths] Staff detected in legacy collection, using superadmin UID:', userId)
            return userId
          }
        }
      } catch (error: any) {
        console.warn('[useFirestorePaths] Could not fetch from legacy collection:', error.message)
      }

      // Try to get from staff store cache (avoids circular dependency)
      try {
        const { useStaffStore } = await import('~/stores/staff')
        const staffStore = useStaffStore()
        const cachedStaff = staffStore.getCurrentStaffMember
        if (cachedStaff?.createdBy) {
          userId = cachedStaff.createdBy
          console.log('[useFirestorePaths] Staff found in cache, using superadmin UID:', userId)
          return userId
        }
        
        // If not in cache, try fetching the staff member (but only if not already fetching to avoid loops)
        // Check if we're already in a fetch operation by looking for a flag
        const isFetching = (staffStore as any).__fetchingStaffMember
        if (!isFetching) {
          try {
            (staffStore as any).__fetchingStaffMember = true
            const fetchedStaff = await staffStore.fetchCurrentStaffMember()
            if (fetchedStaff?.createdBy) {
              userId = fetchedStaff.createdBy
              console.log('[useFirestorePaths] Staff fetched and found, using superadmin UID:', userId)
              ;(staffStore as any).__fetchingStaffMember = false
              return userId
            }
            (staffStore as any).__fetchingStaffMember = false
          } catch (fetchError: any) {
            (staffStore as any).__fetchingStaffMember = false
            console.warn('[useFirestorePaths] Could not fetch staff member:', fetchError.message)
            // If it's a permission error, log it clearly
            if (fetchError.code === 'permission-denied' || fetchError.message?.includes('permission')) {
              console.error('[useFirestorePaths] Permission denied when fetching staff member. Check Firestore rules allow staff to query collections.')
            }
          }
        } else {
          // If already fetching, wait a bit and check cache again (with retries)
          for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 100))
            const retryCachedStaff = staffStore.getCurrentStaffMember
            if (retryCachedStaff?.createdBy) {
              userId = retryCachedStaff.createdBy
              console.log('[useFirestorePaths] Staff found in cache after wait, using superadmin UID:', userId)
              return userId
            }
            // Check if fetch completed
            if (!(staffStore as any).__fetchingStaffMember) {
              break
            }
          }
        }
      } catch (error: any) {
        console.warn('[useFirestorePaths] Could not get from cache:', error.message)
      }

      // If still not found, log warning but return null to indicate failure
      // This will cause operations to fail gracefully rather than using wrong UID
      if (userStore.userData?.role === 'staff') {
        console.error('[useFirestorePaths] Staff member not found in legacy collection or cache. This will prevent data from loading.')
        console.error('[useFirestorePaths] Possible causes:')
        console.error('  1. Staff document does not exist in Firestore')
        console.error('  2. Firestore rules are blocking the query')
        console.error('  3. Staff document has incorrect authUid field')
        console.error('[useFirestorePaths] Attempting to fetch staff data proactively...')
        
        // Try one more time to fetch staff data proactively
        try {
          const { useStaffStore } = await import('~/stores/staff')
          const staffStore = useStaffStore()
          // Try fetching all staff first, which might populate the cache
          try {
            await staffStore.fetchStaff()
            const retryCachedStaff = staffStore.getCurrentStaffMember
            if (retryCachedStaff?.createdBy) {
              userId = retryCachedStaff.createdBy
              console.log('[useFirestorePaths] Staff found after fetching all staff, using superadmin UID:', userId)
              return userId
            }
          } catch (fetchAllError: any) {
            console.warn('[useFirestorePaths] Could not fetch all staff:', fetchAllError.message)
          }
        } catch (proactiveError: any) {
          console.warn('[useFirestorePaths] Error in proactive fetch:', proactiveError.message)
        }
        
        return null
      }
    }
  }

  return userId
}
