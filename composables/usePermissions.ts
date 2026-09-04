import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'
import type { PermissionAction, PermissionModule, StaffPermissions } from '~/types/staff-permissions'
import {
  EMPTY_STAFF_PERMISSIONS,
  FULL_STAFF_PERMISSIONS,
  getPermissionAction,
  hasAnyModuleManageAccess,
  resolveStaffPermissions,
} from '~/utils/staff-permissions'

/**
 * Composable for checking user permissions.
 *
 * Staff access is no longer a fixed role tier (manager/staff/intern) — it's a per-module grant
 * matrix (see types/staff-permissions.ts). `permissions`/`can()` are the source of truth; every
 * other flag below is a thin, name-preserving wrapper over them so existing consumers keep
 * working unchanged. `role` on a Staff doc is deprecated (kept only for migration fallback via
 * `resolveStaffPermissions` — see utils/staff-permissions.ts) and should not be read directly
 * anywhere new.
 */
export const usePermissions = () => {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const staffStore = useStaffStore()

  const isStaff = computed(() => userStore.userData?.role === 'staff')

  /** The calling account's effective grant matrix — full access for the store owner. */
  const permissions = computed<StaffPermissions>(() => {
    if (userStore.isSuperAdmin) return FULL_STAFF_PERMISSIONS
    const member = staffStore.getCurrentStaffMember
    return member ? resolveStaffPermissions(member) : EMPTY_STAFF_PERMISSIONS
  })

  /** Generic per-module, per-action check — prefer this over the specific flags below in new code. */
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

  const canDeleteReceipts = computed(() => can('receipts', 'delete'))

  const canManageInventoryItems = computed(() => can('products', 'edit'))

  const canCreateInventoryFolders = computed(() => can('products', 'create'))

  const canCreateStaff = computed(() => !isStaff.value)

  const canRemoveStaff = computed(() => userStore.isSuperAdmin)

  const canMoveStaff = computed(() => userStore.isSuperAdmin)

  /** Whether the calling user may edit another staff member's permission matrix at all. */
  const canEditStaffPermissions = computed(() => userStore.isSuperAdmin)

  /** Unit cost, margin, COGS, gross profit, and P&L. Store owner (super admin) only; never staff. */
  const canViewProfitAndCost = computed(
    () => !isStaff.value && userStore.userData?.role === 'superAdmin'
  )

  /** Paystack upgrades, plan banners, and billing. Super admin (account owner) only. */
  const canManageBilling = computed(() => userStore.isSuperAdmin)

  /** Adding/settling a sale commission. Owner-only for now; not part of the v1 permission matrix
   *  (staff management, billing, and commissions are deliberately out of scope — see the staff
   *  permission matrix plan). */
  const canManageCommissions = computed(() => userStore.isSuperAdmin)

  return {
    isStaff,
    permissions,
    can,
    hasAnyManageAccess,
    isManager,
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
    canViewProfitAndCost,
    canManageBilling,
    canManageCommissions,
  }
}
