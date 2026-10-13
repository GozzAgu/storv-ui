import { defineStore } from 'pinia'
import { CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
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
  getQueryUserId,
} from '~/composables/useFirestorePaths'
import { normalizeEntityName } from '~/utils/capitalize-text'
import {
  getStaffLimitForStore,
  resolveEffectiveSubscriptionPlan,
  staffLimitReachedMessage,
  summarizeSubscriptionAddOns,
} from '~/types/subscription'
import type { Staff } from '~/composables/useStaff'
import type { Department } from '~/composables/useDepartments'
import { resolveApiPath } from '~/utils/api-url'
import { deriveDefaultPermissions, resolveStaffPermissions } from '~/utils/staff-permissions'

function isActiveStaffStatus(status: Staff['status'] | undefined): boolean {
  return (status || 'active') === 'active'
}

function isRemovedStaffStatus(status: Staff['status'] | undefined): boolean {
  return status === 'inactive'
}

/** Firestore rejects `undefined`. Normalize optional staff fields before writes. */
function prepareStaffFirestoreUpdates(
  updates: Record<string, unknown>
): Record<string, unknown> {
  const prepared: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue
    if (key === 'phone') {
      const trimmed = String(value ?? '').trim()
      prepared.phone = trimmed ? trimmed : deleteField()
      continue
    }
    if (key === 'salary' && (value === null || value === '')) {
      prepared.salary = deleteField()
      continue
    }
    prepared[key] = value
  }
  return prepared
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
  const plan = resolveEffectiveSubscriptionPlan(userStore.userData)
  const maxStaff = getStaffLimitForStore(
    plan,
    storeId,
    summarizeSubscriptionAddOns(userStore.userData?.subscriptionAddOns)
  )
  const departmentsStore = useDepartmentsStore()
  const staffCountInStore = departmentsStore.departments
    .filter((d) => d.storeId === storeId)
    .reduce((sum, d) => sum + (d.staffCount || 0), 0)
  if (maxStaff >= 0 && staffCountInStore >= maxStaff) {
    throw new Error(staffLimitReachedMessage(plan, maxStaff))
  }
}

const getStoreMemberDoc = (db: Firestore, userId: string, storeId: string, memberAuthUid: string) =>
  doc(db, `users/${userId}/stores/${storeId}/members/${memberAuthUid}`)

const getWorkspaceMemberDoc = (db: Firestore, ownerUserId: string, memberAuthUid: string) =>
  doc(db, `users/${ownerUserId}/workspaceMembers/${memberAuthUid}`)

