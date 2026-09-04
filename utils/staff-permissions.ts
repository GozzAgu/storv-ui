import type {
  ModulePermission,
  PermissionAction,
  PermissionModule,
  ReceiptsPermission,
  StaffPermissions,
} from '~/types/staff-permissions'

export const FULL_STAFF_PERMISSIONS: StaffPermissions = {
  products: { view: true, create: true, edit: true, delete: true },
  receipts: { view: true, create: true, edit: true, delete: true, refund: true },
}

export const EMPTY_STAFF_PERMISSIONS: StaffPermissions = {
  products: { view: false, create: false, edit: false, delete: false },
  receipts: { view: false, create: false, edit: false, delete: false, refund: false },
}

/** The subset of a legacy `Staff`/`members` doc needed to derive default permissions. */
export interface LegacyStaffAccessFields {
  role?: 'manager' | 'staff' | 'intern' | string
  canManageInventory?: boolean
  canManageReceipts?: boolean
  permissions?: StaffPermissions
}

/**
 * Pure mapping from the old role + grant model to the new flat matrix. Exact-fidelity: nobody's
 * effective access changes the moment this ships.
 *
 * - `products.view` / `receipts.view` / `receipts.create`: everyone could already see products
 *   and create receipts (POS sales) regardless of role, so these default to true.
 * - `products.{create,edit,delete}`: only a manager explicitly granted `canManageInventory`.
 * - `receipts.edit`: full-field receipt edit was manager-implicit only.
 * - `receipts.refund`: the narrow cancel/refund carve-out — managers implicitly had it, or any
 *   staff/intern explicitly granted `canManageReceipts`.
 * - `receipts.delete`: was owner-only (`usePermissions.canDeleteReceipts = !isStaff`); nobody
 *   gets it by migration.
 */
export function deriveDefaultPermissions(staff: LegacyStaffAccessFields): StaffPermissions {
  const isManager = staff.role === 'manager'
  const inventoryManaged = isManager && staff.canManageInventory === true
  const hadRefundAccess = isManager || staff.canManageReceipts === true

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

  return { products, receipts }
}

/**
 * Single source of truth for "what can this staff member actually do" — used client-side (via
 * usePermissions), by the one-time backfill script, and mirrored (as `legacyHasPermission`) in
 * firestore.rules. Returns the stored grant if present, else derives it from legacy fields.
 */
export function resolveStaffPermissions(staff: LegacyStaffAccessFields): StaffPermissions {
  return staff.permissions ?? deriveDefaultPermissions(staff)
}

export function isModuleManaging(module: ModulePermission): boolean {
  return module.create || module.edit || module.delete
}

export function hasAnyModuleManageAccess(permissions: StaffPermissions): boolean {
  return (
    isModuleManaging(permissions.products) ||
    permissions.receipts.edit ||
    permissions.receipts.delete ||
    permissions.receipts.refund
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

/** Compact roster-badge summary — "Full access" / "View only" / "Custom" — never a stored label. */
export function summarizeStaffPermissions(
  permissions: StaffPermissions
): 'full' | 'view-only' | 'custom' {
  if (
    JSON.stringify(permissions) === JSON.stringify(FULL_STAFF_PERMISSIONS)
  ) {
    return 'full'
  }
  const isViewOnly =
    !isModuleManaging(permissions.products) &&
    !permissions.receipts.edit &&
    !permissions.receipts.delete &&
    !permissions.receipts.refund
  return isViewOnly ? 'view-only' : 'custom'
}
