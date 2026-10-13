import { createError } from 'h3'
import {
  FieldValue,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase-admin/firestore'
import type { StaffAdminGrants, StaffPermissions } from '~/types/staff-permissions'
import {
  getStaffLimitForStore,
  resolveEffectiveSubscriptionPlan,
  staffLimitReachedMessage,
  summarizeSubscriptionAddOns,
} from '~/types/subscription'
import {
  coerceStaffPermissions,
  normalizeStaffAdminGrants,
} from '~/utils/staff-permissions'
import { normalizeEntityName } from '~/utils/capitalize-text'

/**
 * Who may manage a store's staff: the owner, or an active branch admin of that store. Admins
 * manage regular staff only. Making or removing admins, editing another admin, editing
 * themselves, and anyone's financial-figures grant stay with the owner.
 */
export type StaffManager = { kind: 'owner'; uid: string } | { kind: 'admin'; uid: string }

export interface StaffManagerCaller {
  uid: string
  emailVerified: boolean
}

type StaffStatus = 'active' | 'on_leave' | 'inactive'

interface StoredStaff {
  authUid?: string
  email?: string
  status?: StaffStatus | string
  createdBy?: string
  role?: string
  permissions?: Partial<StaffPermissions>
  admin?: boolean
}

interface StoredMember {
  status?: string
  admin?: boolean
  adminGrants?: Partial<StaffAdminGrants>
}

export function storeRef(db: Firestore, ownerUserId: string, storeId: string): DocumentReference {
  return db.collection('users').doc(ownerUserId).collection('stores').doc(storeId)
}

function departmentRef(db: Firestore, ownerUserId: string, storeId: string, departmentId: string) {
  return storeRef(db, ownerUserId, storeId).collection('departments').doc(departmentId)
}

function staffDocRef(
  db: Firestore,
  ownerUserId: string,
  storeId: string,
  departmentId: string,
  staffId: string
) {
  return departmentRef(db, ownerUserId, storeId, departmentId).collection('staff').doc(staffId)
}

function memberRef(db: Firestore, ownerUserId: string, storeId: string, authUid: string) {
  return storeRef(db, ownerUserId, storeId).collection('members').doc(authUid)
}

function workspaceMemberRef(db: Firestore, ownerUserId: string, authUid: string) {
  return db.collection('users').doc(ownerUserId).collection('workspaceMembers').doc(authUid)
}

function forbidden(message: string, code?: string): never {
  throw createError({ statusCode: 403, message, ...(code ? { data: { code } } : {}) })
}

export async function resolveStaffManager(
  db: Firestore,
  caller: StaffManagerCaller,
  ownerUserId: string,
  storeId: string
): Promise<StaffManager> {
  if (caller.uid === ownerUserId) {
    if (!caller.emailVerified) {
      forbidden('Email verification required', 'EMAIL_VERIFICATION_REQUIRED')
    }
    return { kind: 'owner', uid: caller.uid }
  }

  const member = (await memberRef(db, ownerUserId, storeId, caller.uid).get()).data() as
    | StoredMember
    | undefined
  if (!member || member.status !== 'active' || member.admin !== true) {
    forbidden('Only the store owner or a branch admin can manage staff')
  }
  return { kind: 'admin', uid: caller.uid }
}

export async function requireStoreAdminGrant(
  db: Firestore,
  callerUid: string,
  ownerUserId: string,
  storeId: string,
  grant: keyof StaffAdminGrants
): Promise<void> {
  if (callerUid === ownerUserId) return
  const member = (await memberRef(db, ownerUserId, storeId, callerUid).get()).data() as
    | StoredMember
    | undefined
  if (
    !member ||
    member.status !== 'active' ||
    member.admin !== true ||
    normalizeStaffAdminGrants(member.adminGrants)[grant] !== true
  ) {
    forbidden('The store owner has not given you this permission')
  }
}

/** The target must be this owner's regular staff, and an admin may not act on themselves. */
export function assertCanManageTarget(
  manager: StaffManager,
  ownerUserId: string,
  target: StoredStaff,
  targetMember: StoredMember | undefined
): void {
  if (target.createdBy !== ownerUserId) forbidden('Access denied')
  if (manager.kind === 'owner') return
  if (target.authUid && target.authUid === manager.uid) {
    forbidden('Admins cannot change their own access. Ask the store owner.')
  }
  if (target.admin === true || targetMember?.admin === true) {
    forbidden('Only the store owner can manage another admin')
  }
}

/**
 * Untrusted permissions → a full matrix. `payments` is never written here (server-audited
 * grants only). Only the owner sets financial figures; an admin's write keeps the stored value.
 */
export function permissionsForWrite(
  manager: StaffManager,
  input: unknown,
  existing?: Partial<StaffPermissions>
): StaffPermissions {
  const permissions = coerceStaffPermissions(input)
  if (manager.kind === 'owner') return permissions
  return {
    ...permissions,
    financials: coerceStaffPermissions({ financials: existing?.financials }).financials,
  }
}

/** Staff on this store's plan, counted from the records themselves rather than `staffCount`. */
export async function assertStaffCapacity(
  db: Firestore,
  ownerUserId: string,
  storeId: string
): Promise<void> {
  const owner = ((await db.collection('users').doc(ownerUserId).get()).data() ?? {}) as {
    subscription?: unknown
    subscriptionStatus?: string
    subscriptionCurrentPeriodEnd?: string
    subscriptionAddOns?: unknown
  }
  const plan = resolveEffectiveSubscriptionPlan(owner)
  const maxStaff = getStaffLimitForStore(
    plan,
    storeId,
    summarizeSubscriptionAddOns(owner.subscriptionAddOns)
  )
  if (maxStaff < 0) return

  const departments = await storeRef(db, ownerUserId, storeId)
    .collection('departments')
    .where('createdBy', '==', ownerUserId)
    .get()
  let count = 0
  for (const dept of departments.docs) {
    const staff = await dept.ref.collection('staff').get()
    count += staff.docs.filter((d) => d.data().status !== 'inactive').length
  }
  if (count >= maxStaff) {
    throw createError({ statusCode: 403, message: staffLimitReachedMessage(plan, maxStaff) })
  }
}

async function requireOwnedDepartment(
  db: Firestore,
  ownerUserId: string,
  storeId: string,
  departmentId: string
): Promise<DocumentSnapshot> {
  const snap = await departmentRef(db, ownerUserId, storeId, departmentId).get()
  if (!snap.exists || snap.data()?.createdBy !== ownerUserId) {
    throw createError({ statusCode: 404, message: 'Department not found' })
  }
  return snap
}

const MAX_TEXT = 120

function text(value: unknown, field: string, { required = false } = {}): string | undefined {
  if (value === undefined || value === null) {
    if (required) throw createError({ statusCode: 400, message: `${field} is required` })
    return undefined
  }
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: `${field} must be text` })
  }
  const trimmed = value.trim()
  if (required && !trimmed) throw createError({ statusCode: 400, message: `${field} is required` })
  if (trimmed.length > MAX_TEXT) {
    throw createError({ statusCode: 400, message: `${field} is too long` })
  }
  return trimmed
}

