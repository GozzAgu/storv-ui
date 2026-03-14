import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, deleteField, writeBatch } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { useStaffStore } from './staff'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { getInventoryFoldersCollection, getInventoryFolderDocument, getInventoryItemsCollection, getInventoryItemDocument, getQueryUserId } from '~/composables/useFirestorePaths'

export interface TemplateField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'currency'
  required: boolean
  options?: string[]
  placeholder?: string
}

export interface Template {
  id: string
  name: string
  description: string
  fields: TemplateField[]
  category?: string
}

export interface InventoryFolder {
  id: string
  name: string
  description: string
  type?: string
  color: string
  hasSerialNumbers: boolean
  template?: Template
  itemCount: number
  totalValue: number
  lowStockCount: number
  storeId: string // Store this folder belongs to
  createdAt: Date | any
  updatedAt?: Date | any
  createdBy: string
  allowedDepartments?: string[] // Array of department IDs that have access to this folder
}

export interface InventoryItem {
  id: string
  folderId: string
  storeId: string // Store this item belongs to
  [key: string]: any // Dynamic fields based on template
  dateIn?: Date | string // Date when item was added (from createdAt)
  dateOut?: Date | string // Date when item was sold (from receipt generation)
  swapIn?: boolean // Indicates if this item was swapped in by a customer
  swapInReceiptId?: string // Receipt ID associated with this swap-in
  // Discount fields
  discountPercentage?: number // Percentage discount (e.g., 10 for 10%)
  discountAmount?: number // Fixed discount amount
  originalPrice?: number // Original price before discount
  discountedPrice?: number // Price after discount
  createdAt: Date | any
  updatedAt?: Date | any
  createdBy: string
}

