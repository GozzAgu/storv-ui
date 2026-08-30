<template>
  <div :class="[pageWithFixedFooterClass, 'dash-page--unified']">
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Inventory</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Stock loans</h1>
      </template>
      <template
        v-if="canAccessByRole && canAccessSellerLoansPlan && !sellerLoansStore.loading && sellerLoansStore.loans.length > 0"
        #description
      >
        <DashboardPageMetrics :metrics="loanHeaderMetrics" aria-label="Loan summary" />
      </template>
    </DashboardPageHeader>

    <div
      v-if="!canAccessByRole"
      class="rounded-sm bg-red-50/90 px-4 py-4 dark:bg-red-950/25 sm:px-5 sm:py-5"
    >
      <p class="text-xs font-medium text-red-800 dark:text-red-200">
        Only super admins and store managers can manage stock loans.
      </p>
    </div>

    <template v-else-if="canAccessSellerLoansPlan">
      <div
        v-if="!storesStore.currentStoreId && !sellerLoansStore.loading"
        :class="tableShellFlexClass"
      >
        <DashboardTableEmptyState
          :icon="BuildingStorefrontIcon"
          title="Select a store"
          description="Use the store selector in the top bar to view stock loans for a branch."
          :tips="['Loans are tracked per store', 'Only serialized inventory can be lent out']"
        />
      </div>

      <div v-else class="flex min-h-0 flex-1 flex-col gap-4 sm:gap-5">
        <nav :class="segmentTabsClass" aria-label="Stock loan views" role="tablist">
          <button
            v-for="tab in loanStatusTabs"
            :key="tab.value"
            type="button"
            role="tab"
            :aria-selected="statusFilter === tab.value"
            :class="[
              segmentTabsBtnClass,
              statusFilter === tab.value ? segmentTabsBtnActiveClass : '',
            ]"
            @click="statusFilter = tab.value"
          >
            <span class="inline-flex items-center justify-center gap-1.5">
              {{ tab.label }}
              <span
                v-if="tab.badgeCount"
                class="min-w-[1.125rem] rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                :class="tab.badgeClass"
              >
                {{ tab.badgeCount }}
              </span>
            </span>
          </button>
        </nav>

        <div :class="tableShellFlexClass">
          <div
            v-if="sellerLoansStore.loading && sellerLoansStore.loans.length === 0"
            class="p-6 sm:p-8"
          >
            <div class="space-y-3">
              <div v-for="i in 6" :key="i" class="flex items-center gap-3">
                <div
                  class="h-9 w-9 shrink-0 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"
                />
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                  <div class="h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="sellerLoansStore.error" class="px-4 py-10 text-center sm:px-6">
            <p class="text-sm font-medium text-red-600 dark:text-red-400">
              Could not load stock loans.
            </p>
            <p class="mx-auto mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
              {{ sellerLoansStore.error }}
            </p>
          </div>

          <DashboardTableEmptyState
            v-else-if="sellerLoansStore.loans.length === 0"
            :icon="ArchiveBoxIcon"
            title="No stock loans yet"
            description="Lend serialized inventory from a product page to track borrowers here."
            :tips="[
              'Only items with serial numbers can be lent out',
              'Mark sold or returned when the borrower finishes',
            ]"
          />

          <DashboardTableEmptyState
            v-else-if="filteredLoans.length === 0"
            :icon="MagnifyingGlassIcon"
            title="No loans in this filter"
            description="Switch tabs to see loans in another status."
            :tips="[
              'Active loans are still with the borrower',
              'Returned and sold loans stay in history for reference',
            ]"
          >
            <button
              type="button"
              class="text-xs font-medium text-primary-600 underline decoration-primary-300 underline-offset-2 hover:text-primary-700 dark:text-primary-400 dark:decoration-primary-600 dark:hover:text-primary-300"
              @click="statusFilter = 'all'"
            >
              View all
            </button>
          </DashboardTableEmptyState>

          <div v-else class="flex flex-col">
            <div class="overflow-x-auto">
              <table class="dashboard-table min-w-full">
                <thead>
                  <tr>
                    <th scope="col">Borrower</th>
                    <th scope="col">Units</th>
                    <th scope="col">Started</th>
                    <th scope="col" class="dashboard-table__col-status">Status</th>
                    <th scope="col" class="dashboard-table__col-actions">
                      <span class="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="loan in paginatedLoans" :key="loan.id">
                    <td class="max-w-[16rem] sm:max-w-xs">
                      <span class="dashboard-table__primary block truncate">
                        {{ loan.partyName }}
                      </span>
                      <span
                        v-if="loan.partyPhone"
                        class="dashboard-table__muted mt-0.5 block truncate text-[10px]"
                      >
                        {{ loan.partyPhone }}
                      </span>
                      <span
                        v-if="loan.partyNotes && loan.status === 'active'"
                        class="dashboard-table__muted mt-1 block max-w-xs truncate text-[10px]"
                      >
                        {{ loan.partyNotes }}
                      </span>
                    </td>
                    <td>
                      <span class="dashboard-table__numeric">{{ loan.lines.length }}</span>
                      <button
                        v-if="loan.lines.length > 0 && loan.lines.length <= 40"
                        type="button"
                        class="mt-1 flex items-center gap-0.5 text-[10px] font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        :aria-expanded="expandedLoanIds.has(loan.id)"
                        @click="toggleLoanLines(loan.id)"
                      >
                        <ChevronRightIcon
                          class="h-3 w-3 shrink-0 transition-transform"
                          :class="expandedLoanIds.has(loan.id) ? 'rotate-90' : ''"
                          stroke-width="2"
                        />
                        {{ expandedLoanIds.has(loan.id) ? 'Hide products' : 'View products' }}
                      </button>
                      <ul
                        v-if="expandedLoanIds.has(loan.id) && loan.lines.length"
                        class="mt-1.5 max-h-32 space-y-0.5 overflow-y-auto pl-2"
                      >
                        <li
                          v-for="(line, i) in loan.lines"
                          :key="i"
                          class="dashboard-table__muted text-[10px] leading-snug"
                        >
                          {{ line.itemSummary }}
                        </li>
                      </ul>
                    </td>
                    <td class="whitespace-nowrap">
                      <span class="dashboard-table__muted">{{ formatWhen(loan.createdAt) }}</span>
                    </td>
                    <td class="dashboard-table__col-status">
                      <DashboardTableBadge
                        :badge-class="sellerLoanStatusBadgeClass(loan.status)"
                        :label="formatSellerLoanStatusLabel(loan.status)"
                      />
                    </td>
                    <td class="dashboard-table__col-actions">
                      <template v-if="loan.status === 'active'">
                        <div
                          class="inline-flex justify-end"
                          data-stock-loan-actions-menu
                          @click.stop
                        >
                          <button
                            type="button"
                            :data-stock-loan-actions-anchor="loan.id"
                            class="dashboard-table__action-btn"
                            :disabled="loanActionBusyId === loan.id"
                            :aria-expanded="openLoanMenuId === loan.id"
                            aria-haspopup="menu"
                            aria-label="Stock loan actions"
                            @click="toggleLoanMenu(loan.id)"
                          >
                            <EllipsisVerticalIcon class="h-4 w-4 shrink-0" stroke-width="2" />
                          </button>
                        </div>
                      </template>
                      <span
                        v-else-if="loan.status === 'sold' && loan.soldAt"
                        class="dashboard-table__muted block text-right text-[10px] whitespace-nowrap"
                      >
                        {{ formatWhen(loan.soldAt) }}
                      </span>
                      <span
                        v-else-if="loan.returnedAt"
                        class="dashboard-table__muted block text-right text-[10px] whitespace-nowrap"
                      >
                        {{ formatWhen(loan.returnedAt) }}
                      </span>
                      <span v-else class="dashboard-table__muted text-[10px]">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <DashboardTablePagination
              :current-page="currentPage"
              :items-per-page="itemsPerPage"
              :total="filteredLoans.length"
              @page-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </template>

    <div v-else class="py-8">
      <FeatureGateCard
        feature="seller_loans"
        gate="custom"
        :description="
          isStaff
            ? 'Stock loans are not enabled for your workspace.'
            : undefined
        "
        :secondary-href="isStaff ? undefined : '/dashboard/help#settings-subscription'"
      />
    </div>

    <Modal
      v-model="showReturnModal"
      title="Return to store"
      subtitle="This clears the stock-loan flags on the listed inventory so the units show as available again on the shelf."
      size="md"
      :close-on-backdrop="!confirmReturnLoading"
      :show-close="!confirmReturnLoading"
    >
      <template #default>
        <p v-if="loanPendingReturn" class="text-sm text-gray-700 dark:text-gray-300">
          Mark all
          <span class="font-semibold tabular-nums">{{ loanPendingReturn.lines.length }}</span>
          item{{ loanPendingReturn.lines.length !== 1 ? 's' : '' }}
          from
          <span class="font-semibold">{{ loanPendingReturn.partyName }}</span>
          as returned to your store?
        </p>
        <p
          v-if="loanPendingReturn?.partyNotes"
          class="mt-3 text-xs text-gray-500 dark:text-gray-400"
        >
          Notes on file: {{ loanPendingReturn.partyNotes }}
        </p>
      </template>
      <template #footer>
        <IosDrawerActions
          primary-label="Return to store"
          :primary-loading="confirmReturnLoading"
          :primary-disabled="!loanPendingReturn"
          :cancel-disabled="confirmReturnLoading"
          @cancel="closeReturnModal"
          @primary="confirmReturn"
        />
      </template>
    </Modal>

    <Modal
      v-model="showSoldModal"
      title="Mark sold (borrower)"
      subtitle="Each listed unit will be marked sold in inventory (same as a receipt sale outside the POS). Stock loan borrowing flags are cleared. This cannot be undone from here."
      size="md"
      :close-on-backdrop="!confirmSoldLoading"
      :show-close="!confirmSoldLoading"
    >
      <template #default>
        <p v-if="loanPendingSold" class="text-sm text-gray-700 dark:text-gray-300">
          Mark all
          <span class="font-semibold tabular-nums">{{ loanPendingSold.lines.length }}</span>
          item{{ loanPendingSold.lines.length !== 1 ? 's' : '' }}
          from
          <span class="font-semibold">{{ loanPendingSold.partyName }}</span>
          as sold by the borrower?
        </p>
        <p v-if="loanPendingSold?.partyNotes" class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Notes on file: {{ loanPendingSold.partyNotes }}
        </p>
      </template>
      <template #footer>
        <IosDrawerActions
          primary-label="Mark sold"
          :primary-loading="confirmSoldLoading"
          :primary-disabled="!loanPendingSold"
          :cancel-disabled="confirmSoldLoading"
          @cancel="closeSoldModal"
          @primary="confirmMarkSold"
        />
      </template>
    </Modal>

    <!-- Row actions: not clipped by table overflow -->
    <Teleport to="body">
      <div
        v-if="openLoanMenuId && loanForOpenMenu && loanMenuFixedStyle"
        data-stock-loan-actions-menu
        class="frosted-glass fixed z-[1000] min-w-[11rem] rounded-sm py-0.5 shadow-sm"
        :style="loanMenuFixedStyle"
        role="menu"
        @click.stop
      >
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-1.5 px-2.5 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/85"
          @click="handleLoanMenuMarkSold"
        >
          Mark sold (borrower)
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-1.5 px-2.5 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/85"
          @click="handleLoanMenuReturnToStore"
        >
          Return to store
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import {
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
} from '~/utils/app-icons'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import FeatureGateCard from '~/components/subscription/FeatureGateCard.vue'
import DashboardTableBadge from '~/components/ui/DashboardTableBadge.vue'
import { formatSellerLoanStatusLabel, sellerLoanStatusBadgeClass } from '~/utils/table-badge-styles'
import { useSellerLoanOutsStore, type SellerLoanOut } from '~/stores/sellerLoanOuts'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { useAppToast } from '~/composables/useAppToast'
import { getVisibleMenuAnchorElement, computeFixedAnchoredMenuStyle } from '~/utils/menuAnchor'