function hireDate(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createError({ statusCode: 400, message: 'hireDate must be YYYY-MM-DD' })
  }
  return value
}

/** `null` / '' clears the salary; otherwise a non-negative number. */
function salary(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) {
    throw createError({ statusCode: 400, message: 'salary must be a positive number' })
  }
  return n
}

export interface NewStaffInput {
  firstName: unknown
  lastName: unknown
  email: string
  phone?: unknown
  position?: unknown
  hireDate?: unknown
  salary?: unknown
  status?: unknown
  permissions?: unknown
}

/** Validated staff fields for a new record; throws 400 on bad input. */
export function parseNewStaff(input: NewStaffInput) {
  const phone = text(input.phone, 'phone')
  const salaryValue = salary(input.salary)
  return {
    firstName: normalizeEntityName(text(input.firstName, 'firstName', { required: true })!),
    lastName: normalizeEntityName(text(input.lastName, 'lastName', { required: true })!),
    position: text(input.position, 'position') ?? '',
    ...(phone ? { phone } : {}),
    hireDate: hireDate(input.hireDate) ?? new Date().toISOString().split('T')[0],
    ...(typeof salaryValue === 'number' ? { salary: salaryValue } : {}),
    status: (input.status === 'on_leave' ? 'on_leave' : 'active') as StaffStatus,
  }
}

export interface WriteNewStaffParams {
  ownerUserId: string
  storeId: string
  departmentId: string
  authUid: string
  email: string
  fields: ReturnType<typeof parseNewStaff>
  permissions: StaffPermissions
}

