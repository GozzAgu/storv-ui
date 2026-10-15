import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'
import type {
  PermissionAction,
  PermissionModule,
  StaffAdminGrants,
  StaffPermissions,
} from '~/types/staff-permissions'
import {
  EMPTY_STAFF_PERMISSIONS,
  FULL_STAFF_PERMISSIONS,
  getPermissionAction,
  hasAnyModuleManageAccess,
  normalizeStaffAdminGrants,
  resolveStaffPermissions,
} from '~/utils/staff-permissions'

/**
 * Composable for checking user permissions.
 *
 * Staff access is no longer a fixed role tier (manager/staff/intern). it's a per-module grant
 * matrix (see types/staff-permissions.ts). `permissions`/`can()` are the source of truth; every
 * other flag below is a thin, name-preserving wrapper over them so existing consumers keep
 * working unchanged. `role` on a Staff doc is deprecated (kept only for migration fallback via
 * `resolveStaffPermissions`. see utils/staff-permissions.ts) and should not be read directly
 * anywhere new.
 */
export const usePermissions = () => {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const staffStore = useStaffStore()

  const isStaff = computed(() => userStore.userData?.role === 'staff')

  /** The calling account's effective grant matrix. full access for the store owner. */
  const permissions = computed<StaffPermissions>(() => {
    if (userStore.isSuperAdmin) return FULL_STAFF_PERMISSIONS
    const member = staffStore.getCurrentStaffMember
    return member ? resolveStaffPermissions(member) : EMPTY_STAFF_PERMISSIONS
  })

  /** Generic per-module, per-action check. prefer this over the specific flags below in new code. */
  function can(module: PermissionModule, action: PermissionAction): boolean {
    if (userStore.isSuperAdmin) return true
    return getPermissionAction(permissions.value, module, action)
  }

  const hasAnyManageAccess = computed(() => hasAnyModuleManageAccess(permissions.value))

  /** @deprecated Role tiers no longer exist. Use `can()`/`hasAnyManageAccess` instead. Kept only
   *  because a few UI spots (e.g. profile menu labels) still show a legacy role for old staff. */
  const isManager = computed(() => {
    if (!isStaff.value || !authStore.currentUser) return false
    return staffStore.getCurrentStaffMember?.role === 'manager'
  })

  /** Owner-granted inventory access for a staff member (not everyone by default). */
  const hasInventoryEditorAccess = computed(() => can('products', 'edit'))

  const canManage = computed(() => {
    if (!isStaff.value) return true
    return hasAnyManageAccess.value
  })

  const isReadOnly = computed(() => isStaff.value && !hasAnyManageAccess.value)

  const canCreate = computed(() => !!authStore.currentUser)

  /** Owner-granted receipts access (cancel/refund) for a staff member (not everyone by default). */
  const hasReceiptsEditorAccess = computed(() => can('receipts', 'refund'))

  const canEditReceipts = computed(() => hasReceiptsEditorAccess.value)

  /** Deleting sales goes through the server: the owner, or an admin with the delete-sales extra. */
  const canDeleteReceipts = computed(() => hasAdminGrant('deleteSales'))

  const canManageInventoryItems = computed(() => can('products', 'edit'))

  const canCreateInventoryFolders = computed(() => can('products', 'create'))

  /** Branch admin of the store their staff record belongs to (owner-set). */
  const isAdmin = computed(() => isStaff.value && staffStore.getCurrentStaffMember?.admin === true)

  const adminGrants = computed<StaffAdminGrants>(() =>
    normalizeStaffAdminGrants(isAdmin.value ? staffStore.getCurrentStaffMember?.adminGrants : null)
  )

  /** Owner, or an admin the owner gave this extra. */
  function hasAdminGrant(grant: keyof StaffAdminGrants): boolean {
    if (userStore.isSuperAdmin) return true
    return adminGrants.value[grant] === true
  }

  /** Add, edit, move and remove regular staff, and manage departments: owner or admin. */
  const canManageStaff = computed(() => userStore.isSuperAdmin || isAdmin.value)

  const canCreateStaff = canManageStaff

  const canRemoveStaff = canManageStaff

  const canMoveStaff = canManageStaff

  /** Whether the calling user may edit another staff member's permission matrix at all. */
  const canEditStaffPermissions = canManageStaff

  /** Financial figures, making admins, and editing admins: the owner only. */
  const isStoreOwner = computed(() => userStore.isSuperAdmin)

  /** Admins can't act on themselves or on other admins; the owner can act on anyone. */
  function canManageStaffMember(member: { admin?: boolean; authUid?: string } | null | undefined) {
    if (!member) return false
    if (userStore.isSuperAdmin) return true
    if (!isAdmin.value) return false
    if (member.admin === true) return false
    return !member.authUid || member.authUid !== authStore.currentUser?.uid
  }

  /**
   * Revenue, sales totals, stock value, cost and profit: the store owner, plus staff the owner has
   * granted "Financial figures". Hides UI only; staff can still read individual sales they can see.
   */
  const canViewFinancials = computed(() => {
    if (!isStaff.value) return userStore.userData?.role === 'superAdmin'
    return permissions.value.financials.view === true
  })

  /** Unit cost, margin, COGS, gross profit, and P&L. Same audience as `canViewFinancials`. */
  const canViewProfitAndCost = canViewFinancials

  /** Paystack upgrades, plan banners, and billing. Super admin (account owner) only. */
  const canManageBilling = computed(() => userStore.isSuperAdmin)

  /** Adding/settling a sale commission: the owner, or an admin with the delete-sales extra. */
  const canManageCommissions = computed(() => hasAdminGrant('deleteSales'))

  return {
    isStaff,
    permissions,
    can,
    hasAnyManageAccess,
    isManager,
    isAdmin,
    adminGrants,
    hasAdminGrant,
    isStoreOwner,
    canManageStaff,
    canManageStaffMember,
    hasInventoryEditorAccess,
    hasReceiptsEditorAccess,
    canManage,
    isReadOnly,
    canCreate,
    canEditReceipts,
    canDeleteReceipts,
    canManageInventoryItems,
    canCreateInventoryFolders,
    canCreateStaff,
    canRemoveStaff,
    canMoveStaff,
    canEditStaffPermissions,
    canViewFinancials,
    canViewProfitAndCost,
    canManageBilling,
    canManageCommissions,
  }
}
