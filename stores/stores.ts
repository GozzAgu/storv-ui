import { defineStore } from 'pinia'
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
} from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import {
  getStoresCollection,
  getStoreDocument,
  getQueryUserId,
} from '~/composables/useFirestorePaths'
import { getPlanLimits, getEligibleStoresForPlan } from '~/types/subscription'
import type { SubscriptionPlan } from '~/types/subscription'
import type { Store, StoreWithStats } from '~/composables/useStores'
import { clearInventoryItemQueryCaches } from '~/utils/inventory-items-firestore'

export const useStoresStore = defineStore('stores', {
  state: () => ({
    stores: [] as Store[],
    currentStoreId: null as string | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    totalStores: (state) => state.stores.length,
    activeStores: (state) => state.stores.filter((s) => s.isActive),
    currentStore: (state) => {
      if (!state.currentStoreId) return null
      return state.stores.find((s) => s.id === state.currentStoreId) || null
    },
    getStoreById: (state) => (id: string) => state.stores.find((s) => s.id === id),
  },

  actions: {
    // Initialize current store from localStorage or set first store
    async initializeCurrentStore() {
      if (import.meta.server) return

      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { syncDemoToPinia } = await import('~/utils/demo-bridge')
        await syncDemoToPinia()
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) return

      // Check if user is super admin
      const { useUserStore } = await import('./user')
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      if (userStore.userData?.role !== 'superAdmin') {
        // Check if staff creation is in progress - if so, skip this initialization
        // During staff creation, the superadmin temporarily signs in as the new staff
        // but the staff document may not be fully saved yet
        const isStaffCreationInProgress = import.meta.client
          ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
          : false

        if (isStaffCreationInProgress) {
          // console.log('[StoresStore] Staff creation in progress - skipping initializeCurrentStore for staff')
          return
        }

        // For staff, get their store from staff document
        const { useStaffStore } = await import('./staff')
        const staffStore = useStaffStore()
        const staffMember = await staffStore.fetchCurrentStaffMember()
        if (staffMember?.storeId) {
          this.currentStoreId = staffMember.storeId
          if (import.meta.client) {
            localStorage.setItem('currentStoreId', staffMember.storeId)
          }

          // Fetch the store document so we can display store name and details
          const db = useFirestore().getFirestoreInstance()
          if (db) {
            try {
              // Use hierarchical path: users/{userId}/stores/{storeId}
              const userId = await getQueryUserId()
              if (userId) {
                const storeRef = getStoreDocument(db, userId, staffMember.storeId)
                const storeSnap = await getDoc(storeRef)
                if (storeSnap.exists()) {
                  const storeData = storeSnap.data()
                  // Add store to stores array if not already there
                  const existingStore = this.stores.find((s) => s.id === staffMember.storeId)
                  if (!existingStore) {
                    this.stores = [
                      {
                        id: storeSnap.id,
                        ...storeData,
                      } as Store,
                    ]
                  } else {
                    // Update existing store
                    const index = this.stores.findIndex((s) => s.id === staffMember.storeId)
                    if (index > -1) {
                      this.stores[index] = {
                        id: storeSnap.id,
                        ...storeData,
                      } as Store
                    }
                  }
                  // console.log('[StoresStore] Staff store loaded:', storeData.name || storeData.branchName || staffMember.storeId)
                } else {
                  console.warn('[StoresStore] Staff store document not found:', staffMember.storeId)
                }
              } else {
                console.warn('[StoresStore] Could not get userId for staff store')
              }
            } catch (storeError: any) {
              console.warn(
                '[StoresStore] Could not fetch staff store document:',
                storeError.message
              )
            }
          }

          // Refresh data for staff's store
          this.refreshStoreData().catch((err) =>
            console.warn('Failed to refresh store data for staff:', err)
          )
        } else {
          console.warn(
            '[StoresStore] Staff member has no storeId assigned. Staff member:',
            staffMember
          )
        }
        return
      }

      // Fetch stores first
      if (this.stores.length === 0) {
        await this.fetchStores()
      }

      const plan = (userStore.userData?.subscription as SubscriptionPlan) || 'storvv_micro'
      const eligible = getEligibleStoresForPlan(this.stores, plan)
      const eligibleIds = new Set(eligible.map((s) => s.id))

      let storeWasSet = false
      if (import.meta.client) {
        const savedStoreId = localStorage.getItem('currentStoreId')
        if (savedStoreId && eligibleIds.has(savedStoreId) && this.getStoreById(savedStoreId)) {
          this.currentStoreId = savedStoreId
          storeWasSet = true
        }
      }

      if (!storeWasSet) {
        const pick = eligible.find((s) => s.isActive !== false) || eligible[0]
        if (pick) {
          this.currentStoreId = pick.id
          if (import.meta.client) {
            localStorage.setItem('currentStoreId', pick.id)
          }
          storeWasSet = true
        }
      }

      if (storeWasSet && this.currentStoreId) {
        this.refreshStoreData().catch((err) =>
          console.warn('Failed to refresh store data on init:', err)
        )
      }
    },

    /** After fetch or subscription change: keep super-admin on a plan-eligible branch. */
    async applyPlanToCurrentStoreSelection() {
      if (import.meta.server) return

      const authStore = useAuthStore()
      if (!authStore.currentUser) return

      const { useUserStore } = await import('./user')
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      if (userStore.userData?.role !== 'superAdmin') return

      if (this.stores.length === 0) {
        if (this.currentStoreId) {
          await this.clearStoreData()
          this.currentStoreId = null
          if (import.meta.client) localStorage.removeItem('currentStoreId')
        }
        return
      }

      const plan = (userStore.userData.subscription as SubscriptionPlan) || 'storvv_micro'
      const eligible = getEligibleStoresForPlan(this.stores, plan)
      const eligibleIds = new Set(eligible.map((s) => s.id))

      // Full refresh resets Pinia while localStorage still has the user's branch; if we skip this,
      // the null currentStoreId path below calls setCurrentStore(fallback), which overwrites
      // localStorage with the first eligible store and the active branch appears to "switch".
      if (!this.currentStoreId && import.meta.client) {
        const savedStoreId = localStorage.getItem('currentStoreId')
        if (savedStoreId && eligibleIds.has(savedStoreId) && this.getStoreById(savedStoreId)) {
          this.currentStoreId = savedStoreId
        }
      }

      if (this.currentStoreId && eligibleIds.has(this.currentStoreId)) return

      const fallback = eligible.find((s) => s.isActive !== false) || eligible[0]
      if (fallback) {
        await this.setCurrentStore(fallback.id)
      } else {
        await this.clearStoreData()
        this.currentStoreId = null
        if (import.meta.client) localStorage.removeItem('currentStoreId')
      }
    },

    // Set current store and refresh all data
    async setCurrentStore(storeId: string | null) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        if (!storeId) {
          this.currentStoreId = null
          return
        }
        const { applyDemoSetCurrentStore } = await import('~/utils/demo-bridge')
        await applyDemoSetCurrentStore(storeId)
        return
      }

      if (storeId && !this.getStoreById(storeId)) {
        throw new Error('Store not found')
      }

      if (storeId) {
        const { useUserStore } = await import('./user')
        const u = useUserStore()
        if (!u.userData && useAuthStore().currentUser) {
          await u.fetchUserData(useAuthStore().currentUser!.uid)
        }
        if (u.userData?.role === 'superAdmin') {
          const plan = (u.userData.subscription as SubscriptionPlan) || 'storvv_micro'
          const eligibleIds = new Set(getEligibleStoresForPlan(this.stores, plan).map((s) => s.id))
          if (!eligibleIds.has(storeId)) {
            throw new Error(
              'This branch is not available on your current plan. Upgrade in Settings to access it.'
            )
          }
        }
      }

      // Clear all data from previous store before switching
      await this.clearStoreData()

      this.currentStoreId = storeId
      if (import.meta.client) {
        if (storeId) {
          localStorage.setItem('currentStoreId', storeId)
        } else {
          localStorage.removeItem('currentStoreId')
        }
      }

      // Refresh all data for the new store
      await this.refreshStoreData()
    },

    // Clear all store data (departments, staff, inventory, receipts, customers)
    async clearStoreData() {
      if (import.meta.server) return

      // console.log('[StoresStore] Clearing all store data')

      try {
        // Import stores dynamically to avoid circular dependencies
        const [
          { useDepartmentsStore },
          { useStaffStore },
          { useInventoryStore },
          { useReceiptsStore },
          { useCustomersStore },
        ] = await Promise.all([
          import('./departments'),
          import('./staff'),
          import('./inventory'),
          import('./receipts'),
          import('./customers'),
        ])

        const departmentsStore = useDepartmentsStore()
        const staffStore = useStaffStore()
        const inventoryStore = useInventoryStore()
        const receiptsStore = useReceiptsStore()
        const customersStore = useCustomersStore()

        // Clear all data from stores to hide previous store's data
        departmentsStore.departments = []
        departmentsStore.loading = false
        departmentsStore.error = null

        staffStore.staff = []
        staffStore.loading = false
        staffStore.error = null

        inventoryStore.folders = []
        inventoryStore.items = {}
        inventoryStore.itemsPagination = {}
        inventoryStore.itemsLoadedFully = {}
        inventoryStore.selectedItemId = null
        inventoryStore.loading = false
        inventoryStore.error = null
        clearInventoryItemQueryCaches()

        receiptsStore.receipts = []
        receiptsStore.loading = false
        receiptsStore.error = null

        customersStore.customers = []
        customersStore.loading = false
        customersStore.error = null

        // console.log('[StoresStore] All store data cleared')
      } catch (error: any) {
        console.warn('[StoresStore] Error clearing store data:', error)
        // Don't throw - clearing is best effort
      }
    },

    // Refresh all data for the current store
    async refreshStoreData() {
      if (import.meta.server) return
      if (!this.currentStoreId) return

      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { syncDemoToPinia } = await import('~/utils/demo-bridge')
        await syncDemoToPinia()
        return
      }

      // console.log('[StoresStore] Refreshing all data for store:', this.currentStoreId)

      try {
        // Import stores dynamically to avoid circular dependencies
        const [
          { useDepartmentsStore },
          { useStaffStore },
          { useInventoryStore },
          { useReceiptsStore },
          { useCustomersStore },
        ] = await Promise.all([
          import('./departments'),
          import('./staff'),
          import('./inventory'),
          import('./receipts'),
          import('./customers'),
        ])

        const departmentsStore = useDepartmentsStore()
        const staffStore = useStaffStore()
        const inventoryStore = useInventoryStore()
        const receiptsStore = useReceiptsStore()
        const customersStore = useCustomersStore()

        // Clear existing data first to avoid showing stale data from previous store
        departmentsStore.departments = []
        staffStore.staff = []
        inventoryStore.folders = []
        inventoryStore.items = {} // Clear all inventory items
        inventoryStore.itemsPagination = {}
        inventoryStore.itemsLoadedFully = {}
        inventoryStore.selectedItemId = null
        clearInventoryItemQueryCaches()
        receiptsStore.receipts = []
        customersStore.customers = []

        // Set loading states to hide UI during data fetch
        departmentsStore.loading = true
        staffStore.loading = true
        inventoryStore.loading = true
        receiptsStore.loading = true
        customersStore.loading = true

        // Fetch all data in parallel for the new store.
        // Receipts uses in-flight dedup: an outer fetchReceipts may be blocked inside getCurrentStoreId
        // while this refresh runs, force bypasses returning that same promise (avoids deadlock).
        await Promise.all([
          departmentsStore
            .fetchDepartments()
            .catch((err) => console.warn('[StoresStore] Failed to fetch departments:', err)),
          staffStore
            .fetchStaff()
            .catch((err) => console.warn('[StoresStore] Failed to fetch staff:', err)),
          inventoryStore
            .fetchFolders()
            .catch((err) => console.warn('[StoresStore] Failed to fetch inventory folders:', err)),
          receiptsStore
            .fetchReceipts({ force: true })
            .catch((err) => console.warn('[StoresStore] Failed to fetch receipts:', err)),
          customersStore
            .fetchCustomers()
            .catch((err) => console.warn('[StoresStore] Failed to fetch customers:', err)),
        ])

        // console.log('[StoresStore] Successfully refreshed all data for store:', this.currentStoreId)
      } catch (error) {
        console.error('[StoresStore] Error refreshing store data:', error)
      }
    },

    // Fetch all stores for current super admin
    async fetchStores() {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { syncDemoToPinia } = await import('~/utils/demo-bridge')
        await syncDemoToPinia()
        return
      }

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

      // Check if user is staff or super admin
      const { useUserStore } = await import('./user')
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      let ownerId = authStore.currentUser.uid

      // Get userId for hierarchical path (superadmin's UID)
      const userId = await getQueryUserId()
      if (!userId) {
        this.error = 'User ID not available'
        this.loading = false
        return
      }

      // If staff, get their store
      if (userStore.userData?.role === 'staff') {
        const { useStaffStore } = await import('./staff')
        const staffStore = useStaffStore()
        const staffMember = await staffStore.fetchCurrentStaffMember()
        if (staffMember?.storeId) {
          // Staff can only see their own store - use hierarchical path
          try {
            const storeRef = getStoreDocument(db, userId, staffMember.storeId)
            const storeSnap = await getDoc(storeRef)
            if (storeSnap.exists()) {
              const data = storeSnap.data()
              this.stores = [
                {
                  id: storeSnap.id,
                  ...data,
                } as Store,
              ]
            } else {
              this.stores = []
            }
          } catch (error: any) {
            console.error('Error fetching store for staff:', error)
            this.error = error.message || 'Failed to fetch store'
          } finally {
            this.loading = false
          }
          return
        } else {
          this.stores = []
          this.loading = false
          return
        }
      }

      try {
        // IMPORTANT: Stores are ONLY fetched from the hierarchical family tree structure
        // Path: users/{userId}/stores
        // This ensures stores belong to the superadmin's family tree, just like inventory
        const storesRef = getStoresCollection(db, userId)
        let querySnapshot

        try {
          const q = query(storesRef, where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'))
          querySnapshot = await getDocs(q)
        } catch (orderByError: any) {
          if (
            orderByError.code === 'failed-precondition' ||
            orderByError.message?.includes('index')
          ) {
            const q = query(storesRef, where('ownerId', '==', ownerId))
            querySnapshot = await getDocs(q)
          } else {
            throw orderByError
          }
        }

        const stores: Store[] = []
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          stores.push({
            id: docSnapshot.id,
            ...data,
          } as Store)
        })

        this.stores = stores

        if (userStore.userData?.role === 'superAdmin') {
          await this.applyPlanToCurrentStoreSelection()
        }

        if (!this.currentStoreId && stores.length > 0) {
          await this.initializeCurrentStore()
        }
      } catch (error: any) {
        console.error('Error fetching stores:', error)
        this.error = error.message || 'Failed to fetch stores'
      } finally {
        this.loading = false
      }
    },

    // Fetch a single store
    async fetchStore(storeId: string): Promise<Store | null> {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Get userId for hierarchical path (superadmin's UID)
      const userId = await getQueryUserId()
      if (!userId) {
        throw new Error('User ID not available')
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}
        const storeRef = getStoreDocument(db, userId, storeId)
        const storeSnap = await getDoc(storeRef)

        if (!storeSnap.exists()) {
          return null
        }

        const data = storeSnap.data()
        const store = {
          id: storeSnap.id,
          ...data,
        } as Store

        // Verify ownership or staff access
        const { useUserStore } = await import('./user')
        const userStore = useUserStore()
        if (!userStore.userData) {
          await userStore.fetchUserData(authStore.currentUser.uid)
        }

        if (userStore.userData?.role === 'superAdmin') {
          if (store.ownerId !== authStore.currentUser.uid) {
            throw new Error('Access denied')
          }
        } else if (userStore.userData?.role === 'staff') {
          const { useStaffStore } = await import('./staff')
          const staffStore = useStaffStore()
          const staffMember = await staffStore.fetchCurrentStaffMember()
          if (staffMember?.storeId !== storeId) {
            throw new Error('Access denied')
          }
        } else {
          throw new Error('Access denied')
        }

        // Update in local state
        const index = this.stores.findIndex((s) => s.id === storeId)
        if (index > -1) {
          this.stores[index] = store
        } else {
          this.stores.push(store)
        }

        return store
      } catch (error: any) {
        console.error('Error fetching store:', error)
        throw new Error(error.message || 'Failed to fetch store')
      }
    },

    // Create a new store
    async createStore(
      storeData: Omit<Store, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'isActive'> & {
        isActive?: boolean
      },
      options?: { setAsCurrent?: boolean }
    ) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to create stores')
      }

      // Verify user is super admin
      const { useUserStore } = await import('./user')
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      if (userStore.userData?.role !== 'superAdmin') {
        throw new Error('Only super admins can create stores')
      }

      const plan = (userStore.userData?.subscription as SubscriptionPlan) || 'storvv_micro'
      const limits = getPlanLimits(plan)
      if (limits.maxStores >= 0 && this.stores.length >= limits.maxStores) {
        const msg =
          plan === 'storvv_micro'
            ? 'Storvv Micro allows 1 store. Upgrade to Medium or Enterprise to add more.'
            : `Your plan allows up to ${limits.maxStores} stores. Upgrade to Enterprise for unlimited stores.`
        throw new Error(msg)
      }

      try {
        // IMPORTANT: Stores are ONLY created in the hierarchical family tree structure
        // Path: users/{userId}/stores/{storeId}
        // This ensures stores belong to the superadmin's family tree, just like inventory
        const userId = authStore.currentUser.uid
        const storesRef = getStoresCollection(db, userId)
        const newStoreRef = doc(storesRef)

        const newStore: Omit<Store, 'id'> = {
          ...storeData,
          ownerId: authStore.currentUser.uid,
          isActive: storeData.isActive ?? true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }

        await setDoc(newStoreRef, newStore)

        const storeWithId = {
          id: newStoreRef.id,
          ...newStore,
        } as Store

        this.stores.unshift(storeWithId)
        if (options?.setAsCurrent) {
          await this.setCurrentStore(newStoreRef.id)
        }

        return newStoreRef.id
      } catch (error: any) {
        console.error('Error creating store:', error)
        throw new Error(error.message || 'Failed to create store')
      }
    },

    // Update a store
    async updateStore(
      storeId: string,
      updates: Partial<Omit<Store, 'id' | 'ownerId' | 'createdAt'>>
    ) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Verify ownership
      const store = this.getStoreById(storeId) || (await this.fetchStore(storeId))
      if (!store || store.ownerId !== authStore.currentUser.uid) {
        throw new Error('Access denied')
      }

      try {
        // Get userId for hierarchical path
        const userId = await getQueryUserId()
        if (!userId) {
          throw new Error('User ID not available')
        }

        // Use hierarchical path: users/{userId}/stores/{storeId}
        const storeRef = getStoreDocument(db, userId, storeId)
        await updateDoc(storeRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        })

        // Update in local state
        const index = this.stores.findIndex((s) => s.id === storeId)
        if (index > -1) {
          this.stores[index] = {
            ...this.stores[index],
            ...updates,
          } as Store
        }
      } catch (error: any) {
        console.error('Error updating store:', error)
        throw new Error(error.message || 'Failed to update store')
      }
    },

    // Update logo for all stores (super admin account logo - applies to all stores)
    async updateAllStoresLogo(logoUrl: string) {
      const authStore = useAuthStore()
      if (!authStore.currentUser) return

      const userId = await getQueryUserId()
      if (!userId) return

      const db = useFirestore().getFirestoreInstance()
      if (!db) return

      const ownerStores = this.stores.filter((s) => s.ownerId === authStore.currentUser!.uid)
      for (const store of ownerStores) {
        await this.updateStore(store.id, { logoUrl })
      }
    },

    // Delete a store
    async deleteStore(storeId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Verify ownership
      const store = this.getStoreById(storeId) || (await this.fetchStore(storeId))
      if (!store || store.ownerId !== authStore.currentUser.uid) {
        throw new Error('Access denied')
      }

      // TODO: Check if store has any data (departments, staff, receipts, inventory)
      // For now, we'll allow deletion but warn in UI

      try {
        // Get userId for hierarchical path
        const userId = await getQueryUserId()
        if (!userId) {
          throw new Error('User ID not available')
        }

        // Use hierarchical path: users/{userId}/stores/{storeId}
        const storeRef = getStoreDocument(db, userId, storeId)
        await deleteDoc(storeRef)

        // Remove from local state
        this.stores = this.stores.filter((s) => s.id !== storeId)

        if (this.currentStoreId === storeId) {
          const remaining = this.stores.filter((s) => s.id !== storeId)
          const { useUserStore } = await import('./user')
          const u = useUserStore()
          const plan = (u.userData?.subscription as SubscriptionPlan) || 'storvv_micro'
          const eligible =
            u.userData?.role === 'superAdmin'
              ? getEligibleStoresForPlan(remaining, plan)
              : remaining
          const nextStore = eligible.find((s) => s.isActive !== false) || eligible[0]
          if (nextStore) {
            await this.setCurrentStore(nextStore.id)
          } else {
            await this.setCurrentStore(null)
          }
        }
      } catch (error: any) {
        console.error('Error deleting store:', error)
        throw new Error(error.message || 'Failed to delete store')
      }
    },
  },
})