/** Staff record + member doc + roster index + department count, in one batch. */
export async function writeNewStaff(db: Firestore, params: WriteNewStaffParams): Promise<string> {
  const { ownerUserId, storeId, departmentId, authUid, fields, permissions } = params
  await requireOwnedDepartment(db, ownerUserId, storeId, departmentId)

  const ref = departmentRef(db, ownerUserId, storeId, departmentId).collection('staff').doc()
  const now = FieldValue.serverTimestamp()
  const batch = db.batch()
  batch.set(ref, {
    ...fields,
    email: params.email,
    departmentId,
    storeId,
    permissions,
    authUid,
    mustChangePassword: true,
    createdAt: now,
    updatedAt: now,
    createdBy: ownerUserId,
  })
  batch.set(
    memberRef(db, ownerUserId, storeId, authUid),
    {
      authUid,
      staffId: ref.id,
      storeId,
      departmentId,
      status: fields.status,
      permissions,
      createdBy: ownerUserId,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  )
  batch.set(
    workspaceMemberRef(db, ownerUserId, authUid),
    { authUid, storeId, status: fields.status, updatedAt: now },
    { merge: true }
  )
  batch.update(departmentRef(db, ownerUserId, storeId, departmentId), {
    staffCount: FieldValue.increment(1),
    updatedAt: now,
  })
  await batch.commit()
  return ref.id
}

export interface StaffUpdateInput {
  firstName?: unknown
  lastName?: unknown
  phone?: unknown
  position?: unknown
  hireDate?: unknown
  salary?: unknown
  status?: unknown
  permissions?: unknown
  departmentId?: unknown
}

export interface StaffUpdateParams {
  ownerUserId: string
  storeId: string
  departmentId: string
  staffId: string
  updates: StaffUpdateInput
}

/**
 * Edit a staff record (fields, permissions, department move) and keep the member doc and roster
 * index in step. Deactivation stays on its own route; status here is active ↔ on leave only.
 */
export async function applyStaffUpdate(
  db: Firestore,
  manager: StaffManager,
  params: StaffUpdateParams
): Promise<{ departmentId: string }> {
  const { ownerUserId, storeId, departmentId, staffId, updates } = params
  const oldRef = staffDocRef(db, ownerUserId, storeId, departmentId, staffId)
  const snap = await oldRef.get()
  if (!snap.exists) throw createError({ statusCode: 404, message: 'Staff member not found' })
  const staff = snap.data() as StoredStaff
  const authUid = staff.authUid?.trim()
  const memberSnap = authUid ? await memberRef(db, ownerUserId, storeId, authUid).get() : null
  const member = memberSnap?.data() as StoredMember | undefined
  assertCanManageTarget(manager, ownerUserId, staff, member)

  const fields: Record<string, unknown> = {}
  const firstName = text(updates.firstName, 'firstName')
  if (firstName !== undefined) {
    if (!firstName) throw createError({ statusCode: 400, message: 'firstName is required' })
    fields.firstName = normalizeEntityName(firstName)
  }
  const lastName = text(updates.lastName, 'lastName')
  if (lastName !== undefined) {
    if (!lastName) throw createError({ statusCode: 400, message: 'lastName is required' })
    fields.lastName = normalizeEntityName(lastName)
  }
  const position = text(updates.position, 'position')
  if (position !== undefined) fields.position = position
  if (updates.phone !== undefined) {
    const phone = text(updates.phone, 'phone')
    fields.phone = phone ? phone : FieldValue.delete()
  }
  const hire = hireDate(updates.hireDate)
  if (hire !== undefined) fields.hireDate = hire
  const salaryValue = salary(updates.salary)
  if (salaryValue !== undefined) {
    fields.salary = salaryValue === null ? FieldValue.delete() : salaryValue
  }

  let status = staff.status
  if (updates.status !== undefined) {
    if (updates.status !== 'active' && updates.status !== 'on_leave') {
      throw createError({ statusCode: 400, message: 'status must be active or on_leave' })
    }
    if (staff.status === 'inactive') {
      throw createError({ statusCode: 409, message: 'Reactivate this staff member first' })
    }
    status = updates.status
    fields.status = status
  }

  const permissions =
    updates.permissions !== undefined
      ? permissionsForWrite(manager, updates.permissions, staff.permissions)
      : undefined
  const legacyClears = permissions
    ? {
        role: FieldValue.delete(),
        canManageInventory: FieldValue.delete(),
        canManageReceipts: FieldValue.delete(),
      }
    : {}
  if (permissions) fields.permissions = permissions

  const nextDepartmentId = text(updates.departmentId, 'departmentId') || departmentId
  const moving = nextDepartmentId !== departmentId
  if (moving) await requireOwnedDepartment(db, ownerUserId, storeId, nextDepartmentId)

  const now = FieldValue.serverTimestamp()
  await db.runTransaction(async (tx) => {
    const current = await tx.get(oldRef)
    if (!current.exists) throw createError({ statusCode: 404, message: 'Staff member not found' })

    if (moving) {
      const fromRef = departmentRef(db, ownerUserId, storeId, departmentId)
      const toRef = departmentRef(db, ownerUserId, storeId, nextDepartmentId)
      const [from, to] = await Promise.all([tx.get(fromRef), tx.get(toRef)])
      const plain = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => !(v instanceof FieldValue))
      )
      const deletes = Object.keys(fields).filter((k) => fields[k] instanceof FieldValue)
      const nextData: Record<string, unknown> = { ...current.data(), ...plain }
      for (const key of deletes) delete nextData[key]
      if (permissions) {
        delete nextData.role
        delete nextData.canManageInventory
        delete nextData.canManageReceipts
      }
      tx.set(staffDocRef(db, ownerUserId, storeId, nextDepartmentId, staffId), {
        ...nextData,
        departmentId: nextDepartmentId,
        updatedAt: now,
      })
      tx.delete(oldRef)

      if (from.exists) {
        const fromUpdate: Record<string, number | FieldValue> = {
          staffCount: Math.max(0, Number(from.data()?.staffCount ?? 0) - 1),
          updatedAt: now,
        }
        if (from.data()?.managerId === staffId) {
          fromUpdate.manager = FieldValue.delete()
          fromUpdate.managerId = FieldValue.delete()
        }
        tx.update(fromRef, fromUpdate)
      }
      tx.update(toRef, {
        staffCount: Number(to.data()?.staffCount ?? 0) + 1,
        updatedAt: now,
      })
    } else {
      tx.update(oldRef, { ...fields, ...legacyClears, updatedAt: now })
    }

    if (authUid) {
      tx.set(
        memberRef(db, ownerUserId, storeId, authUid),
        {
          authUid,
          staffId,
          storeId,
          departmentId: nextDepartmentId,
          status: status || 'active',
          ...(permissions ? { permissions, ...legacyClears } : {}),
          createdBy: ownerUserId,
          updatedAt: now,
        },
        { merge: true }
      )
      tx.set(
        workspaceMemberRef(db, ownerUserId, authUid),
        { authUid, storeId, status: status || 'active', updatedAt: now },
        { merge: true }
      )
    }
  })

  return { departmentId: nextDepartmentId }
}

