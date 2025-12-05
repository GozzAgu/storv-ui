import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { useStaffStore } from './staff'
import { useCustomersStore } from './customers'
import { useInventoryStore } from './inventory'
import { useNotificationsStore } from './notifications'

export interface ReceiptItem {
  itemId: string
  quantity: number
  price: number // Final price after discount (if any)
  itemName: string
  // Discount fields
  originalPrice?: number // Original price before discount
  discountPercentage?: number // Discount percentage applied
  discountAmount?: number // Discount amount applied
  hasDiscount?: boolean // Flag to indicate if discount was applied
}

export interface Receipt {
  id: string
  receiptNumber: string
  customerName: string
  customerEmail: string
  date: Date | any
  items: ReceiptItem[]
  itemsCount: number
  total: number
  paymentMethod: string
  status: 'completed' | 'pending' | 'refunded'
  notes?: string
  folderId: string
  itemIds: string[] // Array of inventory item IDs that were sold
  storeId: string // Store this receipt belongs to
  // Swap-in fields
  isSwapIn?: boolean // Indicates if this receipt includes a swap-in
  swapInFolderId?: string // Folder ID where swapped-in device is added
  swapInItemId?: string // Inventory item ID of the swapped-in device
  createdAt: Date | any
  updatedAt?: Date | any
  createdBy: string // Super admin UID (for fetching/ownership)
  actualCreator?: string // Actual creator's authUid (for display - staff member or super admin)
}

