<template>
  <div class="w-full max-w-none space-y-5 pb-6 sm:space-y-6 sm:pb-8">
    <DashboardPageHeader>
      <template #eyebrow>
        <p :class="eyebrowClass">Inventory</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Stock loans</h1>
      </template>
      <template #description>
        <p :class="descriptionClass">
          Track serial items lent to a borrower. Mark sold when they sell outside your POS (inventory shows sold), use a receipt to sell through the till, or return units to stock.
        </p>
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
        class="rounded-sm bg-white/90 px-6 py-12 text-center dark:!bg-dashboard-card sm:px-10"
      >
        <BuildingStorefrontIcon class="mx-auto mb-3 h-7 w-7 text-gray-500 dark:text-gray-400" stroke-width="1.5" />
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Select a store</p>
        <p class="mx-auto mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
          Use the store selector in the top bar.
        </p>
      </div>

      <div v-else class="data-table-shell overflow-hidden">
        <div class="border-b border-gray-100/90 bg-gradient-to-b from-gray-50/90 to-white px-4 py-3 dark:border-gray-800/70 dark:from-white/[0.03] dark:to-transparent sm:px-5">
          <div class="flex flex-wrap items-center gap-2">
            <div
              class="flex h-8 shrink-0 items-center rounded-lg border border-gray-200/90 bg-gray-50/50 p-0.5 dark:border-gray-700/80 dark:bg-white/[0.03]"
              role="group"
              aria-label="Loan status"
            >
              <button
                v-for="tab in loanStatusTabs"
                :key="tab.value"
                type="button"
                class="rounded-md px-2.5 text-xs font-medium transition-colors"
                :class="
                  statusFilter === tab.value
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                "
                @click="statusFilter = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>
            <button
              type="button"
              class="inline-flex h-8 items-center px-2 text-xs font-medium text-primary-700 underline underline-offset-2 hover:text-primary-900 disabled:opacity-50 dark:text-primary-400 dark:hover:text-primary-200"
              :disabled="sellerLoansStore.loading"
              @click="sellerLoansStore.fetchSellerLoanOuts(true)"
            >
              Refresh
            </button>
          </div>
        </div>

        <div v-if="sellerLoansStore.loading && sellerLoansStore.loans.length === 0" class="p-8">
          <div class="mx-auto flex max-w-[200px] flex-col gap-2">
            <div v-for="i in 6" :key="i" class="h-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        <div v-else-if="sellerLoansStore.error" class="px-5 py-8 text-center text-sm text-red-600 dark:text-red-400">
          {{ sellerLoansStore.error }}
        </div>

        <div v-else-if="filteredLoans.length === 0" class="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          No stock loans in this filter.
        </div>

        <div v-else class="flex min-h-0 flex-1 flex-col">
          <div class="min-h-0 flex-1 overflow-x-auto">
          <table class="dashboard-table min-w-full">
            <thead>
              <tr>
                <th scope="col">Borrower</th>
                <th scope="col">Units</th>
                <th scope="col">Started</th>
                <th scope="col">Status</th>
                <th scope="col" class="w-[1%] whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="loan in paginatedLoans" :key="loan.id">
                <td>
                  <p class="text-[11px] font-semibold text-gray-900 dark:text-gray-50">{{ loan.partyName }}</p>
                  <p v-if="loan.partyPhone" class="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{{ loan.partyPhone }}</p>
                  <p v-if="loan.partyNotes && loan.status === 'active'" class="mt-1 max-w-xs truncate text-[10px] text-gray-600 dark:text-gray-300" :title="loan.partyNotes">
                    {{ loan.partyNotes }}
                  </p>
                </td>
                <td class="px-3 py-2.5 text-[11px] text-gray-800 dark:text-gray-200 sm:px-4">
                  {{ loan.lines.length }}
                  <details v-if="loan.lines.length && loan.lines.length <= 40" class="mt-1.5">
                    <summary class="cursor-pointer text-[10px] text-primary-700 dark:text-primary-400">View products</summary>
                    <ul class="mt-1 max-h-32 list-inside list-disc space-y-0.5 text-[10px] text-gray-600 dark:text-gray-400">
                      <li v-for="(line, i) in loan.lines" :key="i">{{ line.itemSummary }}</li>
                    </ul>
                  </details>
                </td>
                <td class="whitespace-nowrap px-3 py-2.5 text-[11px] text-gray-700 dark:text-gray-300 sm:px-4">
                  {{ formatWhen(loan.createdAt) }}
                </td>
                <td class="px-3 py-2.5 sm:px-4">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide ring-1 ring-inset',
                      loan.status === 'active'
                        ? 'bg-indigo-500/10 text-indigo-900 ring-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-100 dark:ring-indigo-400/30'
                        : loan.status === 'sold'
                          ? 'bg-emerald-500/10 text-emerald-900 ring-emerald-500/20 dark:bg-emerald-400/12 dark:text-emerald-100 dark:ring-emerald-400/30'
                          : 'bg-gray-500/10 text-gray-700 ring-gray-400/25 dark:bg-gray-500/15 dark:text-gray-300',
                    ]"
                  >
                    {{
                      loan.status === 'active' ? 'On loan' : loan.status === 'sold' ? 'Sold' : 'Returned'
                    }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-right sm:px-4">
                  <template v-if="loan.status === 'active'">
                    <div
                      class="relative inline-flex justify-end"
                      data-stock-loan-actions-menu
                      @click.stop
                    >
                      <button
                        type="button"
                        :data-stock-loan-actions-anchor="loan.id"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700/80 dark:hover:text-gray-200"
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
                  <span v-else-if="loan.status === 'sold' && loan.soldAt" class="text-[10px] text-gray-500 dark:text-gray-400">
                    Sold {{ formatWhen(loan.soldAt) }}
                  </span>
                  <span v-else-if="loan.returnedAt" class="text-[10px] text-gray-500 dark:text-gray-400">
                    {{ formatWhen(loan.returnedAt) }}
                  </span>
                  <span v-else class="text-[10px] text-gray-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
          <DashboardTablePagination
            v-if="filteredLoans.length > 0"
            :current-page="currentPage"
            :items-per-page="itemsPerPage"
            :total="filteredLoans.length"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </template>

    <div
      v-else
      class="rounded-sm bg-amber-50/90 px-4 py-4 dark:bg-amber-950/25 sm:px-5 sm:py-5"
    >
      <p class="text-xs font-medium text-amber-900 dark:text-amber-100">
        Stock loans are included on Storvv Enterprise: lend serial inventory until it sells or comes back to the store. Upgrade in Settings when you are ready.
      </p>
      <NuxtLink
        to="/dashboard/settings"
        class="mt-2 inline-block text-xs font-medium text-amber-900 underline underline-offset-2 dark:text-amber-200"
      >
        Settings
      </NuxtLink>
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
        <p v-if="loanPendingReturn?.partyNotes" class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Notes on file: {{ loanPendingReturn.partyNotes }}
        </p>
      </template>
      <template #footer>
        <Button variant="outline" size="sm" extra-class="!rounded-2xl" :disabled="confirmReturnLoading" @click="closeReturnModal">
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          extra-class="!rounded-2xl"
          :loading="confirmReturnLoading"
          :disabled="!loanPendingReturn"
          @click="confirmReturn"
        >
          Return to store
        </Button>
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
        <Button variant="outline" size="sm" extra-class="!rounded-2xl" :disabled="confirmSoldLoading" @click="closeSoldModal">
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          extra-class="!rounded-2xl"
          :loading="confirmSoldLoading"
          :disabled="!loanPendingSold"
          @click="confirmMarkSold"
        >
          Mark sold
        </Button>
      </template>
    </Modal>

    <!-- Row actions: not clipped by table overflow -->
    <Teleport to="body">
      <div
        v-if="openLoanMenuId && loanForOpenMenu && loanMenuFixedStyle"
        data-stock-loan-actions-menu
        class="frosted-glass fixed z-[1000] min-w-[11rem] rounded-sm border border-gray-200/90 py-0.5 shadow-sm dark:border-gray-700/80"
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
import { BuildingStorefrontIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import { useSellerLoanOutsStore, type SellerLoanOut } from '~/stores/sellerLoanOuts'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { useAppToast } from '~/composables/useAppToast'
import { getVisibleMenuAnchorElement, computeFixedAnchoredMenuStyle } from '~/utils/menuAnchor'

definePageMeta({
  layout: 'dashboard',
})

const { eyebrowClass, pageTitleClass, descriptionClass } = useDashboardPageChrome()

const sellerLoansStore = useSellerLoanOutsStore()
const storesStore = useStoresStore()
const { canManage } = usePermissions()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const toast = useAppToast()

const canAccessByRole = computed(() => canManage.value)
const canAccessSellerLoansPlan = computed(() => canUseSubscriptionFeature('seller_loans'))

const loanStatusTabs = [
  { value: 'active' as const, label: 'Active' },
  { value: 'returned' as const, label: 'Returned' },
  { value: 'sold' as const, label: 'Sold (borrower)' },
  { value: 'all' as const, label: 'All' },
]

const statusFilter = ref<'active' | 'returned' | 'sold' | 'all'>('active')

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
