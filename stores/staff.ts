import { defineStore } from 'pinia'
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, deleteField } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { useDepartmentsStore } from './departments'
import { useAdminCredentials } from '~/composables/useAdminCredentials'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { getStaffCollection, getStaffDocument, getDepartmentDocument, getQueryUserId } from '~/composables/useFirestorePaths'
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

      // Get userId for hierarchical path (superadmin's UID)
      const userId = await getQueryUserId()
      if (!userId) {
        this.error = 'User ID not available'
        this.loading = false
        return
      }

        try {
        // For hierarchical structure, we need to query all departments in the store
        // and get staff from each department
        // Path: users/{userId}/stores/{storeId}/departments/{departmentId}/staff
        const { getDepartmentsCollection } = await import('~/composables/useFirestorePaths')
        const departmentsRef = getDepartmentsCollection(db, userId, storeId)
        const departmentsSnapshot = await getDocs(departmentsRef)
        
        const allStaff: Staff[] = []
        
        // Iterate through all departments and collect staff from each
        for (const deptDoc of departmentsSnapshot.docs) {
          const departmentId = deptDoc.id
          const deptData = deptDoc.data()
          
          // Only process departments created by this user
          if (deptData.createdBy === userId) {
            try {
              const staffRef = getStaffCollection(db, userId, storeId, departmentId)
              const staffSnapshot = await getDocs(staffRef)
              
              staffSnapshot.forEach((staffDoc) => {
                const staffData = staffDoc.data()
                // Double-check that the staff belongs to this user
                if (staffData.createdBy === userId) {
                  allStaff.push({
                    id: staffDoc.id,
                    ...staffData,
                    departmentId: departmentId, // Ensure departmentId is set
            } as Staff)
          }
        })
            } catch (error: any) {
              console.warn(`[StaffStore] Error fetching staff for department ${departmentId}:`, error.message)
            }
          }
        }
        
        // Sort by createdAt (newest first)
        allStaff.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || a.createdAt || 0
          const dateB = b.createdAt?.toMillis?.() || b.createdAt || 0
          return dateB - dateA
        })

        const staff = allStaff

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

      // Get userId for hierarchical path (superadmin's UID)
      const userId = await getQueryUserId()
      if (!userId) {
        this.error = 'User ID not available'
        this.loading = false
        return []
      }

      try {
        // Use hierarchical path: users/{userId}/stores/{storeId}/departments/{departmentId}/staff
        const staffRef = getStaffCollection(db, userId, storeId, departmentId)
        const querySnapshot = await getDocs(staffRef)

        const staff: Staff[] = []
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          // Double-check that the staff belongs to this user
          if (data.createdBy === userId) {
            staff.push({
              id: docSnapshot.id,
              ...data,
              departmentId: departmentId, // Ensure departmentId is set
            } as Staff)
          }
        })
        
        // Sort by createdAt (newest first)
        staff.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || a.createdAt || 0
          const dateB = b.createdAt?.toMillis?.() || b.createdAt || 0
          return dateB - dateA
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

      // Get userId and storeId for hierarchical path
      const userId = await getQueryUserId()
      if (!userId) {
        throw new Error('User ID not available')
      }
      
      const storeId = await getCurrentStoreId()
      if (!storeId) {
        throw new Error('No store selected')
      }

      try {
        // We need to search through all departments to find the staff member
        // Since staff are nested under departments, we'll search through each department
        const { getDepartmentsCollection } = await import('~/composables/useFirestorePaths')
        const departmentsRef = getDepartmentsCollection(db, userId, storeId)
        const departmentsSnapshot = await getDocs(departmentsRef)
        
        for (const deptDoc of departmentsSnapshot.docs) {
          const departmentId = deptDoc.id
          try {
            const staffRef = getStaffDocument(db, userId, storeId, departmentId, staffId)
        const staffSnap = await getDoc(staffRef)

            if (staffSnap.exists()) {
        const data = staffSnap.data()

        // Only return staff if it belongs to this user
              if (data.createdBy === userId) {
        const staffData = {
          id: staffSnap.id,
          ...data,
                  departmentId: departmentId,
        } as Staff

                // Get department name
        const departmentsStore = useDepartmentsStore()
                const department = departmentsStore.getDepartmentById(departmentId) || await departmentsStore.fetchDepartment(departmentId)
        
                if (department) {
                  staffData.departmentName = department.name
        }

        // Update in store if exists
        const index = this.staff.findIndex(s => s.id === staffId)
        if (index > -1) {
          this.staff[index] = staffData
        }

        return staffData
              }
            }
          } catch (error: any) {
            // Continue searching other departments
            continue
          }
        }
        
        return null
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

        // CRITICAL: Always use the department's storeId to ensure staff is created under the correct store -> department hierarchy
        // The staff must be created in the same store as the department where they are being added
        const storeId = department.storeId
        if (!storeId) {
          throw new Error('Department does not have a store assigned. Please assign the department to a store before adding staff.')
        }
        
        console.log('[Staff Creation] Creating staff under store -> department:', {
          storeId: storeId,
          departmentId: staffData.departmentId,
          departmentName: department.name
        })

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

            // Step 3: Skip creating top-level user document for staff
            // Staff members should only exist in the hierarchical structure:
            // users/{superadminUID}/stores/{storeId}/departments/{departmentId}/staff/{staffId}
            // This prevents duplicate user documents and keeps staff data organized under their superadmin
            console.log('[Staff Creation] Skipping top-level user document creation - staff will only exist in hierarchical structure')
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
        
        // Step 4.5: Restore store context after sign-in
        // The storeId might be lost during sign-out/sign-in, so restore it
        if (import.meta.client && storeId) {
          try {
            // Save storeId to localStorage before it might be lost
            localStorage.setItem('currentStoreId', storeId)
            console.log('[Staff Creation] Saved storeId to localStorage:', storeId)
            
            // Restore store context in stores store
            const { useStoresStore } = await import('./stores')
            const storesStore = useStoresStore()
            storesStore.currentStoreId = storeId
            console.log('[Staff Creation] Restored storeId in storesStore:', storeId)
          } catch (restoreError) {
            console.warn('[Staff Creation] Could not restore store context:', restoreError)
          }
        }

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
        
        // Clean undefined values - Firestore doesn't accept undefined
        const cleanedStaffData = Object.fromEntries(
          Object.entries(staffDataWithoutPassword).filter(([_, value]) => value !== undefined)
        ) as Omit<Staff, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'departmentName' | 'storeId' | 'authUid'>
        
        // Use hierarchical path: users/{userId}/stores/{storeId}/departments/{departmentId}/staff
        const userId = authStore.currentUser.uid
        const staffRef = getStaffCollection(db, userId, storeId, staffData.departmentId)
        const newStaffRef = doc(staffRef)

        // StoreId is already obtained from the department above (auto-assigned)

        const newStaff: Omit<Staff, 'id' | 'departmentName'> = {
          ...cleanedStaffData,
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

        // Update department staff count - pass storeId directly to avoid "No store selected" error
        await departmentsStore.updateStaffCount(staffData.departmentId, department.staffCount + 1, storeId)

        // If staff is a manager, update department manager
        if (staffData.role === 'manager') {
          await departmentsStore.updateDepartment(staffData.departmentId, {
            manager: `${staffData.firstName} ${staffData.lastName}`,
            managerId: newStaffRef.id,
          } as Partial<import('~/composables/useDepartments').Department>)
        }

        // Add to local state with all required fields
        // CRITICAL: Ensure createdBy is set so fetchCurrentStaffMember can find the superadmin UID
        const staffWithDept: Staff = {
          id: newStaffRef.id,
          ...newStaff,
          departmentId: staffData.departmentId, // Ensure departmentId is set
          storeId: storeId, // Ensure storeId is set
          createdBy: authStore.currentUser.uid, // CRITICAL: Set createdBy so fetchCurrentStaffMember can find superadmin
          departmentName: department.name,
        }
        this.staff.unshift(staffWithDept)
        console.log('[Staff Creation] Staff added to local state with createdBy:', authStore.currentUser.uid)

        // Clear staff creation flag on success
        if (import.meta.client) {
          sessionStorage.removeItem('staff_creation_in_progress')
        }

        // CRITICAL: Ensure store context is properly restored BEFORE returning
        // This prevents "No store selected" errors and allows modal to close immediately
        if (import.meta.client && storeId) {
          try {
            const { useStoresStore } = await import('./stores')
            const storesStore = useStoresStore()
            
            // Restore store context immediately and synchronously
            storesStore.currentStoreId = storeId
            localStorage.setItem('currentStoreId', storeId)
            console.log('[Staff Creation] Store context restored:', storeId)
            
            // Initialize stores if needed (but don't wait if it fails)
            if (storesStore.stores.length === 0) {
              // Do this in background, don't await
              storesStore.initializeCurrentStore().catch(initError => {
                console.warn('[Staff Creation] Could not initialize stores, but continuing:', initError)
              })
            }
          } catch (storeError) {
            console.warn('[Staff Creation] Could not restore store context:', storeError)
            // Don't throw - we still want to return success and close modal
          }
        }

        // Return success immediately - modal can close now
        // Staff was successfully created, background refresh will happen asynchronously
        const staffId = newStaffRef.id

        // Refresh data in the background (non-blocking) AFTER returning
        // This ensures modal closes immediately and errors don't prevent closing
        if (import.meta.client) {
          // Use setTimeout to ensure store context is fully restored before refresh
          // Wrap in try-catch to prevent unhandled promise rejections
          setTimeout(async () => {
            try {
              // Ensure store context is set before refresh
              if (storeId && import.meta.client) {
                const { useStoresStore } = await import('./stores')
                const storesStore = useStoresStore()
                if (!storesStore.currentStoreId) {
                  storesStore.currentStoreId = storeId
                  localStorage.setItem('currentStoreId', storeId)
                  console.log('[Staff Creation] Re-ensuring store context before refresh:', storeId)
                }
              }
              
          Promise.all([
                // Refresh staff list for the department (most important for table display)
                this.fetchStaffByDepartment(staffData.departmentId).catch(err => {
              console.warn('[Staff Creation] Background refresh: Failed to refresh department staff:', err)
                  return null // Return null instead of throwing
                }),
            // Refresh overall staff list for consistency across pages
                this.fetchStaff().catch(err => {
              console.warn('[Staff Creation] Background refresh: Failed to refresh staff list:', err)
                  return null // Return null instead of throwing
                }),
                // Refresh department to update staff count - pass storeId directly to avoid "No store selected" error
                departmentsStore.fetchDepartment(staffData.departmentId, storeId).catch(err => {
              console.warn('[Staff Creation] Background refresh: Failed to refresh department:', err)
                  return null // Return null instead of throwing
                }),
                // Refresh departments list to ensure it loads properly
                departmentsStore.fetchDepartments().catch(err => {
                  console.warn('[Staff Creation] Background refresh: Failed to refresh departments:', err)
                  return null // Return null instead of throwing
                }),
          ]).then(() => {
                console.log('[Staff Creation] ✅ Background refresh completed - staff should now be visible in table')
          }).catch(err => {
                // All errors are already caught above, this should not happen
                console.warn('[Staff Creation] Unexpected error in background refresh:', err)
          })
            } catch (syncError) {
              // Catch any synchronous errors in the setTimeout callback
              console.warn('[Staff Creation] Error in background refresh setup:', syncError)
            }
          }, 500) // Increased delay to ensure store context is fully set and staff is in Firestore
        }

        return staffId
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

        // Get userId, storeId, and departmentId for hierarchical path
        const userId = authStore.currentUser.uid
        const storeId = await getCurrentStoreId()
        if (!storeId) {
          throw new Error('No store selected')
        }
        const departmentId = staffMember.departmentId

        // If department is being changed, verify new department belongs to user and update counts
        if (updates.departmentId && updates.departmentId !== departmentId) {
            const departmentsStore = useDepartmentsStore()
            
            // Verify new department belongs to this user
            const newDept = departmentsStore.getDepartmentById(updates.departmentId) || await departmentsStore.fetchDepartment(updates.departmentId)
          if (!newDept || newDept.createdBy !== userId) {
              throw new Error('Department not found or access denied')
            }
            
            // Decrease old department count (verify it belongs to user)
          const oldDept = departmentsStore.getDepartmentById(departmentId)
          if (oldDept && oldDept.createdBy === userId) {
            // Pass storeId from old department
            await departmentsStore.updateStaffCount(departmentId, Math.max(0, oldDept.staffCount - 1), oldDept.storeId)
            }
            
          // Increase new department count - pass storeId from new department
          await departmentsStore.updateStaffCount(updates.departmentId, newDept.staffCount + 1, newDept.storeId)
          
          // If department changed, we need to move the staff document to the new department
          // Delete from old department and create in new department
          const oldStaffRef = getStaffDocument(db, userId, storeId, departmentId, staffId)
          const newStaffRef = getStaffDocument(db, userId, storeId, updates.departmentId, staffId)
          
          // Get current staff data
          const currentStaffData = (await getDoc(oldStaffRef)).data()
          if (currentStaffData) {
            // Create in new department
            await setDoc(newStaffRef, {
              ...currentStaffData,
              ...updates,
              departmentId: updates.departmentId,
              updatedAt: serverTimestamp(),
            })
            // Delete from old department
            await deleteDoc(oldStaffRef)
          }
        } else {
          // Use hierarchical path: users/{userId}/stores/{storeId}/departments/{departmentId}/staff/{staffId}
          const staffRef = getStaffDocument(db, userId, storeId, departmentId, staffId)
        await updateDoc(staffRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        })
        }

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
          // Get the old role before the update
          const oldRole = staffMember.role
          const newRole = updates.role
          
          const departmentsStore = useDepartmentsStore()
          const dept = departmentsStore.getDepartmentById(staffMember.departmentId)
          
          if (dept && dept.createdBy === authStore.currentUser.uid) {
            // If role changed to manager, set as manager
            if (newRole === 'manager') {
              const updatedStaff = this.getStaffMember(staffId) || await this.fetchStaffMember(staffId)
              if (updatedStaff) {
                await departmentsStore.updateDepartment(staffMember.departmentId, {
                  manager: `${updatedStaff.firstName} ${updatedStaff.lastName}`,
                  managerId: staffId,
                } as Partial<import('~/composables/useDepartments').Department>)
              }
            }
              // If role changed from manager to something else (like staff), clear manager and set to "not assigned"
              else if (oldRole === 'manager' && (newRole === 'staff' || newRole === 'intern')) {
                // Check if this staff member is currently the manager of the department
                if (dept.managerId === staffId) {
                  // Use deleteField() to properly remove the fields from Firestore
                  const db = useFirestore().getFirestoreInstance()
                  if (db) {
                    // Use hierarchical path for department update
                    const departmentRef = getDepartmentDocument(db, userId, storeId, staffMember.departmentId)
                    await updateDoc(departmentRef, {
                      manager: deleteField(),
                      managerId: deleteField(),
                      updatedAt: serverTimestamp(),
                    })
                    
                    // Update local state to reflect the change immediately (set to undefined so UI shows "Not assigned")
                    const deptIndex = departmentsStore.departments.findIndex(d => d.id === staffMember.departmentId)
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

        // Get userId, storeId, and departmentId for hierarchical path
        const userId = authStore.currentUser.uid
        const storeId = await getCurrentStoreId()
        if (!storeId) {
          throw new Error('No store selected')
        }
        const departmentId = staffMember.departmentId
        
        // Use hierarchical path: users/{userId}/stores/{storeId}/departments/{departmentId}/staff/{staffId}
        const staffRef = getStaffDocument(db, userId, storeId, departmentId, staffId)
        await deleteDoc(staffRef)

        // Update department staff count (verify department belongs to user)
        const departmentsStore = useDepartmentsStore()
        const department = departmentsStore.getDepartmentById(staffMember.departmentId)
        if (department && department.createdBy === authStore.currentUser.uid) {
          // Pass storeId from department to avoid "No store selected" error
          await departmentsStore.updateStaffCount(staffMember.departmentId, Math.max(0, department.staffCount - 1), department.storeId)
          
          // If this staff member was the manager, clear the manager fields (set to "not assigned")
          if (staffMember.role === 'manager' && department.managerId === staffId) {
            const departmentRef = getDepartmentDocument(db, userId, storeId, staffMember.departmentId)
            await updateDoc(departmentRef, {
              manager: deleteField(),
              managerId: deleteField(),
              updatedAt: serverTimestamp(),
            })
            
            // Update local state to reflect the change immediately (set to undefined so UI shows "Not assigned")
            const deptIndex = departmentsStore.departments.findIndex(d => d.id === staffMember.departmentId)
            if (deptIndex > -1) {
              departmentsStore.departments[deptIndex] = {
                ...departmentsStore.departments[deptIndex],
                manager: undefined,
                managerId: undefined,
              } as Department
            }
          }
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

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }

      // For staff users, search through hierarchical structure
      if (userStore.userData?.role === 'staff') {
        // First check if staff member is already in local state (from fetchStaff)
        const cachedStaff = this.getCurrentStaffMember
        if (cachedStaff && cachedStaff.storeId) {
          console.log('[StaffStore] Found staff member in cache:', cachedStaff.storeId)
          return cachedStaff
        }

        // Check if staff creation is in progress - if so, skip this lookup
        // During staff creation, the superadmin temporarily signs in as the new staff
        // but the staff document may not be fully saved yet
        const isStaffCreationInProgress = import.meta.client 
          ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
          : false
        
        if (isStaffCreationInProgress) {
          console.log('[StaffStore] Staff creation in progress - skipping fetchCurrentStaffMember to avoid lookup during creation')
          return null
        }

        // Get superadmin UID - try legacy collection first, then cache, then search hierarchically
        let superadminUserId: string | null = null
        
        // First try legacy collection
      try {
        const staffRef = collection(db, 'staff')
        const staffQuery = query(staffRef, where('authUid', '==', authStore.currentUser.uid))
        const staffSnapshot = await getDocs(staffQuery)

          if (!staffSnapshot.empty && staffSnapshot.docs[0]) {
            const staffData = staffSnapshot.docs[0].data()
            if (staffData.createdBy) {
              superadminUserId = staffData.createdBy
              console.log('[StaffStore] Found superadmin UID from legacy collection:', superadminUserId)
            }
          }
        } catch (error: any) {
          console.warn('[StaffStore] Could not fetch from legacy collection:', error.message)
        }
        
        // If not found, try cache - check all staff in local state, not just getCurrentStaffMember
        if (!superadminUserId) {
          // First try getCurrentStaffMember (faster)
          const cachedStaff = this.getCurrentStaffMember
          if (cachedStaff?.createdBy) {
            superadminUserId = cachedStaff.createdBy
            console.log('[StaffStore] Found superadmin UID from getCurrentStaffMember cache:', superadminUserId)
          } else {
            // If not found, search all staff in local state
            const foundStaff = this.staff.find(s => s.authUid === authStore.currentUser?.uid)
            if (foundStaff?.createdBy) {
              superadminUserId = foundStaff.createdBy
              console.log('[StaffStore] Found superadmin UID from staff array cache:', superadminUserId)
            }
          }
        }
        
        // If still not found, we need to search hierarchically
        // Search through all superadmins' stores to find this staff member
        if (!superadminUserId) {
          console.log('[StaffStore] Superadmin UID not found in cache/legacy - searching all hierarchical structures...')
          try {
            // Get all superadmin users from top-level users collection
            const usersRef = collection(db, 'users')
            const usersSnapshot = await getDocs(usersRef)
            
            for (const userDoc of usersSnapshot.docs) {
              const potentialSuperadminId = userDoc.id
              const userData = userDoc.data()
              
              // Only search superadmins
              if (userData.role !== 'superAdmin') continue
              
              try {
                const { getStoresCollection } = await import('~/composables/useFirestorePaths')
                const storesRef = getStoresCollection(db, potentialSuperadminId)
                const storesSnapshot = await getDocs(storesRef)
                
                for (const storeDoc of storesSnapshot.docs) {
                  const storeId = storeDoc.id
                  const { getDepartmentsCollection } = await import('~/composables/useFirestorePaths')
                  const departmentsRef = getDepartmentsCollection(db, potentialSuperadminId, storeId)
                  const departmentsSnapshot = await getDocs(departmentsRef)
                  
                  for (const deptDoc of departmentsSnapshot.docs) {
                    const departmentId = deptDoc.id
                    try {
                      const staffRef = getStaffCollection(db, potentialSuperadminId, storeId, departmentId)
                      const staffSnapshot = await getDocs(staffRef)
                      
                      for (const staffDoc of staffSnapshot.docs) {
                        const staffData = staffDoc.data()
                        if (staffData.authUid === authStore.currentUser.uid) {
                          // Found the staff member!
                          superadminUserId = potentialSuperadminId
                          console.log('[StaffStore] Found staff member in hierarchical structure, superadmin UID:', superadminUserId)
                          break
                        }
                      }
                      if (superadminUserId) break
                    } catch (e) {
                      continue
                    }
                  }
                  if (superadminUserId) break
                }
                if (superadminUserId) break
              } catch (e) {
                continue
              }
            }
          } catch (searchError: any) {
            console.warn('[StaffStore] Error searching hierarchical structure:', searchError.message)
          }
          
          if (!superadminUserId) {
            console.warn('[StaffStore] Could not find staff member in any hierarchical structure')
          return null
        }
        }

        // Now search through all stores and departments under this superadmin
        try {
          const { getStoresCollection } = await import('~/composables/useFirestorePaths')
          const storesRef = getStoresCollection(db, superadminUserId)
          const storesSnapshot = await getDocs(storesRef)
          
          for (const storeDoc of storesSnapshot.docs) {
            const storeId = storeDoc.id
            const { getDepartmentsCollection } = await import('~/composables/useFirestorePaths')
            const departmentsRef = getDepartmentsCollection(db, superadminUserId, storeId)
            const departmentsSnapshot = await getDocs(departmentsRef)
            
            for (const deptDoc of departmentsSnapshot.docs) {
              const departmentId = deptDoc.id
              try {
                const staffRef = getStaffCollection(db, superadminUserId, storeId, departmentId)
                const staffSnapshot = await getDocs(staffRef)
                
                for (const staffDoc of staffSnapshot.docs) {
                  const staffData = staffDoc.data()
                  if (staffData.authUid === authStore.currentUser.uid) {
                    const foundStaff: Staff = {
          id: staffDoc.id,
                      firstName: staffData.firstName || '',
                      lastName: staffData.lastName || '',
                      email: staffData.email || '',
                      phone: staffData.phone,
                      departmentId: departmentId,
                      storeId: staffData.storeId || storeId,
                      position: staffData.position || '',
                      role: staffData.role || 'staff',
                      hireDate: staffData.hireDate || '',
                      salary: staffData.salary,
                      status: staffData.status || 'active',
                      authUid: staffData.authUid,
                      createdAt: staffData.createdAt,
                      updatedAt: staffData.updatedAt,
                      createdBy: staffData.createdBy || superadminUserId,
                    }

        // Get department name
        const departmentsStore = useDepartmentsStore()
                    const department = departmentsStore.getDepartmentById(departmentId)
                    if (department) {
                      foundStaff.departmentName = department.name
                    }
                    
                    // Add to local state for future lookups
                    const existingIndex = this.staff.findIndex(s => s.id === foundStaff.id)
                    if (existingIndex === -1) {
                      this.staff.push(foundStaff)
                    }
                    
                    console.log('[StaffStore] Found staff member in hierarchical structure:', foundStaff.storeId)
                    return foundStaff
                  }
                }
          } catch (e) {
                continue
              }
            }
          }
        } catch (error: any) {
          console.error('[StaffStore] Error searching hierarchical structure for staff member:', error)
        }

        console.warn('[StaffStore] Could not find staff member in hierarchical structure')
        return null
      }
      
      // For superadmin, search through all their stores and departments
      const userId = authStore.currentUser.uid
      try {
        const { getStoresCollection } = await import('~/composables/useFirestorePaths')
        const storesRef = getStoresCollection(db, userId)
        const storesSnapshot = await getDocs(storesRef)
        
        for (const storeDoc of storesSnapshot.docs) {
          const storeId = storeDoc.id
          const { getDepartmentsCollection } = await import('~/composables/useFirestorePaths')
          const departmentsRef = getDepartmentsCollection(db, userId, storeId)
          const departmentsSnapshot = await getDocs(departmentsRef)
          
          for (const deptDoc of departmentsSnapshot.docs) {
            const departmentId = deptDoc.id
            try {
              const staffRef = getStaffCollection(db, userId, storeId, departmentId)
              const staffSnapshot = await getDocs(staffRef)
              
              for (const staffDoc of staffSnapshot.docs) {
                const staffData = staffDoc.data()
                if (staffData.authUid === authStore.currentUser.uid) {
                  const foundStaff = {
                    id: staffDoc.id,
                    ...staffData,
                    departmentId: departmentId,
                    storeId: storeId,
                  } as Staff
                  
                  // Get department name
                  const departmentsStore = useDepartmentsStore()
                  const department = departmentsStore.getDepartmentById(departmentId)
        if (department) {
                    foundStaff.departmentName = department.name
        }

                  return foundStaff
                }
              }
            } catch (e) {
              continue
            }
          }
        }
      } catch (error: any) {
        console.error('Error fetching current staff member:', error)
      }
      
      return null
    },
  },
})

