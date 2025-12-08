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
      } catch (error: any) {
        console.warn('[useFirestorePaths] Could not get from cache:', error.message)
      }

      // If not found, we can't search hierarchically here without creating a circular dependency
      // Return null and let fetchCurrentStaffMember handle the full search
      console.warn('[useFirestorePaths] Staff member not found in legacy collection or cache')
    }
  }

  return userId
}
