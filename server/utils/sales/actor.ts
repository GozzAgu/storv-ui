import { createError } from 'h3'
import type { DocumentReference, Firestore } from 'firebase-admin/firestore'
import { resolveEffectiveSubscriptionPlan, type SubscriptionPlan } from '~/types/subscription'
import type { StaffPermissions } from '~/types/staff-permissions'
import { canStaffAccessCategory, type CategoryAccessFields } from '~/utils/category-access'
import {
  FULL_STAFF_PERMISSIONS,
  normalizeStaffAdminGrants,
  resolveStaffPermissions,
  type LegacyStaffAccessFields,
} from '~/utils/staff-permissions'

/**
 * Who is acting in a store, resolved the way firestore.rules does it: the owner, or an active
 * member with their permission matrix. Server routes that change money or stock start here.
 */
export interface StoreActor {
  uid: string
  ownerId: string
  storeId: string
  store: DocumentReference
  isOwner: boolean
  /** Branch admin (member doc `admin: true`). */
  isAdmin: boolean
  permissions: StaffPermissions
  /** Branch admin extras (delete sales / settle commissions, ...). */
  canManageCommissions: boolean
  departmentId: string | null
  displayName: string
  plan: SubscriptionPlan
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

export function assertId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw createError({ statusCode: 400, message: `${field} is invalid` })
  }
  return value
}

const PLAN_RANK: Record<SubscriptionPlan, number> = {
  storvv_micro: 0,
  storvv_medium: 1,
  storvv_enterprise: 2,
}

function staffName(data: Record<string, unknown> | undefined): string | null {
  const name = [data?.firstName, data?.lastName]
    .filter((v) => typeof v === 'string' && v.trim())
    .join(' ')
    .trim()
  return name ? name.slice(0, 80) : null
}

/**
 * Loads the store, the owner's plan and the caller's membership. A missing store or a caller who
 * is not an active member gets 404 so IDs from other businesses reveal nothing. With
 * `write: true` (the default) a store or member over the plan's limits is refused, as the rules
 * refuse their direct writes (`planAllowsStoreWrite`).
 */
export async function resolveStoreActor(
  db: Firestore,
  uid: string,
  ownerIdRaw: unknown,
  storeIdRaw: unknown,
  opts: { write?: boolean } = {}
): Promise<StoreActor> {
  const ownerId = assertId(ownerIdRaw, 'ownerUserId')
  const storeId = assertId(storeIdRaw, 'storeId')
  const ownerRef = db.collection('users').doc(ownerId)
  const store = ownerRef.collection('stores').doc(storeId)
  const isOwner = uid === ownerId

  const [ownerSnap, storeSnap, memberSnap] = await Promise.all([
    ownerRef.get(),
    store.get(),
    isOwner ? Promise.resolve(null) : store.collection('members').doc(uid).get(),
  ])
  if (!ownerSnap.exists || !storeSnap.exists) {
    throw createError({ statusCode: 404, message: 'Not found' })
  }
  const owner = ownerSnap.data() ?? {}
  const plan = resolveEffectiveSubscriptionPlan(owner)
  const rank = PLAN_RANK[plan]
  const write = opts.write !== false

  if (write && Number(storeSnap.data()?.planTier ?? 0) > rank) {
    throw createError({
      statusCode: 403,
      message: 'This branch is view only on your plan. Upgrade to make changes here.',
      data: { code: 'PLAN_VIEW_ONLY' },
    })
  }

  if (isOwner) {
    return {
      uid,
      ownerId,
      storeId,
      store,
      isOwner: true,
      isAdmin: true,
      permissions: FULL_STAFF_PERMISSIONS,
      canManageCommissions: true,
      departmentId: null,
      displayName: String(owner.name || owner.email || 'Owner').slice(0, 80),
      plan,
    }
  }

  const member = memberSnap?.data() as
    | (LegacyStaffAccessFields & {
        status?: string
        staffId?: string
        departmentId?: string
        planTier?: number
        adminGrants?: unknown
      })
    | undefined
  if (!member || member.status !== 'active') {
    throw createError({ statusCode: 404, message: 'Not found' })
  }
  if (write && Number(member.planTier ?? 0) > rank) {
    throw createError({
      statusCode: 403,
      message: 'Your access is view only on this plan. Ask the owner to upgrade.',
      data: { code: 'PLAN_VIEW_ONLY' },
    })
  }

  let name: string | null = null
  if (member.staffId && member.departmentId) {
    const staffSnap = await store
      .collection('departments')
      .doc(String(member.departmentId))
      .collection('staff')
      .doc(String(member.staffId))
      .get()
    name = staffName(staffSnap.data())
  }

  const isAdmin = member.admin === true
  return {
    uid,
    ownerId,
    storeId,
    store,
    isOwner: false,
    isAdmin,
    permissions: resolveStaffPermissions(member),
    canManageCommissions: isAdmin && normalizeStaffAdminGrants(member.adminGrants).deleteSales,
    departmentId: member.departmentId ? String(member.departmentId) : null,
    displayName: name ?? 'Staff',
    plan,
  }
}

export function forbid(message: string, code = 'FORBIDDEN'): never {
  throw createError({ statusCode: 403, message, data: { code } })
}

/** Whether the actor may sell from this category (department locks), as the rules check reads. */
export function actorCanUseCategory(
  actor: StoreActor,
  folder: CategoryAccessFields | undefined
): boolean {
  if (actor.isOwner || !folder) return true
  return canStaffAccessCategory(folder, { departmentId: actor.departmentId, authUid: actor.uid })
}

/**
 * Who may approve a discount above the staff limit: the owner, a branch admin, or a member with
 * full receipts edit. The same people may give such a discount themselves.
 */
export function actorCanApproveDiscounts(actor: StoreActor): boolean {
  return actor.isOwner || actor.isAdmin || actor.permissions.receipts.edit === true
}