definePageMeta({
  layout: 'dashboard',
})

const {
  eyebrowClass,
  pageTitleClass,
  pageWithFixedFooterClass,
  segmentTabsClass,
  segmentTabsBtnClass,
  segmentTabsBtnActiveClass,
} = useDashboardPageChrome()

const { tableShellFlexClass } = useDashboardTableChrome()

const sellerLoansStore = useSellerLoanOutsStore()
const storesStore = useStoresStore()
const { canManage, isStaff } = usePermissions()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const toast = useAppToast()

const canAccessByRole = computed(() => canManage.value)
const canAccessSellerLoansPlan = computed(() => canUseSubscriptionFeature('seller_loans'))

type LoanStatusFilter = 'active' | 'returned' | 'sold' | 'all'

const statusFilter = ref<LoanStatusFilter>('active')
const expandedLoanIds = ref<Set<string>>(new Set())

const loanCountByStatus = computed(() => {
  const rows = sellerLoansStore.loans
  return {
    active: rows.filter((l) => l.status === 'active').length,
    sold: rows.filter((l) => l.status === 'sold').length,
    returned: rows.filter((l) => l.status === 'returned').length,
  }
})

const loanStatusTabs = computed(() => {
  const counts = loanCountByStatus.value
  return [
    {
      value: 'active' as const,
      label: 'Active',
      badgeCount: counts.active > 0 ? counts.active : undefined,
      badgeClass: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200',
    },
    { value: 'returned' as const, label: 'Returned' },
    { value: 'sold' as const, label: 'Sold (borrower)' },
    { value: 'all' as const, label: 'All' },
  ]
})

