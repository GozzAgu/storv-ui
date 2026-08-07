import { defineStore } from 'pinia'
import { CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirebaseClientAuthForApp } from '~/utils/firebase-client-auth'
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
  deleteField,
  collectionGroup,
  type Firestore,
} from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'
import { useDepartmentsStore } from './departments'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { getStaffCollection,
  getStaffDocument,
  getDepartmentDocument,
  getQueryUserId,
} from '~/composables/useFirestorePaths'
import { normalizeEntityName } from '~/utils/capitalize-text'
import { getPlanLimits } from '~/types/subscription'
import type { SubscriptionPlan } from '~/types/subscription'
import type { Staff } from '~/composables/useStaff'
import type { Department } from '~/composables/useDepartments'
import { getFirebaseConfig } from '~/config/firebase.config'
import { sendUserEmailVerification } from '~/utils/emailVerification'
import { resolveApiPath } from '~/utils/api-url'

function isActiveStaffStatus(status: Staff['status'] | undefined): boolean {
  return (status || 'active') === 'active'
}

function isRemovedStaffStatus(status: Staff['status'] | undefined): boolean {
  return status === 'inactive'
}

function parseStaffLifecycleApiError(error: any, fallback: string): Error {
  const dataMessage =
    error?.data?.message ||
    error?.data?.statusMessage ||
    (typeof error?.response?._data?.message === 'string' ? error.response._data.message : undefined)
  const status = error?.statusCode ?? error?.status ?? error?.response?.status
  if (status === 503) {
    return new Error(
      dataMessage ||
        'This action is temporarily unavailable. Please try again later or contact Storvv support.'
    )
  }
  if (status === 403) {
    return new Error(dataMessage || 'Only the store owner can manage staff access')
  }
  return new Error(dataMessage || error?.message || fallback)
}

async function assertStaffPlanCapacity(storeId: string): Promise<void> {
  const userStore = useUserStore()
  if (!userStore.userData) {
    const authStore = useAuthStore()
    if (authStore.currentUser) {
      await userStore.fetchUserData(authStore.currentUser.uid)
    }
  }
  const plan = (userStore.userData?.subscription as SubscriptionPlan) || 'storvv_micro'
  const limits = getPlanLimits(plan)
  const departmentsStore = useDepartmentsStore()
  const staffCountInStore = departmentsStore.departments
    .filter((d) => d.storeId === storeId)
    .reduce((sum, d) => sum + (d.staffCount || 0), 0)
  if (limits.maxStaffPerStore >= 0 && staffCountInStore >= limits.maxStaffPerStore) {
    const msg =
      plan === 'storvv_micro'
        ? 'Storvv Micro allows up to 2 staff per store. Upgrade to Medium or Enterprise for more.'
        : `Your plan allows up to ${limits.maxStaffPerStore} staff per store. Upgrade to Enterprise for unlimited.`
    throw new Error(msg)
  }
}

const getStoreMemberDoc = (db: Firestore, userId: string, storeId: string, memberAuthUid: string) =>
  doc(db, `users/${userId}/stores/${storeId}/members/${memberAuthUid}`)

