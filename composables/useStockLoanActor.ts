import { computed } from 'vue'
import { usePermissions } from '~/composables/usePermissions'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import type { StockLoanActor } from '~/utils/stock-loan-policy'

/** The signed-in user as the stock-loan policy sees them; mirrors toStockLoanActor on the server. */
export function useStockLoanActor() {
  const { can, isAdmin, hasAdminGrant } = usePermissions()
  const userStore = useUserStore()
  const authStore = useAuthStore()

  return computed<StockLoanActor>(() => {
    const isOwner = userStore.isSuperAdmin
    return {
      uid: authStore.currentUser?.uid ?? '',
      isOwner,
      canApprove: isOwner || (isAdmin.value && hasAdminGrant('stockLoanApprovals')),
      canEdit: isOwner || can('sellerLoans', 'edit'),
      canMarkSold: isOwner || can('receipts', 'edit'),
    }
  })
}
