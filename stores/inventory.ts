import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, deleteField } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { useStaffStore } from './staff'
import { getCurrentStoreId } from '~/composables/useCurrentStore'

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

      let userId = authStore.currentUser.uid

      // If the current user is staff, get the super admin UID from the staff document
      if (userStore.userData?.role === 'staff') {
        try {
          const staffRef = collection(db, 'staff')
          const staffQuery = query(staffRef, where('authUid', '==', userId))
          const staffSnapshot = await getDocs(staffQuery)

          if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
            const staffDoc = staffSnapshot.docs[0]
            if (staffDoc) {
              const staffData = staffDoc.data()
              if (staffData.createdBy) {
                userId = staffData.createdBy
              }
            }
          }
        } catch (error: any) {
          console.warn('[InventoryStore] Could not fetch staff document, using current user UID:', error.message)
        }
      }

      try {
        const foldersRef = collection(db, 'inventoryFolders')
        let querySnapshot

        try {
          // Filter by createdBy to only get folders for this user
          const q = query(
            foldersRef,
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc')
          )
          querySnapshot = await getDocs(q)
        } catch (orderByError: any) {
          // If orderBy fails (missing index), try without orderBy
          if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
            const indexUrlMatch = orderByError.message?.match(/https:\/\/[^\s]+/)
            const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null

            // Check if warning was already shown for inventoryFolders
            // Handle case where other stores (departments) set it as boolean
            let warned = (window as any).__firestoreIndexWarned
            
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
            
            if (!warned.inventoryFolders) {
              console.warn('[InventoryStore] orderBy failed for folders, retrying without orderBy. This is expected if indexes are not yet created.')
              if (indexUrl) {
                console.info('[InventoryStore] Create the index here:', indexUrl)
              }
              warned.inventoryFolders = true
            }

            // Retry without orderBy
            const q = query(
              foldersRef,
              where('createdBy', '==', userId)
            )
            querySnapshot = await getDocs(q)
          } else {
            throw orderByError
          }
        }

        // Get current store ID to filter folders
        const currentStoreId = await getCurrentStoreId()

        let folders = querySnapshot.docs.map((doc) => {
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

        // Filter folders by current store ID
        if (currentStoreId) {
          folders = folders.filter(folder => folder.storeId === currentStoreId)
        }

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

      try {
        const folderRef = doc(db, 'inventoryFolders', folderId)
        const folderSnap = await getDoc(folderRef)

        if (!folderSnap.exists()) {
          return null
        }

        const data = folderSnap.data()
        
        // Check if user is staff to verify department access
        const userStore = useUserStore()
        if (!userStore.userData) {
          await userStore.fetchUserData(authStore.currentUser.uid)
        }

        // Verify ownership or department access
        if (data.createdBy !== authStore.currentUser.uid) {
          // Check if user is staff and folder belongs to their super admin
          if (userStore.userData?.role === 'staff') {
            const staffRef = collection(db, 'staff')
            const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
            const staffSnapshot = await getDocs(staffQuery)
            
            if (!staffSnapshot.empty && staffSnapshot.docs[0]) {
              const staffData = staffSnapshot.docs[0].data()
              // Check if folder belongs to super admin
              if (staffData.createdBy !== data.createdBy) {
                throw new Error('Folder not found')
              }
              
              // Check department access
              const allowedDepartments = data.allowedDepartments || []
              if (allowedDepartments.length > 0) {
                const staffDepartmentId = staffData.departmentId
                if (!staffDepartmentId || !allowedDepartments.includes(staffDepartmentId)) {
                  throw new Error('Access denied: Your department does not have access to this folder')
                }
              }
            } else {
              throw new Error('Folder not found')
            }
          } else {
            throw new Error('Folder not found')
          }
        } else if (userStore.userData?.role === 'staff') {
          // Even if created by super admin, check department access for staff
          const staffRef = collection(db, 'staff')
          const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
          const staffSnapshot = await getDocs(staffQuery)
          
          if (!staffSnapshot.empty && staffSnapshot.docs[0]) {
            const staffData = staffSnapshot.docs[0].data()
            const allowedDepartments = data.allowedDepartments || []
            if (allowedDepartments.length > 0) {
              const staffDepartmentId = staffData.departmentId
              if (!staffDepartmentId || !allowedDepartments.includes(staffDepartmentId)) {
                throw new Error('Access denied: Your department does not have access to this folder')
              }
            }
          }
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
        const foldersRef = collection(db, 'inventoryFolders')
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
        const folderRef = doc(db, 'inventoryFolders', folderId)
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
        const folderRef = doc(db, 'inventoryFolders', folderId)
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

      let userId = authStore.currentUser.uid
      let staffDepartmentId: string | undefined

      // If the current user is staff, get the super admin UID from the staff document and department ID
      if (userStore.userData?.role === 'staff') {
        try {
          // Find the staff document for this user
          const staffRef = collection(db, 'staff')
          const staffQuery = query(staffRef, where('authUid', '==', userId))
          const staffSnapshot = await getDocs(staffQuery)

          if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
            const staffDoc = staffSnapshot.docs[0]
            if (staffDoc) {
              const staffData = staffDoc.data()
              // Use the super admin's UID who created this staff member
              if (staffData.createdBy) {
                userId = staffData.createdBy
                console.log('[InventoryStore] Staff user detected, using super admin UID for fetchItems:', userId)
              }
              // Get department ID for access check
              staffDepartmentId = staffData.departmentId
            }
          }
        } catch (error: any) {
          console.warn('[InventoryStore] Could not fetch staff document for items, using current user UID:', error.message)
        }

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
      }

      this.itemsLoading[folderId] = true

      try {
        const itemsRef = collection(db, 'inventoryItems')
        
        // For staff: Query all items in folder (then filter client-side)
        // For super admin: Query with createdBy filter
        let q
        if (userStore.userData?.role === 'staff') {
          // Staff: Query all items in folder - Firestore rules allow authenticated reads
          q = query(
            itemsRef,
            where('folderId', '==', folderId)
          )
        } else {
          // Super admin: Normal query with createdBy filter
          q = query(
            itemsRef,
            where('folderId', '==', folderId),
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc')
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
                !['folderId', 'createdAt', 'updatedAt', 'createdBy', 'dateIn', 'dateOut'].includes(key)
              )
            ),
            dateIn: data.dateIn?.toDate ? data.dateIn.toDate() : (data.dateIn ? new Date(data.dateIn) : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date())),
            dateOut: data.dateOut?.toDate ? data.dateOut.toDate() : (data.dateOut ? new Date(data.dateOut) : undefined),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt) || undefined,
            createdBy: data.createdBy || userId,
          } as InventoryItem
        })

        // For staff: Filter items to only show those created by their super admin
        if (userStore.userData?.role === 'staff') {
          fetchedItems = fetchedItems.filter(item => item.createdBy === userId)
        }

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
            const itemsRef = collection(db, 'inventoryItems')
            
            // For staff: Query all items in folder (then filter client-side)
            // For super admin: Query with createdBy filter
            let q
            if (userStore.userData?.role === 'staff') {
              // Staff: Query all items in folder
              q = query(
                itemsRef,
                where('folderId', '==', folderId)
              )
            } else {
              // Super admin: Query with createdBy filter
              q = query(
                itemsRef,
                where('folderId', '==', folderId),
                where('createdBy', '==', userId)
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
                createdBy: data.createdBy || userId,
              } as InventoryItem
            })

            // For staff: Filter items to only show those created by their super admin
            if (userStore.userData?.role === 'staff') {
              fetchedItems = fetchedItems.filter(item => item.createdBy === userId)
            }

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

      try {
        const itemsRef = collection(db, 'inventoryItems')
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

        // Update folder item count
        await this.updateItemCount(folderId)

        return newItemRef.id
      } catch (error: any) {
        console.error('Error creating item:', error)
        throw new Error(error.message || 'Failed to create item')
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

      try {
        const itemRef = doc(db, 'inventoryItems', itemId)
        
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

      try {
        const itemRef = doc(db, 'inventoryItems', itemId)
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

      try {
        // Get actual count from items
        const actualCount = this.items[folderId]?.length || 0

        // Update folder in Firestore
        const folderRef = doc(db, 'inventoryFolders', folderId)
        await updateDoc(folderRef, {
          itemCount: actualCount,
          updatedAt: serverTimestamp(),
        })

        // Update in local state
        const index = this.folders.findIndex(f => f.id === folderId)
        if (index > -1 && this.folders[index]) {
          this.folders[index].itemCount = actualCount
        }
      } catch (error: any) {
        console.error('Error updating item count:', error)
        // Don't throw error, just log it - we don't want to break item creation/deletion
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

      try {
        const now = new Date()
        const batch = itemIds.map(itemId => {
          const itemRef = doc(db, 'inventoryItems', itemId)
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

      try {
        const batch = itemIds.map(itemId => {
          const itemRef = doc(db, 'inventoryItems', itemId)
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

        // Update item in Firestore
        const itemRef = doc(db, 'inventoryItems', itemId)
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

        // Apply updates in batch
        const batch = updates.map(({ itemId, discountPercentage, discountAmount, originalPrice, discountedPrice }) => {
          const itemRef = doc(db, 'inventoryItems', itemId)
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

        const itemRef = doc(db, 'inventoryItems', itemId)
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

      try {
        const batch = itemIds.map(itemId => {
          const itemRef = doc(db, 'inventoryItems', itemId)
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

