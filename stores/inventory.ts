import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { useStaffStore } from './staff'

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
  createdAt: Date | any
  updatedAt?: Date | any
  createdBy: string
}

export interface InventoryItem {
  id: string
  folderId: string
  [key: string]: any // Dynamic fields based on template
  dateIn?: Date | string // Date when item was added (from createdAt)
  dateOut?: Date | string // Date when item was sold (from receipt generation)
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

            if (!(window as any).__firestoreIndexWarned?.inventoryFolders) {
              console.warn('[InventoryStore] orderBy failed, retrying without orderBy:', orderByError.message)
              if (indexUrl) {
                console.info('[InventoryStore] Create the index here:', indexUrl)
              }
              if (!(window as any).__firestoreIndexWarned) {
                (window as any).__firestoreIndexWarned = {}
              }
              ;(window as any).__firestoreIndexWarned.inventoryFolders = true
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

        this.folders = querySnapshot.docs.map((doc) => {
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
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt) || undefined,
            createdBy: data.createdBy || userId,
          } as InventoryFolder
        })

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
        
        // Verify ownership
        if (data.createdBy !== authStore.currentUser.uid) {
          // Check if user is staff and folder belongs to their super admin
          const userStore = useUserStore()
          if (userStore.userData?.role === 'staff') {
            const staffRef = collection(db, 'staff')
            const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
            const staffSnapshot = await getDocs(staffQuery)
            
            if (!staffSnapshot.empty && staffSnapshot.docs[0]) {
              const staffData = staffSnapshot.docs[0].data()
              if (staffData.createdBy !== data.createdBy) {
                throw new Error('Folder not found')
              }
            } else {
              throw new Error('Folder not found')
            }
          } else {
            throw new Error('Folder not found')
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
        } as InventoryFolder
      } catch (error: any) {
        console.error('Error fetching folder:', error)
        throw new Error(error.message || 'Failed to fetch folder')
      }
    },

    // Create a new inventory folder
    async createFolder(folderData: Omit<InventoryFolder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'itemCount' | 'totalValue' | 'lowStockCount'>): Promise<string> {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to create folders')
      }

      try {
        const foldersRef = collection(db, 'inventoryFolders')
        const newFolderRef = doc(foldersRef)

        const newFolder: Omit<InventoryFolder, 'id'> = {
          ...folderData,
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

      // If the current user is staff, get the super admin UID from the staff document
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
            }
          }
        } catch (error: any) {
          console.warn('[InventoryStore] Could not fetch staff document for items, using current user UID:', error.message)
        }
      }

      this.itemsLoading[folderId] = true

      try {
        const itemsRef = collection(db, 'inventoryItems')
        const q = query(
          itemsRef,
          where('folderId', '==', folderId),
          where('createdBy', '==', userId),
          orderBy('createdAt', 'desc')
        )

        const querySnapshot = await getDocs(q)

        const fetchedItems: InventoryItem[] = querySnapshot.docs.map((doc) => {
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
          try {
            const itemsRef = collection(db, 'inventoryItems')
            const q = query(
              itemsRef,
              where('folderId', '==', folderId),
              where('createdBy', '==', userId)
            )

            const querySnapshot = await getDocs(q)
            const fetchedItems: InventoryItem[] = querySnapshot.docs.map((doc) => {
              const data = doc.data()
              return {
                id: doc.id,
                folderId: data.folderId || folderId,
                ...Object.fromEntries(
                  Object.entries(data).filter(([key]) => 
                    !['folderId', 'createdAt', 'updatedAt', 'createdBy'].includes(key)
                  )
                ),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) || new Date(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt) || undefined,
                createdBy: data.createdBy || userId,
              } as InventoryItem
            })

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

      try {
        const itemsRef = collection(db, 'inventoryItems')
        const newItemRef = doc(itemsRef)

        const now = new Date()
        const newItem: Omit<InventoryItem, 'id'> = {
          ...itemData,
          folderId,
          dateIn: now, // Set dateIn from createdAt
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: authStore.currentUser.uid,
        }

        await setDoc(newItemRef, newItem)

        // Add to local state
        const itemForState: InventoryItem = {
          id: newItemRef.id,
          ...itemData,
          folderId,
          dateIn: now, // Set dateIn from createdAt
          createdAt: now,
          updatedAt: now,
          createdBy: authStore.currentUser.uid,
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
          throw new Error('Staff members do not have permission to update items. Only managers can edit.')
        }
      }

      try {
        const itemRef = doc(db, 'inventoryItems', itemId)
        await updateDoc(itemRef, {
          ...updates,
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
          throw new Error('Staff members do not have permission to delete items. Only managers can delete.')
        }
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
  },
})