export const useStaffStore = defineStore('staff', {
  state: () => ({
    staff: [] as Staff[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    totalStaff: (state) => state.staff.length,
    getStaffByDepartment: (state) => (departmentId: string) =>
      state.staff.filter(
        (s) => s.departmentId === departmentId && (s.status || 'active') === 'active'
      ),
    getStaffMember: (state) => (staffId: string) => state.staff.find((s) => s.id === staffId),
    getCurrentStaffMember: (state) => {
      const authStore = useAuthStore()
      if (!authStore.currentUser) return null
      return (
        state.staff.find(
          (s) => s.authUid === authStore.currentUser?.uid && isActiveStaffStatus(s.status)
        ) || null
      )
    },
  },

  actions: {
    // Get all staff
    async fetchStaff() {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const storeId = (await getCurrentStoreId()) || ''
        const { getDemoStaff } = await import('~/utils/demo-bridge')
        this.staff = getDemoStaff(storeId)
        this.loading = false
        this.error = null
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

        const departmentStaffLists = await Promise.all(
          departmentsSnapshot.docs.map(async (deptDoc) => {
            const departmentId = deptDoc.id
            const deptData = deptDoc.data()

            if (deptData.createdBy !== userId) return [] as Staff[]

            try {
              const staffRef = getStaffCollection(db, userId, storeId, departmentId)
              const staffSnapshot = await getDocs(staffRef)
              const deptStaff: Staff[] = []

              staffSnapshot.forEach((staffDoc) => {
                const staffData = staffDoc.data()
                if (staffData.createdBy === userId) {
                  deptStaff.push({
                    id: staffDoc.id,
                    ...staffData,
                    departmentId,
                  } as Staff)
                }
              })

              return deptStaff
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : String(error)
              console.warn(
                `[StaffStore] Error fetching staff for department ${departmentId}:`,
                message
              )
              return [] as Staff[]
            }
          })
        )

        for (const list of departmentStaffLists) {
          allStaff.push(...list)
        }

        // Sort by createdAt (newest first)
        allStaff.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || a.createdAt || 0
          const dateB = b.createdAt?.toMillis?.() || b.createdAt || 0
          return dateB - dateA
        })

        const activeStaff = allStaff.filter((s) => isActiveStaffStatus(s.status))

        // Security rules now rely on members docs for store-level authorization.
        // Backfill missing membership docs when super admin fetches staff.
        if (authStore.currentUser.uid === userId) {
          await Promise.allSettled(
            activeStaff
              .filter((s) => s.authUid)
              .map((s) =>
                setDoc(
                  getStoreMemberDoc(db, userId, storeId, s.authUid as string),
                  {
                    authUid: s.authUid,
                    staffId: s.id,
                    storeId,
                    departmentId: s.departmentId,
                    role: s.role || 'staff',
                    status: s.status || 'active',
                    createdBy: userId,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                )
              )
          )
        }

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

        departmentsStore.departments.forEach((d) => {
          departmentMap.set(d.id, d.name)
        })

        this.staff = activeStaff.map((s) => ({
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
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const storeId = (await getCurrentStoreId()) || ''
        const { getDemoStaff } = await import('~/utils/demo-bridge')
        const deptStaff = getDemoStaff(storeId).filter((s) => s.departmentId === departmentId)
        this.staff = [...this.staff.filter((s) => s.departmentId !== departmentId), ...deptStaff]
        this.loading = false
        this.error = null
        return deptStaff
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
        const department =
          departmentsStore.getDepartmentById(departmentId) ||
          (await departmentsStore.fetchDepartment(departmentId))

        // Verify department belongs to this user
        if (department && department.createdBy !== userId) {
          // Remove staff from this department if department doesn't belong to user
          this.staff = this.staff.filter((s) => s.departmentId !== departmentId)
          return []
        }

        // Merge/update staff for this department instead of replacing entire array
        // Remove existing staff from this department
        this.staff = this.staff.filter((s) => s.departmentId !== departmentId)

        // Add newly fetched staff for this department
        const activeDepartmentStaff = staff.filter((s) => isActiveStaffStatus(s.status))
        const staffWithDepartmentName = activeDepartmentStaff.map((s) => ({
          ...s,
          departmentName: department?.name || 'Unknown',
        }))

        this.staff.push(...staffWithDepartmentName)

        return staffWithDepartmentName
      } catch (error: any) {
        console.error('Error getting staff by department:', error)
        this.error = error.message || 'Failed to fetch staff'
        return []
      } finally {
        this.loading = false
      }
    },

    /** Inactive (removed) staff for a department - owner roster / reactivation */
    async fetchInactiveStaffByDepartment(departmentId: string): Promise<Staff[]> {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const storeId = (await getCurrentStoreId()) || ''
        const { getDemoExtrasStaff } = await import('~/utils/demo-extras')
        return getDemoExtrasStaff(storeId, 'inactive').filter(
          (s) => s.departmentId === departmentId
        )
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) return []

      const authStore = useAuthStore()
      if (!authStore.currentUser) return []

      const storeId = await getCurrentStoreId()
      if (!storeId) return []

      const userId = await getQueryUserId()
      if (!userId) return []

      try {
        const staffRef = getStaffCollection(db, userId, storeId, departmentId)
        const querySnapshot = await getDocs(staffRef)
        const inactive: Staff[] = []

        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          if (data.createdBy === userId && isRemovedStaffStatus(data.status as Staff['status'])) {
            inactive.push({
              id: docSnapshot.id,
              ...data,
              departmentId,
              storeId,
            } as Staff)
          }
        })

        inactive.sort((a, b) => {
          const sortKey = (s: Staff) => {
            const removed = s.removedAt as { toMillis?: () => number } | undefined
            const updated = s.updatedAt as { toMillis?: () => number } | undefined
            return removed?.toMillis?.() || updated?.toMillis?.() || 0
          }
          return sortKey(b) - sortKey(a)
        })

        const departmentsStore = useDepartmentsStore()
        const department =
          departmentsStore.getDepartmentById(departmentId) ||
          (await departmentsStore.fetchDepartment(departmentId))
        const departmentName = department?.name || 'Unknown'

        return inactive.map((s) => ({ ...s, departmentName }))
      } catch (error: any) {
        console.error('Error fetching removed staff:', error)
        return []
      }
    },

    // Get a single staff member
    async fetchStaffMember(staffId: string): Promise<Staff | null> {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const storeId = (await getCurrentStoreId()) || ''
        const { getDemoExtrasStaff } = await import('~/utils/demo-extras')
        return getDemoExtrasStaff(storeId, 'all').find((s) => s.id === staffId) ?? null
      }

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
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
                const department =
                  departmentsStore.getDepartmentById(departmentId) ||
                  (await departmentsStore.fetchDepartment(departmentId))

                if (department) {
                  staffData.departmentName = department.name
                }

                // Update in store if exists
                const index = this.staff.findIndex((s) => s.id === staffId)
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

    // Create a new staff member: frontend creates Firebase Auth account (secondary app) + Firestore doc. Admin types password in the form.
    async createStaff(
      staffData: Omit<
        Staff,
        'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'departmentName' | 'storeId'
      > & { password: string }
    ) {
      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated to create staff')
      }

      const { isDemoModeActive, DEMO_USER_UID } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const departmentsStore = useDepartmentsStore()
        const department = departmentsStore.getDepartmentById(staffData.departmentId)
        const storeId = department?.storeId || (await getCurrentStoreId()) || ''
        const { password: _pw, ...fields } = staffData
        const staffId = `demo_staff_${Math.random().toString(36).slice(2, 9)}`
        const now = new Date()
        const demoMember: Staff = {
          id: staffId,
          ...fields,
          firstName: normalizeEntityName(fields.firstName),
          lastName: normalizeEntityName(fields.lastName),
          storeId,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          createdBy: DEMO_USER_UID,
          departmentName: department?.name || 'Unknown',
        }
        const { getDemoExtrasStaff, setDemoExtrasStaff } = await import('~/utils/demo-extras')
        const all = getDemoExtrasStaff(storeId, 'all')
        all.unshift(demoMember)
        setDemoExtrasStaff(storeId, all)
        this.staff = all.filter((s) => (s.status || 'active') === 'active')
        return { staffId, temporaryPassword: staffData.password }
      }
      if (!staffData.email?.trim()) {
        throw new Error('Staff email is required')
      }
      const password = typeof staffData.password === 'string' ? staffData.password.trim() : ''
      if (!password || password.length < 6) {
        throw new Error('Password is required (at least 6 characters)')
      }

      const departmentsStore = useDepartmentsStore()
      const department =
        departmentsStore.getDepartmentById(staffData.departmentId) ||
        (await departmentsStore.fetchDepartment(staffData.departmentId))
      if (!department || department.createdBy !== authStore.currentUser.uid) {
        throw new Error('Department not found or access denied')
      }
      const storeId = department.storeId
      if (!storeId) {
        throw new Error(
          'Department does not have a store assigned. Please assign the department to a store before adding staff.'
        )
      }

      const userStore = useUserStore()
      if (!userStore.userData) {
        await userStore.fetchUserData(authStore.currentUser.uid)
      }
      const plan = (userStore.userData?.subscription as SubscriptionPlan) || 'storvv_micro'
      const limits = getPlanLimits(plan)
      const staffCountInStore = departmentsStore.departments
        .filter((d) => d.storeId === storeId)
        .reduce((sum, d) => sum + (d.staffCount || 0), 0)
      if (limits.maxStaffPerStore >= 0 && staffCountInStore >= limits.maxStaffPerStore) {
        const msg =
          plan === 'storvv_micro'
            ? 'Storvv Micro allows up to 2 staff per store. Upgrade to Medium or Enterprise for more.'
            : `Your plan allows up to ${limits.maxStaffPerStore} staff per store. Upgrade to Enterprise for unlimited.`
        throw new Error(msg)
      }

      const normalizedEmail = staffData.email.trim().toLowerCase()

      // Use a secondary Firebase app so creating the staff user does not sign out the admin
      const config = getFirebaseConfig()
      const apps = getApps()
      let staffApp: FirebaseApp = apps.find(
        (a: FirebaseApp) => a.name === 'StaffCreation'
      ) as FirebaseApp
      if (!staffApp) {
        staffApp = initializeApp(config, 'StaffCreation')
      }
      const authSecondary = getFirebaseClientAuthForApp(staffApp)
      const userCred = await createUserWithEmailAndPassword(
        authSecondary,
        normalizedEmail,
        password
      )
      const staffAuthUid = userCred.user.uid
      try {
        const rc = useRuntimeConfig()
        await sendUserEmailVerification(userCred.user, (rc.public.appOrigin as string) || '')
      } catch (err) {
        console.warn('[staff] Could not send verification email for new staff account:', err)
      }
      await signOut(authSecondary)

      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      }

      const superAdminUid = authStore.currentUser.uid
      const staffRef = doc(getStaffCollection(db, superAdminUid, storeId, staffData.departmentId))
      const staffId = staffRef.id

      const normalizedFirstName = normalizeEntityName(staffData.firstName)
      const normalizedLastName = normalizeEntityName(staffData.lastName)

      const newStaff = {
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        ...(staffData.phone !== undefined &&
          staffData.phone !== '' && { phone: String(staffData.phone).trim() }),
        departmentId: staffData.departmentId,
        storeId,
        position: staffData.position.trim(),
        role:
          staffData.role === 'manager' || staffData.role === 'intern' ? staffData.role : 'staff',
        ...(staffData.role === 'manager' && staffData.canManageInventory === true
          ? { canManageInventory: true as const }
          : {}),
        hireDate: staffData.hireDate || new Date().toISOString().split('T')[0],
        ...(staffData.salary !== undefined && { salary: Number(staffData.salary) }),
        status:
          staffData.status === 'inactive' || staffData.status === 'on_leave'
            ? staffData.status
            : 'active',
        authUid: staffAuthUid,
        mustChangePassword: true, // Staff must set a new password on first login
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: superAdminUid,
      }
      await setDoc(staffRef, newStaff)
      await setDoc(
        getStoreMemberDoc(db, superAdminUid, storeId, staffAuthUid),
        {
          authUid: staffAuthUid,
          staffId,
          storeId,
          departmentId: staffData.departmentId,
          role: newStaff.role,
          status: newStaff.status,
          createdBy: superAdminUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      await departmentsStore.updateStaffCount(
        staffData.departmentId,
        department.staffCount + 1,
        storeId
      )
      if (staffData.role === 'manager') {
        await departmentsStore.updateDepartment(staffData.departmentId, {
          manager: `${normalizedFirstName} ${normalizedLastName}`,
          managerId: staffId,
        } as Partial<import('~/composables/useDepartments').Department>)
      }

      const now = new Date()
      const { password: _pw, ...staffFields } = staffData
      const staffWithDept: Staff = {
        id: staffId,
        ...staffFields,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        storeId,
        authUid: staffAuthUid,
        mustChangePassword: true,
        createdAt: now,
        updatedAt: now,
        createdBy: superAdminUid,
        departmentName: department.name,
      }
      this.staff.unshift(staffWithDept)

      if (import.meta.client) {
        setTimeout(() => {
          this.fetchStaffByDepartment(staffData.departmentId).catch(() => {})
          this.fetchStaff().catch(() => {})
          departmentsStore.fetchDepartment(staffData.departmentId, storeId).catch(() => {})
          departmentsStore.fetchDepartments().catch(() => {})
        }, 500)
      }

      return { staffId, temporaryPassword: password }
    },

    // Clear mustChangePassword for the currently signed-in staff (after they set a new password)
    async clearMustChangePassword() {
      const db = useFirestore().getFirestoreInstance()
      if (!db) throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      const authStore = useAuthStore()
      if (!authStore.currentUser) throw new Error('User must be authenticated')
      const uid = authStore.currentUser.uid
      const staffCollectionGroup = collectionGroup(db, 'staff')
      const q = query(staffCollectionGroup, where('authUid', '==', uid))
      const snapshot = await getDocs(q)
      if (snapshot.empty || !snapshot.docs[0]) throw new Error('Staff document not found')
      const staffRef = snapshot.docs[0].ref
      await updateDoc(staffRef, { mustChangePassword: false, updatedAt: serverTimestamp() })
      const idx = this.staff.findIndex((s) => s.authUid === uid)
      if (idx !== -1) this.staff[idx] = { ...this.staff[idx]!, mustChangePassword: false }
    },

    // Update a staff member
    async updateStaff(
      staffId: string,
      updates: Partial<Omit<Staff, 'id' | 'createdAt' | 'createdBy' | 'departmentName'>>
    ) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      try {
        const userId = await getQueryUserId()
        if (!userId) {
          throw new Error('User ID not available')
        }

        // First verify the staff belongs to this account (super admin path for managers)
        const staffMember = this.getStaffMember(staffId) || (await this.fetchStaffMember(staffId))
        if (!staffMember || staffMember.createdBy !== userId) {
          throw new Error('Staff member not found or access denied')
        }

        // Get storeId and departmentId for hierarchical path
        const storeId = await getCurrentStoreId()
        if (!storeId) {
          throw new Error('No store selected')
        }
        const departmentId = staffMember.departmentId

        const normalizedUpdates = {
          ...updates,
          ...(updates.firstName !== undefined
            ? { firstName: normalizeEntityName(updates.firstName) }
            : {}),
          ...(updates.lastName !== undefined
            ? { lastName: normalizeEntityName(updates.lastName) }
            : {}),
        }

        // If department is being changed, verify new department belongs to user and update counts
        if (normalizedUpdates.departmentId && normalizedUpdates.departmentId !== departmentId) {
          const departmentsStore = useDepartmentsStore()

          // Verify new department belongs to this user
          const newDept =
            departmentsStore.getDepartmentById(normalizedUpdates.departmentId) ||
            (await departmentsStore.fetchDepartment(normalizedUpdates.departmentId))
          if (!newDept || newDept.createdBy !== userId) {
            throw new Error('Department not found or access denied')
          }

          // Decrease old department count (verify it belongs to user)
          const oldDept = departmentsStore.getDepartmentById(departmentId)
          if (oldDept && oldDept.createdBy === userId) {
            // Pass storeId from old department
            await departmentsStore.updateStaffCount(
              departmentId,
              Math.max(0, oldDept.staffCount - 1),
              oldDept.storeId
            )
          }

          // Increase new department count - pass storeId from new department
          await departmentsStore.updateStaffCount(
            normalizedUpdates.departmentId,
            newDept.staffCount + 1,
            newDept.storeId
          )

          // If department changed, we need to move the staff document to the new department
          // Delete from old department and create in new department
          const oldStaffRef = getStaffDocument(db, userId, storeId, departmentId, staffId)
          const newStaffRef = getStaffDocument(
            db,
            userId,
            storeId,
            normalizedUpdates.departmentId,
            staffId
          )

          // Get current staff data
          const currentStaffData = (await getDoc(oldStaffRef)).data()
          if (currentStaffData) {
            // Create in new department
            await setDoc(newStaffRef, {
              ...currentStaffData,
              ...normalizedUpdates,
              departmentId: normalizedUpdates.departmentId,
              updatedAt: serverTimestamp(),
            })
            // Delete from old department
            await deleteDoc(oldStaffRef)
          }

          // No longer manage the department they left
          if (oldDept?.managerId === staffId) {
            const departmentRef = getDepartmentDocument(db, userId, storeId, departmentId)
            await updateDoc(departmentRef, {
              manager: deleteField(),
              managerId: deleteField(),
              updatedAt: serverTimestamp(),
            })
            const deptIndex = departmentsStore.departments.findIndex((d) => d.id === departmentId)
            if (deptIndex > -1) {
              departmentsStore.departments[deptIndex] = {
                ...departmentsStore.departments[deptIndex],
                manager: undefined,
                managerId: undefined,
              } as Department
            }
          }
        } else {
          // Use hierarchical path: users/{userId}/stores/{storeId}/departments/{departmentId}/staff/{staffId}
          const staffRef = getStaffDocument(db, userId, storeId, departmentId, staffId)
          const mergedRole = normalizedUpdates.role ?? staffMember.role
          const inventoryPatch =
            mergedRole === 'manager' && normalizedUpdates.canManageInventory === true
              ? { canManageInventory: true }
              : mergedRole !== 'manager' || normalizedUpdates.canManageInventory === false
              ? { canManageInventory: deleteField() }
              : {}
          await updateDoc(staffRef, {
            ...normalizedUpdates,
            ...inventoryPatch,
            updatedAt: serverTimestamp(),
          })
        }

        // Keep store membership index in sync for security rules.
        const mergedRole = normalizedUpdates.role ?? staffMember.role
        const mergedStatus = normalizedUpdates.status ?? staffMember.status
        const mergedDepartmentId = normalizedUpdates.departmentId ?? staffMember.departmentId
        if (!staffMember.authUid) {
          throw new Error('Staff member is missing auth UID')
        }
        await setDoc(
          getStoreMemberDoc(db, userId, storeId, staffMember.authUid),
          {
            authUid: staffMember.authUid,
            staffId,
            storeId,
            departmentId: mergedDepartmentId,
            role: mergedRole,
            status: mergedStatus,
            createdBy: userId,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )

        // Update in local state
        const departmentsStoreForName = useDepartmentsStore()
        const deptForName =
          departmentsStoreForName.getDepartmentById(mergedDepartmentId) ||
          (await departmentsStoreForName.fetchDepartment(mergedDepartmentId).catch(() => null))
        const index = this.staff.findIndex((s) => s.id === staffId)
        if (index > -1) {
          const existing = this.staff[index]
          this.staff[index] = {
            ...existing,
            ...normalizedUpdates,
            departmentId: mergedDepartmentId,
            departmentName: deptForName?.name ?? existing?.departmentName,
          } as Staff
        }

        if (staffMember.authUid === authStore.currentUser?.uid) {
          await this.fetchCurrentStaffMember().catch(() => {})
        }

        // Handle role changes that affect department manager assignment
        if (normalizedUpdates.role !== undefined) {
          // Get the old role before the update
          const oldRole = staffMember.role
          const newRole = normalizedUpdates.role

          const departmentsStore = useDepartmentsStore()
          const dept = departmentsStore.getDepartmentById(mergedDepartmentId)

          if (dept && dept.createdBy === userId) {
            // If role changed to manager, set as manager
            if (newRole === 'manager') {
              const updatedStaff =
                this.getStaffMember(staffId) || (await this.fetchStaffMember(staffId))
              if (updatedStaff) {
                await departmentsStore.updateDepartment(mergedDepartmentId, {
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
                  const departmentRef = getDepartmentDocument(
                    db,
                    userId,
                    storeId,
                    mergedDepartmentId
                  )
                  await updateDoc(departmentRef, {
                    manager: deleteField(),
                    managerId: deleteField(),
                    updatedAt: serverTimestamp(),
                  })

                  // Update local state to reflect the change immediately (set to undefined so UI shows "Not assigned")
                  const deptIndex = departmentsStore.departments.findIndex(
                    (d) => d.id === mergedDepartmentId
                  )
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

    // Deactivate staff (soft-delete roster + disable Firebase Auth login)
    async deleteStaff(staffId: string, totpCode?: string): Promise<Staff> {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const { DEMO_USER_UID } = await import('~/utils/demo-mode')
        const member = this.getStaffMember(staffId) || (await this.fetchStaffMember(staffId))
        if (!member) throw new Error('Staff member not found')
        const storeId = member.storeId || (await getCurrentStoreId()) || ''
        const inactive = {
          ...member,
          status: 'inactive' as const,
          removedAt: new Date(),
          removedBy: DEMO_USER_UID,
        }
        const { getDemoExtrasStaff, setDemoExtrasStaff } = await import('~/utils/demo-extras')
        const all = getDemoExtrasStaff(storeId, 'all').map((s) => (s.id === staffId ? inactive : s))
        if (!all.some((s) => s.id === staffId)) all.push(inactive)
        setDemoExtrasStaff(storeId, all)
        this.staff = all.filter((s) => (s.status || 'active') === 'active')
        return inactive
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      try {
        const staffMember = this.getStaffMember(staffId) || (await this.fetchStaffMember(staffId))
        if (!staffMember || staffMember.createdBy !== authStore.currentUser.uid) {
          throw new Error('Staff member not found or access denied')
        }

        const ownerUserId = authStore.currentUser.uid
        const storeId = staffMember.storeId || (await getCurrentStoreId())
        if (!storeId) {
          throw new Error('No store selected')
        }
        const departmentId = staffMember.departmentId

        const token = await authStore.currentUser.getIdToken()
        await $fetch(resolveApiPath('/api/staff/deactivate'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            ownerUserId,
            storeId,
            departmentId,
            staffId,
            totpCode,
          },
        })

        const departmentsStore = useDepartmentsStore()
        const department = departmentsStore.getDepartmentById(staffMember.departmentId)
        if (department && department.createdBy === ownerUserId) {
          const newCount = Math.max(0, (department.staffCount || 0) - 1)
          const deptPatch: Partial<Department> = { staffCount: newCount }
          if (staffMember.role === 'manager' && department.managerId === staffId) {
            deptPatch.manager = undefined
            deptPatch.managerId = undefined
          }
          const deptIndex = departmentsStore.departments.findIndex(
            (d) => d.id === staffMember.departmentId
          )
          if (deptIndex > -1) {
            departmentsStore.departments[deptIndex] = {
              ...departmentsStore.departments[deptIndex],
              ...deptPatch,
            } as Department
          }
        }

        this.staff = this.staff.filter((s) => s.id !== staffId)
        return { ...staffMember, status: 'inactive' as const }
      } catch (error: any) {
        console.error('Error deactivating staff:', error)
        throw parseStaffLifecycleApiError(error, 'Failed to remove staff')
      }
    },

    // Reactivate removed staff (restore Firestore + enable Auth)
    async reactivateStaff(staffId: string, totpCode?: string): Promise<Staff> {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) {
        const storeId = (await getCurrentStoreId()) || ''
        const { getDemoExtrasStaff, setDemoExtrasStaff } = await import('~/utils/demo-extras')
        const all = getDemoExtrasStaff(storeId, 'all')
        const member = all.find((s) => s.id === staffId) || (await this.fetchStaffMember(staffId))
        if (!member) throw new Error('Staff member not found')
        const reactivated = {
          ...member,
          status: 'active' as const,
          removedAt: undefined,
          removedBy: undefined,
        }
        const next = all.map((s) => (s.id === staffId ? reactivated : s))
        if (!next.some((s) => s.id === staffId)) next.unshift(reactivated)
        setDemoExtrasStaff(storeId, next)
        this.staff = next.filter((s) => (s.status || 'active') === 'active')
        return reactivated
      }

      const authStore = useAuthStore()
      if (!authStore.currentUser) {
        throw new Error('User must be authenticated')
      }

      try {
        const staffMember = await this.fetchStaffMember(staffId)
        if (!staffMember || staffMember.createdBy !== authStore.currentUser.uid) {
          throw new Error('Staff member not found or access denied')
        }
        if (!isRemovedStaffStatus(staffMember.status)) {
          throw new Error('Only removed staff can be reactivated')
        }

        const ownerUserId = authStore.currentUser.uid
        const storeId = staffMember.storeId || (await getCurrentStoreId())
        if (!storeId) {
          throw new Error('No store selected')
        }

        await assertStaffPlanCapacity(storeId)

        const token = await authStore.currentUser.getIdToken()
        await $fetch(resolveApiPath('/api/staff/reactivate'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            ownerUserId,
            storeId,
            departmentId: staffMember.departmentId,
            staffId,
            totpCode,
          },
        })

        const departmentsStore = useDepartmentsStore()
        const department = departmentsStore.getDepartmentById(staffMember.departmentId)
        if (department && department.createdBy === ownerUserId) {
          const newCount = (department.staffCount || 0) + 1
          const deptPatch: Partial<Department> = { staffCount: newCount }
          if (staffMember.role === 'manager' && !department.managerId && staffMember.firstName) {
            deptPatch.manager = `${staffMember.firstName} ${staffMember.lastName}`.trim()
            deptPatch.managerId = staffId
          }
          const deptIndex = departmentsStore.departments.findIndex(
            (d) => d.id === staffMember.departmentId
          )
          if (deptIndex > -1) {
            departmentsStore.departments[deptIndex] = {
              ...departmentsStore.departments[deptIndex],
              ...deptPatch,
            } as Department
          }
        }

        const reactivated: Staff = {
          ...staffMember,
          status: 'active',
          removedAt: undefined,
          removedBy: undefined,
        }
        if (!this.staff.some((s) => s.id === staffId)) {
          this.staff.unshift(reactivated)
        }
        return reactivated
      } catch (error: any) {
        console.error('Error reactivating staff:', error)
        throw parseStaffLifecycleApiError(error, 'Failed to reactivate staff')
      }
    },

    // Get current logged-in staff member's data
    async fetchCurrentStaffMember(): Promise<Staff | null> {
      const { isDemoModeActive } = await import('~/utils/demo-mode')
      if (isDemoModeActive()) return null

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

      // For staff users, search through hierarchical structure
      if (userStore.userData?.role === 'staff') {
        // First check if staff member is already in local state (from fetchStaff)
        const cachedStaff = this.getCurrentStaffMember
        if (cachedStaff?.storeId && isActiveStaffStatus(cachedStaff.status)) {
          return cachedStaff
        }

        // Check if staff creation is in progress - if so, skip this lookup
        // During staff creation, the superadmin temporarily signs in as the new staff
        // but the staff document may not be fully saved yet
        const isStaffCreationInProgress = import.meta.client
          ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
          : false

        if (isStaffCreationInProgress) {
          // console.log('[StaffStore] Staff creation in progress - skipping fetchCurrentStaffMember to avoid lookup during creation')
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
              // console.log('[StaffStore] Found superadmin UID from legacy collection:', superadminUserId)
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
            // console.log('[StaffStore] Found superadmin UID from getCurrentStaffMember cache:', superadminUserId)
          } else {
            // If not found, search all staff in local state
            const foundStaff = this.staff.find((s) => s.authUid === authStore.currentUser?.uid)
            if (foundStaff?.createdBy) {
              superadminUserId = foundStaff.createdBy
              // console.log('[StaffStore] Found superadmin UID from staff array cache:', superadminUserId)
            }
          }
        }

        // If still not found, use collection group query to search ALL staff collections
        // This is more efficient and avoids permission issues with hierarchical paths
        if (!superadminUserId) {
          // console.log('[StaffStore] Superadmin UID not found in cache/legacy - using collection group query...')
          try {
            // Use collectionGroup to search across ALL staff collections regardless of path
            // This avoids permission issues when querying other superadmins' collections
            const { collectionGroup, query, where, getDocs } = await import('firebase/firestore')
            const staffCollectionGroup = collectionGroup(db, 'staff')
            const staffQuery = query(
              staffCollectionGroup,
              where('authUid', '==', authStore.currentUser.uid)
            )
            const staffSnapshot = await getDocs(staffQuery)

            if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
              // Found the staff member!
              const staffDoc = staffSnapshot.docs[0]
              if (!staffDoc) {
                console.warn('[StaffStore] Collection group query returned empty document')
                return null
              }

              const staffData = staffDoc.data()
              if (!staffData) {
                console.warn('[StaffStore] Staff document has no data')
                return null
              }

              if (staffData.createdBy) {
                superadminUserId = staffData.createdBy
                // console.log('[StaffStore] Found staff member via collection group query, superadmin UID:', superadminUserId)

                // Extract path information from the document reference
                // Path format: users/{userId}/stores/{storeId}/departments/{departmentId}/staff/{staffId}
                const pathParts = staffDoc.ref.path.split('/')
                let extractedStoreId: string | undefined
                let extractedDepartmentId: string | undefined

                if (pathParts.length >= 6) {
                  const extractedSuperadminId = pathParts[1] // users/{userId}
                  extractedStoreId = pathParts[3] // stores/{storeId}
                  extractedDepartmentId = pathParts[5] // departments/{departmentId}

                  // console.log('[StaffStore] Extracted from path - superadmin:', extractedSuperadminId, 'store:', extractedStoreId, 'dept:', extractedDepartmentId)

                  // Verify the extracted superadmin matches createdBy
                  if (extractedSuperadminId === superadminUserId) {
                    // console.log('[StaffStore] Path verification successful')
                  } else {
                    console.warn(
                      '[StaffStore] Path superadmin ID does not match createdBy, using createdBy:',
                      superadminUserId
                    )
                  }
                }

                // Build the staff object from the found document
                const foundStaff: Staff = {
                  id: staffDoc.id,
                  firstName: staffData.firstName || '',
                  lastName: staffData.lastName || '',
                  email: staffData.email || '',
                  phone: staffData.phone,
                  departmentId: extractedDepartmentId || staffData.departmentId || '',
                  storeId: extractedStoreId || staffData.storeId || '',
                  position: staffData.position || '',
                  role: staffData.role || 'staff',
                  hireDate: staffData.hireDate || '',
                  salary: staffData.salary,
                  status: staffData.status || 'active',
                  authUid: staffData.authUid,
                  mustChangePassword: staffData.mustChangePassword ?? false,
                  createdAt: staffData.createdAt,
                  updatedAt: staffData.updatedAt,
                  createdBy: staffData.createdBy || superadminUserId,
                }

                if (!isActiveStaffStatus(foundStaff.status)) {
                  return null
                }

                // Get department name if available
                if (foundStaff.departmentId) {
                  const departmentsStore = useDepartmentsStore()
                  const department = departmentsStore.getDepartmentById(foundStaff.departmentId)
                  if (department) {
                    foundStaff.departmentName = department.name
                  }
                }

                // Add to local state for future lookups
                const existingIndex = this.staff.findIndex((s) => s.id === foundStaff.id)
                if (existingIndex === -1) {
                  this.staff.push(foundStaff)
                } else {
                  // Update existing entry
                  this.staff[existingIndex] = foundStaff
                }

                // console.log('[StaffStore] Staff member loaded and cached:', foundStaff.storeId)
                return foundStaff
              } else {
                console.warn('[StaffStore] Staff document found but missing createdBy field')
              }
            } else {
              console.warn('[StaffStore] Collection group query returned no results')
            }
          } catch (collectionGroupError: any) {
            console.error(
              '[StaffStore] Error with collection group query:',
              collectionGroupError.message
            )
            if (collectionGroupError.code === 'permission-denied') {
              console.error(
                '[StaffStore] Permission denied on collection group query. Check Firestore rules allow collection group queries for staff.'
              )
            } else if (collectionGroupError.code === 'failed-precondition') {
              // Extract index creation URL from error message
              const indexUrlMatch = collectionGroupError.message?.match(/https:\/\/[^\s]+/)
              const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null

              console.error('')
              console.error('🚨 [StaffStore] COLLECTION GROUP INDEX MISSING 🚨')
              console.error(
                '[StaffStore] The query requires a COLLECTION_GROUP index for staff/authUid'
              )
              console.error('')

              if (indexUrl) {
                console.error('⚠️ ⚠️ ⚠️ ACTION REQUIRED ⚠️ ⚠️ ⚠️')
                console.error('[StaffStore] Click this link to create the index automatically:')
                console.error('')
                console.error('👉', indexUrl)
                console.error('')
                console.error('[StaffStore] After clicking the link:')
                console.error(' 1. Click "Create Index" in the Firebase Console')
                console.error(' 2. Wait for the index to build (may take a few minutes)')
                console.error(' 3. Refresh this page')
                console.error('')
              } else {
                // Fallback: provide direct link to Firebase Console indexes
                const config = useRuntimeConfig()
                const projectId = config.public.firebase.projectId || 'storv-ux'
                const fallbackUrl = `https://console.firebase.google.com/project/${projectId}/firestore/indexes`
                console.error('[StaffStore] Go to Firebase Console > Firestore > Indexes:')
                console.error('👉', fallbackUrl)
                console.error('')
                console.error('[StaffStore] Create a COLLECTION_GROUP index for:')
                console.error(' - Collection Group: staff')
                console.error(' - Field: authUid (Ascending)')
                console.error(' - Query Scope: COLLECTION_GROUP')
                console.error('')
              }
            }
          }

          if (!superadminUserId) {
            console.error('[StaffStore] Could not find staff member via collection group query')
            console.error("[StaffStore] This means the staff member's document either:")
            console.error(' 1. Does not exist in Firestore')
            console.error(' 2. Has incorrect authUid field')
            console.error(' 3. Is blocked by Firestore rules')
            console.error(' 4. Collection group index is missing (deploy firestore.indexes.json)')
            return null
          }

          // If we found superadminUserId but didn't return the staff member above,
          // it means the document was missing createdBy. This shouldn't happen, but handle it.
          console.error('[StaffStore] Found superadminUserId but staff document was incomplete')
          return null
        }
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
