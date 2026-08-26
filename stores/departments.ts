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
import { normalizeEntityName } from '~/utils/capitalize-text'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import {
  getDepartmentsCollection,
  getDepartmentDocument,
  getStaffCollection,
  getQueryUserId,
} from '~/composables/useFirestorePaths'
import { getPlanLimits } from '~/types/subscription'
import { PERMISSION_DENIED_MESSAGE, CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import type { SubscriptionPlan } from '~/types/subscription'
import type { Department } from '~/composables/useDepartments'
// CORE_DEPARTMENTS should be imported directly from '~/composables/useDepartments' to avoid duplication

let fetchDepartmentsInflight: { key: string; promise: Promise<void> } | null = null

export const useDepartmentsStore = defineStore('departments', {
  state: () => ({
    departments: [] as Department[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    totalDepartments: (state) => state.departments.length,
    totalStaff: (state) => state.departments.reduce((sum, dept) => sum + dept.staffCount, 0),
    totalManagers: (state) => state.departments.filter((dept) => dept.manager).length,
    averageStaffPerDept: (state) => {
      if (state.departments.length === 0) return 0
      return Math.round(
        state.departments.reduce((sum, dept) => sum + dept.staffCount, 0) / state.departments.length
      )
    },
    getDepartmentById: (state) => (id: string) => state.departments.find((d) => d.id === id),
  },

  actions: {
    // Get all departments
    async fetchDepartments(options?: { force?: boolean }) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { syncDemoToPinia } = await import('~/utils/demo-bridge')
        this.loading = true
        await syncDemoToPinia()
        this.loading = false
        return
      }

      const storeIdForKey = (await getCurrentStoreId()) ?? ''
      if (options?.force) {
        fetchDepartmentsInflight = null
      } else if (fetchDepartmentsInflight?.key === storeIdForKey) {
        return fetchDepartmentsInflight.promise
      }

      const run = (async () => {
      this.loading = true
      this.error = null

      // console.log('[DepartmentsStore] Starting fetchDepartments')

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        console.error('[DepartmentsStore] Firestore not initialized')
        this.error = CLOUD_UNAVAILABLE_MESSAGE
        this.loading = false
        return
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        console.error('[DepartmentsStore] User not authenticated')
        this.error = 'User must be authenticated'
        this.loading = false
        return
      }

      // Get current store ID
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        this.error = 'No store selected. Please select a store first.'
        this.loading = false
        return
      }

      // Check if user is staff to determine which departments to show
      const userStore = useUserStore()

      // If user data is not loaded, fetch it first
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      const resolvedOwner = await getQueryUserId()
      const userId = resolvedOwner ?? authStore.currentUser.uid

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/departments
        const departmentsRef = getDepartmentsCollection(db, userId, storeId)
        let querySnapshot

        try {
          // Filter by createdBy to only get departments for this user
          const q = query(
            departmentsRef,
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc')
          )
          querySnapshot = await getDocs(q)
        } catch (orderByError: any) {
          // If orderBy fails (missing index), try without orderBy
          if (
            orderByError.code === 'failed-precondition' ||
            orderByError.message?.includes('index')
          ) {
            // Extract index creation URL from error if available
            const indexUrlMatch = orderByError.message?.match(
              /https:\/\/console\.firebase\.google\.com[^\s]+/
            )
            const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null

            // Only log index warning once per session to reduce console noise
            if (typeof window !== 'undefined' && !(window as any).__firestoreIndexWarned) {
              console.warn(
                '📊 Firestore index missing for optimized queries. ' +
                  'Create it here for better performance: ' +
                  (indexUrl || 'Firebase Console > Firestore > Indexes')
              )
              ;(window as any).__firestoreIndexWarned = true
            }

            // Retry query without orderBy - this works but is less efficient
            const q = query(departmentsRef, where('createdBy', '==', userId))
            querySnapshot = await getDocs(q)
          } else {
            throw orderByError
          }
        }

        const departments: Department[] = []
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          // Double-check that the department belongs to this user
          if (data.createdBy === userId) {
            departments.push({
              id: docSnapshot.id,
              ...data,
            } as Department)
          }
        })

        // Sort manually if fetched without orderBy
        if (departments.length > 0 && departments[0]?.createdAt) {
          departments.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0
            const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0
            return bTime - aTime
          })
        }

        // Staff: only list the department they belong to (not every department in the store)
        let visibleDepartments = departments
        if (userStore.userData?.role === 'staff') {
          try {
            const { useStaffStore } = await import('./staff')
            const staffStore = useStaffStore()
            const staffMember = await staffStore.fetchCurrentStaffMember()
            const myDeptId = staffMember?.departmentId
            visibleDepartments = myDeptId ? departments.filter((d) => d.id === myDeptId) : []
          } catch (e) {
            console.warn('[DepartmentsStore] Could not filter departments for staff:', e)
            visibleDepartments = []
          }
        }

        const storeIdNow = await getCurrentStoreId()
        if (storeIdNow !== storeId) {
          this.loading = false
          return
        }

        this.departments = visibleDepartments
      } catch (error: any) {
        console.error('[DepartmentsStore] Error fetching departments:', error.message || error)
        this.error = error.message || 'Failed to fetch departments'

        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
          this.error = PERMISSION_DENIED_MESSAGE
        }
      } finally {
        this.loading = false
      }
      })()

      fetchDepartmentsInflight = {
        key: storeIdForKey,
        promise: run.finally(() => {
          if (fetchDepartmentsInflight?.promise === run) {
            fetchDepartmentsInflight = null
          }
        }),
      }
      return fetchDepartmentsInflight.promise
    },

    // Get a single department
    async fetchDepartment(departmentId: string, storeId?: string): Promise<Department | null> {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        await this.fetchDepartments()
        return this.getDepartmentById(departmentId) ?? null
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Get current store ID - use provided storeId or get from context
      const currentStoreId = storeId || (await getCurrentStoreId())
      if (!currentStoreId) {
        throw new Error('No store selected')
      }

      // Get userId for hierarchical path (superadmin's UID)
      const userId = await getQueryUserId()
      if (!userId) {
        throw new Error('User ID not available')
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/departments/{departmentId}
        const departmentRef = getDepartmentDocument(db, userId, currentStoreId, departmentId)
        const departmentSnap = await getDoc(departmentRef)

        if (!departmentSnap.exists()) {
          return null
        }

        const data = departmentSnap.data()

        // Only return department if it belongs to this user
        if (data.createdBy !== userId) {
          throw new Error('Department not found or access denied')
        }

        const userStore = useUserStore()
        if (!userStore.userData) {
          await userStore.fetchUserData(authStore.currentUser.uid)
        }
        if (userStore.userData?.role === 'staff') {
          const { useStaffStore } = await import('./staff')
          const staffStore = useStaffStore()
          const staffMember = await staffStore.fetchCurrentStaffMember()
          if (!staffMember?.departmentId || staffMember.departmentId !== departmentId) {
            throw new Error('Access denied: You can only view your own department')
          }
        }

        const department = {
          id: departmentSnap.id,
          ...data,
        } as Department

        // Update in store if it exists
        const index = this.departments.findIndex((d) => d.id === departmentId)
        if (index > -1) {
          this.departments[index] = department
        }

        return department
      } catch (error: any) {
        console.error('Error getting department:', error)
        throw new Error(error.message || 'Failed to fetch department')
      }
    },

    // Create a new department
    async createDepartment(
      departmentData: Omit<
        Department,
        'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'staffCount' | 'storeId'
      >
    ): Promise<string> {
      const { isDemoModeActive, DEMO_USER_UID } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const storeId = (await getCurrentStoreId()) ?? ''
        const { demoId } = await import('~/utils/demo-seed')
        const id = demoId('dept')
        const dept: Department = {
          id,
          ...departmentData,
          name: normalizeEntityName(departmentData.name),
          staffCount: 0,
          storeId,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: DEMO_USER_UID,
        }
        this.departments.push(dept)
        return id
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to create departments')
      }

      // Get current store ID
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        throw new Error('No store selected. Please select a store first.')
      }

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      const plan = (userStore.userData?.subscription as SubscriptionPlan) || 'storvv_micro'
      const limits = getPlanLimits(plan)
      const departmentsInStore = this.departments.filter((d) => d.storeId === storeId)
      if (
        limits.maxDepartmentsPerStore >= 0 &&
        departmentsInStore.length >= limits.maxDepartmentsPerStore
      ) {
        const msg =
          plan === 'storvv_micro'
            ? 'Storvv Micro allows 1 department per store. Upgrade to Medium or Enterprise for more.'
            : `Your plan allows up to ${limits.maxDepartmentsPerStore} departments per store. Upgrade to Enterprise for unlimited.`
        throw new Error(msg)
      }

      try {
        // Get userId for hierarchical path
        const userId = authStore.currentUser.uid

        // Use hierarchical path: users/{userId}/stores/{storeId}/departments
        const departmentsRef = getDepartmentsCollection(db, userId, storeId)
        const newDepartmentRef = doc(departmentsRef)

        const newDepartment: Omit<Department, 'id'> = {
          ...departmentData,
          name: normalizeEntityName(departmentData.name),
          storeId,
          staffCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: authStore.currentUser.uid,
        }

        await setDoc(newDepartmentRef, newDepartment)

        // Add to local state with actual Date objects (not FieldValue)
        const now = new Date()
        const departmentForState: Department = {
          id: newDepartmentRef.id,
          ...departmentData,
          name: normalizeEntityName(departmentData.name),
          storeId,
          staffCount: 0,
          createdAt: now,
          updatedAt: now,
          createdBy: authStore.currentUser.uid,
        }
        this.departments.unshift(departmentForState)

        return newDepartmentRef.id
      } catch (error: any) {
        console.error('Error creating department:', error)
        throw new Error(error.message || 'Failed to create department')
      }
    },

    // Update a department
    async updateDepartment(
      departmentId: string,
      updates: Partial<Omit<Department, 'id' | 'createdAt' | 'createdBy' | 'storeId'>>
    ) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const index = this.departments.findIndex((d) => d.id === departmentId)
        if (index > -1) {
          this.departments[index] = {
            ...this.departments[index],
            ...updates,
            ...(updates.name !== undefined ? { name: normalizeEntityName(updates.name) } : {}),
            updatedAt: new Date(),
          } as Department
        }
        return
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Check if user is staff - staff cannot update departments
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      if (userStore.userData?.role === 'staff') {
        throw new Error('Staff members do not have permission to update departments')
      }

      try {
        // First verify the department belongs to this user and store
        const department = await this.fetchDepartment(departmentId)
        if (!department || department.createdBy !== authStore.currentUser.uid) {
          throw new Error('Department not found or access denied')
        }

        // Get userId and storeId for hierarchical path
        const userId = authStore.currentUser.uid
        const storeId = await getCurrentStoreId()
        if (!storeId) {
          throw new Error('No store selected')
        }

        const normalizedUpdates = {
          ...updates,
          ...(updates.name !== undefined ? { name: normalizeEntityName(updates.name) } : {}),
        }

        // Use hierarchical path: users/{userId}/stores/{storeId}/departments/{departmentId}
        const departmentRef = getDepartmentDocument(db, userId, storeId, departmentId)
        await updateDoc(departmentRef, {
          ...normalizedUpdates,
          updatedAt: serverTimestamp(),
        })

        // Update in local state
        const index = this.departments.findIndex((d) => d.id === departmentId)
        if (index > -1) {
          this.departments[index] = {
            ...this.departments[index],
            ...normalizedUpdates,
          } as Department
        }
      } catch (error: any) {
        console.error('Error updating department:', error)
        throw new Error(error.message || 'Failed to update department')
      }
    },

    // Delete a department
    // When on a store's departments page, pass storeId so the correct path is used
    async deleteDepartment(departmentId: string, storeIdParam?: string) {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        this.departments = this.departments.filter((d) => d.id !== departmentId)
        return
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      // Check if user is staff - staff cannot delete departments
      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      if (userStore.userData?.role === 'staff') {
        throw new Error('Staff members do not have permission to delete departments')
      }

      // Use provided storeId (e.g. from route) or current store
      let storeId = storeIdParam
      if (!storeId) {
        storeId = (await getCurrentStoreId()) ?? undefined
      }
      if (!storeId) {
        throw new Error('No store selected')
      }

      try {
        const userId = await getQueryUserId()
        if (!userId) {
          throw new Error('User ID not available')
        }

        // First verify the department belongs to this user and store
        const department = await this.fetchDepartment(departmentId)
        if (!department || department.createdBy !== authStore.currentUser.uid) {
          throw new Error('Department not found or access denied')
        }

        // Check if department has staff using hierarchical path (same path as in rules)
        const staffRef = getStaffCollection(db, userId, storeId, departmentId)
        const staffSnapshot = await getDocs(staffRef)
        if (!staffSnapshot.empty) {
          throw new Error(
            'Cannot delete department with existing staff. Please remove all staff first.'
          )
        }

        // Use hierarchical path: users/{userId}/stores/{storeId}/departments/{departmentId}
        const departmentRef = getDepartmentDocument(db, userId, storeId, departmentId)
        await deleteDoc(departmentRef)

        // Remove from local state
        this.departments = this.departments.filter((d) => d.id !== departmentId)
      } catch (error: any) {
        console.error('Error deleting department:', error)
        throw new Error(error.message || 'Failed to delete department')
      }
    },

    // Update staff count for a department
    async updateStaffCount(departmentId: string, count: number, storeId?: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      try {
        // Get userId and storeId for hierarchical path
        const userId = await getQueryUserId()
        if (!userId) {
          throw new Error('User ID not available')
        }

        // Use provided storeId or get from current store
        let finalStoreId: string | undefined = storeId
        if (!finalStoreId) {
          const currentStoreId = await getCurrentStoreId()
          finalStoreId = currentStoreId || undefined
        }

        // If still no storeId, try to get it from the department
        if (!finalStoreId) {
          const department = this.getDepartmentById(departmentId)
          if (department?.storeId) {
            finalStoreId = department.storeId
          }
        }

        if (!finalStoreId) {
          throw new Error('No store selected')
        }

        // Use hierarchical path: users/{userId}/stores/{storeId}/departments/{departmentId}
        const departmentRef = getDepartmentDocument(db, userId, finalStoreId, departmentId)
        await updateDoc(departmentRef, {
          staffCount: count,
          updatedAt: serverTimestamp(),
        })

        // Update in local state
        const index = this.departments.findIndex((d) => d.id === departmentId)
        if (index > -1 && this.departments[index]) {
          this.departments[index].staffCount = count
        }
      } catch (error: any) {
        console.error('Error updating staff count:', error)
        throw new Error(error.message || 'Failed to update staff count')
      }
    },
  },
})