export const useReceiptsStore = defineStore('receipts', {
  state: () => ({
    receipts: [] as Receipt[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    totalReceipts: (state) => state.receipts.length,
    totalSales: (state) => state.receipts
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.total, 0),
    todaySales: (state) => {
      const today = new Date().toDateString()
      return state.receipts
        .filter(r => r.status === 'completed' && new Date(r.date).toDateString() === today)
        .reduce((sum, r) => sum + r.total, 0)
    },
    monthSales: (state) => {
      const now = new Date()
      return state.receipts
        .filter(r => {
          const receiptDate = new Date(r.date)
          return r.status === 'completed' &&
            receiptDate.getMonth() === now.getMonth() &&
            receiptDate.getFullYear() === now.getFullYear()
        })
        .reduce((sum, r) => sum + r.total, 0)
    },
  },

  actions: {
    // Fetch all receipts
    async fetchReceipts() {
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

      // Check if user is staff to determine which receipts to show
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
                console.log('[ReceiptsStore] Staff user detected, using super admin UID:', userId)
              }
            }
          }
        } catch (error: any) {
          console.warn('[ReceiptsStore] Could not fetch staff document, using current user UID:', error.message)
        }
      }

      try {
        const receiptsRef = collection(db, 'receipts')
        let querySnapshot

        try {
          // Filter by createdBy to only get receipts for this user (or super admin if staff)
          const q = query(
            receiptsRef,
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc')
          )
          querySnapshot = await getDocs(q)
        } catch (orderByError: any) {
          // If orderBy fails (missing index), try without orderBy
          if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
            // Check if warning was already shown for receipts
            // Handle case where other stores set it as boolean
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
            if (!warned.receipts) {
              const indexUrlMatch = orderByError.message?.match(/https:\/\/[^\s]+/)
              const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null
              console.warn('[ReceiptsStore] orderBy failed, retrying without orderBy. This is expected if indexes are not yet created.')
              if (indexUrl) {
                console.info('[ReceiptsStore] Create the index here:', indexUrl)
              }
              warned.receipts = true
            }
            
            const q = query(receiptsRef, where('createdBy', '==', userId))
            querySnapshot = await getDocs(q)
          } else {
            throw orderByError
          }
        }

        const receipts: Receipt[] = []
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          // Double-check that the receipt belongs to this user
          if (data.createdBy === userId) {
            receipts.push({
              id: docSnapshot.id,
              ...data,
              date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
              actualCreator: data.actualCreator || undefined,
            } as Receipt)
          }
        })

        // Sort by date (newest first) if orderBy failed
        receipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        this.receipts = receipts
      } catch (error: any) {
        console.error('Error fetching receipts:', error)
        this.error = error.message || 'Failed to fetch receipts'
      } finally {
        this.loading = false
      }
    },

    // Fetch a single receipt
    async fetchReceipt(receiptId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      try {
        const receiptRef = doc(db, 'receipts', receiptId)
        const receiptSnap = await getDoc(receiptRef)

        if (!receiptSnap.exists()) {
          throw new Error('Receipt not found')
        }

        const data = receiptSnap.data()
        
        // Verify ownership
        if (data.createdBy !== authStore.currentUser.uid) {
          throw new Error('Access denied')
        }

        return {
          id: receiptSnap.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
        } as Receipt
      } catch (error: any) {
        console.error('Error fetching receipt:', error)
        throw new Error(error.message || 'Failed to fetch receipt')
      }
    },

    // Create a new receipt
    async createReceipt(receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to create receipts')
      }

      const actualCreatorUid = authStore.currentUser.uid // Store actual creator for display

      // Check if user is staff to determine which UID to use for createdBy
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      let createdByUid = authStore.currentUser.uid

      // If the current user is staff, get the super admin UID from the staff document
      if (userStore.userData?.role === 'staff') {
        try {
          // Find the staff document for this user
          const staffRef = collection(db, 'staff')
          const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
          const staffSnapshot = await getDocs(staffQuery)

          if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
            const staffDoc = staffSnapshot.docs[0]
            if (staffDoc) {
              const staffData = staffDoc.data()
              // Use the super admin's UID who created this staff member
              if (staffData.createdBy) {
                createdByUid = staffData.createdBy
                console.log('[ReceiptsStore] Staff user detected, using super admin UID for receipt creation:', createdByUid)
              }
            }
          }
        } catch (error: any) {
          console.warn('[ReceiptsStore] Could not fetch staff document for receipt creation, using current user UID:', error.message)
        }
      }

      try {
        const receiptsRef = collection(db, 'receipts')
        const newReceiptRef = doc(receiptsRef)

        const now = new Date()
        
        // Build receipt object - only include actualCreator if it's different from createdBy
        const newReceipt: Omit<Receipt, 'id'> = {
          ...receiptData,
          date: receiptData.date || now,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: createdByUid,
          ...(actualCreatorUid !== createdByUid && { actualCreator: actualCreatorUid }), // Only include if different
        }

        await setDoc(newReceiptRef, newReceipt)

        // Add to local state
        const receiptForState: Receipt = {
          id: newReceiptRef.id,
          ...receiptData,
          date: receiptData.date || now,
          createdAt: now,
          updatedAt: now,
          createdBy: createdByUid,
          ...(actualCreatorUid !== createdByUid && { actualCreator: actualCreatorUid }), // Only include if different
        }

        this.receipts.unshift(receiptForState)

        // Create notification
        try {
          const notificationsStore = useNotificationsStore()
          const notificationType = receiptData.isSwapIn ? 'swap_in_completed' : 'receipt_created'
          const notificationTitle = receiptData.isSwapIn ? 'Swap-in Completed' : 'New Receipt Created'
          const notificationMessage = receiptData.isSwapIn
            ? `Swap-in receipt #${receiptData.receiptNumber} was created for ${receiptData.customerName}`
            : `Receipt #${receiptData.receiptNumber} was created for ${receiptData.customerName} - Total: $${receiptData.total.toFixed(2)}`

          await notificationsStore.createNotification(
            notificationType,
            notificationTitle,
            notificationMessage,
            { receiptId: newReceiptRef.id },
            actualCreatorUid
          )
        } catch (notifError: any) {
          console.warn('Failed to create notification for receipt:', notifError)
          // Don't fail receipt creation if notification fails
        }

        return newReceiptRef.id
      } catch (error: any) {
        console.error('Error creating receipt:', error)
        throw new Error(error.message || 'Failed to create receipt')
      }
    },

    // Update a receipt
    async updateReceipt(receiptId: string, updates: Partial<Omit<Receipt, 'id' | 'createdAt' | 'createdBy'>>) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
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
          throw new Error('Staff members do not have permission to update receipts. Only managers can edit.')
        }
      }

      try {
        // First verify the receipt belongs to this user
        const receiptRef = doc(db, 'receipts', receiptId)
        const receiptSnap = await getDoc(receiptRef)

        if (!receiptSnap.exists()) {
          throw new Error('Receipt not found')
        }

        const receiptData = receiptSnap.data()
        if (receiptData.createdBy !== authStore.currentUser.uid) {
          throw new Error('Access denied')
        }

        await updateDoc(receiptRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        })

        // Update local state
        const index = this.receipts.findIndex(r => r.id === receiptId)
        if (index > -1 && this.receipts[index]) {
          this.receipts[index] = {
            ...this.receipts[index],
            ...updates,
            updatedAt: new Date(),
          } as Receipt
        }
      } catch (error: any) {
        console.error('Error updating receipt:', error)
        throw new Error(error.message || 'Failed to update receipt')
      }
    },

    // Delete a receipt
    async deleteReceipt(receiptId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Check permissions - super admins and managers can delete
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      
      // Super admins can always delete
      if (userStore.userData?.role !== 'superAdmin') {
        // Staff (non-managers) cannot delete
        if (userStore.userData?.role === 'staff') {
          const staffStore = useStaffStore()
          const currentStaffMember = await staffStore.fetchCurrentStaffMember()
          if (currentStaffMember?.role !== 'manager') {
            throw new Error('Staff members do not have permission to delete receipts. Only managers and super admins can delete.')
          }
        }
      }

      try {
        // First verify the receipt belongs to this user
        const receiptRef = doc(db, 'receipts', receiptId)
        const receiptSnap = await getDoc(receiptRef)

        if (!receiptSnap.exists()) {
          throw new Error('Receipt not found')
        }

        const receiptData = receiptSnap.data()
        const receiptCreatedBy = receiptData.createdBy
        
        // Super admins can delete receipts they have access to (fetched receipts)
        // For staff/managers, only allow deletion if they created the receipt
        if (userStore.userData?.role === 'superAdmin') {
          // Super admins can delete any receipt (they already filter receipts by their UID when fetching)
          // The receipt must belong to their organization (handled by fetchReceipts filtering)
        } else if (receiptCreatedBy !== authStore.currentUser.uid) {
          // Non-super admins can only delete receipts they created
          throw new Error('Access denied: You can only delete receipts you created')
        }

        const receipt = receiptData as Receipt
        const itemIds = receipt.itemIds || []

        // 1. Return items to inventory (remove dateOut)
        if (itemIds.length > 0) {
          try {
            const inventoryStore = useInventoryStore()
            await inventoryStore.returnItemsToStock(itemIds)
          } catch (error: any) {
            console.error('[ReceiptsStore] Error returning items to stock:', error)
            // Continue with deletion even if returning items fails
          }
        }

        // 2. Update or delete customer
        try {
          const customersStore = useCustomersStore()
          await customersStore.removeReceiptFromCustomer(receiptId, receipt.total || 0)
        } catch (error: any) {
          console.error('[ReceiptsStore] Error removing receipt from customer:', error)
          // Continue with deletion even if customer update fails
        }

        // 3. Delete the receipt
        await deleteDoc(receiptRef)

        // Remove from local state
        this.receipts = this.receipts.filter(r => r.id !== receiptId)
      } catch (error: any) {
        console.error('Error deleting receipt:', error)
        throw new Error(error.message || 'Failed to delete receipt')
      }
    },
  },
})

