import { defineStore } from 'pinia'
import { CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { useStaffStore } from './staff'
import { getCustomersCollection, getCustomerDocument } from '~/composables/useFirestorePaths'

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  totalOrders: number
  totalSpent: number
  receipts: string[] // Array of receipt IDs
  storeId: string // Store this customer belongs to
  lastOrderDate: Date | any
  firstOrderDate: Date | any
  createdAt: Date | any
  updatedAt?: Date | any
  createdBy: string
}

export const useCustomersStore = defineStore('customers', {
  state: () => ({
    customers: [] as Customer[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    totalCustomers: (state) => state.customers.length,
    totalRevenue: (state) => state.customers.reduce((sum, c) => sum + c.totalSpent, 0),
  },

  actions: {
    // Find customer by email, phone, or address
    async findCustomerByContact(
      email?: string,
      phone?: string,
      address?: string
    ): Promise<Customer | null> {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const nameMatch = this.customers.find((c) => {
          if (phone && c.phone === phone) return true
          if (email && c.email?.toLowerCase() === email.toLowerCase().trim()) return true
          return false
        })
        return nameMatch ?? null
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        return null
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        return null
      }

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      const { getQueryUserId } = await import('~/composables/useFirestorePaths')
      const resolvedOwner = await getQueryUserId()
      const userId = resolvedOwner ?? authStore.currentUser.uid

      try {
        // Get storeId for hierarchical path - we need to search across all stores for the superadmin
        // For now, we'll search in the current store, but this might need adjustment
        const currentStoreId = await getCurrentStoreId()
        if (!currentStoreId) {
          return null
        }

        const customersRef = getCustomersCollection(db, userId, currentStoreId)
        const conditions: any[] = [where('createdBy', '==', userId)]

        // Build query conditions
        if (email) {
          const emailQuery = query(
            customersRef,
            ...conditions,
            where('email', '==', email.toLowerCase().trim())
          )
          const emailSnapshot = await getDocs(emailQuery)
          if (!emailSnapshot.empty) {
            const doc = emailSnapshot.docs[0]
            if (doc) {
              const data = doc.data()
              return {
                id: doc.id,
                ...data,
                lastOrderDate: data.lastOrderDate?.toDate
                  ? data.lastOrderDate.toDate()
                  : new Date(data.lastOrderDate),
                firstOrderDate: data.firstOrderDate?.toDate
                  ? data.firstOrderDate.toDate()
                  : new Date(data.firstOrderDate),
                createdAt: data.createdAt?.toDate
                  ? data.createdAt.toDate()
                  : new Date(data.createdAt),
                updatedAt: data.updatedAt?.toDate
                  ? data.updatedAt.toDate()
                  : data.updatedAt
                  ? new Date(data.updatedAt)
                  : undefined,
              } as Customer
            }
          }
        }

        if (phone) {
          const phoneQuery = query(customersRef, ...conditions, where('phone', '==', phone.trim()))
          const phoneSnapshot = await getDocs(phoneQuery)
          if (!phoneSnapshot.empty) {
            const doc = phoneSnapshot.docs[0]
            if (doc) {
              const data = doc.data()
              return {
                id: doc.id,
                ...data,
                lastOrderDate: data.lastOrderDate?.toDate
                  ? data.lastOrderDate.toDate()
                  : new Date(data.lastOrderDate),
                firstOrderDate: data.firstOrderDate?.toDate
                  ? data.firstOrderDate.toDate()
                  : new Date(data.firstOrderDate),
                createdAt: data.createdAt?.toDate
                  ? data.createdAt.toDate()
                  : new Date(data.createdAt),
                updatedAt: data.updatedAt?.toDate
                  ? data.updatedAt.toDate()
                  : data.updatedAt
                  ? new Date(data.updatedAt)
                  : undefined,
              } as Customer
            }
          }
        }

        if (address) {
          const addressQuery = query(
            customersRef,
            ...conditions,
            where('address', '==', address.trim())
          )
          const addressSnapshot = await getDocs(addressQuery)
          if (!addressSnapshot.empty) {
            const doc = addressSnapshot.docs[0]
            if (doc) {
              const data = doc.data()
              return {
                id: doc.id,
                ...data,
                lastOrderDate: data.lastOrderDate?.toDate
                  ? data.lastOrderDate.toDate()
                  : new Date(data.lastOrderDate),
                firstOrderDate: data.firstOrderDate?.toDate
                  ? data.firstOrderDate.toDate()
                  : new Date(data.firstOrderDate),
                createdAt: data.createdAt?.toDate
                  ? data.createdAt.toDate()
                  : new Date(data.createdAt),
                updatedAt: data.updatedAt?.toDate
                  ? data.updatedAt.toDate()
                  : data.updatedAt
                  ? new Date(data.updatedAt)
                  : undefined,
              } as Customer
            }
          }
        }

        return null
      } catch (error: any) {
        console.error('[CustomersStore] Error finding customer:', error)
        return null
      }
    },

    // Create or update customer when receipt is created
    async createOrUpdateCustomerFromReceipt(
      receiptId: string,
      receiptData: {
        customerName: string
        customerEmail?: string
        customerPhone?: string
        customerAddress?: string
        total: number
        date: Date
      }
    ): Promise<string> {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { applyDemoCustomerFromReceipt } = await import('~/utils/demo-bridge')
        return applyDemoCustomerFromReceipt(receiptId, {
          customerName: receiptData.customerName,
          customerEmail: receiptData.customerEmail,
          customerPhone: receiptData.customerPhone,
          total: receiptData.total,
        })
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      const { getQueryUserId } = await import('~/composables/useFirestorePaths')
      const resolvedOwner = await getQueryUserId()
      const userId = resolvedOwner ?? authStore.currentUser.uid

      try {
        // Try to find existing customer
        const existingCustomer = await this.findCustomerByContact(
          receiptData.customerEmail,
          receiptData.customerPhone,
          receiptData.customerAddress
        )

        const now = new Date()
        const orderDate =
          receiptData.date instanceof Date ? receiptData.date : new Date(receiptData.date)

        if (existingCustomer) {
          // Update existing customer
          // Get storeId for hierarchical path
          const storeId = await getCurrentStoreId()
          if (!storeId) {
            throw new Error('No store selected')
          }

          // Use hierarchical path: users/{userId}/stores/{storeId}/customers/{customerId}
          const customerRef = getCustomerDocument(db, userId, storeId, existingCustomer.id)
          await updateDoc(customerRef, {
            name: receiptData.customerName, // Update name in case it changed
            email: receiptData.customerEmail || existingCustomer.email,
            phone: receiptData.customerPhone || existingCustomer.phone,
            address: receiptData.customerAddress || existingCustomer.address,
            totalOrders: existingCustomer.totalOrders + 1,
            totalSpent: existingCustomer.totalSpent + receiptData.total,
            receipts: arrayUnion(receiptId),
            lastOrderDate:
              orderDate > existingCustomer.lastOrderDate
                ? orderDate
                : existingCustomer.lastOrderDate,
            updatedAt: serverTimestamp(),
          })

          // Update local state
          const index = this.customers.findIndex((c) => c.id === existingCustomer.id)
          if (index > -1 && this.customers[index]) {
            const existing = this.customers[index]
            this.customers[index] = {
              ...existing,
              name: receiptData.customerName,
              email: receiptData.customerEmail || existing.email,
              phone: receiptData.customerPhone || existing.phone,
              address: receiptData.customerAddress || existing.address,
              totalOrders: existing.totalOrders + 1,
              totalSpent: existing.totalSpent + receiptData.total,
              receipts: [...existing.receipts, receiptId],
              lastOrderDate:
                orderDate > existing.lastOrderDate ? orderDate : existing.lastOrderDate,
              updatedAt: now,
            }
          }

          return existingCustomer.id
        } else {
          // Get storeId for hierarchical path
          const storeId = await getCurrentStoreId()
          if (!storeId) {
            throw new Error('No store selected')
          }

          // Create new customer
          // Use hierarchical path: users/{userId}/stores/{storeId}/customers
          const customersRef = getCustomersCollection(db, userId, storeId)
          const newCustomerRef = doc(customersRef)

          const newCustomer: Omit<Customer, 'id'> = {
            name: receiptData.customerName,
            email: receiptData.customerEmail?.toLowerCase().trim(),
            phone: receiptData.customerPhone?.trim(),
            address: receiptData.customerAddress?.trim(),
            totalOrders: 1,
            totalSpent: receiptData.total,
            receipts: [receiptId],
            storeId: storeId, // Add storeId
            lastOrderDate: orderDate,
            firstOrderDate: orderDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: userId,
          }

          await setDoc(newCustomerRef, newCustomer)

          // Add to local state
          const customerForState: Customer = {
            id: newCustomerRef.id,
            ...newCustomer,
            lastOrderDate: orderDate,
            firstOrderDate: orderDate,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
          }

          this.customers.push(customerForState)

          return newCustomerRef.id
        }
      } catch (error: any) {
        console.error('[CustomersStore] Error creating/updating customer:', error)
        throw new Error(error.message || 'Failed to create/update customer')
      }
    },

    // Fetch all customers
    async fetchCustomers() {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { syncDemoToPinia } = await import('~/utils/demo-bridge')
        this.loading = true
        await syncDemoToPinia()
        this.loading = false
        return
      }

      this.loading = true
      this.error = null

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        this.error = CLOUD_UNAVAILABLE_MESSAGE
        this.loading = false
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        this.error = 'User must be authenticated'
        this.loading = false
        return
      }

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      const { getQueryUserId } = await import('~/composables/useFirestorePaths')
      const resolvedOwner = await getQueryUserId()
      const userId = resolvedOwner ?? authStore.currentUser.uid

      // Get current store ID to filter customers
      const { getCurrentStoreId } = await import('~/composables/useCurrentStore')
      const storeId = await getCurrentStoreId()

      // console.log('[CustomersStore] fetchCustomers - userId (store owner):', userId, 'storeId:', storeId, 'isStaff:', userStore.userData?.role === 'staff')

      if (!storeId) {
        this.error = 'No store selected. Please select a store first.'
        this.loading = false
        return
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/customers
        const customersRef = getCustomersCollection(db, userId, storeId)
        let querySnapshot

        // For staff: Get all customers in store (no createdBy filter) - they see customers from anyone in their store
        // For superadmin: Filter by createdBy
        const isStaff = userStore.userData?.role === 'staff'

        try {
          if (isStaff) {
            // Staff sees all customers in store
            const q = query(customersRef, orderBy('lastOrderDate', 'desc'))
            querySnapshot = await getDocs(q)
          } else {
            // Superadmin sees only their customers
            const q = query(
              customersRef,
              where('createdBy', '==', userId),
              orderBy('lastOrderDate', 'desc')
            )
            querySnapshot = await getDocs(q)
          }
        } catch (orderByError: any) {
          // If orderBy fails (missing index), try without orderBy
          if (
            orderByError.code === 'failed-precondition' ||
            orderByError.message?.includes('index')
          ) {
            if (isStaff) {
              // Staff sees all customers in store
              querySnapshot = await getDocs(customersRef)
            } else {
              // Superadmin sees only their customers
              const q = query(customersRef, where('createdBy', '==', userId))
              querySnapshot = await getDocs(q)
            }
          } else {
            throw orderByError
          }
        }

        const allCustomers = querySnapshot.docs
        // console.log('[CustomersStore] Found', allCustomers.length, 'customers in store (userId:', userId, 'storeId:', storeId + ')')

        // Process and filter customers
        let customers = allCustomers.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            totalOrders: data.totalOrders || 0,
            totalSpent: data.totalSpent || 0,
            receipts: data.receipts || [],
            storeId: data.storeId || '',
            lastOrderDate: data.lastOrderDate?.toDate
              ? data.lastOrderDate.toDate()
              : new Date(data.lastOrderDate),
            firstOrderDate: data.firstOrderDate?.toDate
              ? data.firstOrderDate.toDate()
              : new Date(data.firstOrderDate),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate
              ? data.updatedAt.toDate()
              : data.updatedAt
              ? new Date(data.updatedAt)
              : undefined,
            createdBy: data.createdBy || userId,
          } as Customer
        })

        // No need to filter by storeId since we're already querying from the store's subcollection
        // All customers returned are already in the correct store

        // Sort customers by lastOrderDate (newest first)
        customers.sort((a, b) => {
          const dateA =
            a.lastOrderDate instanceof Date
              ? a.lastOrderDate.getTime()
              : new Date(a.lastOrderDate).getTime()
          const dateB =
            b.lastOrderDate instanceof Date
              ? b.lastOrderDate.getTime()
              : new Date(b.lastOrderDate).getTime()
          return dateB - dateA
        })

        this.customers = customers
      } catch (error: any) {
        console.error('[CustomersStore] Error fetching customers:', error)
        this.error = error.message || 'Failed to fetch customers'
      } finally {
        this.loading = false
      }
    },

    // Remove receipt from customer or delete customer when receipt is deleted
    async removeReceiptFromCustomer(receiptId: string, receiptTotal: number) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      const { getQueryUserId } = await import('~/composables/useFirestorePaths')
      const resolvedOwner = await getQueryUserId()
      const userId = resolvedOwner ?? authStore.currentUser.uid

      try {
        // Get storeId for hierarchical path
        const storeId = await getCurrentStoreId()
        if (!storeId) {
          throw new Error('No store selected')
        }

        // Find customer that has this receipt
        // Use hierarchical path: users/{userId}/stores/{storeId}/customers
        const customersRef = getCustomersCollection(db, userId, storeId)
        const q = query(
          customersRef,
          where('createdBy', '==', userId),
          where('receipts', 'array-contains', receiptId)
        )

        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          console.warn(`[CustomersStore] No customer found with receipt ${receiptId}`)
          return
        }

        const customerDoc = querySnapshot.docs[0]
        if (!customerDoc) {
          console.warn(`[CustomersStore] Customer document not found for receipt ${receiptId}`)
          return
        }

        const customerData = customerDoc.data()

        // If customer has only one receipt, delete the customer
        if (customerData.receipts && customerData.receipts.length === 1) {
          // Use hierarchical path: users/{userId}/stores/{storeId}/customers/{customerId}
          const customerRef = getCustomerDocument(db, userId, storeId, customerDoc.id)
          await deleteDoc(customerRef)

          // Remove from local state
          this.customers = this.customers.filter((c) => c.id !== customerDoc.id)
        } else {
          // Update customer: remove receipt, decrement orders, subtract total
          const updatedReceipts = (customerData.receipts || []).filter(
            (r: string) => r !== receiptId
          )
          const updatedTotalOrders = Math.max(0, (customerData.totalOrders || 1) - 1)
          const updatedTotalSpent = Math.max(
            0,
            (customerData.totalSpent || receiptTotal) - receiptTotal
          )

          // Use hierarchical path: users/{userId}/stores/{storeId}/customers/{customerId}
          const customerRef = getCustomerDocument(db, userId, storeId, customerDoc.id)
          await updateDoc(customerRef, {
            receipts: updatedReceipts,
            totalOrders: updatedTotalOrders,
            totalSpent: updatedTotalSpent,
            updatedAt: serverTimestamp(),
          })

          // Update local state
          const index = this.customers.findIndex((c) => c.id === customerDoc.id)
          if (index > -1 && this.customers[index]) {
            this.customers[index].receipts = updatedReceipts
            this.customers[index].totalOrders = updatedTotalOrders
            this.customers[index].totalSpent = updatedTotalSpent
            this.customers[index].updatedAt = new Date()
          }
        }
      } catch (error: any) {
        console.error('[CustomersStore] Error removing receipt from customer:', error)
        throw new Error(error.message || 'Failed to remove receipt from customer')
      }
    },
  },
})