function toggleLoanLines(loanId: string) {
  const next = new Set(expandedLoanIds.value)
  if (next.has(loanId)) next.delete(loanId)
  else next.add(loanId)
  expandedLoanIds.value = next
}

const getInitialPage = (): number => {
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('seller-loans-page')
      return saved ? parseInt(saved, 10) : 1
    } catch {
      return 1
    }
  }
  return 1
}

const currentPage = ref(getInitialPage())
const itemsPerPage = ref(100)

const filteredLoans = computed(() => {
  const rows = sellerLoansStore.loans
  if (statusFilter.value === 'all') return rows
  if (statusFilter.value === 'active') return rows.filter((l) => l.status === 'active')
  if (statusFilter.value === 'sold') return rows.filter((l) => l.status === 'sold')
  return rows.filter((l) => l.status === 'returned')
})

const loanHeaderMetrics = computed(() => {
  const counts = loanCountByStatus.value
  const total = sellerLoansStore.loans.length
  const shown = filteredLoans.value.length

  return [
    {
      key: 'shown',
      label: statusFilter.value === 'all' ? 'Loans' : 'Shown',
      value: statusFilter.value === 'all' ? String(total) : `${shown} / ${total}`,
    },
    {
      key: 'active',
      label: 'On loan',
      value: String(counts.active),
      tone: counts.active > 0 ? ('info' as const) : undefined,
    },
    {
      key: 'sold',
      label: 'Sold',
      value: String(counts.sold),
      tone: 'success' as const,
    },
    {
      key: 'returned',
      label: 'Returned',
      value: String(counts.returned),
    },
  ]
})

