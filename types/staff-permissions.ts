/**
 * Granular, per-module staff permission matrix.
 *
 * Replaces the old fixed `role: 'manager' | 'staff' | 'intern'` tier with an explicit grant per
 * feature module. A staff member's actual access is never read off `role` directly anymore —
 * always go through `resolveStaffPermissions()` / `usePermissions().can()` in
 * utils/staff-permissions.ts.
 */

export type PermissionModule = 'products' | 'receipts'

export interface ModulePermission {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

/**
 * Receipts (orders/transactions) has a 5th action beyond the generic CRUD set: refunding or
 * cancelling an existing sale is narrower than full field edit (firestore.rules has always
 * field-locked this separately via `receiptStaffRefundUpdate`), so it stays a distinct grant
 * rather than being folded into `edit`.
 */
export interface ReceiptsPermission extends ModulePermission {
  refund: boolean
}

export interface StaffPermissions {
  products: ModulePermission
  receipts: ReceiptsPermission
}

export type PermissionAction = keyof ReceiptsPermission
