import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, arrayUnion } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { useStaffStore } from './staff'

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
    async findCustomerByContact(email?: string, phone?: string, address?: string): Promise<Customer | null> {
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

      let userId = authStore.currentUser.uid

      // If the current user is staff, get the super admin UID
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
          console.warn('[CustomersStore] Could not fetch staff document:', error.message)
        }
      }

      try {
        const customersRef = collection(db, 'customers')
        const conditions: any[] = [where('createdBy', '==', userId)]

        // Build query conditions
        if (email) {
          const emailQuery = query(customersRef, ...conditions, where('email', '==', email.toLowerCase().trim()))
          const emailSnapshot = await getDocs(emailQuery)
          if (!emailSnapshot.empty) {
            const doc = emailSnapshot.docs[0]
            if (doc) {
              const data = doc.data()
              return {
                id: doc.id,
                ...data,
                lastOrderDate: data.lastOrderDate?.toDate ? data.lastOrderDate.toDate() : new Date(data.lastOrderDate),
                firstOrderDate: data.firstOrderDate?.toDate ? data.firstOrderDate.toDate() : new Date(data.firstOrderDate),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
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
                lastOrderDate: data.lastOrderDate?.toDate ? data.lastOrderDate.toDate() : new Date(data.lastOrderDate),
                firstOrderDate: data.firstOrderDate?.toDate ? data.firstOrderDate.toDate() : new Date(data.firstOrderDate),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
              } as Customer
            }
          }
        }

        if (address) {
          const addressQuery = query(customersRef, ...conditions, where('address', '==', address.trim()))
          const addressSnapshot = await getDocs(addressQuery)
          if (!addressSnapshot.empty) {
            const doc = addressSnapshot.docs[0]
            if (doc) {
              const data = doc.data()
              return {
                id: doc.id,
                ...data,
                lastOrderDate: data.lastOrderDate?.toDate ? data.lastOrderDate.toDate() : new Date(data.lastOrderDate),
                firstOrderDate: data.firstOrderDate?.toDate ? data.firstOrderDate.toDate() : new Date(data.firstOrderDate),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
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
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      let userId = authStore.currentUser.uid

      // If the current user is staff, get the super admin UID
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
          console.warn('[CustomersStore] Could not fetch staff document:', error.message)
        }
      }

      try {
        // Try to find existing customer
        const existingCustomer = await this.findCustomerByContact(
          receiptData.customerEmail,
          receiptData.customerPhone,
          receiptData.customerAddress
        )

        const now = new Date()
        const orderDate = receiptData.date instanceof Date ? receiptData.date : new Date(receiptData.date)

        if (existingCustomer) {
          // Update existing customer
          const customerRef = doc(db, 'customers', existingCustomer.id)
          await updateDoc(customerRef, {
            name: receiptData.customerName, // Update name in case it changed
            email: receiptData.customerEmail || existingCustomer.email,
            phone: receiptData.customerPhone || existingCustomer.phone,
            address: receiptData.customerAddress || existingCustomer.address,
            totalOrders: existingCustomer.totalOrders + 1,
            totalSpent: existingCustomer.totalSpent + receiptData.total,
            receipts: arrayUnion(receiptId),
            lastOrderDate: orderDate > existingCustomer.lastOrderDate ? orderDate : existingCustomer.lastOrderDate,
            updatedAt: serverTimestamp(),
          })

          // Update local state
          const index = this.customers.findIndex(c => c.id === existingCustomer.id)
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
              lastOrderDate: orderDate > existing.lastOrderDate ? orderDate : existing.lastOrderDate,
              updatedAt: now,
            }
          }

          return existingCustomer.id
        } else {
          // Create new customer
          const customersRef = collection(db, 'customers')
          const newCustomerRef = doc(customersRef)

          const newCustomer: Omit<Customer, 'id'> = {
            name: receiptData.customerName,
            email: receiptData.customerEmail?.toLowerCase().trim(),
            phone: receiptData.customerPhone?.trim(),
            address: receiptData.customerAddress?.trim(),
            totalOrders: 1,
            totalSpent: receiptData.total,
            receipts: [receiptId],
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

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      let userId = authStore.currentUser.uid

      // If the current user is staff, get the super admin UID
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
          console.warn('[CustomersStore] Could not fetch staff document:', error.message)
        }
      }

      // Get current store ID to filter customers
      const { getCurrentStoreId } = await import('~/composables/useCurrentStore')
      const storeId = await getCurrentStoreId()
      
      console.log('[CustomersStore] fetchCustomers - userId:', userId, 'storeId:', storeId, 'isStaff:', userStore.userData?.role === 'staff')

      try {
        const customersRef = collection(db, 'customers')
        let allCustomers: any[] = []

        // Query ALL customers created by superadmin first, then filter by storeId client-side
        // This ensures we don't miss any data due to storeId mismatches
        try {
          // Query all customers created by the superadmin (without storeId filter)
          const qAll = query(
            customersRef,
            where('createdBy', '==', userId)
          )
          const snapshotAll = await getDocs(qAll)
          allCustomers = snapshotAll.docs
          console.log('[CustomersStore] Found', allCustomers.length, 'total customers created by superadmin (userId:', userId + ')')
        } catch (error: any) {
          console.error('[CustomersStore] Error querying customers:', error.message)
          // If the basic query fails, try with orderBy as fallback
          try {
            const qWithOrder = query(
              customersRef,
              where('createdBy', '==', userId),
              orderBy('lastOrderDate', 'desc')
            )
            const snapshotWithOrder = await getDocs(qWithOrder)
            allCustomers = snapshotWithOrder.docs
            console.log('[CustomersStore] Found', allCustomers.length, 'customers with orderBy fallback')
          } catch (orderError: any) {
            // If orderBy also fails, try without it
            if (orderError.code === 'failed-precondition' || orderError.message?.includes('index')) {
              const qBasic = query(
                customersRef,
                where('createdBy', '==', userId)
              )
              const snapshotBasic = await getDocs(qBasic)
              allCustomers = snapshotBasic.docs
              console.log('[CustomersStore] Found', allCustomers.length, 'customers with basic query')
            } else {
              throw orderError
            }
          }
        }

        console.log('[CustomersStore] Total customers found before filtering:', allCustomers.length)

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
            lastOrderDate: data.lastOrderDate?.toDate ? data.lastOrderDate.toDate() : new Date(data.lastOrderDate),
            firstOrderDate: data.firstOrderDate?.toDate ? data.firstOrderDate.toDate() : new Date(data.firstOrderDate),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
            createdBy: data.createdBy || userId,
          } as Customer
        })

        // Filter customers by current store ID (client-side filter)
        // Include customers that match the storeId, or customers without a storeId (legacy data)
        if (storeId) {
          const beforeFilter = customers.length
          customers = customers.filter(customer => {
            const customerStoreId = customer.storeId || ''
            const matches = !customerStoreId || customerStoreId === '' || customerStoreId === storeId
            if (!matches) {
              console.log('[CustomersStore] Filtering out customer:', customer.id, 'name:', customer.name, 'customer storeId:', customerStoreId, 'expected:', storeId)
            }
            return matches
          })
          console.log('[CustomersStore] Filtered customers from', beforeFilter, 'to', customers.length, 'by storeId:', storeId)
          
          // If no customers after filtering, log a warning
          if (customers.length === 0 && beforeFilter > 0) {
            console.warn('[CustomersStore] WARNING: All customers were filtered out! This might indicate a storeId mismatch.')
            console.warn('[CustomersStore] Staff storeId:', storeId, 'Superadmin userId:', userId)
          }
        } else {
          console.warn('[CustomersStore] WARNING: No storeId available! Staff might not have a storeId set.')
        }

        // Sort customers by lastOrderDate (newest first)
        customers.sort((a, b) => {
          const dateA = a.lastOrderDate instanceof Date ? a.lastOrderDate.getTime() : new Date(a.lastOrderDate).getTime()
          const dateB = b.lastOrderDate instanceof Date ? b.lastOrderDate.getTime() : new Date(b.lastOrderDate).getTime()
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
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      let userId = authStore.currentUser.uid

      // If the current user is staff, get the super admin UID
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
          console.warn('[CustomersStore] Could not fetch staff document:', error.message)
        }
      }

      try {
        // Find customer that has this receipt
        const customersRef = collection(db, 'customers')
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
          await deleteDoc(doc(db, 'customers', customerDoc.id))
          
          // Remove from local state
          this.customers = this.customers.filter(c => c.id !== customerDoc.id)
        } else {
          // Update customer: remove receipt, decrement orders, subtract total
          const updatedReceipts = (customerData.receipts || []).filter((r: string) => r !== receiptId)
          const updatedTotalOrders = Math.max(0, (customerData.totalOrders || 1) - 1)
          const updatedTotalSpent = Math.max(0, (customerData.totalSpent || receiptTotal) - receiptTotal)

          await updateDoc(doc(db, 'customers', customerDoc.id), {
            receipts: updatedReceipts,
            totalOrders: updatedTotalOrders,
            totalSpent: updatedTotalSpent,
            updatedAt: serverTimestamp(),
          })

          // Update local state
          const index = this.customers.findIndex(c => c.id === customerDoc.id)
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

