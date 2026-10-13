import type {
  ModulePermission,
  PermissionAction,
  PermissionModule,
  ReceiptsPermission,
  StaffAdminGrants,
  StaffPermissions,
} from '~/types/staff-permissions'
import { STAFF_ADMIN_GRANT_KEYS } from '~/types/staff-permissions'

const emptyModule = (): ModulePermission => ({
  view: false,
  create: false,
  edit: false,
  delete: false,
})

export const FULL_STAFF_PERMISSIONS: StaffPermissions = {
  products: { view: true, create: true, edit: true, delete: true },
  receipts: { view: true, create: true, edit: true, delete: true, refund: true },
  leads: { view: true, create: true, edit: true, delete: true },
  buybacks: { view: true, create: true, edit: true, delete: true },
  sellerLoans: { view: true, create: true, edit: true, delete: true },
  multiStoreSync: { view: true, create: true, edit: true, delete: true },
  financials: { view: true, create: false, edit: false, delete: false },
}

export const EMPTY_STAFF_PERMISSIONS: StaffPermissions = {
  products: emptyModule(),
  receipts: { ...emptyModule(), refund: false },
  leads: emptyModule(),
  buybacks: emptyModule(),
  sellerLoans: emptyModule(),
  multiStoreSync: emptyModule(),
  financials: emptyModule(),
}

/** The subset of a legacy `Staff`/`members` doc needed to derive default permissions. */
export interface LegacyStaffAccessFields {
  role?: 'manager' | 'staff' | 'intern' | string
  canManageInventory?: boolean
  canManageReceipts?: boolean
  permissions?: Partial<StaffPermissions> | StaffPermissions
  /** Branch admin (owner-set). Every module action; financials still follow the stored grant. */
  admin?: boolean
}

/**
 * Pure mapping from the old role + grant model to the new flat matrix. Exact-fidelity: nobody's
 * effective access changes the moment this ships.
 *
 * - `products.view` / `receipts.view` / `receipts.create`: everyone could already see products
 *   and create receipts (POS sales) regardless of role, so these default to true.
 * - `products.{create,edit,delete}`: only a manager explicitly granted `canManageInventory`.
 * - `receipts.edit`: full-field receipt edit was manager-implicit only.
 * - `receipts.refund`: the narrow cancel/refund carve-out. managers implicitly had it, or any
 *   staff/intern explicitly granted `canManageReceipts`.
 * - `receipts.delete`: was owner-only (`usePermissions.canDeleteReceipts = !isStaff`); nobody
 *   gets it by migration.
 * - `leads`: any member could view/create/edit; delete required elevated manage access.
 * - `buybacks`: matched inventory manage (create/edit); view when they could manage.
 * - `sellerLoans`: baseline for every staff member (view/create/edit), same idea as leads /
 *   receipts.create. Delete stays elevated-only.
 * - `multiStoreSync`: owner-only historically; staff never inherit it by migration.
 * - `financials`: owner-only until the owner grants it; staff never inherit it by migration.
 */
export function deriveDefaultPermissions(staff: LegacyStaffAccessFields): StaffPermissions {
  const isManager = staff.role === 'manager'
  const inventoryManaged = isManager && staff.canManageInventory === true
  const hadRefundAccess = isManager || staff.canManageReceipts === true
  const elevated = inventoryManaged || isManager || hadRefundAccess

  const products: ModulePermission = {
    view: true,
    create: inventoryManaged,
    edit: inventoryManaged,
    delete: inventoryManaged,
  }

  const receipts: ReceiptsPermission = {
    view: true,
    create: true,
    edit: isManager,
    delete: false,
    refund: hadRefundAccess,
  }

  const leads: ModulePermission = {
    view: true,
    create: true,
    edit: true,
    delete: elevated,
  }

  const buybacks: ModulePermission = {
    view: inventoryManaged,
    create: inventoryManaged,
    edit: inventoryManaged,
    delete: false,
  }

  const sellerLoans: ModulePermission = {
    view: true,
    create: true,
    edit: true,
    delete: false,
  }

  const multiStoreSync: ModulePermission = emptyModule()

  return {
    products,
    receipts,
    leads,
    buybacks,
    sellerLoans,
    multiStoreSync,
    financials: emptyModule(),
  }
}

