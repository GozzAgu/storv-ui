<template>
  <div class="ds-root s-c s-page">
    <SPageHeader title="Stock loans">
      <template #description>
        Serial-numbered stock you've lent to resellers. Mark each loan sold or returned when they're done.
      </template>
    </SPageHeader>

    <SCard v-if="!canAccessByRole">
      <SEmptyState
        title="You don't have access to stock loans"
        description="Ask the account owner to give you access to stock loans."
      >
        <template #icon><Lock :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>
    </SCard>

    <PlanGate
      v-else-if="!canAccessSellerLoansPlan"
      feature="seller_loans"
      description="Lend serial-numbered stock to resellers and track it until it's sold or returned."
    />

    <SCard v-else-if="!storesStore.currentStoreId && !sellerLoansStore.loading">
      <SEmptyState
        title="Choose a branch"
        description="Stock loans are kept per branch. Pick one from the branch switcher to see its loans."
      >
        <template #icon><Store :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="sellerLoansStore.loading && sellerLoansStore.loans.length === 0" flush aria-busy="true">
      <ul class="s-list" aria-label="Loading stock loans">
        <li v-for="i in 6" :key="i" class="s-list__item" aria-hidden="true">
          <div class="s-list__main">
            <SSkeleton width="40%" height="14px" />
            <SSkeleton width="25%" height="12px" />
          </div>
          <SSkeleton width="64px" height="20px" />
        </li>
      </ul>
    </SCard>

    <SCard v-else-if="sellerLoansStore.error">
      <SEmptyState title="Couldn't load stock loans" :description="sellerLoansStore.error">
        <template #icon><TriangleAlert :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton @click="sellerLoansStore.fetchSellerLoanOuts(true)">Try again</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="sellerLoansStore.loans.length === 0">
      <SEmptyState
        title="No stock loans yet"
        description="To lend stock, select serial-numbered products in Inventory and choose Stock loan."
      >
        <template #icon><Handshake :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton variant="primary" :to="dashPath('/inventory')">Go to Inventory</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <dl class="s-metrics">
        <div class="s-metrics__item">
          <dt class="s-metrics__label">On loan</dt>
          <dd class="s-metrics__value">{{ loanCountByStatus.active }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Units out</dt>
          <dd class="s-metrics__value">{{ unitsOnLoan }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Sold by borrower</dt>
          <dd class="s-metrics__value">{{ loanCountByStatus.sold }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Returned</dt>
          <dd class="s-metrics__value">{{ loanCountByStatus.returned }}</dd>
        </div>
      </dl>

      <STabs v-model="statusFilter" :tabs="webLoanTabs" label="Loan status" />

      <SCard v-if="filteredLoans.length === 0">
        <SEmptyState
          :title="`No ${statusFilter === 'sold' ? 'sold' : statusFilter} loans`"
          description="Loans move between these tabs as you mark them sold or returned."
        >
          <template #icon><Handshake :size="24" :stroke-width="1.75" /></template>
          <template #actions>
            <SButton @click="statusFilter = 'all'">Show all loans</SButton>
          </template>
        </SEmptyState>
      </SCard>

      <template v-else>
        <!-- Phone -->
        <SCard flush class="s-only-sm">
          <ul class="s-list">
            <li v-for="loan in paginatedLoans" :key="loan.id">
              <div class="s-list__item">
                <button
                  type="button"
                  class="s-list__main s-list__hit"
                  :aria-expanded="expandedLoanIds.has(loan.id)"
                  @click="toggleLoanLines(loan.id)"
                >
                  <span class="s-list__primary">{{ loan.partyName }}</span>
                  <span class="s-list__secondary">{{ unitLabel(loan) }} · {{ formatDay(loan.createdAt) }}</span>
                </button>
                <span class="s-list__end">
                  <SBadge :tone="loanTone(loan.status)" size="sm">{{ formatSellerLoanStatusLabel(loan.status) }}</SBadge>
                </span>
                <SIconButton
                  v-if="loan.status === 'active'"
                  :label="`Actions for loan to ${loan.partyName}`"
                  size="sm"
                  :data-stock-loan-actions-anchor="loan.id"
                  :disabled="loanActionBusyId === loan.id"
                  aria-haspopup="menu"
                  :aria-expanded="openLoanMenuId === loan.id"
                  @click="toggleLoanMenu(loan.id)"
                >
                  <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
                </SIconButton>
              </div>
              <ul v-if="expandedLoanIds.has(loan.id)" class="s-loan__lines">
                <li v-for="(line, index) in loan.lines" :key="index">{{ line.itemSummary }}</li>
              </ul>
            </li>
          </ul>
        </SCard>

        <!-- Tablet and desktop -->
        <div class="s-table-wrap s-hide-sm">
          <table class="s-table">
            <thead>
              <tr>
                <th scope="col">Borrower</th>
                <th scope="col" class="s-table__num">Units</th>
                <th scope="col">Lent</th>
                <th scope="col" class="s-hide-md">Closed</th>
                <th scope="col">Status</th>
                <th scope="col" class="s-table__actions"><span class="ds-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="loan in paginatedLoans" :key="loan.id">
                <tr :class="{ 's-table__row--expanded': expandedLoanIds.has(loan.id) }">
                  <td>
                    <span class="s-table__primary">{{ loan.partyName }}</span>
                    <span v-if="loan.partyPhone || loan.partyNotes" class="s-table__secondary">
                      {{ loan.partyPhone || loan.partyNotes }}
                    </span>
                  </td>
                  <td class="s-table__num">
                    <button
                      type="button"
                      class="s-loan__toggle"
                      :aria-expanded="expandedLoanIds.has(loan.id)"
                      :aria-label="`${expandedLoanIds.has(loan.id) ? 'Hide' : 'Show'} the ${unitLabel(loan)} lent to ${loan.partyName}`"
                      @click="toggleLoanLines(loan.id)"
                    >
                      {{ loan.lines.length }}
                      <ChevronDown
                        :size="14"
                        :stroke-width="2"
                        class="s-loan__chevron"
                        :class="{ 's-loan__chevron--open': expandedLoanIds.has(loan.id) }"
                        aria-hidden="true"
                      />
                    </button>
                  </td>
                  <td class="s-table__nowrap">{{ formatDay(loan.createdAt) }}</td>
                  <td class="s-hide-md s-table__nowrap">
                    <span v-if="loanClosedAt(loan)">{{ formatDay(loanClosedAt(loan)) }}</span>
                    <span v-else class="s-table__muted">{{ EMPTY_CELL }}</span>
                  </td>
                  <td>
                    <SBadge :tone="loanTone(loan.status)" dot>{{ formatSellerLoanStatusLabel(loan.status) }}</SBadge>
                  </td>
                  <td class="s-table__actions">
                    <SIconButton
                      v-if="loan.status === 'active'"
                      :label="`Actions for loan to ${loan.partyName}`"
                      size="sm"
                      :data-stock-loan-actions-anchor="loan.id"
                      :disabled="loanActionBusyId === loan.id"
                      aria-haspopup="menu"
                      :aria-expanded="openLoanMenuId === loan.id"
                      @click="toggleLoanMenu(loan.id)"
                    >
                      <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
                    </SIconButton>
                  </td>
                </tr>
                <tr v-if="expandedLoanIds.has(loan.id)">
                  <td colspan="6" class="s-table__nested">
                    <ul class="s-list" :aria-label="`Units lent to ${loan.partyName}`">
                      <li v-for="(line, index) in loan.lines" :key="index" class="s-list__item">
                        <span class="s-list__main">{{ line.itemSummary }}</span>
                      </li>
                    </ul>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <SPagination
          :current-page="currentPage"
          :page-size="itemsPerPage"
          :total="filteredLoans.length"
          label="Stock loans pagination"
          @page-change="handlePageChange"
        />
      </template>
    </template>

    <SMenu
      :open="Boolean(openLoanMenuId && loanForOpenMenu && loanMenuFixedStyle)"
      :style="loanMenuFixedStyle"
      menu-id="stock-loan"
      label="Stock loan actions"
      @close="closeLoanMenu"
    >
      <SMenuItem label="Mark sold by borrower" :icon="CircleCheck" @select="handleLoanMenuMarkSold" />
      <SMenuItem label="Return to stock" :icon="Undo2" @select="handleLoanMenuReturnToStore" />
    </SMenu>

    <SDialog
      v-model:open="showReturnModal"
      role="alertdialog"
      size="sm"
      title="Return this stock?"
      :description="loanPendingReturn ? `${unitLabel(loanPendingReturn)} from ${loanPendingReturn.partyName} go back on your shelf as available.` : undefined"
      :dismissible="!confirmReturnLoading"
    >
      <p v-if="loanPendingReturn?.partyNotes" class="s-loan__note">Notes: {{ loanPendingReturn.partyNotes }}</p>
      <template #footer>
        <SButton :disabled="confirmReturnLoading" @click="closeReturnModal">Cancel</SButton>
        <SButton variant="primary" :loading="confirmReturnLoading" @click="confirmReturn">Return to stock</SButton>
      </template>
    </SDialog>

    <SDialog
      v-model:open="showSoldModal"
      role="alertdialog"
      size="sm"
      title="Mark as sold by the borrower?"
      :description="loanPendingSold ? `${unitLabel(loanPendingSold)} from ${loanPendingSold.partyName} will show as sold in your inventory. You can't undo this here.` : undefined"
      :dismissible="!confirmSoldLoading"
    >
      <p v-if="loanPendingSold?.partyNotes" class="s-loan__note">Notes: {{ loanPendingSold.partyNotes }}</p>
      <template #footer>
        <SButton :disabled="confirmSoldLoading" @click="closeSoldModal">Cancel</SButton>
        <SButton variant="primary" :loading="confirmSoldLoading" @click="confirmMarkSold">Mark sold</SButton>
      </template>
    </SDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import {
  ChevronDown,
  CircleCheck,
  EllipsisVertical,
  Handshake,
  Lock,
  Store,
  TriangleAlert,
  Undo2,
} from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SDialog from '~/components/s/SDialog.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SMenu from '~/components/s/SMenu.vue'
import SMenuItem from '~/components/s/SMenuItem.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
import PlanGate from '~/components/subscription/PlanGate.vue'
import { formatSellerLoanStatusLabel } from '~/utils/status-labels'
import { EMPTY_CELL } from '~/utils/ui-empty'
import { useSellerLoanOutsStore, type SellerLoanOut } from '~/stores/sellerLoanOuts'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { useAppToast } from '~/composables/useAppToast'
import {
  getVisibleMenuAnchorElement,
  computeFixedAnchoredMenuStyle,
  isInsideAnchoredMenu,
} from '~/utils/menuAnchor'

definePageMeta({
  layout: 'dashboard',
})

const { dashPath } = useDashboardPaths()

const sellerLoansStore = useSellerLoanOutsStore()
const storesStore = useStoresStore()
const { can } = usePermissions()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const toast = useAppToast()

const canAccessByRole = computed(() => can('sellerLoans', 'view'))
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

const webLoanTabs = computed(() => {
  const counts = loanCountByStatus.value
  return [
    { value: 'active', label: 'On loan', count: counts.active },
    { value: 'sold', label: 'Sold by borrower', count: counts.sold },
    { value: 'returned', label: 'Returned', count: counts.returned },
    { value: 'all', label: 'All', count: sellerLoansStore.loans.length },
  ]
})

const unitsOnLoan = computed(() =>
  sellerLoansStore.loans
    .filter((loan) => loan.status === 'active')
    .reduce((sum, loan) => sum + loan.lines.length, 0)
)

function unitLabel(loan: SellerLoanOut) {
  return `${loan.lines.length} unit${loan.lines.length === 1 ? '' : 's'}`
}

function loanTone(status: SellerLoanOut['status']): 'info' | 'success' | 'neutral' {
  if (status === 'active') return 'info'
  if (status === 'sold') return 'success'
  return 'neutral'
}

function loanClosedAt(loan: SellerLoanOut): Date | undefined {
  if (loan.status === 'sold') return loan.soldAt
  if (loan.status === 'returned') return loan.returnedAt
  return undefined
}

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

function formatDay(v: Date | undefined) {
  if (!v) return EMPTY_CELL
  try {
    return v.toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return EMPTY_CELL
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
    sellerLoansStore.fetchSellerLoanOuts(false)
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
    if (isInsideAnchoredMenu(t)) return
    if (t?.closest?.('[data-stock-loan-actions-anchor]')) return
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

function closeLoanMenu() {
  const id = openLoanMenuId.value
  openLoanMenuId.value = null
  if (id) nextTick(() => getVisibleMenuAnchorElement('data-stock-loan-actions-anchor', id)?.focus())
}

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
