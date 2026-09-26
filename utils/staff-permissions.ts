import type {
  ModulePermission,
  PermissionAction,
  PermissionModule,
  ReceiptsPermission,
  StaffPermissions,
} from '~/types/staff-permissions'

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
}

export const EMPTY_STAFF_PERMISSIONS: StaffPermissions = {
  products: emptyModule(),
  receipts: { ...emptyModule(), refund: false },
  leads: emptyModule(),
  buybacks: emptyModule(),
  sellerLoans: emptyModule(),
  multiStoreSync: emptyModule(),
}

/** The subset of a legacy `Staff`/`members` doc needed to derive default permissions. */
export interface LegacyStaffAccessFields {
  role?: 'manager' | 'staff' | 'intern' | string
  canManageInventory?: boolean
  canManageReceipts?: boolean
  permissions?: Partial<StaffPermissions> | StaffPermissions
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
 * - `sellerLoans`: elevated manage access (same as former "manager-only" ops).
 * - `multiStoreSync`: owner-only historically; staff never inherit it by migration.
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
    view: elevated,
    create: elevated,
    edit: elevated,
    delete: false,
  }

  const multiStoreSync: ModulePermission = emptyModule()

  return { products, receipts, leads, buybacks, sellerLoans, multiStoreSync }
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
  }
}

/**
 * Single source of truth for "what can this staff member actually do". used client-side (via
 * usePermissions), by the one-time backfill script, and mirrored (as `legacyHasPermission`) in
 * firestore.rules. Returns the stored grant if present, else derives it from legacy fields.
 */
export function resolveStaffPermissions(staff: LegacyStaffAccessFields): StaffPermissions {
  if (staff.permissions) {
    return normalizeStaffPermissions(staff.permissions, staff)
  }
  return deriveDefaultPermissions(staff)
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
    isModuleManaging(permissions.sellerLoans) ||
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

/** Compact roster-badge summary. "Full access" / "View only" / "Custom". never a stored label. */
export function summarizeStaffPermissions(
  permissions: StaffPermissions
): 'full' | 'view-only' | 'custom' {
  if (JSON.stringify(permissions) === JSON.stringify(FULL_STAFF_PERMISSIONS)) {
    return 'full'
  }
  const isViewOnly =
    !isModuleManaging(permissions.products) &&
    !permissions.receipts.edit &&
    !permissions.receipts.delete &&
    !permissions.receipts.refund &&
    !permissions.leads.delete &&
    !isModuleManaging(permissions.buybacks) &&
    !isModuleManaging(permissions.sellerLoans) &&
    !isModuleManaging(permissions.multiStoreSync)
  return isViewOnly ? 'view-only' : 'custom'
}
