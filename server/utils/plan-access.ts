import type { Firestore } from 'firebase-admin/firestore'
import {
  getStaffLimitForStore,
  resolveEffectiveSubscriptionPlan,
  summarizeSubscriptionAddOns,
  type TrialFields,
} from '~/types/subscription'
import {
  isStoreViewOnlyOnPlan,
  pickFullAccessStaff,
  type PlanAccessStaff,
  type PlanViewOnlyReason,
} from '~/utils/plan-access'

export type OwnerPlanFields = TrialFields & {
  subscriptionStatus?: string
  subscriptionCurrentPeriodEnd?: string
  subscriptionAddOns?: unknown
}

export interface StoreStaffMember extends PlanAccessStaff {
  name: string
  departmentId: string
}

/** Active staff of a store (they are the ones who can sign in), with their department. */
export async function loadActiveStoreStaff(
  db: Firestore,
  ownerId: string,
  storeId: string
): Promise<StoreStaffMember[]> {
  const store = db.collection('users').doc(ownerId).collection('stores').doc(storeId)
  const departments = await store.collection('departments').where('createdBy', '==', ownerId).get()
  const lists = await Promise.all(
    departments.docs.map(async (dept) => {
      const staff = await dept.ref.collection('staff').get()
      return staff.docs
        .filter((doc) => {
          const data = doc.data()
          return data.createdBy === ownerId && (data.status || 'active') === 'active'
        })
        .map((doc) => {
          const data = doc.data()
          const name = `${data.firstName || ''} ${data.lastName || ''}`.trim()
          return {
            id: doc.id,
            name: name || String(data.email || 'Staff member'),
            departmentId: dept.id,
            createdAt: data.createdAt ?? null,
          }
        })
    })
  )
  return lists.flat()
}

export interface StorePlanAccess {
  storeViewOnly: boolean
  /** Negative means unlimited. */
  maxStaff: number
  staff: StoreStaffMember[]
  /** Null when every active staff member keeps full access. */
  fullAccessIds: string[] | null
}

export async function loadStorePlanAccess(
  db: Firestore,
  ownerId: string,
  owner: OwnerPlanFields,
  storeId: string
): Promise<StorePlanAccess> {
  const plan = resolveEffectiveSubscriptionPlan(owner)
  const addOns = summarizeSubscriptionAddOns(owner.subscriptionAddOns)
  const storesRef = db.collection('users').doc(ownerId).collection('stores')
  const [storesSnap, storeSnap] = await Promise.all([
    storesRef.where('ownerId', '==', ownerId).select('createdAt').get(),
    storesRef.doc(storeId).get(),
  ])
  const stores = storesSnap.docs.map((doc) => ({ id: doc.id, createdAt: doc.data().createdAt }))
  const storeViewOnly = isStoreViewOnlyOnPlan(stores, storeId, plan, addOns)
  const maxStaff = getStaffLimitForStore(plan, storeId, addOns)
  const staff = await loadActiveStoreStaff(db, ownerId, storeId)
  return {
    storeViewOnly,
    maxStaff,
    staff,
    fullAccessIds: pickFullAccessStaff(staff, maxStaff, storeSnap.data()?.fullAccessStaffIds),
  }
}

/** Whether a signed-in staff member is view only, and why. */
export async function resolveStaffPlanViewOnly(
  db: Firestore,
  ownerId: string,
  owner: OwnerPlanFields,
  storeId: string,
  staffDocId: string
): Promise<PlanViewOnlyReason | null> {
  const access = await loadStorePlanAccess(db, ownerId, owner, storeId)
  if (access.storeViewOnly) return 'store'
  if (access.fullAccessIds && !access.fullAccessIds.includes(staffDocId)) return 'staff'
  return null
}