/** Fill any modules missing from a stored (partial) matrix using migration defaults. */
export function normalizeStaffPermissions(
  permissions: Partial<StaffPermissions> | StaffPermissions,
  legacy: LegacyStaffAccessFields = {}
): StaffPermissions {
  const derived = deriveDefaultPermissions(legacy)
  return {
    products: permissions.products ?? derived.products,
    receipts: permissions.receipts ?? derived.receipts,
    leads: permissions.leads ?? derived.leads,
    buybacks: permissions.buybacks ?? derived.buybacks,
    sellerLoans: permissions.sellerLoans ?? derived.sellerLoans,
    multiStoreSync: permissions.multiStoreSync ?? derived.multiStoreSync,
    financials: permissions.financials ?? derived.financials,
  }
}

/**
 * Single source of truth for "what can this staff member actually do". used client-side (via
 * usePermissions), by the one-time backfill script, and mirrored (as `legacyHasPermission`) in
 * firestore.rules. Returns the stored grant if present, else derives it from legacy fields.
 *
 * Stock loans view/create/edit are always granted (baseline for every active staff member), even
 * when an older stored matrix left them off. A branch admin gets every module action; their
 * financial-figures grant stays whatever the owner stored.
 */
export function resolveStaffPermissions(staff: LegacyStaffAccessFields): StaffPermissions {
  const base = staff.permissions
    ? normalizeStaffPermissions(staff.permissions, staff)
    : deriveDefaultPermissions(staff)

  if (staff.admin === true) {
    return { ...FULL_STAFF_PERMISSIONS, financials: base.financials }
  }

  return {
    ...base,
    sellerLoans: {
      view: true,
      create: true,
      edit: true,
      delete: base.sellerLoans.delete === true,
    },
  }
}

export function isModuleManaging(module: ModulePermission): boolean {
  return module.create || module.edit || module.delete
}

export function hasAnyModuleManageAccess(permissions: StaffPermissions): boolean {
  return (
    isModuleManaging(permissions.products) ||
    permissions.receipts.edit ||
    permissions.receipts.delete ||
    permissions.receipts.refund ||
    // Leads create/edit are baseline for staff (same idea as receipts.create); only delete elevates.
    permissions.leads.delete ||
    isModuleManaging(permissions.buybacks) ||
    // Stock loans view/create/edit are baseline; only delete elevates.
    permissions.sellerLoans.delete ||
    isModuleManaging(permissions.multiStoreSync)
  )
}

export function getPermissionAction(
  permissions: StaffPermissions,
  module: PermissionModule,
  action: PermissionAction
): boolean {
  const modulePermissions = permissions[module] as Record<string, boolean>
  return modulePermissions[action] === true
}

/** Owner-set admin extras from a stored (possibly partial or malformed) map; all false if absent. */
export function normalizeStaffAdminGrants(raw: unknown): StaffAdminGrants {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return Object.fromEntries(
    STAFF_ADMIN_GRANT_KEYS.map((key) => [key, source[key] === true])
  ) as unknown as StaffAdminGrants
}

/** Coerce an untrusted permissions payload to a full matrix of booleans (unknown keys dropped). */
export function coerceStaffPermissions(raw: unknown): StaffPermissions {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const result: Record<string, Record<string, boolean>> = {}
  for (const [module, template] of Object.entries(EMPTY_STAFF_PERMISSIONS)) {
    const given =
      source[module] && typeof source[module] === 'object'
        ? (source[module] as Record<string, unknown>)
        : {}
    result[module] = Object.fromEntries(
      Object.keys(template).map((action) => [action, given[action] === true])
    )
  }
  return result as unknown as StaffPermissions
}

/**
 * Compact roster-badge summary. "Full access" / "View only" / "Custom". never a stored label.
 * Financial figures are a visibility grant, not an action, so they don't affect the badge.
 */
export function summarizeStaffPermissions(
  permissions: StaffPermissions
): 'full' | 'view-only' | 'custom' {
  const { financials: _financials, ...actions } = permissions
  const { financials: _fullFinancials, ...fullActions } = FULL_STAFF_PERMISSIONS
  if (JSON.stringify(actions) === JSON.stringify(fullActions)) {
    return 'full'
  }
  const isViewOnly =
    !isModuleManaging(permissions.products) &&
    !permissions.receipts.edit &&
    !permissions.receipts.delete &&
    !permissions.receipts.refund &&
    !permissions.leads.delete &&
    !isModuleManaging(permissions.buybacks) &&
    !permissions.sellerLoans.delete &&
    !isModuleManaging(permissions.multiStoreSync)
  return isViewOnly ? 'view-only' : 'custom'
}
