import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import type { Department } from '~/composables/useDepartments'

export { CORE_DEPARTMENTS } from '~/composables/useDepartments'

export const useDepartmentsStore = defineStore('departments', {
  state: () => ({
    departments: [] as Department[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    totalDepartments: (state) => state.departments.length,
    totalStaff: (state) => state.departments.reduce((sum, dept) => sum + dept.staffCount, 0),
    totalManagers: (state) => state.departments.filter(dept => dept.manager).length,
    averageStaffPerDept: (state) => {
      if (state.departments.length === 0) return 0
      return Math.round(state.departments.reduce((sum, dept) => sum + dept.staffCount, 0) / state.departments.length)
    },
    getDepartmentById: (state) => (id: string) => state.departments.find(d => d.id === id),
  },

  actions: {
    // Get all departments
    async fetchDepartments() {
      this.loading = true
      this.error = null

      console.log('[DepartmentsStore] Starting fetchDepartments')

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        console.error('[DepartmentsStore] Firestore not initialized')
        this.error = 'Firestore not initialized'
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

      const userId = authStore.currentUser.uid

      try {
        const departmentsRef = collection(db, 'departments')
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
          if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
            // Extract index creation URL from error if available
            const indexUrlMatch = orderByError.message?.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
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

        this.departments = departments
      } catch (error: any) {
        console.error('[DepartmentsStore] Error fetching departments:', error.message || error)
        this.error = error.message || 'Failed to fetch departments'
        
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
          this.error = 'Missing or insufficient permissions. Please check your Firestore security rules.'
        }
      } finally {
        this.loading = false
      }
    },

    // Get a single department
    async fetchDepartment(departmentId: string): Promise<Department | null> {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      try {
        const departmentRef = doc(db, 'departments', departmentId)
        const departmentSnap = await getDoc(departmentRef)

        if (!departmentSnap.exists()) {
          return null
        }

        const data = departmentSnap.data()
        const userId = authStore.currentUser.uid

        // Only return department if it belongs to this user
        if (data.createdBy !== userId) {
          throw new Error('Department not found or access denied')
        }

        const department = {
          id: departmentSnap.id,
          ...data,
        } as Department

        // Update in store if it exists
        const index = this.departments.findIndex(d => d.id === departmentId)
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
    async createDepartment(departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'staffCount'>): Promise<string> {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to create departments')
      }

      try {
        const departmentsRef = collection(db, 'departments')
        const newDepartmentRef = doc(departmentsRef)

        const newDepartment: Omit<Department, 'id'> = {
          ...departmentData,
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
    async updateDepartment(departmentId: string, updates: Partial<Omit<Department, 'id' | 'createdAt' | 'createdBy'>>) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      try {
        // First verify the department belongs to this user
        const department = await this.fetchDepartment(departmentId)
        if (!department || department.createdBy !== authStore.currentUser.uid) {
          throw new Error('Department not found or access denied')
        }

        const departmentRef = doc(db, 'departments', departmentId)
        await updateDoc(departmentRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        })

        // Update in local state
        const index = this.departments.findIndex(d => d.id === departmentId)
        if (index > -1) {
          this.departments[index] = {
            ...this.departments[index],
            ...updates,
          } as Department
        }
      } catch (error: any) {
        console.error('Error updating department:', error)
        throw new Error(error.message || 'Failed to update department')
      }
    },

    // Delete a department
    async deleteDepartment(departmentId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      try {
        // First verify the department belongs to this user
        const department = await this.fetchDepartment(departmentId)
        if (!department || department.createdBy !== authStore.currentUser.uid) {
          throw new Error('Department not found or access denied')
        }

        // Check if department has staff (only staff created by this user)
        const staffRef = collection(db, 'staff')
        const q = query(
          staffRef,
          where('departmentId', '==', departmentId),
          where('createdBy', '==', authStore.currentUser.uid)
        )
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          throw new Error('Cannot delete department with existing staff. Please remove all staff first.')
        }

        const departmentRef = doc(db, 'departments', departmentId)
        await deleteDoc(departmentRef)

        // Remove from local state
        this.departments = this.departments.filter(d => d.id !== departmentId)
      } catch (error: any) {
        console.error('Error deleting department:', error)
        throw new Error(error.message || 'Failed to delete department')
      }
    },

    // Update staff count for a department
    async updateStaffCount(departmentId: string, count: number) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      try {
        const departmentRef = doc(db, 'departments', departmentId)
        await updateDoc(departmentRef, {
          staffCount: count,
          updatedAt: serverTimestamp(),
        })

        // Update in local state
        const index = this.departments.findIndex(d => d.id === departmentId)
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

