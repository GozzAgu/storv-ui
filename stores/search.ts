import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { useReceiptsStore } from './receipts'
import { useInventoryStore } from './inventory'
import { useCustomersStore } from './customers'
import { useDepartmentsStore } from './departments'
import { useStaffStore } from './staff'

export type SearchEntityType = 'all' | 'receipts' | 'inventory' | 'customers' | 'departments' | 'staff'

export interface SearchFilter {
  entityTypes: SearchEntityType[]
  dateRange?: {
    start: Date | null
    end: Date | null
  }
  status?: string[]
  storeId?: string
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters: SearchFilter
  createdAt: Date | any
  updatedAt?: Date | any
  createdBy: string
}

export interface SearchResult {
  id: string
  type: SearchEntityType
  title: string
  subtitle: string
  description?: string
  icon: string
  url: string
  metadata?: Record<string, any>
}

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    filters: {
      entityTypes: ['all'] as SearchEntityType[],
      dateRange: {
        start: null as Date | null,
        end: null as Date | null,
      },
      status: [] as string[],
      storeId: undefined as string | undefined,
    } as SearchFilter,
    results: [] as SearchResult[],
    loading: false,
    savedSearches: [] as SavedSearch[],
    isOpen: false,
  }),

  getters: {
    hasResults: (state) => state.results.length > 0,
    hasActiveFilters: (state) => {
      return (
        state.filters.entityTypes.length > 0 && state.filters.entityTypes[0] !== 'all' ||
        state.filters.dateRange?.start !== null ||
        state.filters.dateRange?.end !== null ||
        (state.filters.status && state.filters.status.length > 0) ||
        state.filters.storeId !== undefined
      )
    },
  },

  actions: {
    // Set search query
    setQuery(query: string) {
      this.query = query
    },

    // Set filters
    setFilters(filters: Partial<SearchFilter>) {
      this.filters = { ...this.filters, ...filters }
    },

    // Reset filters
    resetFilters() {
      this.filters = {
        entityTypes: ['all'],
        dateRange: {
          start: null,
          end: null,
        },
        status: [],
        storeId: undefined,
      }
    },

    // Perform global search
    async performSearch() {
      if (!this.query.trim() && !this.hasActiveFilters) {
        this.results = []
        return
      }

      this.loading = true
      this.results = []

      const searchQuery = this.query.toLowerCase().trim()
      const entityTypes = this.filters.entityTypes.includes('all')
        ? ['receipts', 'inventory', 'customers', 'departments', 'staff']
        : this.filters.entityTypes.filter(t => t !== 'all') as string[]

      try {
        const results: SearchResult[] = []

        // Search receipts
        if (entityTypes.includes('receipts')) {
          const receiptsStore = useReceiptsStore()
          if (receiptsStore.receipts.length === 0) {
            await receiptsStore.fetchReceipts()
          }

          receiptsStore.receipts.forEach(receipt => {
            const matchesQuery = !searchQuery ||
              receipt.receiptNumber.toLowerCase().includes(searchQuery) ||
              receipt.customerName.toLowerCase().includes(searchQuery) ||
              receipt.customerEmail.toLowerCase().includes(searchQuery) ||
              receipt.items.some(item => item.itemName.toLowerCase().includes(searchQuery))

            const matchesDateRange = !this.filters.dateRange?.start || !this.filters.dateRange?.end ||
              (() => {
                const receiptDate = receipt.date?.toDate ? receipt.date.toDate() : new Date(receipt.date)
                return receiptDate >= this.filters.dateRange!.start! && receiptDate <= this.filters.dateRange!.end!
              })()

            const matchesStatus = !this.filters.status || this.filters.status.length === 0 ||
              this.filters.status.includes(receipt.status)

            if (matchesQuery && matchesDateRange && matchesStatus) {
              results.push({
                id: receipt.id,
                type: 'receipts',
                title: `Receipt #${receipt.receiptNumber}`,
                subtitle: receipt.customerName,
                description: `${receipt.itemsCount} items • $${receipt.total.toFixed(2)} • ${receipt.status}`,
                icon: 'ReceiptPercentIcon',
                url: `/dashboard/receipts?receipt=${receipt.id}`,
                metadata: {
                  date: receipt.date,
                  total: receipt.total,
                  status: receipt.status,
                },
              })
            }
          })
        }

        // Search inventory items
        if (entityTypes.includes('inventory')) {
          const inventoryStore = useInventoryStore()
          if (inventoryStore.folders.length === 0) {
            await inventoryStore.fetchFolders()
          }

          // Search folders
          inventoryStore.folders.forEach(folder => {
            const matchesQuery = !searchQuery ||
              folder.name.toLowerCase().includes(searchQuery) ||
              folder.description.toLowerCase().includes(searchQuery)

            if (matchesQuery) {
              results.push({
                id: folder.id,
                type: 'inventory',
                title: folder.name,
                subtitle: 'Inventory Folder',
                description: `${folder.itemCount} items • $${folder.totalValue.toFixed(2)}`,
                icon: 'FolderIcon',
                url: `/dashboard/inventory/${folder.id}`,
                metadata: {
                  itemCount: folder.itemCount,
                  totalValue: folder.totalValue,
                },
              })
            }
          })

          // Search items in folders
          for (const folder of inventoryStore.folders) {
            if (inventoryStore.items[folder.id] === undefined) {
              await inventoryStore.fetchItems(folder.id)
            }

            const items = inventoryStore.items[folder.id] || []
            items.forEach(item => {
              const matchesQuery = !searchQuery ||
                Object.values(item).some(value => {
                  const strValue = value?.toString().toLowerCase() || ''
                  return strValue.includes(searchQuery)
                })

              if (matchesQuery) {
                const itemName = item.name || item.itemName || 'Unnamed Item'
                results.push({
                  id: item.id,
                  type: 'inventory',
                  title: itemName,
                  subtitle: folder.name,
                  description: `Serial: ${item.serialNo || item.serialNumber || 'N/A'}`,
                  icon: 'CubeIcon',
                  url: `/dashboard/inventory/${folder.id}?item=${item.id}`,
                  metadata: {
                    folderId: folder.id,
                    folderName: folder.name,
                  },
                })
              }
            })
          }
        }

        // Search customers
        if (entityTypes.includes('customers')) {
          const customersStore = useCustomersStore()
          if (customersStore.customers.length === 0) {
            await customersStore.fetchCustomers()
          }

          customersStore.customers.forEach(customer => {
            const matchesQuery = !searchQuery ||
              customer.name.toLowerCase().includes(searchQuery) ||
              customer.email?.toLowerCase().includes(searchQuery) ||
              customer.phone?.toLowerCase().includes(searchQuery) ||
              customer.address?.toLowerCase().includes(searchQuery)

            const matchesDateRange = !this.filters.dateRange?.start || !this.filters.dateRange?.end ||
              (() => {
                const lastOrderDate = customer.lastOrderDate?.toDate ? customer.lastOrderDate.toDate() : new Date(customer.lastOrderDate)
                return lastOrderDate >= this.filters.dateRange!.start! && lastOrderDate <= this.filters.dateRange!.end!
              })()

            if (matchesQuery && matchesDateRange) {
              results.push({
                id: customer.id,
                type: 'customers',
                title: customer.name,
                subtitle: customer.email || customer.phone || 'No contact info',
                description: `${customer.totalOrders} orders • $${customer.totalSpent.toFixed(2)} total`,
                icon: 'UserCircleIcon',
                url: `/dashboard/customers?customer=${customer.id}`,
                metadata: {
                  totalOrders: customer.totalOrders,
                  totalSpent: customer.totalSpent,
                },
              })
            }
          })
        }

        // Search departments
        if (entityTypes.includes('departments')) {
          const departmentsStore = useDepartmentsStore()
          if (departmentsStore.departments.length === 0) {
            await departmentsStore.fetchDepartments()
          }

          departmentsStore.departments.forEach(department => {
            const matchesQuery = !searchQuery ||
              department.name.toLowerCase().includes(searchQuery) ||
              department.description?.toLowerCase().includes(searchQuery)

            if (matchesQuery) {
              results.push({
                id: department.id,
                type: 'departments',
                title: department.name,
                subtitle: 'Department',
                description: department.description || 'No description',
                icon: 'BuildingOfficeIcon',
                url: `/dashboard/departments/${department.id}`,
                metadata: {
                  description: department.description,
                },
              })
            }
          })
        }

        // Search staff
        if (entityTypes.includes('staff')) {
          const staffStore = useStaffStore()
          if (staffStore.staff.length === 0) {
            await staffStore.fetchStaff()
          }

          staffStore.staff.forEach(staff => {
            const fullName = `${staff.firstName} ${staff.lastName}`.trim()
            const matchesQuery = !searchQuery ||
              fullName.toLowerCase().includes(searchQuery) ||
              staff.email?.toLowerCase().includes(searchQuery) ||
              staff.phone?.toLowerCase().includes(searchQuery)

            if (matchesQuery) {
              results.push({
                id: staff.id,
                type: 'staff',
                title: fullName,
                subtitle: staff.email || staff.phone || 'No contact info',
                description: `Department: ${staff.departmentName || 'N/A'}`,
                icon: 'UserIcon',
                url: `/dashboard/departments?staff=${staff.id}`,
                metadata: {
                  departmentName: staff.departmentName,
                  role: staff.role,
                },
              })
            }
          })
        }

        // Sort results by relevance (exact matches first, then partial matches)
        results.sort((a, b) => {
          const aExact = a.title.toLowerCase() === searchQuery || a.subtitle.toLowerCase() === searchQuery
          const bExact = b.title.toLowerCase() === searchQuery || b.subtitle.toLowerCase() === searchQuery
          if (aExact && !bExact) return -1
          if (!aExact && bExact) return 1
          return a.title.localeCompare(b.title)
        })

        this.results = results
      } catch (error: any) {
        console.error('[SearchStore] Error performing search:', error)
      } finally {
        this.loading = false
      }
    },

    // Save search
    async saveSearch(name: string) {
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
          console.warn('[SearchStore] Could not fetch staff document:', error.message)
        }
      }

      try {
        const savedSearchesRef = collection(db, 'savedSearches')
        const newSearchRef = doc(savedSearchesRef)

        const savedSearch: Omit<SavedSearch, 'id'> = {
          name: name.trim(),
          query: this.query,
          filters: { ...this.filters },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId,
        }

        await setDoc(newSearchRef, savedSearch)

        // Add to local state
        this.savedSearches.push({
          id: newSearchRef.id,
          ...savedSearch,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
        })

        return newSearchRef.id
      } catch (error: any) {
        console.error('[SearchStore] Error saving search:', error)
        throw new Error(error.message || 'Failed to save search')
      }
    },

    // Load saved searches
    async loadSavedSearches() {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
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
          console.warn('[SearchStore] Could not fetch staff document:', error.message)
        }
      }

      try {
        const savedSearchesRef = collection(db, 'savedSearches')
        const q = query(
          savedSearchesRef,
          where('createdBy', '==', userId),
          orderBy('updatedAt', 'desc')
        )

        const querySnapshot = await getDocs(q)
        const searches: SavedSearch[] = []

        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          if (data.createdBy === userId) {
            searches.push({
              id: docSnapshot.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
            } as SavedSearch)
          }
        })

        this.savedSearches = searches
      } catch (error: any) {
        console.error('[SearchStore] Error loading saved searches:', error)
      }
    },

    // Load saved search
    async loadSavedSearch(searchId: string) {
      const savedSearch = this.savedSearches.find(s => s.id === searchId)
      if (savedSearch) {
        this.query = savedSearch.query
        this.filters = { ...savedSearch.filters }
        await this.performSearch()
      }
    },

    // Delete saved search
    async deleteSavedSearch(searchId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      try {
        await deleteDoc(doc(db, 'savedSearches', searchId))
        this.savedSearches = this.savedSearches.filter(s => s.id !== searchId)
      } catch (error: any) {
        console.error('[SearchStore] Error deleting saved search:', error)
        throw new Error(error.message || 'Failed to delete saved search')
      }
    },

    // Open search modal
    openSearch() {
      this.isOpen = true
    },

    // Close search modal
    closeSearch() {
      this.isOpen = false
    },

    // Toggle search modal
    toggleSearch() {
      this.isOpen = !this.isOpen
    },
  },
})