async function syncWorkspaceMemberIndex(
  db: Firestore,
  ownerUserId: string,
  memberAuthUid: string,
  payload: { storeId: string; status: string }
) {
  await setDoc(
    getWorkspaceMemberDoc(db, ownerUserId, memberAuthUid),
    {
      authUid: memberAuthUid,
      storeId: payload.storeId,
      status: payload.status || 'active',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

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
              .map(async (s) => {
                const authUid = s.authUid as string
                await setDoc(
                  getStoreMemberDoc(db, userId, storeId, authUid),
                  {
                    authUid,
                    staffId: s.id,
                    storeId,
                    departmentId: s.departmentId,
                    status: s.status || 'active',
                    ...(s.permissions
                      ? {
                          permissions: s.permissions,
                          role: deleteField(),
                          canManageInventory: deleteField(),
                          canManageReceipts: deleteField(),
                        }
                      : {
                          role: s.role || 'staff',
                          canManageInventory: s.canManageInventory === true ? true : deleteField(),
                          canManageReceipts: s.canManageReceipts === true ? true : deleteField(),
                        }),
                    createdBy: userId,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                )
                await syncWorkspaceMemberIndex(db, userId, authUid, {
                  storeId,
                  status: s.status || 'active',
                })
              })
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

      const ownerUserId = await getQueryUserId()
      if (!ownerUserId) {
        throw new Error('User ID not available')
      }

      const departmentsStore = useDepartmentsStore()
      const department =
        departmentsStore.getDepartmentById(staffData.departmentId) ||
        (await departmentsStore.fetchDepartment(staffData.departmentId))
      if (!department || department.createdBy !== ownerUserId) {
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
      const plan = resolveEffectiveSubscriptionPlan(userStore.userData)
      const maxStaff = getStaffLimitForStore(
        plan,
        storeId,
        summarizeSubscriptionAddOns(userStore.userData?.subscriptionAddOns)
      )
      const staffCountInStore = departmentsStore.departments
        .filter((d) => d.storeId === storeId)
        .reduce((sum, d) => sum + (d.staffCount || 0), 0)
      if (maxStaff >= 0 && staffCountInStore >= maxStaff) {
        throw new Error(staffLimitReachedMessage(plan, maxStaff))
      }

      // Per-module permission matrix is the source of truth going forward. `role` is no longer
      // written for new staff (see composables/useStaff.ts#Staff.role). pass `permissions`
      // explicitly (StaffPermissionsPanel does), or a view-only baseline is derived.
      const permissions = staffData.permissions ?? deriveDefaultPermissions({})
      const status = staffData.status === 'on_leave' ? 'on_leave' : 'active'

      // The server creates the login and records, so an admin can add staff without ever
      // writing the owner's membership records directly.
      let raw: unknown
      try {
        const token = await authStore.currentUser.getIdToken()
        raw = await $fetch(resolveApiPath('/api/staff/create'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: {
            ownerUserId,
            storeId,
            departmentId: staffData.departmentId,
            email: staffData.email.trim().toLowerCase(),
            password,
            firstName: staffData.firstName,
            lastName: staffData.lastName,
            phone: staffData.phone !== undefined && staffData.phone !== '' ? String(staffData.phone) : undefined,
            position: staffData.position,
            hireDate: staffData.hireDate || undefined,
            salary: staffData.salary,
            status,
            permissions,
          },
        })
      } catch (error: unknown) {
        throw parseStaffLifecycleApiError(error, 'Failed to create staff')
      }
      const result = raw as { staffId: string; authUid: string; temporaryPassword: string }

      const now = new Date()
      const { password: _pw, ...staffFields } = staffData
      const staffWithDept: Staff = {
        id: result.staffId,
        ...staffFields,
        firstName: normalizeEntityName(staffData.firstName),
        lastName: normalizeEntityName(staffData.lastName),
        storeId,
        status,
        authUid: result.authUid,
        mustChangePassword: true,
        createdAt: now,
        updatedAt: now,
        createdBy: ownerUserId,
        departmentName: department.name,
      }
      this.staff.unshift(staffWithDept)
      const deptIndex = departmentsStore.departments.findIndex((d) => d.id === department.id)
      if (deptIndex > -1 && departmentsStore.departments[deptIndex]) {
        departmentsStore.departments[deptIndex].staffCount = (department.staffCount || 0) + 1
      }

      if (import.meta.client) {
        setTimeout(() => {
          this.fetchStaffByDepartment(staffData.departmentId).catch(() => {})
          this.fetchStaff().catch(() => {})
          departmentsStore.fetchDepartment(staffData.departmentId, storeId).catch(() => {})
          departmentsStore.fetchDepartments().catch(() => {})
        }, 500)
      }

      return { staffId: result.staffId, temporaryPassword: result.temporaryPassword }
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

        const normalizedUpdates = prepareStaffFirestoreUpdates({
          ...updates,
          ...(updates.firstName !== undefined
            ? { firstName: normalizeEntityName(updates.firstName) }
            : {}),
          ...(updates.lastName !== undefined
            ? { lastName: normalizeEntityName(updates.lastName) }
            : {}),
        } as Record<string, unknown>) as Partial<
          Omit<Staff, 'id' | 'createdAt' | 'createdBy' | 'departmentName'>
        >

        const departmentsStore = useDepartmentsStore()
        const moving =
          !!normalizedUpdates.departmentId && normalizedUpdates.departmentId !== departmentId
        const oldDept = moving ? departmentsStore.getDepartmentById(departmentId) : undefined
        const newDept = moving
          ? departmentsStore.getDepartmentById(normalizedUpdates.departmentId!) ||
            (await departmentsStore.fetchDepartment(normalizedUpdates.departmentId!))
          : undefined
        if (moving && (!newDept || newDept.createdBy !== userId)) {
          throw new Error('Department not found or access denied')
        }

        // The server writes the staff record, membership and roster index together and
        // enforces who may change what (admins: regular staff only, never financial figures).
        const token = await authStore.currentUser.getIdToken()
        try {
          await $fetch(resolveApiPath('/api/staff/update'), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: {
              ownerUserId: userId,
              storeId,
              departmentId,
              staffId,
              updates: {
                firstName: updates.firstName,
                lastName: updates.lastName,
                phone: updates.phone,
                position: updates.position,
                hireDate: updates.hireDate,
                salary: updates.salary === undefined ? undefined : (updates.salary ?? null),
                status: updates.status,
                permissions: updates.permissions,
                departmentId: updates.departmentId,
              },
            },
          })
        } catch (error: unknown) {
          throw parseStaffLifecycleApiError(error, 'Failed to update staff')
        }

        if (moving && newDept) {
          const patchDept = (id: string, patch: Partial<Department>) => {
            const i = departmentsStore.departments.findIndex((d) => d.id === id)
            if (i > -1) {
              departmentsStore.departments[i] = {
                ...departmentsStore.departments[i],
                ...patch,
              } as Department
            }
          }
          if (oldDept) {
            patchDept(departmentId, {
              staffCount: Math.max(0, (oldDept.staffCount || 0) - 1),
              ...(oldDept.managerId === staffId ? { manager: undefined, managerId: undefined } : {}),
            })
          }
          patchDept(newDept.id, { staffCount: (newDept.staffCount || 0) + 1 })
        }

        const mergedDepartmentId = normalizedUpdates.departmentId ?? staffMember.departmentId

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
        const ownerUserId = await getQueryUserId()
        const staffMember = this.getStaffMember(staffId) || (await this.fetchStaffMember(staffId))
        if (!ownerUserId || !staffMember || staffMember.createdBy !== ownerUserId) {
          throw new Error('Staff member not found or access denied')
        }

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
        const ownerUserId = await getQueryUserId()
        const staffMember = await this.fetchStaffMember(staffId)
        if (!ownerUserId || !staffMember || staffMember.createdBy !== ownerUserId) {
          throw new Error('Staff member not found or access denied')
        }
        if (!isRemovedStaffStatus(staffMember.status)) {
          throw new Error('Only removed staff can be reactivated')
        }

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

    /** Staff self-service: persist personal photo on the roster doc (staff have no users/{uid}). */
    async updateOwnStaffPhoto(photoURL: string) {
      const db = useFirestore().getFirestoreInstance()
      if (!db) {
        throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      }

      const staffMember = await this.fetchCurrentStaffMember()
      if (!staffMember?.createdBy || !staffMember.storeId || !staffMember.departmentId) {
        throw new Error('Could not find your staff profile. Please sign in again.')
      }

      const staffRef = getStaffDocument(
        db,
        staffMember.createdBy,
        staffMember.storeId,
        staffMember.departmentId,
        staffMember.id
      )
      await updateDoc(staffRef, { photoURL, updatedAt: serverTimestamp() })

      const index = this.staff.findIndex((s) => s.id === staffMember.id)
      if (index > -1 && this.staff[index]) {
        this.staff[index] = { ...this.staff[index], photoURL }
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

      const isStaffCreationInProgress = import.meta.client
        ? (await import('~/utils/staff-creation-session')).isStaffCreationInProgress()
        : false
      if (isStaffCreationInProgress) {
        return null
      }

      const cachedStaff = this.getCurrentStaffMember
      if (cachedStaff?.authUid === authStore.currentUser.uid && isActiveStaffStatus(cachedStaff.status)) {
        return cachedStaff
      }

      try {
        const { lookupActiveStaffMemberByAuthUid } = await import('~/utils/staff-user-bootstrap')
        const foundStaff = await lookupActiveStaffMemberByAuthUid(db, authStore.currentUser.uid)
        if (!foundStaff) {
          return null
        }

        if (foundStaff.departmentId) {
          const departmentsStore = useDepartmentsStore()
          const department = departmentsStore.getDepartmentById(foundStaff.departmentId)
          if (department) {
            foundStaff.departmentName = department.name
          }
        }

        const existingIndex = this.staff.findIndex((s) => s.id === foundStaff.id)
        if (existingIndex === -1) {
          this.staff.push(foundStaff)
        } else {
          this.staff[existingIndex] = foundStaff
        }

        return foundStaff
      } catch (error: any) {
        console.error('[StaffStore] Error fetching current staff member:', error)
        if (error.code === 'failed-precondition') {
          console.error(
            '[StaffStore] Missing COLLECTION_GROUP index for staff.authUid. Deploy firestore.indexes.json.'
          )
        }
        return null
      }
    },
  },
})