export interface AdminAccessParams {
  ownerUserId: string
  storeId: string
  departmentId: string
  staffId: string
  admin: boolean
  grants?: unknown
}

/** Owner-only: make a staff member a branch admin of this store (or remove it) and set extras. */
export async function setStaffAdminAccess(
  db: Firestore,
  manager: StaffManager,
  params: AdminAccessParams
): Promise<{ admin: boolean; adminGrants: StaffAdminGrants }> {
  if (manager.kind !== 'owner') forbidden('Only the store owner can make or remove admins')

  const { ownerUserId, storeId, departmentId, staffId } = params
  const ref = staffDocRef(db, ownerUserId, storeId, departmentId, staffId)
  const snap = await ref.get()
  if (!snap.exists) throw createError({ statusCode: 404, message: 'Staff member not found' })
  const staff = snap.data() as StoredStaff
  if (staff.createdBy !== ownerUserId) forbidden('Access denied')
  const authUid = staff.authUid?.trim()
  if (!authUid) {
    throw createError({ statusCode: 409, message: 'This staff member has no login yet' })
  }
  if (params.admin && staff.status === 'inactive') {
    throw createError({ statusCode: 409, message: 'Reactivate this staff member first' })
  }

  const admin = params.admin === true
  const adminGrants = admin
    ? normalizeStaffAdminGrants(params.grants)
    : normalizeStaffAdminGrants(undefined)
  const now = FieldValue.serverTimestamp()
  const batch = db.batch()
  batch.update(ref, { admin, adminGrants, updatedAt: now })
  batch.set(
    memberRef(db, ownerUserId, storeId, authUid),
    { admin, adminGrants, updatedAt: now },
    { merge: true }
  )
  await batch.commit()
  return { admin, adminGrants }
}