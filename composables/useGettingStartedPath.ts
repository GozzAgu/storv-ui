import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useInventoryStore } from '~/stores/inventory'
import { useReceiptsStore } from '~/stores/receipts'
import { useDepartmentsStore } from '~/stores/departments'
import { useStoresStore } from '~/stores/stores'
import { resolveStoreDepartmentsPath } from '~/utils/department-routes'

export type GettingStartedStepId = 'category' | 'product' | 'sale' | 'staff'

function dismissStorageKey(uid: string) {
  return `storvv-getting-started-dismissed-${uid}`
}

/**
 * Single first-win path (category → product → sale → optional staff).
 * Shared so dashboard can hide competing banners/tutorials while this is active.
 */
export function useGettingStartedPath() {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const inventoryStore = useInventoryStore()
  const receiptsStore = useReceiptsStore()
  const departmentsStore = useDepartmentsStore()
  const storesStore = useStoresStore()
  const { canUse: canUseBusinessCapability } = useBusinessCapabilities()

  const dismissed = ref(false)

  function readDismissed(uid: string | undefined) {
    if (!import.meta.client || !uid) return false
    return localStorage.getItem(dismissStorageKey(uid)) === '1'
  }

  function writeDismissed(uid: string) {
    if (!import.meta.client) return
    localStorage.setItem(dismissStorageKey(uid), '1')
  }

  const hasCategory = computed(() => inventoryStore.folders.length > 0)
  const hasProduct = computed(() => inventoryStore.totalItems > 0)
  const hasSale = computed(() => receiptsStore.receipts.length > 0)
  const hasStaff = computed(() => {
    const storeId = storesStore.currentStoreId
    if (!storeId) return false
    return departmentsStore.departments
      .filter((dept) => dept.storeId === storeId)
      .some((dept) => (dept.staffCount || 0) > 0)
  })

  const staffDepartmentsHref = computed(() => {
    const storeId = storesStore.currentStoreId || storesStore.stores[0]?.id
    return resolveStoreDepartmentsPath(storeId, storesStore.stores[0]?.id) ?? '/dashboard/settings'
  })

  const steps = computed(() => {
    const all = [
      {
        id: 'category' as const,
        order: 1,
        title: 'Create an inventory category',
        description: 'Group products so your team can find stock quickly.',
        href: '/dashboard/inventory',
        cta: 'Add category',
        done: hasCategory.value,
      },
      {
        id: 'product' as const,
        order: 2,
        title: 'Add your first product',
        description: 'Open a category and add at least one item to sell.',
        href: hasCategory.value
          ? `/dashboard/inventory/${inventoryStore.folders[0]?.id ?? ''}`
          : '/dashboard/inventory',
        cta: 'Add product',
        done: hasProduct.value,
      },
      {
        id: 'sale' as const,
        order: 3,
        title: 'Record a sale',
        description: 'Create a receipt to start tracking revenue and payments.',
        href: '/dashboard/receipts',
        cta: 'Create sale',
        done: hasSale.value,
      },
      {
        id: 'staff' as const,
        order: 4,
        title: 'Invite a team member',
        description: 'Add staff to a department so they can sign in with their role.',
        href: staffDepartmentsHref.value,
        cta: 'Add staff',
        done: hasStaff.value,
      },
    ]
    if (!canUseBusinessCapability('staffManagement')) {
      return all.filter((step) => step.id !== 'staff')
    }
    return all
  })

  const completedCount = computed(() => steps.value.filter((step) => step.done).length)
  const allComplete = computed(() => completedCount.value === steps.value.length)
  const progressPercent = computed(() =>
    steps.value.length === 0 ? 0 : Math.round((completedCount.value / steps.value.length) * 100)
  )

  /** Next incomplete step — drives quiet-dashboard CTA. */
  const nextStep = computed(() => steps.value.find((step) => !step.done) ?? null)

  const visible = computed(() => {
    if (dismissed.value) return false
    if (!userStore.isSuperAdmin) return false
    if (!userStore.hasCompletedOnboarding) return false
    if (allComplete.value) return false
    return true
  })

  function dismiss() {
    dismissed.value = true
    const uid = authStore.currentUser?.uid
    if (uid) writeDismissed(uid)
  }

  onMounted(() => {
    dismissed.value = readDismissed(authStore.currentUser?.uid)
  })

  watch(
    () => authStore.currentUser?.uid,
    (uid) => {
      dismissed.value = readDismissed(uid)
    }
  )

  return {
    steps,
    completedCount,
    allComplete,
    progressPercent,
    nextStep,
    visible,
    dismiss,
  }
}
