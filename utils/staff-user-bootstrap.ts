import { collectionGroup, doc, getDoc, getDocs, query, where, type Firestore } from 'firebase/firestore'
import type { Staff } from '~/composables/useStaff'
import type { UserData } from '~/composables/useUser'
import type { SubscriptionPlan } from '~/types/subscription'
import { resolveApiPath } from '~/utils/api-url'
import { getFirebaseClientAuth } from '~/utils/firebase-client-auth'
import { sanitizeUserData } from '~/utils/sanitize-user-data'
import { resolveStaffPermissions } from '~/utils/staff-permissions'

type OwnerWorkspaceContext = Pick<
  UserData,
  'subscription' | 'subscriptionBillingCycle' | 'preferences' | 'storeDetails' | 'storeLogoUrl'
>

export type StaffOwnerContextResult = {
  userData: UserData
  /** True when owner plan/prefs were applied (safe to cache as authoritative). */
  inheritedOwnerContext: boolean
}

function applyOwnerContext(base: UserData, owner: OwnerWorkspaceContext): UserData {
  return {
    ...base,
    subscription: owner.subscription ?? base.subscription,
    subscriptionBillingCycle: owner.subscriptionBillingCycle,
    preferences: owner.preferences,
    storeDetails: owner.storeDetails,
    storeLogoUrl: owner.storeLogoUrl,
    hasCompletedOnboarding: true,
    hasCompletedTutorial: true,
  }
}

/**
 * users/{ownerId} is owner-only in Firestore rules, so staff getDoc often fails.
 * Admin-backed API returns the plan/prefs staff need for nav feature gates.
 */
