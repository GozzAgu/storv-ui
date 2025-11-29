import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useDepartmentsStore } from './departments'
import type { Staff } from '~/composables/useStaff'

export const useStaffStore = defineStore('staff', {
  state: () => ({
    staff: [] as Staff[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    totalStaff: (state) => state.staff.length,
    getStaffByDepartment: (state) => (departmentId: string) => 
      state.staff.filter(s => s.departmentId === departmentId),
    getStaffMember: (state) => (staffId: string) => 
      state.staff.find(s => s.id === staffId),
  },

  actions: {
    // Get all staff
    async fetchStaff() {
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

      try {
        const staffRef = collection(db, 'staff')
        const userId = authStore.currentUser.uid
        let querySnapshot

        try {
          // Filter by createdBy to only get staff for this user
          const q = query(
            staffRef,
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc')
          )
          querySnapshot = await getDocs(q)
        } catch (orderByError: any) {
          // If orderBy fails (missing index), try without orderBy
          if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
            const q = query(staffRef, where('createdBy', '==', userId))
            querySnapshot = await getDocs(q)
          } else {
            throw orderByError
          }
        }

        const staff: Staff[] = []
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          // Double-check that the staff belongs to this user
          if (data.createdBy === userId) {
            staff.push({
              id: docSnapshot.id,
              ...data,
            } as Staff)
          }
        })

        // Populate department names
        const departmentsStore = useDepartmentsStore()
        const departmentMap = new Map<string, string>()
        
        // Try to get departments from store, fetch if empty
        if (departmentsStore.departments.length === 0) {
          try {
            await departmentsStore.fetchDepartments()
          } catch (e) {
            console.warn('Could not fetch departments for staff:', e)
          }
        }
        
        departmentsStore.departments.forEach(d => {
          departmentMap.set(d.id, d.name)
        })

        this.staff = staff.map(s => ({
          ...s,
          departmentName: departmentMap.get(s.departmentId) || 'Unknown',
        }))
      } catch (error: any) {
        console.error('Error getting staff:', error)
        this.error = error.message || 'Failed to fetch staff'
      } finally {
        this.loading = false
      }
    },

    // Get staff by department
    async fetchStaffByDepartment(departmentId: string) {
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

      try {
        const staffRef = collection(db, 'staff')
        const userId = authStore.currentUser.uid
        let querySnapshot

        try {
          // Filter by departmentId AND createdBy to only get staff for this user
          const q = query(
            staffRef,
            where('departmentId', '==', departmentId),
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
            
            // Only log index warning once per session (shared with departments)
            if (typeof window !== 'undefined' && !(window as any).__firestoreIndexWarned) {
              const indexUrlMatch = orderByError.message?.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
              const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null
              console.warn(
                '📊 Firestore index missing for optimized queries. ' +
                'Create it here for better performance: ' +
                (indexUrl || 'Firebase Console > Firestore > Indexes')
              )
              ;(window as any).__firestoreIndexWarned = true
            }
            
            // Retry query without orderBy - this works but is less efficient
            const q = query(
              staffRef,
              where('departmentId', '==', departmentId),
              where('createdBy', '==', userId)
            )
            querySnapshot = await getDocs(q)
          } else {
            throw orderByError
          }
        }

        const staff: Staff[] = []
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          // Double-check that the staff belongs to this user
          if (data.createdBy === userId) {
            staff.push({
              id: docSnapshot.id,
              ...data,
            } as Staff)
          }
        })

        // Get department name (verify it belongs to this user)
        const departmentsStore = useDepartmentsStore()
        const department = departmentsStore.getDepartmentById(departmentId) || await departmentsStore.fetchDepartment(departmentId)
        
        // Verify department belongs to this user
        if (department && department.createdBy !== userId) {
          this.staff = []
          return []
        }

        this.staff = staff.map(s => ({
          ...s,
          departmentName: department?.name || 'Unknown',
        }))

        return this.staff
      } catch (error: any) {
        console.error('Error getting staff by department:', error)
        this.error = error.message || 'Failed to fetch staff'
        return []
      } finally {
        this.loading = false
      }
    },

    // Get a single staff member
    async fetchStaffMember(staffId: string): Promise<Staff | null> {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      try {
        const staffRef = doc(db, 'staff', staffId)
        const staffSnap = await getDoc(staffRef)

        if (!staffSnap.exists()) {
          return null
        }

        const data = staffSnap.data()
        const userId = authStore.currentUser.uid

        // Only return staff if it belongs to this user
        if (data.createdBy !== userId) {
          throw new Error('Staff member not found or access denied')
        }

        const staffData = {
          id: staffSnap.id,
          ...data,
        } as Staff

        // Get department name (verify it belongs to this user)
        const departmentsStore = useDepartmentsStore()
        const department = departmentsStore.getDepartmentById(staffData.departmentId) || await departmentsStore.fetchDepartment(staffData.departmentId)
        
        // Verify department belongs to this user
        if (!department || department.createdBy !== userId) {
          throw new Error('Department not found or access denied')
        }
        
        staffData.departmentName = department.name

        // Update in store if exists
        const index = this.staff.findIndex(s => s.id === staffId)
        if (index > -1) {
          this.staff[index] = staffData
        }

        return staffData
      } catch (error: any) {
        console.error('Error getting staff member:', error)
        throw new Error(error.message || 'Failed to fetch staff member')
      }
    },

    // Create a new staff member
    async createStaff(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'departmentName'>) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to create staff')
      }

      try {
        // Verify department exists and belongs to this user
        const departmentsStore = useDepartmentsStore()
        const department = departmentsStore.getDepartmentById(staffData.departmentId) || await departmentsStore.fetchDepartment(staffData.departmentId)
        if (!department || department.createdBy !== authStore.currentUser.uid) {
          throw new Error('Department not found or access denied')
        }

        const staffRef = collection(db, 'staff')
        const newStaffRef = doc(staffRef)

        const newStaff: Omit<Staff, 'id' | 'departmentName'> = {
          ...staffData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: authStore.currentUser.uid,
        }

        await setDoc(newStaffRef, newStaff)

        // Update department staff count
        await departmentsStore.updateStaffCount(staffData.departmentId, department.staffCount + 1)

        // If staff is a manager, update department manager
        if (staffData.role === 'manager') {
          await departmentsStore.updateDepartment(staffData.departmentId, {
            manager: `${staffData.firstName} ${staffData.lastName}`,
            managerId: newStaffRef.id,
          } as Partial<import('~/composables/useDepartments').Department>)
        }

        // Add to local state
        const staffWithDept = {
          id: newStaffRef.id,
          ...newStaff,
          departmentName: department.name,
        } as Staff
        this.staff.unshift(staffWithDept)

        return newStaffRef.id
      } catch (error: any) {
        console.error('Error creating staff:', error)
        throw new Error(error.message || 'Failed to create staff')
      }
    },

    // Update a staff member
    async updateStaff(staffId: string, updates: Partial<Omit<Staff, 'id' | 'createdAt' | 'createdBy' | 'departmentName'>>) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      try {
        // First verify the staff belongs to this user
        const staffMember = this.getStaffMember(staffId) || await this.fetchStaffMember(staffId)
        if (!staffMember || staffMember.createdBy !== authStore.currentUser.uid) {
          throw new Error('Staff member not found or access denied')
        }

        const staffRef = doc(db, 'staff', staffId)

        // If department is being changed, verify new department belongs to user and update counts
        if (updates.departmentId) {
          if (staffMember.departmentId !== updates.departmentId) {
            const departmentsStore = useDepartmentsStore()
            
            // Verify new department belongs to this user
            const newDept = departmentsStore.getDepartmentById(updates.departmentId) || await departmentsStore.fetchDepartment(updates.departmentId)
            if (!newDept || newDept.createdBy !== authStore.currentUser.uid) {
              throw new Error('Department not found or access denied')
            }
            
            // Decrease old department count (verify it belongs to user)
            const oldDept = departmentsStore.getDepartmentById(staffMember.departmentId)
            if (oldDept && oldDept.createdBy === authStore.currentUser.uid) {
              await departmentsStore.updateStaffCount(staffMember.departmentId, Math.max(0, oldDept.staffCount - 1))
            }
            
            // Increase new department count
            await departmentsStore.updateStaffCount(updates.departmentId, newDept.staffCount + 1)
          }
        }

        await updateDoc(staffRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        })

        // Update in local state
        const index = this.staff.findIndex(s => s.id === staffId)
        if (index > -1) {
          this.staff[index] = {
            ...this.staff[index],
            ...updates,
          } as Staff
        }

        // If role changed to manager, update department (verify department belongs to user)
        if (updates.role === 'manager') {
          const currentStaff = this.getStaffMember(staffId) || await this.fetchStaffMember(staffId)
          if (currentStaff && currentStaff.createdBy === authStore.currentUser.uid) {
            const departmentsStore = useDepartmentsStore()
            const dept = departmentsStore.getDepartmentById(currentStaff.departmentId)
            if (dept && dept.createdBy === authStore.currentUser.uid) {
              await departmentsStore.updateDepartment(currentStaff.departmentId, {
                manager: `${currentStaff.firstName} ${currentStaff.lastName}`,
                managerId: staffId,
              } as Partial<import('~/composables/useDepartments').Department>)
            }
          }
        }
      } catch (error: any) {
        console.error('Error updating staff:', error)
        throw new Error(error.message || 'Failed to update staff')
      }
    },

    // Delete a staff member
    async deleteStaff(staffId: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      try {
        const staffMember = this.getStaffMember(staffId) || await this.fetchStaffMember(staffId)
        if (!staffMember || staffMember.createdBy !== authStore.currentUser.uid) {
          throw new Error('Staff member not found or access denied')
        }

        const staffRef = doc(db, 'staff', staffId)
        await deleteDoc(staffRef)

        // Update department staff count (verify department belongs to user)
        const departmentsStore = useDepartmentsStore()
        const department = departmentsStore.getDepartmentById(staffMember.departmentId)
        if (department && department.createdBy === authStore.currentUser.uid) {
          await departmentsStore.updateStaffCount(staffMember.departmentId, Math.max(0, department.staffCount - 1))
        }

        // Remove from local state
        this.staff = this.staff.filter(s => s.id !== staffId)
      } catch (error: any) {
        console.error('Error deleting staff:', error)
        throw new Error(error.message || 'Failed to delete staff')
      }
    },
  },
})

