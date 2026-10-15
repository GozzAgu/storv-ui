/**
 * Granular, per-module staff permission matrix.
 *
 * Replaces the old fixed `role: 'manager' | 'staff' | 'intern'` tier with an explicit grant per
 * feature module. A staff member's actual access is never read off `role` directly anymore -
 * always go through `resolveStaffPermissions()` / `usePermissions().can()` in
 * utils/staff-permissions.ts.
 */

export type PermissionModule =
  | 'products'
  | 'receipts'
  | 'leads'
  | 'buybacks'
  | 'sellerLoans'
  | 'multiStoreSync'
  | 'financials'

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
  leads: ModulePermission
  buybacks: ModulePermission
  sellerLoans: ModulePermission
  multiStoreSync: ModulePermission
  /**
   * Revenue, sales totals, stock value, cost and profit. Only `view` is meaningful; the owner
   * always has it, staff only when the owner grants it.
   */
  financials: ModulePermission
}

export type PermissionAction = keyof ReceiptsPermission

/**
 * Branch admin extras. An admin (member doc `admin: true`) already has every module action and
 * can manage regular staff and departments; these are the high-risk owner powers the owner turns
 * on one by one. Only the owner can change `admin`, `adminGrants` or anyone's `financials`.
 */
export interface StaffAdminGrants {
  /** Create, edit and delete branches. */
  branches: boolean
  /** Give staff the "confirm payments" grant. */
  paymentsConfirm: boolean
  /** Delete sales and settle commissions. */
  deleteSales: boolean
  /** Business details, tax, receipt settings. */
  storeSettings: boolean
  /** Export all store data. */
  dataExport: boolean
  /** Request and complete stock transfers to other branches. */
  stockTransfers: boolean
}

export const STAFF_ADMIN_GRANT_KEYS = [
  'branches',
  'paymentsConfirm',
  'deleteSales',
  'storeSettings',
  'dataExport',
  'stockTransfers',
] as const satisfies ReadonlyArray<keyof StaffAdminGrants>

/** Shared settings sections a branch admin with the "store settings" extra may save. */
export type SharedSettingsSection = 'business' | 'inventory' | 'receipt' | 'payment'