async function fetchOwnerWorkspaceContextFromApi(): Promise<OwnerWorkspaceContext | null> {
  try {
    const auth = getFirebaseClientAuth()
    const user = auth?.currentUser
    if (!user) return null
    const token = await user.getIdToken()
    return await $fetch<OwnerWorkspaceContext>(resolveApiPath('/api/workspace/owner-context'), {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    return null
  }
}

function isActiveStaffStatus(status: Staff['status'] | undefined): boolean {
  return (status || 'active') === 'active'
}

function mapStaffDoc(staffDoc: { id: string; ref: { path: string }; data: () => Record<string, unknown> }): Staff {
  const staffData = staffDoc.data()
  const pathParts = staffDoc.ref.path.split('/')
  let extractedStoreId: string | undefined
  let extractedDepartmentId: string | undefined

  if (pathParts.length >= 6) {
    extractedStoreId = pathParts[3]
    extractedDepartmentId = pathParts[5]
  }

  const role: Staff['role'] =
    staffData.role === 'manager' || staffData.role === 'intern' ? staffData.role : 'staff'
  const canManageInventory =
    staffData.canManageInventory === true ? true : undefined
  const canManageReceipts =
    staffData.canManageReceipts === true ? true : undefined

  return {
    id: staffDoc.id,
    firstName: String(staffData.firstName || ''),
    lastName: String(staffData.lastName || ''),
    email: String(staffData.email || ''),
    phone: staffData.phone ? String(staffData.phone) : undefined,
    departmentId: extractedDepartmentId || String(staffData.departmentId || ''),
    storeId: extractedStoreId || String(staffData.storeId || ''),
    position: String(staffData.position || ''),
    role,
    canManageInventory,
    canManageReceipts,
    permissions: resolveStaffPermissions({
      role,
      canManageInventory,
      canManageReceipts,
      permissions: staffData.permissions as Staff['permissions'],
    }),
    hireDate: String(staffData.hireDate || ''),
    salary: typeof staffData.salary === 'number' ? staffData.salary : undefined,
    status:
      staffData.status === 'inactive' || staffData.status === 'on_leave'
        ? staffData.status
        : 'active',
    authUid: staffData.authUid ? String(staffData.authUid) : undefined,
    mustChangePassword: Boolean(staffData.mustChangePassword),
    createdAt: staffData.createdAt,
    updatedAt: staffData.updatedAt,
    createdBy: String(staffData.createdBy || ''),
  }
}

/**
 * Seed staff profile. Prefer prior cached owner plan so nav does not flash Micro
 * while owner context is still loading.
 */
export function buildStaffUserData(
  staff: Staff,
  authUid: string,
  prior?: Pick<UserData, 'subscription' | 'subscriptionBillingCycle' | 'preferences' | 'storeDetails' | 'storeLogoUrl'> | null
): UserData {
  const priorPlan = prior?.subscription
  return {
    uid: authUid,
    email: staff.email || '',
    name: `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Staff Member',
    role: 'staff',
    subscription: (priorPlan as SubscriptionPlan) || 'storvv_micro',
    subscriptionBillingCycle: prior?.subscriptionBillingCycle,
    preferences: prior?.preferences,
    storeDetails: prior?.storeDetails,
    storeLogoUrl: prior?.storeLogoUrl,
    hasCompletedOnboarding: true,
    hasCompletedTutorial: true,
    mustChangePassword: Boolean(staff.mustChangePassword),
    createdAt: staff.createdAt || null,
    updatedAt: staff.updatedAt || null,
  }
}

/** Staff inherit currency, subscription, and store settings from the owning super admin. */
export async function buildStaffUserDataWithOwnerContext(
  db: Firestore,
  staff: Staff,
  authUid: string,
  prior?: UserData | null
): Promise<StaffOwnerContextResult> {
  const base = buildStaffUserData(staff, authUid, prior?.uid === authUid ? prior : null)
  const ownerId = staff.createdBy?.trim()
  if (!ownerId) {
    return { userData: base, inheritedOwnerContext: false }
  }

  // Prefer admin API (works regardless of owner-doc rules); fall back to client getDoc.
  const fromApi = await fetchOwnerWorkspaceContextFromApi()
  if (fromApi?.subscription || fromApi?.preferences || fromApi?.storeDetails) {
    return {
      userData: applyOwnerContext(base, fromApi),
      inheritedOwnerContext: true,
    }
  }

  try {
    const ownerSnap = await getDoc(doc(db, 'users', ownerId))
    if (ownerSnap.exists()) {
      const owner = sanitizeUserData({
        uid: ownerSnap.id,
        ...ownerSnap.data(),
      } as UserData)
      return {
        userData: applyOwnerContext(base, owner),
        inheritedOwnerContext: true,
      }
    }
  } catch {
    // Permission denied / offline — keep prior plan on base.
  }

  return { userData: base, inheritedOwnerContext: false }
}

export type StaffLookupResult =
  | { kind: 'active'; staff: Staff }
  | { kind: 'inactive'; staff: Staff }
  | { kind: 'missing' }

/**
 * Resolve a staff roster row from Firebase Auth uid (collection group on `staff.authUid`).
 * Used at sign-in so we do not depend on a top-level `users/{uid}` document.
 */
export async function lookupStaffMemberByAuthUid(
  db: Firestore,
  authUid: string
): Promise<StaffLookupResult> {
  const staffCollectionGroup = collectionGroup(db, 'staff')
  const staffQuery = query(staffCollectionGroup, where('authUid', '==', authUid))
  const staffSnapshot = await getDocs(staffQuery)

  if (staffSnapshot.empty || !staffSnapshot.docs[0]) {
    return { kind: 'missing' }
  }

  const staff = mapStaffDoc(staffSnapshot.docs[0])
  if (!isActiveStaffStatus(staff.status)) {
    return { kind: 'inactive', staff }
  }

  return { kind: 'active', staff }
}

export async function lookupActiveStaffMemberByAuthUid(
  db: Firestore,
  authUid: string
): Promise<Staff | null> {
  const result = await lookupStaffMemberByAuthUid(db, authUid)
  return result.kind === 'active' ? result.staff : null
}