const paginatedLoans = computed(() => {
  const list = filteredLoans.value
  const start = (currentPage.value - 1) * itemsPerPage.value
  return list.slice(start, start + itemsPerPage.value)
})

function handlePageChange(page: number) {
  currentPage.value = page
  if (import.meta.client) {
    try {
      localStorage.setItem('seller-loans-page', String(page))
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

watch(statusFilter, () => {
  expandedLoanIds.value = new Set()
  currentPage.value = 1
  if (import.meta.client) {
    try {
      localStorage.setItem('seller-loans-page', '1')
    } catch {
      // ignore
    }
  }
})

watch(
  () => filteredLoans.value.length,
  (total) => {
    const maxPage = Math.max(1, Math.ceil(total / itemsPerPage.value) || 1)
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage
    }
  }
)

function formatWhen(v: Date | undefined) {
  if (!v) return '-'
  try {
    return v.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return '-'
  }
}

watch(
  () => storesStore.currentStoreId,
  () => {
    if (storesStore.currentStoreId && canAccessSellerLoansPlan.value && canAccessByRole.value) {
      sellerLoansStore.fetchSellerLoanOuts(true)
    } else if (!storesStore.currentStoreId) {
      sellerLoansStore.clearForUiStoreSwitch()
    }
  }
)

onMounted(() => {
  if (canAccessSellerLoansPlan.value && canAccessByRole.value && storesStore.currentStoreId) {
    sellerLoansStore.fetchSellerLoanOuts(true)
  }
})

const openLoanMenuId = ref<string | null>(null)
const toggleLoanMenu = (loanId: string) => {
  openLoanMenuId.value = openLoanMenuId.value === loanId ? null : loanId
}

const loanForOpenMenu = computed(() => {
  const id = openLoanMenuId.value
  if (!id) return null
  return sellerLoansStore.loans.find((l) => l.id === id && l.status === 'active') ?? null
})

const loanMenuFixedStyle = ref<Record<string, string> | null>(null)

let loanMenuOutsideHandler: ((e: MouseEvent) => void) | null = null

function removeLoanMenuOutsideListener() {
  if (loanMenuOutsideHandler && import.meta.client) {
    document.removeEventListener('click', loanMenuOutsideHandler, true)
    loanMenuOutsideHandler = null
  }
}

function updateLoanMenuPosition() {
  const id = openLoanMenuId.value
  if (!id || !import.meta.client) {
    loanMenuFixedStyle.value = null
    return
  }
  const el = getVisibleMenuAnchorElement('data-stock-loan-actions-anchor', id)
  if (!el) {
    loanMenuFixedStyle.value = null
    return
  }
  const r = el.getBoundingClientRect()
  loanMenuFixedStyle.value = computeFixedAnchoredMenuStyle(r, {
    menuWidth: 176,
    estimatedMenuHeight: 88,
    margin: 4,
    viewportPadding: 8,
  })
}

function addLoanMenuPositionListeners() {
  if (!import.meta.client) return
  window.addEventListener('scroll', updateLoanMenuPosition, true)
  window.addEventListener('resize', updateLoanMenuPosition)
}

function removeLoanMenuPositionListeners() {
  if (!import.meta.client) return
  window.removeEventListener('scroll', updateLoanMenuPosition, true)
  window.removeEventListener('resize', updateLoanMenuPosition)
}

watch(openLoanMenuId, (id) => {
  removeLoanMenuOutsideListener()
  removeLoanMenuPositionListeners()
  loanMenuFixedStyle.value = null
  if (!id || !import.meta.client) return

  nextTick(() => {
    updateLoanMenuPosition()
    addLoanMenuPositionListeners()
  })

  loanMenuOutsideHandler = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null
    if (t?.closest?.('[data-stock-loan-actions-menu]')) return
    openLoanMenuId.value = null
    removeLoanMenuOutsideListener()
  }

  nextTick(() => {
    setTimeout(() => {
      if (openLoanMenuId.value && loanMenuOutsideHandler) {
        document.addEventListener('click', loanMenuOutsideHandler, true)
      }
    }, 0)
  })
})

onBeforeUnmount(() => {
  removeLoanMenuOutsideListener()
  removeLoanMenuPositionListeners()
})

function handleLoanMenuMarkSold() {
  const loan = loanForOpenMenu.value
  if (!loan) {
    openLoanMenuId.value = null
    return
  }
  openLoanMenuId.value = null
  openSoldModal(loan)
}

function handleLoanMenuReturnToStore() {
  const loan = loanForOpenMenu.value
  if (!loan) {
    openLoanMenuId.value = null
    return
  }
  openLoanMenuId.value = null
  openReturnModal(loan)
}

const returningLoanId = ref<string | null>(null)
const markingSoldLoanId = ref<string | null>(null)
const loanActionBusyId = computed(() => returningLoanId.value ?? markingSoldLoanId.value)

const showReturnModal = ref(false)
const loanPendingReturn = ref<SellerLoanOut | null>(null)
const confirmReturnLoading = ref(false)

const showSoldModal = ref(false)
const loanPendingSold = ref<SellerLoanOut | null>(null)
const confirmSoldLoading = ref(false)

watch(showReturnModal, (open) => {
  if (!open && !confirmReturnLoading.value) {
    loanPendingReturn.value = null
  }
})

watch(showSoldModal, (open) => {
  if (!open && !confirmSoldLoading.value) {
    loanPendingSold.value = null
  }
})

function openReturnModal(loan: SellerLoanOut) {
  loanPendingReturn.value = loan
  showReturnModal.value = true
}

function closeReturnModal() {
  showReturnModal.value = false
  if (!confirmReturnLoading.value) {
    loanPendingReturn.value = null
  }
}

async function confirmReturn() {
  const loan = loanPendingReturn.value
  if (!loan) return
  returningLoanId.value = loan.id
  confirmReturnLoading.value = true
  try {
    await sellerLoansStore.returnSellerLoanOut(loan.id)
    toast.success('Stock returned. Items are available again in inventory.')
    showReturnModal.value = false
    loanPendingReturn.value = null
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Return failed')
  } finally {
    confirmReturnLoading.value = false
    returningLoanId.value = null
  }
}

function openSoldModal(loan: SellerLoanOut) {
  loanPendingSold.value = loan
  showSoldModal.value = true
}

function closeSoldModal() {
  showSoldModal.value = false
  if (!confirmSoldLoading.value) {
    loanPendingSold.value = null
  }
}

async function confirmMarkSold() {
  const loan = loanPendingSold.value
  if (!loan) return
  markingSoldLoanId.value = loan.id
  confirmSoldLoading.value = true
  try {
    await sellerLoansStore.markSellerLoanOutSold(loan.id)
    toast.success('Items marked sold. They now show as sold in inventory.')
    showSoldModal.value = false
    loanPendingSold.value = null
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Could not mark sold')
  } finally {
    confirmSoldLoading.value = false
    markingSoldLoanId.value = null
  }
}
</script>
