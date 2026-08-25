import { collectionGroup, doc, getDoc, getDocs, query, where, type Firestore } from 'firebase/firestore'
import type { Staff } from '~/composables/useStaff'
import type { UserData } from '~/composables/useUser'
import { sanitizeUserData } from '~/utils/sanitize-user-data'

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

  return {
    id: staffDoc.id,
    firstName: String(staffData.firstName || ''),
    lastName: String(staffData.lastName || ''),
    email: String(staffData.email || ''),
    phone: staffData.phone ? String(staffData.phone) : undefined,
    departmentId: extractedDepartmentId || String(staffData.departmentId || ''),
    storeId: extractedStoreId || String(staffData.storeId || ''),
    position: String(staffData.position || ''),
    role:
      staffData.role === 'manager' || staffData.role === 'intern'
        ? staffData.role
        : 'staff',
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

export function buildStaffUserData(staff: Staff, authUid: string): UserData {
  return {
    uid: authUid,
    email: staff.email || '',
    name: `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Staff Member',
    role: 'staff',
    subscription: 'storvv_micro',
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
  authUid: string
): Promise<UserData> {
  const base = buildStaffUserData(staff, authUid)
  const ownerId = staff.createdBy?.trim()
  if (!ownerId) return base

  try {
    const ownerSnap = await getDoc(doc(db, 'users', ownerId))
    if (!ownerSnap.exists()) return base

    const owner = sanitizeUserData({
      uid: ownerSnap.id,
      ...ownerSnap.data(),
    } as UserData)

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
  } catch {
    return base
  }
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