export const useInventoryStore = defineStore('inventory', {
  state: () => ({ 
    folders: [] as InventoryFolder[],
    items: {} as Record<string, InventoryItem[]>, // Keyed by folderId
    loading: false,
    itemsLoading: {} as Record<string, boolean>, // Keyed by folderId
    error: null as string | null,
  }),

  getters: {
    totalFolders: (state) => state.folders.length,
    totalItems: (state) => state.folders.reduce((sum, folder) => sum + folder.itemCount, 0),
    totalValue: (state) => state.folders.reduce((sum, folder) => sum + folder.totalValue, 0),
    lowStockFolders: (state) => state.folders.filter(folder => folder.lowStockCount > 0),
    getFolderById: (state) => (id: string) => state.folders.find(f => f.id === id),
  },

  actions: {
    // Get all inventory folders
    async fetchFolders() {
      this.loading = true
      this.error = null

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.error = 'Firestore not initialized'
        this.loading = false
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        this.error = 'User must be authenticated'
        this.loading = false
        return
      }

      // Check if user is staff to determine which folders to show
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      // Use getQueryUserId to get the correct userId (superadmin's UID for staff)
      const userId = await getQueryUserId()
      if (!userId) {
        this.error = 'User ID not available'
        this.loading = false
        return
      }

      // Get current store ID to filter folders
      const currentStoreId = await getCurrentStoreId()
      
      if (!currentStoreId) {
        this.error = 'No store selected. Please select a store first.'
        this.loading = false
        return
      }
      
      console.log('[InventoryStore] fetchFolders - userId:', userId, 'currentStoreId:', currentStoreId, 'isStaff:', userStore.userData?.role === 'staff')

      // If staff, also log their staff document info for debugging
      if (userStore.userData?.role === 'staff') {
        try {
          const staffRef = collection(db, 'staff')
          const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
          const staffSnapshot = await getDocs(staffQuery)
          if (!staffSnapshot.empty) {
            const staffDoc = staffSnapshot.docs[0]
            if (staffDoc) {
              const staffData = staffDoc.data()
              console.log('[InventoryStore] Staff document - storeId:', staffData.storeId, 'createdBy:', staffData.createdBy)
            }
          }
        } catch (e) {
          console.warn('[InventoryStore] Could not fetch staff doc for logging:', e)
        }
      }

      // Get staff departmentId if user is staff
      let staffDepartmentId: string | undefined
      if (userStore.userData?.role === 'staff') {
        try {
          const { useStaffStore } = await import('./staff')
          const staffStore = useStaffStore()
          const staffMember = await staffStore.fetchCurrentStaffMember()
          staffDepartmentId = staffMember?.departmentId
          console.log('[InventoryStore] Staff departmentId:', staffDepartmentId)
        } catch (e) {
          console.warn('[InventoryStore] Could not fetch staff member:', e)
        }
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryFolders
        const foldersRef = getInventoryFoldersCollection(db, userId, currentStoreId)
        let querySnapshot

        try {
          // For staff: Get all folders in store (no createdBy filter)
          // For superadmin: Filter by createdBy
          let q
          if (userStore.userData?.role === 'staff') {
            // Staff sees all folders in their store
            q = query(
              foldersRef,
              orderBy('createdAt', 'desc')
            )
          } else {
            // Superadmin sees only their folders
            q = query(
              foldersRef,
              where('createdBy', '==', userId),
              orderBy('createdAt', 'desc')
            )
          }
          querySnapshot = await getDocs(q)
        } catch (orderByError: any) {
          // If orderBy fails (missing index), try without orderBy
          if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
            let q
            if (userStore.userData?.role === 'staff') {
              // Staff sees all folders in their store
              q = query(foldersRef)
            } else {
              // Superadmin sees only their folders
              q = query(
                foldersRef,
                where('createdBy', '==', userId)
              )
            }
            querySnapshot = await getDocs(q)
          } else {
            throw orderByError
          }
        }

        const allFolders = querySnapshot.docs
        console.log('[InventoryStore] Found', allFolders.length, 'folders in store (userId:', userId, 'storeId:', currentStoreId, 'isStaff:', userStore.userData?.role === 'staff' + ')')

        // Process the results
        let folders = allFolders.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            type: data.type || '',
            color: data.color || '#3B82F6',
            hasSerialNumbers: data.hasSerialNumbers || false,
            template: data.template || undefined,
            itemCount: data.itemCount || 0,
            totalValue: data.totalValue || 0,
            lowStockCount: data.lowStockCount || 0,
            storeId: data.storeId || '', // Include storeId from data
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt) || undefined,
            createdBy: data.createdBy || userId,
            allowedDepartments: data.allowedDepartments || undefined,
          } as InventoryFolder
        })

        // For staff: Filter folders by department access
        if (userStore.userData?.role === 'staff' && staffDepartmentId) {
          folders = folders.filter(folder => {
            // If folder has allowedDepartments, check if staff's department has access
            if (folder.allowedDepartments && folder.allowedDepartments.length > 0) {
              return folder.allowedDepartments.includes(staffDepartmentId)
            }
            // If no allowedDepartments specified, staff can see it (folder is accessible to all departments)
            return true
          })
          console.log('[InventoryStore] Filtered folders by department access:', folders.length, 'folders visible to staff')
        }

        // No need to filter by storeId since we're already querying from the store's subcollection
        // All folders returned are already in the correct store

        // If user is staff, filter folders by department access
        if (userStore.userData?.role === 'staff') {
          try {
            const staffStore = useStaffStore()
            let currentStaffMember = staffStore.getCurrentStaffMember

            // If current staff member not found in store, fetch it directly
            if (!currentStaffMember) {
              try {
                const staffRef = collection(db, 'staff')
                const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
                const staffSnapshot = await getDocs(staffQuery)

                if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
                  const staffDoc = staffSnapshot.docs[0]
                  if (staffDoc) {
                    const staffData = staffDoc.data()
                    currentStaffMember = {
                      id: staffDoc.id,
                      ...staffData,
                    } as any
                  }
                }
              } catch (fetchError: any) {
                console.warn('[InventoryStore] Could not fetch staff document:', fetchError.message)
              }
            }

            const staffDepartmentId = currentStaffMember?.departmentId

            if (staffDepartmentId) {
              // Filter folders: show if no allowedDepartments (accessible to all) OR if staff's department is in allowedDepartments
              folders = folders.filter(folder => {
                // If folder has no allowedDepartments, it's accessible to all
                if (!folder.allowedDepartments || folder.allowedDepartments.length === 0) {
                  return true
                }
                // Otherwise, check if staff's department is in the allowed list
                return folder.allowedDepartments.includes(staffDepartmentId)
              })
            } else {
              // If staff member has no department, only show folders with no restrictions
              folders = folders.filter(folder => !folder.allowedDepartments || folder.allowedDepartments.length === 0)
            }
          } catch (error: any) {
            console.warn('[InventoryStore] Could not filter by department, showing all folders:', error.message)
          }
        }

        this.folders = folders

        // Sort by createdAt if orderBy failed
        this.folders.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
          return dateB.getTime() - dateA.getTime()
        })

        this.loading = false
      } catch (error: any) {
        console.error('Error fetching inventory folders:', error)
        this.error = error.message || 'Failed to fetch inventory folders'
        this.loading = false
        throw new Error(error.message || 'Failed to fetch inventory folders')
      }
    },

    // Get a single folder
    async fetchFolder(folderId: string): Promise<InventoryFolder | null> {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Get userId and storeId for hierarchical path
      const userId = await getQueryUserId()
      if (!userId) {
        throw new Error('User ID not available')
      }
      
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        throw new Error('No store selected')
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryFolders/{folderId}
        const folderRef = getInventoryFolderDocument(db, userId, storeId, folderId)
        const folderSnap = await getDoc(folderRef)

        if (!folderSnap.exists()) {
          console.warn('[InventoryStore] Folder not found in hierarchical path:', {
            folderId,
            userId,
            storeId,
            path: `users/${userId}/stores/${storeId}/inventoryFolders/${folderId}`
          })
          return null
        }

        const data = folderSnap.data()
        
        // Check if user is staff to verify department access
        const userStore = useUserStore()
        if (!userStore.userData) {
          await userStore.fetchUserData(authStore.currentUser.uid)
        }

        // Verify ownership or department access
        if (userStore.userData?.role === 'staff') {
          // For staff, folders created by their superadmin are accessible
          // Verify folder belongs to staff's superadmin (using userId from getQueryUserId)
          if (data.createdBy !== userId) {
            console.warn('[InventoryStore] Folder createdBy does not match superadmin UID:', {
              folderCreatedBy: data.createdBy,
              superadminUID: userId
            })
            throw new Error('Folder not found')
          }
          
          // Get staff member data to check department access
          const { useStaffStore } = await import('./staff')
          const staffStore = useStaffStore()
          const staffMember = await staffStore.fetchCurrentStaffMember()
          
          if (!staffMember) {
            console.warn('[InventoryStore] Staff member not found for folder access check')
            throw new Error('Folder not found')
          }
          
          // Check department access if folder has allowedDepartments set
          const allowedDepartments = data.allowedDepartments || []
          if (allowedDepartments.length > 0) {
            const staffDepartmentId = staffMember.departmentId
            if (!staffDepartmentId || !allowedDepartments.includes(staffDepartmentId)) {
              throw new Error('Access denied: Your department does not have access to this folder')
            }
          }
          // If allowedDepartments is empty, staff can access (folder is accessible to all departments in store)
        } else if (data.createdBy !== authStore.currentUser.uid) {
          // For superadmin, folder must be created by them
          throw new Error('Folder not found')
        }

        return {
          id: folderSnap.id,
          name: data.name || '',
          description: data.description || '',
          type: data.type || '',
          color: data.color || '#3B82F6',
          hasSerialNumbers: data.hasSerialNumbers || false,
          template: data.template || undefined,
          itemCount: data.itemCount || 0,
          totalValue: data.totalValue || 0,
          lowStockCount: data.lowStockCount || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt) || undefined,
          createdBy: data.createdBy || authStore.currentUser.uid,
          allowedDepartments: data.allowedDepartments || undefined,
        } as InventoryFolder
      } catch (error: any) {
        console.error('Error fetching folder:', error)
        throw new Error(error.message || 'Failed to fetch folder')
      }
    },

    // Create a new inventory folder
    async createFolder(folderData: Omit<InventoryFolder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'itemCount' | 'totalValue' | 'lowStockCount' | 'storeId'>): Promise<string> {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to create folders')
      }

      // Check if user is staff - managers cannot create folders
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      if (userStore.userData?.role === 'staff') {
        // Managers cannot create inventory folders - only super admins can
        throw new Error('Managers cannot create inventory folders. Only super admins can create folders.')
      }

      // Get current store ID
      const { getCurrentStoreId } = await import('~/composables/useCurrentStore')
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        throw new Error('No store selected. Please select a store first.')
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryFolders
        const userId = authStore.currentUser.uid
        const foldersRef = getInventoryFoldersCollection(db, userId, storeId)
        const newFolderRef = doc(foldersRef)

        const newFolder: Omit<InventoryFolder, 'id'> = {
          ...folderData,
          storeId, // Add storeId to the folder
          itemCount: 0,
          totalValue: 0,
          lowStockCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: authStore.currentUser.uid,
        }

        await setDoc(newFolderRef, newFolder)

        // Add to local state with actual Date objects
        const now = new Date()
        const folderForState: InventoryFolder = {
          id: newFolderRef.id,
          ...folderData,
          storeId, // Add storeId to local state
          itemCount: 0,
          totalValue: 0,
          lowStockCount: 0,
          createdAt: now,
          updatedAt: now,
          createdBy: authStore.currentUser.uid,
        }
        this.folders.unshift(folderForState)

        return newFolderRef.id
      } catch (error: any) {
        console.error('Error creating folder:', error)
        throw new Error(error.message || 'Failed to create folder')
      }
    },

    // Update a folder
    async updateFolder(folderId: string, updates: Partial<Omit<InventoryFolder, 'id' | 'createdAt' | 'createdBy'>>) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to update folders')
      }

      // Check permissions - staff (non-managers) cannot update
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      if (userStore.userData?.role === 'staff') {
        // Check if staff member is a manager
        const staffStore = useStaffStore()
        const currentStaffMember = await staffStore.fetchCurrentStaffMember()
        if (currentStaffMember?.role !== 'manager') {
          throw new Error('Staff members do not have permission to update folders. Only managers can edit.')
        }
      }

      // Verify ownership
      const folder = this.getFolderById(folderId)
      if (!folder || folder.createdBy !== authStore.currentUser.uid) {
        throw new Error('Folder not found or access denied')
      }

      try {
        // Get userId and storeId for hierarchical path
        const userId = authStore.currentUser.uid
        const storeId = await getCurrentStoreId()
        if (!storeId) {
          throw new Error('No store selected')
        }
        
        // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryFolders/{folderId}
        const folderRef = getInventoryFolderDocument(db, userId, storeId, folderId)
        await updateDoc(folderRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        })

        // Update local state
        const index = this.folders.findIndex(f => f.id === folderId)
        if (index > -1) {
          this.folders[index] = {
            ...this.folders[index],
            ...updates,
            updatedAt: new Date(),
          } as InventoryFolder
        }
      } catch (error: any) {
        console.error('Error updating folder:', error)
        throw new Error(error.message || 'Failed to update folder')
      }
    },

    // Delete a folder
    async deleteFolder(folderId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to delete folders')
      }

      // Check permissions - staff (non-managers) cannot delete
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      if (userStore.userData?.role === 'staff') {
        // Check if staff member is a manager
        const staffStore = useStaffStore()
        const currentStaffMember = await staffStore.fetchCurrentStaffMember()
        if (currentStaffMember?.role !== 'manager') {
          throw new Error('Staff members do not have permission to delete folders. Only managers can delete.')
        }
      }

      // Verify ownership
      const folder = this.getFolderById(folderId)
      if (!folder || folder.createdBy !== authStore.currentUser.uid) {
        throw new Error('Folder not found or access denied')
      }

      try {
        // Get userId and storeId for hierarchical path
        const userId = authStore.currentUser.uid
        const storeId = await getCurrentStoreId()
        if (!storeId) {
          throw new Error('No store selected')
        }

        // Delete all items in this folder first (same user path as folder owner)
        const itemsRef = getInventoryItemsCollection(db, userId, storeId)
        const itemsQuery = query(itemsRef, where('folderId', '==', folderId))
        const itemsSnapshot = await getDocs(itemsQuery)
        const BATCH_SIZE = 500 // Firestore batch limit
        if (!itemsSnapshot.empty) {
          const docs = itemsSnapshot.docs
          for (let i = 0; i < docs.length; i += BATCH_SIZE) {
            const batch = writeBatch(db)
            const chunk = docs.slice(i, i + BATCH_SIZE)
            chunk.forEach((d) => batch.delete(d.ref))
            await batch.commit()
          }
        }

        // Remove folder's items from local state
        delete this.items[folderId]

        // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryFolders/{folderId}
        const folderRef = getInventoryFolderDocument(db, userId, storeId, folderId)
        await deleteDoc(folderRef)

        // Remove from local state
        const index = this.folders.findIndex(f => f.id === folderId)
        if (index > -1) {
          this.folders.splice(index, 1)
        }
      } catch (error: any) {
        console.error('Error deleting folder:', error)
        throw new Error(error.message || 'Failed to delete folder')
      }
    },

    // Get all items for a folder
    async fetchItems(folderId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Check if user is staff to determine which items to show
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      // Use getQueryUserId to get the correct userId (superadmin's UID for staff)
      const queryUserId = await getQueryUserId()
      if (!queryUserId) {
        throw new Error('User ID not available')
      }
      
      // Get staff departmentId if user is staff
      let staffDepartmentId: string | undefined
      if (userStore.userData?.role === 'staff') {
        try {
          const { useStaffStore } = await import('./staff')
          const staffStore = useStaffStore()
          const staffMember = await staffStore.fetchCurrentStaffMember()
          staffDepartmentId = staffMember?.departmentId
          console.log('[InventoryStore] Staff user detected, using super admin UID for fetchItems:', queryUserId, 'departmentId:', staffDepartmentId)
          
          // Verify department access to the folder
          if (staffDepartmentId) {
            const folder = this.getFolderById(folderId)
            if (folder) {
              // If folder has allowedDepartments, verify staff's department has access
              if (folder.allowedDepartments && folder.allowedDepartments.length > 0) {
                if (!folder.allowedDepartments.includes(staffDepartmentId)) {
                  throw new Error('Access denied: Your department does not have access to items in this folder')
                }
              }
            } else {
              // Folder not in store, fetch it to check access
              try {
                const folderData = await this.fetchFolder(folderId)
                if (!folderData) {
                  throw new Error('Folder not found')
                }
              } catch (error: any) {
                throw new Error(error.message || 'Access denied: Cannot access items in this folder')
              }
            }
          }
        } catch (error: any) {
          console.warn('[InventoryStore] Could not fetch staff member for items:', error.message)
        }
      }

      this.itemsLoading[folderId] = true

      // Get storeId for hierarchical path
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        this.itemsLoading[folderId] = false
        throw new Error('No store selected')
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryItems
        // Use queryUserId (superadmin's UID) for the hierarchical path
        const itemsRef = getInventoryItemsCollection(db, queryUserId, storeId)
        
        // Query items by folderId
        // For staff: Get all items in folder (no createdBy filter) - they see items from anyone in their store
        // For superadmin: Filter by createdBy
        let q
        try {
          if (userStore.userData?.role === 'staff') {
            // Staff sees all items in folder
            q = query(
              itemsRef,
              where('folderId', '==', folderId),
              orderBy('createdAt', 'desc')
            )
            } else {
              // Superadmin sees only their items
              q = query(
                itemsRef,
                where('folderId', '==', folderId),
                where('createdBy', '==', queryUserId),
                orderBy('createdAt', 'desc')
              )
            }
        } catch (orderByError: any) {
          // If orderBy fails, try without it
          if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
            if (userStore.userData?.role === 'staff') {
              // Staff sees all items in folder
              q = query(
                itemsRef,
                where('folderId', '==', folderId)
              )
            } else {
              // Superadmin sees only their items
              q = query(
                itemsRef,
                where('folderId', '==', folderId),
                where('createdBy', '==', queryUserId)
              )
            }
          } else {
            throw orderByError
          }
        }

        const querySnapshot = await getDocs(q)

        let fetchedItems: InventoryItem[] = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            folderId: data.folderId || folderId,
            ...Object.fromEntries(
              Object.entries(data).filter(([key]) => 
                !['folderId', 'createdAt', 'updatedAt', 'createdBy', 'dateIn', 'dateOut'].includes(key)
              )
            ),
            dateIn: data.dateIn?.toDate ? data.dateIn.toDate() : (data.dateIn ? new Date(data.dateIn) : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date())),
            dateOut: data.dateOut?.toDate ? data.dateOut.toDate() : (data.dateOut ? new Date(data.dateOut) : undefined),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt) || undefined,
            createdBy: data.createdBy || queryUserId,
          } as InventoryItem
        })

        // Staff sees all items in folder (no filtering needed - query already returns all items for staff)
        // Superadmin sees only their items (already filtered by createdBy in query)

        // Sort by createdAt if orderBy failed
        fetchedItems.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
          return dateB.getTime() - dateA.getTime()
        })

        this.items[folderId] = fetchedItems
        this.itemsLoading[folderId] = false

        // Update folder item count based on actual items
        await this.updateItemCount(folderId)

        return fetchedItems
      } catch (error: any) {
        // Try without orderBy if index is missing
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          // Check if warning was already shown for inventoryItems
          let warned = typeof window !== 'undefined' ? (window as any).__firestoreIndexWarned : null
          
          // Convert to object if it's a boolean (from other stores)
          if (warned && typeof warned !== 'object') {
            (window as any).__firestoreIndexWarned = {}
            warned = (window as any).__firestoreIndexWarned
          }
          
          // Initialize as object if it doesn't exist
          if (!warned) {
            (window as any).__firestoreIndexWarned = {}
            warned = (window as any).__firestoreIndexWarned
          }
          
          // Only warn once
          if (!warned.inventoryItems) {
            const indexUrlMatch = error.message?.match(/https:\/\/[^\s]+/)
            const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null
            console.warn('[InventoryStore] orderBy failed for items, retrying without orderBy. This is expected if indexes are not yet created.')
            if (indexUrl) {
              console.info('[InventoryStore] Create the index here:', indexUrl)
            }
            warned.inventoryItems = true
          }
          
          try {
            // Get storeId for hierarchical path
            const storeId = await getCurrentStoreId()
            if (!storeId) {
              throw new Error('No store selected')
            }
            
            // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryItems
            // Use queryUserId (superadmin's UID) for the hierarchical path
            const itemsRef = getInventoryItemsCollection(db, queryUserId, storeId)
            
            // Query items by folderId
            // For staff: Get all items (no createdBy filter)
            // For superadmin: Filter by createdBy
            let q
            if (userStore.userData?.role === 'staff') {
              q = query(
                itemsRef,
                where('folderId', '==', folderId)
              )
            } else {
              q = query(
                itemsRef,
                where('folderId', '==', folderId),
                where('createdBy', '==', queryUserId)
              )
            }

            const querySnapshot = await getDocs(q)
            let fetchedItems: InventoryItem[] = querySnapshot.docs.map((doc) => {
              const data = doc.data()
              return {
                id: doc.id,
                folderId: data.folderId || folderId,
                ...Object.fromEntries(
                  Object.entries(data).filter(([key]) => 
                    !['folderId', 'createdAt', 'updatedAt', 'createdBy', 'dateIn', 'dateOut', 'swapIn', 'swapInReceiptId', 'discountPercentage', 'discountAmount', 'originalPrice', 'discountedPrice'].includes(key)
                  )
                ),
                dateIn: data.dateIn?.toDate ? data.dateIn.toDate() : (data.dateIn ? new Date(data.dateIn) : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date())),
                dateOut: data.dateOut?.toDate ? data.dateOut.toDate() : (data.dateOut ? new Date(data.dateOut) : undefined),
                swapIn: data.swapIn || false,
                swapInReceiptId: data.swapInReceiptId || undefined,
                discountPercentage: data.discountPercentage || undefined,
                discountAmount: data.discountAmount || undefined,
                originalPrice: data.originalPrice || undefined,
                discountedPrice: data.discountedPrice || undefined,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt) || undefined,
                createdBy: data.createdBy || queryUserId,
              } as InventoryItem
            })

            // Staff sees all items in folder (no filtering needed - query already returns all items for staff)
            // Superadmin sees only their items (already filtered by createdBy in query)

            fetchedItems.sort((a, b) => {
              const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
              const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
              return dateB.getTime() - dateA.getTime()
            })

            this.items[folderId] = fetchedItems
            this.itemsLoading[folderId] = false

            // Update folder item count based on actual items
            await this.updateItemCount(folderId)

            return fetchedItems
          } catch (retryError: any) {
            this.itemsLoading[folderId] = false
            throw new Error(retryError.message || 'Failed to fetch items')
          }
        }

        this.itemsLoading[folderId] = false
        throw new Error(error.message || 'Failed to fetch items')
      }
    },

    // Check if a serial number already exists for the same brand and model
    async checkDuplicateSerialNumber(
      storeId: string,
      folderId: string,
      serialNo: string,
      brand: string,
      model: string,
      createdByUid: string,
      userRole?: string
    ): Promise<boolean> {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      // Only check if serial number, brand, and model are provided
      if (!serialNo || !brand || !model) {
        return false // No duplicate if required fields are missing
      }

      try {
        const itemsRef = getInventoryItemsCollection(db, createdByUid, storeId)
        const trimmedSerialNo = serialNo.trim()
        const trimmedBrand = brand.trim()
        const trimmedModel = model.trim()
        
        // Query for items with same serial number in the same folder
        // We'll filter by brand and model in memory to avoid composite index requirements
        // For staff: check all items in folder (no createdBy filter)
        // For superadmin: check only their items
        let q
        try {
          if (userRole === 'staff') {
            q = query(
              itemsRef,
              where('folderId', '==', folderId),
              where('serialNo', '==', trimmedSerialNo)
            )
          } else {
            q = query(
              itemsRef,
              where('folderId', '==', folderId),
              where('serialNo', '==', trimmedSerialNo),
              where('createdBy', '==', createdByUid)
            )
          }
        } catch (queryError: any) {
          // If query fails due to missing index, try simpler query
          if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
            // Fallback: query by folderId only and filter in memory
            if (userRole === 'staff') {
              q = query(itemsRef, where('folderId', '==', folderId))
            } else {
              q = query(
                itemsRef,
                where('folderId', '==', folderId),
                where('createdBy', '==', createdByUid)
              )
            }
          } else {
            throw queryError
          }
        }

        const querySnapshot = await getDocs(q)
        
        // Filter results in memory to check for matching brand and model
        const duplicateExists = querySnapshot.docs.some(doc => {
          const data = doc.data()
          return (
            data.serialNo?.trim() === trimmedSerialNo &&
            data.brand?.trim() === trimmedBrand &&
            data.model?.trim() === trimmedModel
          )
        })

        return duplicateExists
      } catch (error: any) {
        // If query fails, log warning but don't block creation
        console.warn('Error checking duplicate serial number:', error)
        return false // Allow creation if check fails
      }
    },

    // Create a new item
    async createItem(folderId: string, itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'folderId'>) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to create items')
      }

      // Check permissions - only super admins can create items (all staff have view-only)
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      // Only super admins can create inventory items
      if (userStore.userData?.role === 'staff') {
        throw new Error('Only super admins can add items to inventory. Staff have view-only access.')
      }

      const createdByUid = authStore.currentUser.uid

      // Get folder to get its storeId
      const folder = this.getFolderById(folderId)
      if (!folder) {
        throw new Error('Folder not found')
      }

      // Get storeId from folder or current store
      let storeId = folder.storeId
      if (!storeId) {
        storeId = await getCurrentStoreId() || ''
        if (!storeId) {
          throw new Error('No store selected. Please select a store first.')
        }
      }

      // Check for duplicate serial number if item has serial number, brand, and model
      if (itemData.serialNo && itemData.brand && itemData.model) {
        const isDuplicate = await this.checkDuplicateSerialNumber(
          storeId,
          folderId,
          itemData.serialNo,
          itemData.brand,
          itemData.model,
          createdByUid,
          userStore.userData?.role
        )
        
        if (isDuplicate) {
          throw new Error(`An item with serial number "${itemData.serialNo}" already exists for ${itemData.brand} ${itemData.model}. Please use a different serial number.`)
        }
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryItems
        // For superadmins, userId is their own UID (createdByUid)
        const itemsRef = getInventoryItemsCollection(db, createdByUid, storeId)
        const newItemRef = doc(itemsRef)

        const now = new Date()
        const newItem: Omit<InventoryItem, 'id'> = {
          ...itemData,
          folderId,
          storeId, // Add storeId from folder
          dateIn: now, // Set dateIn from createdAt
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: createdByUid, // Use super admin UID for managers
        }

        await setDoc(newItemRef, newItem)

        // Add to local state
        const itemForState: InventoryItem = {
          id: newItemRef.id,
          ...itemData,
          folderId,
          storeId, // Add storeId to local state
          dateIn: now, // Set dateIn from createdAt
          createdAt: now,
          updatedAt: now,
          createdBy: createdByUid, // Use super admin UID for managers
        }

        if (!this.items[folderId]) {
          this.items[folderId] = []
        }
        this.items[folderId].unshift(itemForState)

        // Update folder item count in background (non-blocking for better performance)
        // This updates folder stats (itemCount, lowStockCount) but doesn't affect item creation
        // If this fails, the item is still created successfully, just folder stats might be slightly off
        this.updateItemCount(folderId).catch((err) => {
          console.warn('[InventoryStore] Background folder stats update failed (non-critical):', err)
          // Item is already created and in local state, so this is just a stats sync issue
        })

        // Optimistically update folder count in local state
        const folderIndex = this.folders.findIndex(f => f.id === folderId)
        if (folderIndex > -1 && this.folders[folderIndex]) {
          this.folders[folderIndex].itemCount = (this.folders[folderIndex].itemCount || 0) + 1
        }

        return newItemRef.id
      } catch (error: any) {
        console.error('Error creating item:', error)
        throw new Error(error.message || 'Failed to create item')
      }
    },

    // Create multiple items in a batch (much faster than individual creates)
    async createItemsBatch(folderId: string, itemsData: Array<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'folderId'>>) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to create items')
      }

      // Check permissions
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      if (userStore.userData?.role === 'staff') {
        throw new Error('Only super admins can add items to inventory. Staff have view-only access.')
      }

      const createdByUid = authStore.currentUser.uid
      const folder = this.getFolderById(folderId)
      if (!folder) {
        throw new Error('Folder not found')
      }

      let storeId = folder.storeId
      if (!storeId) {
        storeId = await getCurrentStoreId() || ''
        if (!storeId) {
          throw new Error('No store selected. Please select a store first.')
        }
      }

      // Check for duplicate serial numbers in the batch
      const itemsWithSerialNumbers = itemsData.filter(item => item.serialNo && item.brand && item.model)
      if (itemsWithSerialNumbers.length > 0) {
        // Check each item for duplicates
        for (const item of itemsWithSerialNumbers) {
          const isDuplicate = await this.checkDuplicateSerialNumber(
            storeId,
            folderId,
            item.serialNo,
            item.brand,
            item.model,
            createdByUid,
            userStore.userData?.role
          )
          
          if (isDuplicate) {
            throw new Error(`An item with serial number "${item.serialNo}" already exists for ${item.brand} ${item.model}. Please use a different serial number.`)
          }
        }

        // Check for duplicates within the batch itself
        const serialNumberMap = new Map<string, { brand: string; model: string }>()
        for (const item of itemsWithSerialNumbers) {
          const key = `${item.serialNo.trim()}-${item.brand.trim()}-${item.model.trim()}`
          if (serialNumberMap.has(key)) {
            throw new Error(`Duplicate serial number "${item.serialNo}" for ${item.brand} ${item.model} found in the items you're trying to add. Each serial number must be unique.`)
          }
          serialNumberMap.set(key, { brand: item.brand, model: item.model })
        }
      }

      try {
        const itemsRef = getInventoryItemsCollection(db, createdByUid, storeId)
        const batch = writeBatch(db)
        const now = new Date()
        const createdItems: InventoryItem[] = []

        // Add all items to batch
        itemsData.forEach(itemData => {
          const newItemRef = doc(itemsRef)
          const newItem: Omit<InventoryItem, 'id'> = {
            ...itemData,
            folderId,
            storeId,
            dateIn: now,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: createdByUid,
          }
          batch.set(newItemRef, newItem)

          // Prepare for local state
          createdItems.push({
            id: newItemRef.id,
            ...itemData,
            folderId,
            storeId,
            dateIn: now,
            createdAt: now,
            updatedAt: now,
            createdBy: createdByUid,
          } as InventoryItem)
        })

        // Commit batch (all items created in one operation)
        await batch.commit()

        // Add to local state
        if (!this.items[folderId]) {
          this.items[folderId] = []
        }
        this.items[folderId].unshift(...createdItems)

        // Update folder item count in background
        this.updateItemCount(folderId).catch(console.error)

        // Optimistically update folder count
        const folderIndex = this.folders.findIndex(f => f.id === folderId)
        if (folderIndex > -1 && this.folders[folderIndex]) {
          this.folders[folderIndex].itemCount = (this.folders[folderIndex].itemCount || 0) + itemsData.length
        }

        return createdItems.map(item => item.id)
      } catch (error: any) {
        console.error('Error creating items batch:', error)
        throw new Error(error.message || 'Failed to create items')
      }
    },

    // Update an item
    async updateItem(folderId: string, itemId: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'createdBy' | 'folderId'>>) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to update items')
      }

      // Check permissions - only super admins can update (all staff have view-only)
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      // Only super admins can update inventory items
      if (userStore.userData?.role === 'staff') {
        throw new Error('Only super admins can update items in inventory. Staff have view-only access.')
      }

      // Get userId and storeId for hierarchical path
      const userId = authStore.currentUser.uid
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        throw new Error('No store selected')
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryItems/{itemId}
        const itemRef = getInventoryItemDocument(db, userId, storeId, itemId)
        
        // Filter out undefined values and system fields that shouldn't be updated directly
        const systemFields = ['dateOut', 'dateIn', 'swapIn', 'swapInReceiptId']
        const cleanedUpdates = Object.fromEntries(
          Object.entries(updates).filter(([key, value]) => 
            value !== undefined && !systemFields.includes(key)
          )
        )
        
        await updateDoc(itemRef, {
          ...cleanedUpdates,
          updatedAt: serverTimestamp(),
        })

        // Update local state
        if (this.items[folderId]) {
          const index = this.items[folderId].findIndex(item => item.id === itemId)
          if (index > -1) {
            this.items[folderId][index] = {
              ...this.items[folderId][index],
              ...updates,
              updatedAt: new Date(),
            } as InventoryItem
          }
        }
      } catch (error: any) {
        console.error('Error updating item:', error)
        throw new Error(error.message || 'Failed to update item')
      }
    },

    // Optimistically remove item from local state (for undo flow)
    removeItemOptimistically(folderId: string, itemId: string): InventoryItem | null {
      if (!this.items[folderId]) return null
      const index = this.items[folderId].findIndex(item => item.id === itemId)
      if (index === -1) return null
      const [removed] = this.items[folderId].splice(index, 1)
      return removed ?? null
    },

    // Restore item to local state (undo)
    restoreItem(folderId: string, item: InventoryItem) {
      if (!this.items[folderId]) this.items[folderId] = []
      this.items[folderId].push(item)
      this.updateItemCount(folderId)
    },

    // Delete an item
    async deleteItem(folderId: string, itemId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to delete items')
      }

      // Check permissions - only super admins can delete (all staff have view-only)
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      // Only super admins can delete inventory items
      if (userStore.userData?.role === 'staff') {
        throw new Error('Only super admins can delete items from inventory. Staff have view-only access.')
      }

      // Get userId and storeId for hierarchical path
      const userId = authStore.currentUser.uid
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        throw new Error('No store selected')
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryItems/{itemId}
        const itemRef = getInventoryItemDocument(db, userId, storeId, itemId)
        await deleteDoc(itemRef)

        // Remove from local state
        if (this.items[folderId]) {
          const index = this.items[folderId].findIndex(item => item.id === itemId)
          if (index > -1) {
            this.items[folderId].splice(index, 1)
          }
        }

        // Update folder item count
        await this.updateItemCount(folderId)
      } catch (error: any) {
        console.error('Error deleting item:', error)
        throw new Error(error.message || 'Failed to delete item')
      }
    },

    // Update item count for a folder
    async updateItemCount(folderId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        console.warn('[InventoryStore] Cannot update folder item count: user not authenticated')
        return
      }

      try {
        // Get actual count from items
        const actualCount = this.items[folderId]?.length || 0

        // Get userId for hierarchical path (superadmin's UID for staff)
        const userId = await getQueryUserId()
        if (!userId) {
          console.warn('[InventoryStore] Cannot update folder item count: user ID not available')
          return
        }
        
        const storeId = await getCurrentStoreId()
        if (storeId) {
          // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryFolders/{folderId}
          const folderRef = getInventoryFolderDocument(db, userId, storeId, folderId)
          await updateDoc(folderRef, {
            itemCount: actualCount,
            updatedAt: serverTimestamp(),
          })
        }

        // Update in local state
        const index = this.folders.findIndex(f => f.id === folderId)
        if (index > -1 && this.folders[index]) {
          this.folders[index].itemCount = actualCount
        }

        // Also update low stock count in background (non-blocking)
        this.updateLowStockCount(folderId).catch(console.error)
      } catch (error: any) {
        console.error('Error updating item count:', error)
        // Don't throw error, just log it - we don't want to break item creation/deletion
      }
    },

    // Update low stock count for a folder
    async updateLowStockCount(folderId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        console.warn('[InventoryStore] Cannot update low stock count: Firestore not initialized')
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        console.warn('[InventoryStore] Cannot update low stock count: user not authenticated')
        return
      }

      try {
        // Get user settings to get lowStockThreshold
        const { useUser } = await import('~/composables/useUser')
        const { getUserDocument } = useUser()
        const userId = await getQueryUserId()
        if (!userId) {
          console.warn('[InventoryStore] Cannot update low stock count: user ID not available')
          return
        }

        const userData = await getUserDocument(userId)
        const lowStockThreshold = userData?.storeDetails?.settings?.inventory?.lowStockThreshold || 10

        // Get folder items
        const folderItems = this.items[folderId] || []
        const folder = this.getFolderById(folderId)
        if (!folder) {
          console.warn('[InventoryStore] Cannot update low stock count: folder not found')
          return
        }

        // Find quantity field name from template
        const quantityField = folder.template?.fields?.find(f => 
          f.name.toLowerCase() === 'quantity' ||
          f.name.toLowerCase() === 'qty'
        )?.name

        let lowStockCount = 0

        // For serial number folders: count total available items
        if (folder.hasSerialNumbers) {
          // Count available (not sold) items
          let availableCount = 0
          folderItems.forEach(item => {
            const dateOutValue = item.dateOut
            const hasDateOut = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
            if (!hasDateOut) {
              availableCount++
            }
          })
          
          // Folder is low stock if available count is below threshold
          if (availableCount > 0 && availableCount <= lowStockThreshold) {
            lowStockCount = availableCount // For serial number folders, this represents total available items below threshold
          }
        } else {
          // For bulk items: count items with low quantity
          folderItems.forEach(item => {
            // Skip sold items (items with dateOut)
            const dateOutValue = item.dateOut
            const hasDateOut = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
            if (hasDateOut) return

            // For bulk items, check quantity field
            if (quantityField && item[quantityField] !== undefined) {
              const quantity = typeof item[quantityField] === 'number' 
                ? item[quantityField] 
                : parseFloat(String(item[quantityField])) || 0
              
              // Item is low stock if quantity is greater than 0 but less than or equal to threshold
              if (quantity > 0 && quantity <= lowStockThreshold) {
                lowStockCount++
              }
            }
          })
        }

        // Update in Firestore
        const storeId = await getCurrentStoreId()
        if (storeId) {
          const folderRef = getInventoryFolderDocument(db, userId, storeId, folderId)
          await updateDoc(folderRef, {
            lowStockCount,
            updatedAt: serverTimestamp(),
          })
        }

        // Update in local state
        const index = this.folders.findIndex(f => f.id === folderId)
        if (index > -1 && this.folders[index]) {
          this.folders[index].lowStockCount = lowStockCount
        }
      } catch (error: any) {
        console.error('[InventoryStore] Error updating low stock count:', error)
        // Don't throw error, just log it - we don't want to break other operations
      }
    },

    // Update dateOut for items when receipt is generated
    async updateItemsDateOut(folderId: string, itemIds: string[]) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Get userId for hierarchical path (superadmin's UID for staff)
      const userId = await getQueryUserId()
      if (!userId) {
        throw new Error('User ID not available')
      }
      
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        throw new Error('No store selected')
      }

      try {
        const now = new Date()
        const batch = itemIds.map(itemId => {
          // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryItems/{itemId}
          const itemRef = getInventoryItemDocument(db, userId, storeId, itemId)
          return updateDoc(itemRef, {
            dateOut: now,
            updatedAt: serverTimestamp(),
          })
        })

        await Promise.all(batch)

        // Update local state
        const folderItems = this.items[folderId]
        if (folderItems) {
          itemIds.forEach(itemId => {
            const index = folderItems.findIndex(item => item.id === itemId)
            if (index > -1 && folderItems[index]) {
              folderItems[index].dateOut = now
              folderItems[index].updatedAt = now
            }
          })
        }
      } catch (error: any) {
        console.error('Error updating dateOut:', error)
        throw new Error(error.message || 'Failed to update dateOut')
      }
    },

    // Remove dateOut from items (return to stock) when receipt is deleted
    async returnItemsToStock(itemIds: string[]) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Get userId for hierarchical path (superadmin's UID for staff)
      const userId = await getQueryUserId()
      if (!userId) {
        throw new Error('User ID not available')
      }
      
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        throw new Error('No store selected')
      }

      try {
        const batch = itemIds.map(itemId => {
          // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryItems/{itemId}
          const itemRef = getInventoryItemDocument(db, userId, storeId, itemId)
          return updateDoc(itemRef, {
            dateOut: null,
            updatedAt: serverTimestamp(),
          })
        })

        await Promise.all(batch)

        // Update local state
        Object.keys(this.items).forEach(folderId => {
          const folderItems = this.items[folderId]
          if (folderItems) {
            itemIds.forEach(itemId => {
              const index = folderItems.findIndex(item => item.id === itemId)
              if (index > -1 && folderItems[index]) {
                folderItems[index].dateOut = undefined
                folderItems[index].updatedAt = new Date()
              }
            })
          }
        })
      } catch (error: any) {
        console.error('Error returning items to stock:', error)
        throw new Error(error.message || 'Failed to return items to stock')
      }
    },

    // Helper function to get price field from item
    getItemPrice(item: InventoryItem): number {
      // Try common price field names
      const priceFields = ['price', 'Price', 'PRICE', 'cost', 'Cost', 'COST']
      for (const field of priceFields) {
        if (item[field] !== undefined && item[field] !== null) {
          return parseFloat(String(item[field])) || 0
        }
      }
      return 0
    },

    // Apply discount to a single item
    async applyDiscount(folderId: string, itemId: string, discountType: 'percentage' | 'amount', discountValue: number) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to apply discounts')
      }

      // Check permissions - only super admins can apply discounts (all staff have view-only)
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      // Only super admins can apply discounts
      if (userStore.userData?.role === 'staff') {
        throw new Error('Only super admins can apply discounts. Staff have view-only access.')
      }

      try {
        // Get the item to calculate discount
        const folderItems = this.items[folderId] || []
        const item = folderItems.find(i => i.id === itemId)
        if (!item) {
          throw new Error('Item not found')
        }

        // Check if item has been sold
        if (item.dateOut) {
          const dateOutValue = item.dateOut
          const hasDateOut = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
          if (hasDateOut) {
            throw new Error('Cannot apply discount to sold items')
          }
        }

        const originalPrice = item.originalPrice || this.getItemPrice(item)
        if (!originalPrice || originalPrice <= 0) {
          throw new Error('Item does not have a valid price to apply discount')
        }

        let discountPercentage: number | undefined
        let discountAmount: number | undefined
        let discountedPrice: number

        if (discountType === 'percentage') {
          if (discountValue < 0 || discountValue > 100) {
            throw new Error('Discount percentage must be between 0 and 100')
          }
          discountPercentage = discountValue
          discountAmount = (originalPrice * discountValue) / 100
          discountedPrice = originalPrice - discountAmount
        } else {
          if (discountValue < 0 || discountValue > originalPrice) {
            throw new Error('Discount amount cannot be negative or greater than the original price')
          }
          discountAmount = discountValue
          discountPercentage = (discountValue / originalPrice) * 100
          discountedPrice = originalPrice - discountAmount
        }

        // Get userId and storeId for hierarchical path
        const userId = authStore.currentUser.uid
        const storeId = await getCurrentStoreId()
        if (!storeId) {
          throw new Error('No store selected')
        }

        // Update item in Firestore
        // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryItems/{itemId}
        const itemRef = getInventoryItemDocument(db, userId, storeId, itemId)
        await updateDoc(itemRef, {
          discountPercentage,
          discountAmount,
          originalPrice: originalPrice,
          discountedPrice: Math.round(discountedPrice * 100) / 100, // Round to 2 decimal places
          updatedAt: serverTimestamp(),
        })

        // Update local state
        const index = folderItems.findIndex(i => i.id === itemId)
        if (index > -1 && folderItems[index]) {
          folderItems[index].discountPercentage = discountPercentage
          folderItems[index].discountAmount = discountAmount
          folderItems[index].originalPrice = originalPrice
          folderItems[index].discountedPrice = Math.round(discountedPrice * 100) / 100
          folderItems[index].updatedAt = new Date()
        }

        return {
          discountPercentage,
          discountAmount,
          originalPrice,
          discountedPrice: Math.round(discountedPrice * 100) / 100,
        }
      } catch (error: any) {
        console.error('Error applying discount:', error)
        throw new Error(error.message || 'Failed to apply discount')
      }
    },

    // Apply discount to multiple items (bulk)
    async applyBulkDiscount(folderId: string, itemIds: string[], discountType: 'percentage' | 'amount', discountValue: number) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to apply discounts')
      }

      // Check permissions - only super admins can apply discounts (all staff have view-only)
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      // Only super admins can apply discounts
      if (userStore.userData?.role === 'staff') {
        throw new Error('Only super admins can apply discounts. Staff have view-only access.')
      }

      try {
        const folderItems = this.items[folderId] || []
        const updates: Array<{ itemId: string; discountPercentage?: number; discountAmount?: number; originalPrice: number; discountedPrice: number }> = []

        // Calculate discounts for all items
        for (const itemId of itemIds) {
          const item = folderItems.find(i => i.id === itemId)
          if (!item) continue

          // Skip sold items
          if (item.dateOut) {
            const dateOutValue = item.dateOut
            const hasDateOut = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
            if (hasDateOut) continue
          }

          const originalPrice = item.originalPrice || this.getItemPrice(item)
          if (!originalPrice || originalPrice <= 0) continue

          let discountPercentage: number | undefined
          let discountAmount: number | undefined
          let discountedPrice: number

          if (discountType === 'percentage') {
            if (discountValue < 0 || discountValue > 100) continue
            discountPercentage = discountValue
            discountAmount = (originalPrice * discountValue) / 100
            discountedPrice = originalPrice - discountAmount
          } else {
            if (discountValue < 0 || discountValue > originalPrice) continue
            discountAmount = discountValue
            discountPercentage = (discountValue / originalPrice) * 100
            discountedPrice = originalPrice - discountAmount
          }

          updates.push({
            itemId,
            discountPercentage,
            discountAmount,
            originalPrice,
            discountedPrice: Math.round(discountedPrice * 100) / 100,
          })
        }

        // Get userId and storeId for hierarchical path
        const userId = authStore.currentUser.uid
        const storeId = await getCurrentStoreId()
        if (!storeId) {
          throw new Error('No store selected')
        }

        // Apply updates in batch
        const batch = updates.map(({ itemId, discountPercentage, discountAmount, originalPrice, discountedPrice }) => {
          // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryItems/{itemId}
          const itemRef = getInventoryItemDocument(db, userId, storeId, itemId)
          return updateDoc(itemRef, {
            discountPercentage,
            discountAmount,
            originalPrice,
            discountedPrice,
            updatedAt: serverTimestamp(),
          })
        })

        await Promise.all(batch)

        // Update local state
        updates.forEach(({ itemId, discountPercentage, discountAmount, originalPrice, discountedPrice }) => {
          const index = folderItems.findIndex(i => i.id === itemId)
          if (index > -1 && folderItems[index]) {
            folderItems[index].discountPercentage = discountPercentage
            folderItems[index].discountAmount = discountAmount
            folderItems[index].originalPrice = originalPrice
            folderItems[index].discountedPrice = discountedPrice
            folderItems[index].updatedAt = new Date()
          }
        })

        return updates.length
      } catch (error: any) {
        console.error('Error applying bulk discount:', error)
        throw new Error(error.message || 'Failed to apply bulk discount')
      }
    },

    // Remove discount from a single item
    async removeDiscount(folderId: string, itemId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to remove discounts')
      }

      // Check permissions - only super admins can remove discounts (all staff have view-only)
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      // Only super admins can remove discounts
      if (userStore.userData?.role === 'staff') {
        throw new Error('Only super admins can remove discounts. Staff have view-only access.')
      }

      try {
        // Check if item has been sold
        const folderItems = this.items[folderId] || []
        const item = folderItems.find(i => i.id === itemId)
        if (item) {
          if (item.dateOut) {
            const dateOutValue = item.dateOut
            const hasDateOut = dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
            if (hasDateOut) {
              throw new Error('Cannot remove discount from sold items')
            }
          }
        }

        // Get userId and storeId for hierarchical path
        const userId = authStore.currentUser.uid
        const storeId = await getCurrentStoreId()
        if (!storeId) {
          throw new Error('No store selected')
        }

        // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryItems/{itemId}
        const itemRef = getInventoryItemDocument(db, userId, storeId, itemId)
        await updateDoc(itemRef, {
          discountPercentage: deleteField(),
          discountAmount: deleteField(),
          discountedPrice: deleteField(),
          updatedAt: serverTimestamp(),
          // Keep originalPrice in case we want to restore discount later
        })

        // Update local state
        const index = folderItems.findIndex(i => i.id === itemId)
        if (index > -1 && folderItems[index]) {
          delete folderItems[index].discountPercentage
          delete folderItems[index].discountAmount
          delete folderItems[index].discountedPrice
          folderItems[index].updatedAt = new Date()
        }
      } catch (error: any) {
        console.error('Error removing discount:', error)
        throw new Error(error.message || 'Failed to remove discount')
      }
    },

    // Remove discount from multiple items (bulk)
    async removeBulkDiscount(folderId: string, itemIds: string[]) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to remove discounts')
      }

      // Check permissions - only super admins can remove discounts (all staff have view-only)
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      // Only super admins can remove discounts
      if (userStore.userData?.role === 'staff') {
        throw new Error('Only super admins can remove discounts. Staff have view-only access.')
      }

      // Get userId and storeId for hierarchical path
      const userId = authStore.currentUser.uid
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        throw new Error('No store selected')
      }

      try {
        const batch = itemIds.map(itemId => {
          // Use hierarchical path: users/{userId}/stores/{storeId}/inventoryItems/{itemId}
          const itemRef = getInventoryItemDocument(db, userId, storeId, itemId)
          return updateDoc(itemRef, {
            discountPercentage: deleteField(),
            discountAmount: deleteField(),
            discountedPrice: deleteField(),
            updatedAt: serverTimestamp(),
          })
        })

        await Promise.all(batch)

        // Update local state
        const folderItems = this.items[folderId] || []
        itemIds.forEach(itemId => {
          const index = folderItems.findIndex(i => i.id === itemId)
          if (index > -1 && folderItems[index]) {
            delete folderItems[index].discountPercentage
            delete folderItems[index].discountAmount
            delete folderItems[index].discountedPrice
            folderItems[index].updatedAt = new Date()
          }
        })
      } catch (error: any) {
        console.error('Error removing bulk discount:', error)
        throw new Error(error.message || 'Failed to remove bulk discount')
      }
    },
  },
})

