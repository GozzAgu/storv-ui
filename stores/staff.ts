import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, deleteField } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { useDepartmentsStore } from './departments'
import { useAdminCredentials } from '~/composables/useAdminCredentials'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import type { Staff } from '~/composables/useStaff'
import type { Department } from '~/composables/useDepartments'

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
    getCurrentStaffMember: (state) => {
      const authStore = useAuthStore()
      if (!authStore.currentUser) return null
      return state.staff.find(s => s.authUid === authStore.currentUser?.uid) || null
    },
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

      // Get current store ID
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        this.error = 'No store selected. Please select a store first.'
        this.loading = false
        return
      }

      try {
        const staffRef = collection(db, 'staff')
        const userId = authStore.currentUser.uid
        let querySnapshot

        try {
          // Filter by storeId AND createdBy to only get staff for this store
          const q = query(
            staffRef,
            where('storeId', '==', storeId),
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc')
          )
          querySnapshot = await getDocs(q)
        } catch (orderByError: any) {
          // If orderBy fails (missing index), try without orderBy
          if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
            const q = query(
              staffRef,
              where('storeId', '==', storeId),
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
          // Double-check that the staff belongs to this store and user
          if (data.createdBy === userId && data.storeId === storeId) {
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

      // Get current store ID
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        this.error = 'No store selected. Please select a store first.'
        this.loading = false
        return []
      }

      // Check if user is staff to determine which staff to show
      const userStore = useUserStore()
      
      // If user data is not loaded, fetch it first
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      let userId = authStore.currentUser.uid

      // If the current user is staff, get the super admin UID from the staff document
      if (userStore.userData?.role === 'staff') {
        try {
          // Find the staff document for this user to get their super admin's UID
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
                console.log('[StaffStore] Staff user detected, using super admin UID for fetchStaffByDepartment:', userId)
              }
            }
          }
        } catch (error: any) {
          console.warn('[StaffStore] Could not fetch staff document, using current user UID:', error.message)
        }
      }

      try {
        const staffRef = collection(db, 'staff')
        let querySnapshot

        try {
          // Filter by storeId, departmentId AND createdBy to only get staff for this store
          const q = query(
            staffRef,
            where('storeId', '==', storeId),
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
              where('storeId', '==', storeId),
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
          // Double-check that the staff belongs to this store and user
          if (data.createdBy === userId && data.storeId === storeId) {
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
    async createStaff(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'departmentName'> & { password?: string; superAdminPassword?: string }) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to create staff')
      }

      // Get super admin credentials for signing back in
      const { getCredentials, storeCredentials } = useAdminCredentials()
      const adminCredentials = getCredentials()
      
      // Use provided password or stored credentials (prefer stored credentials)
      const superAdminEmail = authStore.currentUser.email
      let superAdminPassword: string | undefined
      
      // First try stored credentials (they're automatically available if user signed in recently)
      if (adminCredentials) {
        superAdminPassword = adminCredentials.password
      } else if (staffData.superAdminPassword) {
        // Use password provided directly (e.g., from modal when credentials not stored)
        superAdminPassword = staffData.superAdminPassword
        // Store credentials for future use if email is available
        if (superAdminEmail) {
          storeCredentials(superAdminEmail, superAdminPassword)
        }
      }
      
      if (!superAdminPassword) {
        throw new Error('Super admin password is required. If your credentials expired, please enter your password in the "Your Super Admin Password" field above.')
      }
      
      if (!superAdminEmail) {
        throw new Error('Super admin email not found')
      }

      if (!staffData.password || !staffData.email) {
        throw new Error('Staff email and password are required')
      }

      let staffAuthUid: string | null = null
      let signedBackIn = false
      let firebaseAuthAccountCreated = false // Flag to track if Firebase Auth account was successfully created

      // Helper function to sign super admin back in
      const signSuperAdminBackIn = async () => {
        if (signedBackIn) return
        
        try {
          if (!superAdminPassword) {
            throw new Error('Password is required to sign back in')
          }
          await authStore.signIn(superAdminEmail, superAdminPassword)
          signedBackIn = true
          console.log('[Staff Creation] Super admin signed back in successfully')
          
          // Verify we're signed back in
          if (!authStore.currentUser) {
            throw new Error('Super admin sign-in verification failed - currentUser is null')
          }
        } catch (signInError: any) {
          console.error('[Staff Creation] Failed to sign super admin back in:', signInError)
          throw new Error(`Failed to sign super admin back in: ${signInError.message}`)
        }
      }

      try {
        // Verify department exists and belongs to this user
        const departmentsStore = useDepartmentsStore()
        const department = departmentsStore.getDepartmentById(staffData.departmentId) || await departmentsStore.fetchDepartment(staffData.departmentId)
        if (!department || department.createdBy !== authStore.currentUser.uid) {
          throw new Error('Department not found or access denied')
        }

        // Auto-assign staff to the department's store (no manual store selection needed)
        const storeId = department.storeId
        if (!storeId) {
          throw new Error('Department does not have a store assigned. Please assign the department to a store first.')
        }
        console.log('[Staff Creation] Auto-assigning staff to department\'s store:', storeId)

        // Set flag to prevent redirect during staff creation
        if (import.meta.client) {
          sessionStorage.setItem('staff_creation_in_progress', 'true')
        }

        // Step 1: Sign out super admin temporarily
        console.log('[Staff Creation] Signing out super admin...')
        await authStore.signOut()
        console.log('[Staff Creation] Super admin signed out successfully')

          // Step 2: Create Firebase Auth account for staff
          const auth = authStore.getAuthInstance()
          if (!auth) {
            // Sign super admin back in before throwing error
            try {
              await signSuperAdminBackIn()
            } catch (signInError) {
              console.error('Failed to sign super admin back in:', signInError)
            }
            throw new Error('Firebase Auth not initialized')
          }

          console.log('[Staff Creation] Creating Firebase Auth account for staff:', staffData.email)
          try {
            if (!staffData.email || !staffData.password) {
              throw new Error('Staff email and password are required for Firebase Auth account creation')
            }

            if (staffData.password.length < 6) {
              throw new Error('Staff password must be at least 6 characters long')
            }

            console.log('[Staff Creation] Calling createUserWithEmailAndPassword...')
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              staffData.email.trim().toLowerCase(),
              staffData.password
            )
            
            if (!userCredential || !userCredential.user) {
              throw new Error('Firebase Auth account creation returned null user credential')
            }

            staffAuthUid = userCredential.user.uid
            console.log('[Staff Creation] Firebase Auth account created successfully. UID:', staffAuthUid)

            if (!staffAuthUid || staffAuthUid.trim() === '') {
              throw new Error('Staff Firebase Auth UID is null or empty after account creation')
            }

            // Mark that Firebase Auth account was successfully created
            firebaseAuthAccountCreated = true
            console.log('[Staff Creation] ✅ Firebase Auth account creation confirmed. Flag set to true.')

            // Verify the account was actually created
            console.log('[Staff Creation] Verifying Firebase Auth account exists...')
            const createdUser = auth.currentUser
            if (createdUser && createdUser.uid === staffAuthUid && createdUser.email === staffData.email) {
              console.log('[Staff Creation] ✅ Verified: Firebase Auth account exists and matches created user')
            } else {
              // This is expected - after signing out, currentUser will be null, but the account still exists
              console.log('[Staff Creation] Note: Auth state cleared (expected after sign out), but Firebase Auth account was created with UID:', staffAuthUid)
            }
            
            // Additional verification: Ensure we have a valid UID
            if (!staffAuthUid || staffAuthUid.length < 20) {
              throw new Error('Invalid Firebase Auth UID received: ' + staffAuthUid)
            }
            
            console.log('[Staff Creation] ✅ Firebase Auth account UID validated:', staffAuthUid.substring(0, 8) + '...')

            // Step 3: Create user document for staff with 'staff' role
            console.log('[Staff Creation] Creating user document in Firestore for staff...')
            const userStore = useUserStore()
            try {
              await userStore.createUserDocument(staffAuthUid, {
                email: staffData.email,
                name: `${staffData.firstName} ${staffData.lastName}`,
                role: 'staff',
                hasCompletedOnboarding: true,
                hasCompletedTutorial: false,
              })
              console.log('[Staff Creation] User document created successfully in users collection')
            } catch (userDocError: any) {
              console.error('[Staff Creation] Error creating user document:', userDocError)
              // Don't fail the entire process if user document creation fails
              // The staff document will still have the authUid
              console.warn('[Staff Creation] Continuing despite user document creation error...')
            }
          } catch (authError: any) {
            console.error('[Staff Creation] Error creating staff Firebase Auth account:', authError)
            // If staff account creation fails, sign super admin back in first
            try {
              await signSuperAdminBackIn()
            } catch (signInError) {
              console.error('Failed to sign super admin back in after staff creation error:', signInError)
            }
            // Re-throw with more context
            const errorMessage = authError.code 
              ? `Failed to create staff Firebase Auth account (${authError.code}): ${authError.message}`
              : `Failed to create staff Firebase Auth account: ${authError.message}`
            throw new Error(errorMessage)
          }

        // Step 4: Sign super admin back in quickly
        console.log('[Staff Creation] Signing super admin back in...')
        await signSuperAdminBackIn()

        // Step 5: Create staff document in Firestore
        // CRITICAL VALIDATION: Ensure Firebase Auth account was created
        if (!firebaseAuthAccountCreated) {
          console.error('[Staff Creation] FATAL ERROR: Firebase Auth account was not created!')
          throw new Error('Cannot create staff document: Firebase Auth account creation failed or was not completed.')
        }

        if (!staffAuthUid || staffAuthUid.trim() === '') {
          console.error('[Staff Creation] FATAL ERROR: staffAuthUid is null or empty!')
          console.error('[Staff Creation] Cannot create Firestore document without Firebase Auth account.')
          throw new Error('Cannot create staff document: Firebase Auth account was not created. staffAuthUid is null or empty.')
        }

        console.log('[Staff Creation] ✅ Firebase Auth account confirmed. Creation flag:', firebaseAuthAccountCreated, 'UID:', staffAuthUid)
        console.log('[Staff Creation] Creating staff document in Firestore...')
        // Remove password and superAdminPassword from staffData - these are not stored in Firestore
        // Rename superAdminPassword during destructuring to avoid naming conflict
        const { password, superAdminPassword: _, ...staffDataWithoutPassword } = staffData
        const staffRef = collection(db, 'staff')
        const newStaffRef = doc(staffRef)

        // StoreId is already obtained from the department above (auto-assigned)

        const newStaff: Omit<Staff, 'id' | 'departmentName'> = {
          ...staffDataWithoutPassword,
          storeId, // Assign staff to department's store (auto-detected)
          authUid: staffAuthUid, // CRITICAL: This must be set for staff to log in
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: authStore.currentUser.uid, // Should be set now after sign in
        }

        // Double-check before saving
        if (!newStaff.authUid || newStaff.authUid.trim() === '') {
          console.error('[Staff Creation] FATAL ERROR: authUid is missing in newStaff object!')
          throw new Error('Staff object is missing authUid field. Cannot save to Firestore.')
        }

        console.log('[Staff Creation] Staff document data:', {
          ...newStaff,
          authUid: staffAuthUid,
          createdBy: authStore.currentUser.uid
        })

        await setDoc(newStaffRef, newStaff)
        console.log('[Staff Creation] ✅ SUCCESS: Staff created in Firestore with authUid:', staffAuthUid)

        // Verify the staff document was created with authUid
        const verifyDoc = await getDoc(newStaffRef)
        if (!verifyDoc.exists()) {
          throw new Error('Staff document was not created in Firestore')
        }
        const verifyData = verifyDoc.data()
        if (!verifyData.authUid || verifyData.authUid !== staffAuthUid) {
          console.error('[Staff Creation] ERROR: Staff document created but authUid is missing or incorrect!')
          console.error('[Staff Creation] Expected authUid:', staffAuthUid)
          console.error('[Staff Creation] Actual authUid in document:', verifyData.authUid)
          // Delete the document since it's incomplete
          await deleteDoc(newStaffRef)
          throw new Error('Staff document was created without authUid. Document deleted. Please try again.')
        }
        console.log('[Staff Creation] ✅ Verified: Staff document has correct authUid:', verifyData.authUid)

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

        // Clear staff creation flag on success
        if (import.meta.client) {
          sessionStorage.removeItem('staff_creation_in_progress')
        }

        // Refresh data in the background (non-blocking) for quick UI update
        if (import.meta.client) {
          // Refresh data immediately in background - Promise.all is non-blocking
          Promise.all([
            // Refresh staff list for the department
            this.fetchStaffByDepartment(staffData.departmentId).catch(err => 
              console.warn('[Staff Creation] Background refresh: Failed to refresh department staff:', err)
            ),
            // Refresh overall staff list for consistency across pages
            this.fetchStaff().catch(err =>
              console.warn('[Staff Creation] Background refresh: Failed to refresh staff list:', err)
            ),
            // Refresh department to update staff count
            departmentsStore.fetchDepartment(staffData.departmentId).catch(err =>
              console.warn('[Staff Creation] Background refresh: Failed to refresh department:', err)
            ),
          ]).then(() => {
            console.log('[Staff Creation] ✅ Background refresh completed successfully')
          }).catch(err => {
            console.warn('[Staff Creation] Background refresh completed with warnings:', err)
          })
        }

        return newStaffRef.id
      } catch (error: any) {
        console.error('Error creating staff:', error)
        
        // Ensure super admin is signed back in even if something fails
        if (!signedBackIn) {
          try {
            await signSuperAdminBackIn()
          } catch (signInError) {
            console.error('Failed to sign super admin back in after error:', signInError)
          }
        }
        
        // Clear staff creation flag on error
        if (import.meta.client) {
          sessionStorage.removeItem('staff_creation_in_progress')
        }
        
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

        // Handle role changes that affect department manager assignment
        if (updates.role !== undefined) {
          const currentStaff = this.getStaffMember(staffId) || await this.fetchStaffMember(staffId)
          if (currentStaff && currentStaff.createdBy === authStore.currentUser.uid) {
            const departmentsStore = useDepartmentsStore()
            const dept = departmentsStore.getDepartmentById(currentStaff.departmentId)
            
            if (dept && dept.createdBy === authStore.currentUser.uid) {
              // If role changed to manager, set as manager
              if (updates.role === 'manager') {
                await departmentsStore.updateDepartment(currentStaff.departmentId, {
                  manager: `${currentStaff.firstName} ${currentStaff.lastName}`,
                  managerId: staffId,
                } as Partial<import('~/composables/useDepartments').Department>)
              }
              // If role changed from manager to something else (like staff), clear manager
              else if (staffMember.role === 'manager' && (updates.role === 'staff' || updates.role === 'intern')) {
                // Check if this staff member is currently the manager of the department
                if (dept.managerId === staffId) {
                  // Use deleteField() to properly remove the fields from Firestore
                  const db = useFirestore().getFirestoreInstance()
                  if (db) {
                    const departmentRef = doc(db, 'departments', currentStaff.departmentId)
                    await updateDoc(departmentRef, {
                      manager: deleteField(),
                      managerId: deleteField(),
                      updatedAt: serverTimestamp(),
                    })
                    
                    // Update local state to reflect the change immediately
                    const deptIndex = departmentsStore.departments.findIndex(d => d.id === currentStaff.departmentId)
                    if (deptIndex > -1) {
                      departmentsStore.departments[deptIndex] = {
                        ...departmentsStore.departments[deptIndex],
                        manager: undefined,
                        managerId: undefined,
                      } as Department
                    }
                  }
                }
              }
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

    // Get current logged-in staff member's data
    async fetchCurrentStaffMember(): Promise<Staff | null> {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error('Firestore not initialized')
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        return null
      }

      try {
        const staffRef = collection(db, 'staff')
        const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
        const staffSnapshot = await getDocs(staffQuery)

        if (staffSnapshot.empty || staffSnapshot.docs.length === 0) {
          return null
        }

        const staffDoc = staffSnapshot.docs[0]
        if (!staffDoc) {
          return null
        }

        const staffData = {
          id: staffDoc.id,
          ...staffDoc.data(),
        } as Staff

        // Get department name
        const departmentsStore = useDepartmentsStore()
        if (departmentsStore.departments.length === 0) {
          try {
            await departmentsStore.fetchDepartments()
          } catch (e) {
            console.warn('Could not fetch departments for current staff member:', e)
          }
        }

        const department = departmentsStore.getDepartmentById(staffData.departmentId)
        if (department) {
          staffData.departmentName = department.name
        }

        return staffData
      } catch (error: any) {
        console.error('Error fetching current staff member:', error)
        return null
      }
    },
  },
})

