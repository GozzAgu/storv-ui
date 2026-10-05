<template>
  <ClientOnly>
    <div class="ds-root s-c">
      <!-- Initial loading -->
      <template v-if="isInitialLoading">
        <div class="s-page s-sales" aria-busy="true">
          <SPageHeader :title="branchPageTitle('Sales')">
            <template #eyebrow>
              <p class="s-page-header__eyebrow">Sales</p>
            </template>
          </SPageHeader>
          <div class="s-metrics" aria-hidden="true">
            <div v-for="i in 4" :key="i" class="s-metrics__item">
              <SSkeleton width="64px" height="12px" />
              <SSkeleton width="96px" height="24px" />
            </div>
          </div>
          <SCard flush>
            <ul class="s-list" aria-label="Loading sales">
              <li v-for="i in 8" :key="i" class="s-list__item" aria-hidden="true">
                <div class="s-list__main">
                  <SSkeleton width="40%" height="14px" />
                  <SSkeleton width="25%" height="12px" />
                </div>
                <SSkeleton width="72px" height="14px" />
              </li>
            </ul>
          </SCard>
        </div>
      </template>

      <template v-else>
        <div class="s-page s-sales" data-receipts-page>
          <SPageHeader :title="branchPageTitle('Sales')">
            <template #eyebrow>
              <p class="s-page-header__eyebrow">Sales</p>
            </template>
            <template v-if="canCreate" #actions>
              <SButton @click="openQuickSaleModal">
                <template #leading><QrCode :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
                Quick sale
              </SButton>
              <SButton variant="primary" @click="openCreateReceiptModal">
                <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
                New sale
              </SButton>
            </template>
          </SPageHeader>

          <dl v-if="!receiptsStore.loading" class="s-metrics" aria-label="Sales summary">
            <div v-for="metric in receiptsHeaderMetrics" :key="metric.key" class="s-metrics__item">
              <dt class="s-metrics__label">{{ metric.label }}</dt>
              <dd
                class="s-metrics__value"
                :class="metric.tone && `s-metrics__value--${metric.tone}`"
              >
                {{ metric.value }}
              </dd>
            </div>
          </dl>

          <STabs v-model="activeTab" :tabs="salesTabs" label="Sales views" />

          <!-- Sales -->
          <section v-if="activeTab === 'receipts'" class="s-sales__section" aria-label="Sales">
            <div
              v-if="canDeleteReceipts && selectedReceiptsForBulk.length > 0"
              class="s-toolbar s-toolbar--selection"
              role="region"
              aria-label="Bulk actions"
            >
              <SCheckbox
                :model-value="allReceiptsOnPageSelected"
                :label="`${selectedReceiptsForBulk.length} selected`"
                @update:model-value="toggleSelectAllReceipts"
              />
              <div class="s-toolbar__end">
                <SButton variant="ghost" size="sm" @click="selectedReceiptsForBulk = []">Clear</SButton>
                <SButton variant="danger" size="sm" @click="openBulkDeleteReceiptsModal">
                  <template #leading><Trash2 :size="14" :stroke-width="2" aria-hidden="true" /></template>
                  Delete
                </SButton>
              </div>
            </div>
            <div v-else-if="!receiptsStore.loading" class="s-toolbar">
              <SSearch
                v-model="searchQuery"
                class="s-toolbar__search"
                placeholder="Search sales"
                label="Search by receipt number, customer or item"
              />
              <div class="s-toolbar__filter">
                <SSelect v-model="statusFilter" :options="receiptStatusFilterOptions" aria-label="Status" />
              </div>
              <div class="s-toolbar__filter">
                <SSelect v-model="dateFilter" :options="receiptDateFilterSelectOptions" aria-label="Date range" />
              </div>
            </div>

            <SCard v-if="receiptsStore.loading" flush aria-busy="true">
              <ul class="s-list" aria-label="Loading sales">
                <li v-for="i in 8" :key="i" class="s-list__item" aria-hidden="true">
                  <div class="s-list__main">
                    <SSkeleton width="40%" height="14px" />
                    <SSkeleton width="25%" height="12px" />
                  </div>
                  <SSkeleton width="72px" height="14px" />
                </li>
              </ul>
            </SCard>

            <SCard v-else-if="sortedFilteredReceipts.length === 0">
              <SEmptyState
                :title="hasReceiptFilters ? 'No sales found' : 'No sales yet'"
                :description="
                  hasReceiptFilters
                    ? 'Try adjusting your search, status, or date filters.'
                    : 'Record your first sale to track revenue and payments.'
                "
              >
                <template #icon>
                  <SearchX v-if="hasReceiptFilters" :size="24" :stroke-width="1.75" />
                  <ReceiptText v-else :size="24" :stroke-width="1.75" />
                </template>
                <template v-if="hasReceiptFilters || canCreate" #actions>
                  <SButton v-if="hasReceiptFilters" @click="clearReceiptFilters">Clear filters</SButton>
                  <SButton v-else variant="primary" @click="openCreateReceiptModal">
                    <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
                    New sale
                  </SButton>
                </template>
              </SEmptyState>
            </SCard>

            <template v-else>
              <!-- Phone: one row per sale -->
              <SCard flush class="s-only-sm">
                <ul class="s-list">
                  <li v-for="receipt in paginatedReceipts" :key="receipt.id">
                    <div
                      :data-receipt-row="receipt.id"
                      class="s-list__item"
                      :class="{ 's-list__item--flash': flashReceiptId === receipt.id }"
                    >
                      <SCheckbox
                        v-if="canDeleteReceipts"
                        :model-value="isReceiptSelected(receipt)"
                        :aria-label="`Select sale ${receipt.receiptNumber}`"
                        @update:model-value="(checked) => toggleReceiptSelection(receipt, checked)"
                      />
                      <button
                        type="button"
                        class="s-list__main s-list__hit"
                        @click="handleViewReceipt(receipt)"
                      >
                        <span class="s-list__primary">{{ receipt.customerName || 'Walk-in customer' }}</span>
                        <span class="s-list__secondary">
                          #{{ receipt.receiptNumber }} · {{ formatDate(receipt.date) }}
                        </span>
                      </button>
                      <div class="s-list__end">
                        <span class="s-list__value">{{ formatCurrency(receipt.total) }}</span>
                        <SBadge v-if="receipt.status !== 'completed'" :tone="getReceiptStatusTone(receipt.status)">
                          {{ getReceiptStatusLabel(receipt.status) }}
                        </SBadge>
                      </div>
                      <SIconButton
                        label="Sale actions"
                        size="sm"
                        :data-receipt-actions-anchor="receipt.id"
                        aria-haspopup="menu"
                        :aria-expanded="openReceiptMenuId === receipt.id"
                        @click="toggleReceiptMenu(receipt.id)"
                      >
                        <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
                      </SIconButton>
                    </div>
                  </li>
                </ul>
              </SCard>

              <!-- Tablet and desktop: table -->
              <div class="s-table-wrap s-hide-sm">
                <table class="s-table">
                  <thead>
                    <tr>
                      <th v-if="canDeleteReceipts" scope="col" class="s-table__check">
                        <SCheckbox
                          :model-value="allReceiptsOnPageSelected"
                          aria-label="Select all sales on this page"
                          @update:model-value="toggleSelectAllReceipts"
                        />
                      </th>
                      <th
                        v-for="column in receiptTableColumns"
                        :key="column.key"
                        scope="col"
                        :class="column.class"
                        :aria-sort="ariaSort(column.key)"
                      >
                        <SSortHeader
                          :label="column.label"
                          :direction="sortDirection(column.key)"
                          :align="column.align"
                          @sort="toggleSort(column.key)"
                        />
                      </th>
                      <th scope="col" class="s-table__actions">
                        <span class="ds-sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="receipt in paginatedReceipts"
                      :key="receipt.id"
                      :data-receipt-row="receipt.id"
                      class="s-table__row--interactive"
                      :class="{
                        's-table__row--flash': flashReceiptId === receipt.id,
                        's-table__row--selected': isReceiptSelected(receipt),
                      }"
                      tabindex="0"
                      @click="handleViewReceipt(receipt)"
                      @keydown.enter.self="handleViewReceipt(receipt)"
                    >
                      <td v-if="canDeleteReceipts" class="s-table__check" @click.stop>
                        <SCheckbox
                          :model-value="isReceiptSelected(receipt)"
                          :aria-label="`Select sale ${receipt.receiptNumber}`"
                          @update:model-value="(checked) => toggleReceiptSelection(receipt, checked)"
                        />
                      </td>
                      <td>
                        <span class="s-table__inline">
                          <span class="s-table__primary">#{{ receipt.receiptNumber }}</span>
                          <SIconButton
                            label="Copy receipt number"
                            size="sm"
                            @click.stop="copyReceiptNumber(receipt.receiptNumber)"
                          >
                            <CopyIcon :size="14" :stroke-width="1.75" aria-hidden="true" />
                          </SIconButton>
                          <SBadge v-if="receipt.isSwapIn" tone="info">Swap</SBadge>
                        </span>
                      </td>
                      <td>
                        <span class="s-table__primary">{{ receipt.customerName || 'Walk-in customer' }}</span>
                        <span
                          v-if="receipt.customerPhone || receipt.customerEmail"
                          class="s-table__secondary"
                        >
                          {{ receipt.customerPhone || receipt.customerEmail }}
                        </span>
                      </td>
                      <td class="s-hide-md">{{ formatDate(receipt.date) }}</td>
                      <td class="s-hide-lg">
                        <span class="s-table__secondary">
                          {{ getReceiptLineItemsPreview(receipt) || EMPTY_CELL }}
                        </span>
                      </td>
                      <td class="s-table__num">
                        <span class="s-table__primary">{{ formatCurrency(receipt.total) }}</span>
                        <ReceiptProfitHint :receipt="receipt" />
                      </td>
                      <td class="s-hide-lg">{{ formatPaymentMethod(receipt.paymentMethod) }}</td>
                      <td>
                        <SBadge :tone="getReceiptStatusTone(receipt.status)" dot>
                          {{ getReceiptStatusLabel(receipt.status) }}
                        </SBadge>
                      </td>
                      <td class="s-hide-lg">
                        <span class="s-table__secondary">
                          {{
                            receipt.createdByUserName ||
                            getCreatorName(receipt.actualCreator || receipt.createdBy)
                          }}
                        </span>
                      </td>
                      <td class="s-table__actions" @click.stop>
                        <SIconButton
                          label="Sale actions"
                          size="sm"
                          :data-receipt-actions-anchor="receipt.id"
                          aria-haspopup="menu"
                          :aria-expanded="openReceiptMenuId === receipt.id"
                          @click="toggleReceiptMenu(receipt.id)"
                        >
                          <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
                        </SIconButton>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SPagination
                :current-page="currentPage"
                :page-size="itemsPerPage"
                :total="sortedFilteredReceipts.length"
                label="Sales pagination"
                @page-change="handlePageChange"
              />
            </template>
          </section>

          <!-- Outstanding (balance due) -->
          <section v-else-if="activeTab === 'outstanding'" class="s-sales__section" aria-label="Outstanding">
            <div v-if="!receiptsStore.loading" class="s-toolbar">
              <SSearch
                v-model="outstandingSearchQuery"
                class="s-toolbar__search"
                placeholder="Search customer or receipt #"
              />
            </div>

            <SCard v-if="receiptsStore.loading" flush aria-busy="true">
              <ul class="s-list" aria-label="Loading outstanding payments">
                <li v-for="i in 6" :key="i" class="s-list__item" aria-hidden="true">
                  <div class="s-list__main">
                    <SSkeleton width="40%" height="14px" />
                    <SSkeleton width="25%" height="12px" />
                  </div>
                  <SSkeleton width="72px" height="14px" />
                </li>
              </ul>
            </SCard>

            <SCard v-else-if="filteredOutstandingReceipts.length === 0">
              <SEmptyState
                title="No outstanding payments"
                description="Sales recorded with a balance due appear here until they're paid in full."
              >
                <template #icon><CircleCheck :size="24" :stroke-width="1.75" /></template>
              </SEmptyState>
            </SCard>

            <div v-else class="s-table-wrap">
              <table class="s-table">
                <thead>
                  <tr>
                    <th scope="col">Customer</th>
                    <th scope="col" class="s-hide-sm">Sale</th>
                    <th scope="col" class="s-hide-md">Items</th>
                    <th scope="col" class="s-table__num s-hide-sm">Total</th>
                    <th scope="col" class="s-table__num s-hide-sm">Paid</th>
                    <th scope="col" class="s-table__num">Balance</th>
                    <th scope="col"><span class="ds-sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in filteredOutstandingReceipts"
                    :key="row.id"
                    class="s-table__row--interactive"
                    tabindex="0"
                    @click="viewOutstandingReceipt(row)"
                    @keydown.enter.self="viewOutstandingReceipt(row)"
                  >
                    <td>
                      <span class="s-table__primary">{{ row.customerName || 'Walk-in customer' }}</span>
                      <span v-if="row.customerPhone || row.customerEmail" class="s-table__secondary">
                        {{ row.customerPhone || row.customerEmail }}
                      </span>
                    </td>
                    <td class="s-hide-sm">
                      <span class="s-table__primary">#{{ row.receiptNumber }}</span>
                      <span class="s-table__secondary">{{ formatDate(row.date) }}</span>
                    </td>
                    <td class="s-hide-md">
                      <span class="s-table__secondary">{{ getReceiptLineItemsPreview(row) || EMPTY_CELL }}</span>
                    </td>
                    <td class="s-table__num s-hide-sm">{{ formatCurrency(row.total) }}</td>
                    <td class="s-table__num s-hide-sm">{{ formatCurrency(outstandingAmountPaid(row)) }}</td>
                    <td class="s-table__num s-table__warning">
                      <span class="s-table__primary">{{ formatCurrency(outstandingBalanceDue(row)) }}</span>
                    </td>
                    <td @click.stop>
                      <div class="s-table__row-actions">
                        <SButton size="sm" variant="primary" @click="openRecordPayment(row)">
                          Record payment
                        </SButton>
                        <SButton
                          v-if="canEditReceipts"
                          size="sm"
                          variant="ghost"
                          class="s-hide-sm"
                          @click="cancelOutstandingReceipt(row)"
                        >
                          Cancel sale
                        </SButton>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>


          <CreateReceiptModal
            v-model="showCreateReceiptModal"
            @receipt-created="handleReceiptCreated"
          />
          <QuickSaleModal v-model="showQuickSaleModal" @sale-completed="handleQuickSaleCompleted" />
          <ViewReceiptModal v-model="showViewReceiptModal" :receipt="selectedReceipt" />
          <ReceiptDetailsDrawer
            v-model="showReceiptDetailsDrawer"
            :receipt="selectedReceipt"
            @preview="previewReceiptFromDrawer"
            @print="previewReceiptFromDrawer"
            @record-payment="recordPaymentFromDrawer"
            @cancel="cancelFromDrawer"
            @refund="refundFromDrawer"
          />
          <ReturnReceiptModal
            v-model="showReturnReceiptModal"
            :receipt="selectedReceipt"
            @returned="handleReceiptReturned"
          />
          <BulkDeleteConfirmModal
            v-model="showBulkDeleteReceiptsModal"
            v-model:confirmed="bulkDeleteReceiptsConfirmed"
            title="Delete selected sales"
            entity-label="sale"
            :count="selectedReceiptsForBulk.length"
            :item-names="selectedReceiptsForBulk.map((r) => r.receiptNumber || r.customerName || r.id)"
            warning="This permanently deletes the selected sales. Associated customer balances may be affected. This cannot be undone."
            confirm-label="I understand these sales will be permanently deleted."
            :loading="isBulkDeletingReceipts"
            @update:model-value="(v) => { if (!v) bulkDeleteReceiptsConfirmed = false }"
            @confirm="handleConfirmBulkDeleteReceipts"
          />
          <DeleteReceiptModal
            v-model="showDeleteReceiptModal"
            :receipt="selectedReceipt"
            @confirmDelete="handleReceiptConfirmDelete"
          />
          <ReceiptTimelineModal v-model="showTimelineModal" :receipt="selectedReceipt" />
        </div>
      </template>
    </div>
    <template #fallback>
      <div class="ds-root s-c s-sales s-sales--fallback" role="status">
        <SSpinner :size="24" />
        <span class="ds-sr-only">Loading sales</span>
      </div>
    </template>
  </ClientOnly>

  <!-- Receipt actions (teleported; not clipped by table/card overflow) -->
  <SMenu
    ref="receiptMenuPanelRef"
    :open="Boolean(openReceiptMenuId && receiptForOpenMenu && receiptMenuFixedStyle)"
    :style="receiptMenuFixedStyle"
    menu-id="receipt"
    label="Sale actions"
    @close="closeReceiptMenu"
  >
    <SMenuItem label="View sale" :icon="Eye" @select="runReceiptMenuAction(handleViewReceipt)" />
    <SMenuItem label="History" :icon="History" @select="runReceiptMenuAction(handleViewReceiptTimeline)" />
    <SMenuItem
      v-if="receiptForOpenMenu?.status === 'completed' && canEditReceipts"
      label="Refund"
      :icon="Undo2"
      @select="runReceiptMenuAction(handleRefundReceipt)"
    />
    <SMenuItem
      v-if="canDeleteReceipts"
      label="Delete"
      :icon="Trash2"
      danger
      @select="runReceiptMenuAction(handleDeleteReceipt)"
    />
  </SMenu>

  <BalanceDuePaymentModal
    v-model="showBalancePaymentModal"
    :receipt="balancePaymentReceipt"
    @completed="onBalancePaymentCompleted"
  />
</template>

<script setup lang="ts">
import ReceiptProfitHint from '~/components/receipts/ReceiptProfitHint.vue'
import BulkDeleteConfirmModal from '~/components/dashboard/BulkDeleteConfirmModal.vue'
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  PencilSquareIcon,
  ChevronRightIcon,
} from '~/utils/app-icons'
import {
  CircleCheck,
  Copy as CopyIcon,
  EllipsisVertical,
  Eye,
  History,
  Plus,
  QrCode,
  ReceiptText,
  SearchX,
  Trash2,
  Undo2,
} from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SMenu from '~/components/s/SMenu.vue'
import SMenuItem from '~/components/s/SMenuItem.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import SSortHeader from '~/components/s/SSortHeader.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import STabs from '~/components/s/STabs.vue'
// @ts-ignore
import CreateReceiptModal from '~/components/receipts/CreateReceiptModal.vue'
// @ts-ignore
import QuickSaleModal from '~/components/receipts/QuickSaleModal.vue'
// @ts-ignore
import ViewReceiptModal from '~/components/receipts/ViewReceiptModal.vue'
import ReceiptDetailsDrawer from '~/components/receipts/ReceiptDetailsDrawer.vue'
import { getReceiptStatusLabel, getReceiptStatusTone } from '~/utils/receipt-status'
// @ts-ignore
import ReturnReceiptModal from '~/components/receipts/ReturnReceiptModal.vue'
// @ts-ignore
import DeleteReceiptModal from '~/components/receipts/DeleteReceiptModal.vue'
// @ts-ignore
import ReceiptTimelineModal from '~/components/receipts/ReceiptTimelineModal.vue'
import { useReceiptsStore, type Receipt } from '~/stores/receipts'
import { useRecentItems } from '~/composables/useRecentItems'
import { useAuthStore } from '~/stores/auth'
import { useStoresStore } from '~/stores/stores'
import { usePermissions } from '~/composables/usePermissions'
import { useUser } from '~/composables/useUser'
import { useFirestore } from '~/composables/useFirestore'
import { useStaffStore } from '~/stores/staff'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { useCopy } from '~/composables/useCopy'
import { usePreferences } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import {
  getVisibleMenuAnchorElement,
  computeFixedAnchoredMenuStyle,
  isInsideAnchoredMenu,
} from '~/utils/menuAnchor'
import { EMPTY_CELL } from '~/utils/ui-empty'
import BalanceDuePaymentModal from '~/components/receipts/BalanceDuePaymentModal.vue'
import { useDashboardPageRefreshRegister } from '~/composables/useDashboardPageRefresh'
import { receiptAmountPaid, receiptBalanceDue } from '~/utils/receipt-balance'

definePageMeta({
  layout: 'dashboard',
  ssr: false,
})

useHead({
  title: 'Sales - Storvv',
})

const receiptsStore = useReceiptsStore()
const storesStore = useStoresStore()
const toast = useAppToast()
const authStore = useAuthStore()
const { canManage, canCreate, canEditReceipts, canDeleteReceipts } = usePermissions()
const { getUserDocument } = useUser()
const { getFirestoreInstance } = useFirestore()
const staffStore = useStaffStore()
const { copyToClipboard } = useCopy()
const userStore = useUserStore()

// Copy functions
const copyReceiptNumber = (receiptNumber: string) => {
  copyToClipboard(receiptNumber, 'Receipt number')
}

const copyCustomerId = (customerId: string) => {
  copyToClipboard(customerId, 'Customer ID')
}

// Store creator names by UID
const creatorNames = ref<Record<string, string>>({})
const loadingCreators = ref(false)

// Tab management
const route = useRoute()
const router = useRouter()

const highlightFromRoute = computed(() => {
  // `receipt` is what global search links to (`/dashboard/receipts?receipt=<id>`);
  // `highlight` is used internally (e.g. after undo/balance-payment actions).
  for (const key of ['receipt', 'highlight'] as const) {
    const raw = route.query[key]
    if (typeof raw === 'string' && raw.length > 0) return raw
    if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0]
  }
  return null
})

const flashReceiptId = ref<string | null>(null)
let receiptHighlightClearTimer: ReturnType<typeof setTimeout> | null = null

function clearReceiptHighlightTimer() {
  if (receiptHighlightClearTimer) {
    clearTimeout(receiptHighlightClearTimer)
    receiptHighlightClearTimer = null
  }
}

function stripHighlightQuery() {
  const hasReceipt = route.query.receipt != null && route.query.receipt !== ''
  const hasHighlight = route.query.highlight != null && route.query.highlight !== ''
  if (!hasReceipt && !hasHighlight) return
  const q = { ...route.query }
  delete q.receipt
  delete q.highlight
  void router.replace({ query: q })
}

function applyReceiptHighlight(receiptId: string) {
  clearReceiptHighlightTimer()
  flashReceiptId.value = receiptId
  if (import.meta.client) {
    const scrollToRow = () => {
      const el = getVisibleMenuAnchorElement('data-receipt-row', receiptId)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    nextTick(() => {
      scrollToRow()
      requestAnimationFrame(scrollToRow)
    })
  }
  receiptHighlightClearTimer = setTimeout(() => {
    flashReceiptId.value = null
    receiptHighlightClearTimer = null
    stripHighlightQuery()
  }, 5000)
}

const activeTab = ref<'receipts' | 'outstanding' | 'customers'>(
  (['receipts', 'outstanding', 'customers'].includes(String(route.query.tab))
    ? route.query.tab
    : 'receipts') as 'receipts' | 'outstanding' | 'customers'
)
const outstandingSearchQuery = ref('')
const showBalancePaymentModal = ref(false)
const balancePaymentReceipt = ref<Receipt | null>(null)
const openReceiptMenuId = ref<string | null>(null)

const toggleReceiptMenu = (receiptId: string) => {
  openReceiptMenuId.value = openReceiptMenuId.value === receiptId ? null : receiptId
}

// Handle ESC key to close menus
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    openReceiptMenuId.value = null
  }
}

// Watch for tab changes and update URL
watch(activeTab, (newTab) => {
  const q = { ...route.query, tab: newTab } as Record<string, string | string[] | null | undefined>
  if (newTab !== 'receipts') {
    delete q.highlight
    clearReceiptHighlightTimer()
    flashReceiptId.value = null
  }
  void router.replace({ query: q })
})

// Sidebar links (Sales / Customers) change the tab through the URL
watch(
  () => route.query.tab,
  (tab) => {
    const next = (['receipts', 'outstanding', 'customers'].includes(String(tab))
      ? tab
      : 'receipts') as typeof activeTab.value
    if (next !== activeTab.value) activeTab.value = next
  }
)

// Initialize loading state synchronously on client (warm cache avoids flash)
const isInitialLoading = ref(receiptsStore.receipts.length === 0)
const { branchPageTitle } = useCurrentStoreLabel()
const { dashPath } = useDashboardPaths()

// Customers have their own page; old `?tab=customers` links land there.
watch(
  () => route.query.tab,
  (tab) => {
    if (tab !== 'customers') return
    const { tab: _tab, ...query } = route.query
    void router.replace({ path: dashPath('/customers'), query })
  },
  { immediate: true }
)

const searchQuery = ref('')
const statusFilter = ref('all')
const dateFilter = ref('all')
// Load pagination state from localStorage
const getInitialPage = (): number => {
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('receipts-page')
      return saved ? parseInt(saved, 10) : 1
    } catch (e) {
      return 1
    }
  }
  return 1
}
const currentPage = ref(getInitialPage())
const itemsPerPage = ref(100)

const formatPaymentMethod = (method: string | undefined) => {
  if (!method?.trim()) return EMPTY_CELL
  const m = method.trim()
  return m.charAt(0).toUpperCase() + m.slice(1)
}

const getReceiptLineItemsPreview = (receipt: Receipt): string => {
  if (!receipt.items?.length) return ''
  const names = receipt.items.map((i) => i.itemName).filter(Boolean)
  if (names.length === 0) return ''
  const max = 3
  if (names.length <= max) return names.join(', ')
  return `${names.slice(0, max).join(', ')} · +${names.length - max} more`
}

// Sorting state
const currentSort = ref<{ key: string; order: 'asc' | 'desc' }>({ key: 'date', order: 'desc' })

// Define sortable columns
const sortableColumns = [
  { key: 'receiptNumber', label: 'Sale #' },
  { key: 'customerName', label: 'Customer' },
  { key: 'date', label: 'Date' },
  { key: 'itemsCount', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'paymentMethod', label: 'Payment' },
  { key: 'status', label: 'Status' },
  { key: 'createdBy', label: 'Created By' },
]

// Filter receipts by current store for all computed properties
const currentStoreId = computed(() => storesStore.currentStoreId)

// Filter receipts by current store
const receipts = computed(() => {
  const storeId = currentStoreId.value
  if (!storeId) return []
  return receiptsStore.receipts.filter((receipt) => receipt.storeId === storeId)
})

const totalSales = computed(() => {
  const storeId = currentStoreId.value
  if (!storeId) return 0
  return receipts.value.filter((r) => r.status === 'completed').reduce((sum, r) => sum + r.total, 0)
})

const todaySales = computed(() => {
  const today = new Date().toDateString()
  const storeId = currentStoreId.value
  if (!storeId) return 0
  return receipts.value
    .filter((r) => r.status === 'completed' && new Date(r.date).toDateString() === today)
    .reduce((sum, r) => sum + r.total, 0)
})

const todayReceipts = computed(() => {
  const today = new Date().toDateString()
  return receipts.value.filter((r) => new Date(r.date).toDateString() === today).length
})

const monthSales = computed(() => {
  const now = new Date()
  return receipts.value
    .filter((r) => {
      const receiptDate = new Date(r.date)
      return (
        r.status === 'completed' &&
        receiptDate.getMonth() === now.getMonth() &&
        receiptDate.getFullYear() === now.getFullYear()
      )
    })
    .reduce((sum, r) => sum + r.total, 0)
})

const monthReceipts = computed(() => {
  const now = new Date()
  return receipts.value.filter((r) => {
    const receiptDate = new Date(r.date)
    return (
      receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear()
    )
  }).length
})

const outstandingReceipts = computed(() =>
  receipts.value
    .filter((r) => r.status === 'balance_due')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
)

const receiptStatusFilterOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'refunded', label: 'Refunded' },
]

const receiptDateFilterSelectOptions = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
]

const receiptTableColumns: Array<{
  key: string
  label: string
  class?: string
  align?: 'start' | 'end'
}> = [
  { key: 'receiptNumber', label: 'Sale' },
  { key: 'customerName', label: 'Customer' },
  { key: 'date', label: 'Date', class: 's-hide-md' },
  { key: 'itemsCount', label: 'Items', class: 's-hide-lg' },
  { key: 'total', label: 'Total', class: 's-table__num', align: 'end' },
  { key: 'paymentMethod', label: 'Payment', class: 's-hide-lg' },
  { key: 'status', label: 'Status' },
  { key: 'createdBy', label: 'Created by', class: 's-hide-lg' },
]

const salesTabs = computed(() => [
  { value: 'receipts', label: 'Sales' },
  { value: 'outstanding', label: 'Outstanding', count: outstandingReceipts.value.length || undefined },
])

const hasReceiptFilters = computed(
  () => Boolean(searchQuery.value) || statusFilter.value !== 'all' || dateFilter.value !== 'all'
)

function isReceiptSelected(receipt: Receipt): boolean {
  return selectedReceiptsForBulk.value.some((r) => r.id === receipt.id)
}

const allReceiptsOnPageSelected = computed(
  () =>
    paginatedReceipts.value.length > 0 &&
    selectedReceiptsForBulk.value.length === paginatedReceipts.value.length
)

function sortDirection(key: string): 'asc' | 'desc' | null {
  return currentSort.value.key === key ? currentSort.value.order : null
}

function ariaSort(key: string): 'ascending' | 'descending' | 'none' {
  const direction = sortDirection(key)
  if (direction === 'asc') return 'ascending'
  if (direction === 'desc') return 'descending'
  return 'none'
}

function runReceiptMenuAction(action: (receipt: Receipt) => unknown) {
  const receipt = receiptForOpenMenu.value
  if (receipt) action(receipt)
  openReceiptMenuId.value = null
}

function focusMenuAnchor(
  attribute: Parameters<typeof getVisibleMenuAnchorElement>[0],
  id: string | null
) {
  if (!id || !import.meta.client) return
  getVisibleMenuAnchorElement(attribute, id)?.focus()
}

function closeReceiptMenu() {
  const id = openReceiptMenuId.value
  openReceiptMenuId.value = null
  focusMenuAnchor('data-receipt-actions-anchor', id)
}

const filteredOutstandingReceipts = computed(() => {
  const q = outstandingSearchQuery.value.trim().toLowerCase()
  if (!q) return outstandingReceipts.value
  return outstandingReceipts.value.filter(
    (r) =>
      r.receiptNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      (r.customerEmail || '').toLowerCase().includes(q) ||
      (r.customerPhone || '').includes(q)
  )
})

function outstandingAmountPaid(receipt: Receipt) {
  return receiptAmountPaid(receipt)
}

function outstandingBalanceDue(receipt: Receipt) {
  return receiptBalanceDue(receipt)
}

function openRecordPayment(receipt: Receipt) {
  balancePaymentReceipt.value = receipt
  showBalancePaymentModal.value = true
}

function viewOutstandingReceipt(receipt: Receipt) {
  selectedReceipt.value = receipt
  showReceiptDetailsDrawer.value = true
}

function previewReceiptFromDrawer(receipt: Receipt) {
  selectedReceipt.value = receipt
  showReceiptDetailsDrawer.value = false
  showViewReceiptModal.value = true
}

function recordPaymentFromDrawer(receipt: Receipt) {
  showReceiptDetailsDrawer.value = false
  openRecordPayment(receipt)
}

function cancelFromDrawer(receipt: Receipt) {
  showReceiptDetailsDrawer.value = false
  void cancelOutstandingReceipt(receipt)
}

function refundFromDrawer(receipt: Receipt) {
  showReceiptDetailsDrawer.value = false
  handleRefundReceipt(receipt)
}

async function cancelOutstandingReceipt(receipt: Receipt) {
  if (
    !confirm(
      `Cancel ${receipt.receiptNumber}? Reserved stock will be released. This cannot be undone.`
    )
  ) {
    return
  }
  try {
    await receiptsStore.cancelBalanceDueReceipt(receipt.id)
    toast.success('Order cancelled and stock released.')
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : 'Could not cancel order')
  }
}

async function onBalancePaymentCompleted(receiptId: string) {
  await receiptsStore.fetchReceipts({ force: true })
  const completed = receiptsStore.receipts.find((r) => r.id === receiptId)
  if (completed?.status === 'completed') {
    activeTab.value = 'receipts'
    flashReceiptId.value = receiptId
  }
}

const filteredReceipts = computed(() => {
  let result = receipts.value.filter((r) => r.status !== 'balance_due')

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(query) ||
        r.customerName.toLowerCase().includes(query) ||
        r.customerEmail.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    result = result.filter((r) => r.status === statusFilter.value)
  }

  // Date filter
  if (dateFilter.value !== 'all') {
    const now = new Date()
    result = result.filter((r) => {
      const receiptDate = new Date(r.date)
      switch (dateFilter.value) {
        case 'today':
          return receiptDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return receiptDate >= weekAgo
        case 'month':
          return (
            receiptDate.getMonth() === now.getMonth() &&
            receiptDate.getFullYear() === now.getFullYear()
          )
        default:
          return true
      }
    })
  }

  return result
})

const sortedFilteredReceipts = computed(() => {
  const result = [...filteredReceipts.value]

  result.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (currentSort.value.key) {
      case 'receiptNumber':
        aValue = a.receiptNumber
        bValue = b.receiptNumber
        break
      case 'customerName':
        aValue = a.customerName
        bValue = b.customerName
        break
      case 'date':
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
        break
      case 'itemsCount':
        aValue = a.itemsCount
        bValue = b.itemsCount
        break
      case 'total':
        aValue = a.total
        bValue = b.total
        break
      case 'paymentMethod':
        aValue = a.paymentMethod
        bValue = b.paymentMethod
        break
      case 'status':
        // Custom sort order for status
        const statusOrder = ['completed', 'pending', 'refunded']
        aValue = statusOrder.indexOf(a.status)
        bValue = statusOrder.indexOf(b.status)
        break
      case 'createdBy':
        aValue = a.createdByUserName || getCreatorName(a.actualCreator || a.createdBy)
        bValue = b.createdByUserName || getCreatorName(b.actualCreator || b.createdBy)
        break
      default:
        return 0
    }

    // Handle undefined/null values
    if (aValue === undefined || aValue === null) return 1
    if (bValue === undefined || bValue === null) return -1

    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return currentSort.value.order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    // Numeric comparison
    const aNum = typeof aValue === 'number' ? aValue : parseFloat(aValue) || 0
    const bNum = typeof bValue === 'number' ? bValue : parseFloat(bValue) || 0

    return currentSort.value.order === 'asc' ? aNum - bNum : bNum - aNum
  })

  return result
})

const paginatedReceipts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedFilteredReceipts.value.slice(start, end)
})

const receiptForOpenMenu = computed(() => {
  const id = openReceiptMenuId.value
  if (!id) return null
  return sortedFilteredReceipts.value.find((r) => r.id === id) ?? null
})

const receiptsHeaderMetrics = computed(() => {
  if (activeTab.value === 'outstanding') {
    const rows = filteredOutstandingReceipts.value
    const balanceTotal = rows.reduce((sum, row) => sum + outstandingBalanceDue(row), 0)
    return [
      {
        key: 'open',
        label: 'Open balances',
        value: String(rows.length),
        tone: rows.length > 0 ? ('warning' as const) : undefined,
      },
      {
        key: 'due',
        label: 'Balance due',
        value: formatCurrency(balanceTotal),
        tone: balanceTotal > 0 ? ('warning' as const) : undefined,
      },
    ]
  }

  const inStore = receipts.value.length
  const shown = sortedFilteredReceipts.value.length

  return [
    {
      key: 'in-store',
      label: shown !== inStore ? 'Receipts shown' : 'In store',
      value: shown !== inStore ? `${shown} / ${inStore}` : String(inStore),
    },
    {
      key: 'completed',
      label: 'Completed',
      value: formatCurrency(totalSales.value),
    },
    {
      key: 'today',
      label: 'Today',
      value: formatCurrency(todaySales.value),
    },
    {
      key: 'month',
      label: 'This month',
      value: formatCurrency(monthSales.value),
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      value: String(outstandingReceipts.value.length),
      tone: outstandingReceipts.value.length > 0 ? ('warning' as const) : undefined,
    },
  ]
})

const receiptMenuFixedStyle = ref<Record<string, string> | null>(null)
/** The menu exposes its rendered card as `panel` so we can measure it */
type ContextMenuHandle = { panel: HTMLElement | null } | null
const receiptMenuPanelRef = ref<ContextMenuHandle>(null)

function updateReceiptMenuPosition() {
  const id = openReceiptMenuId.value
  if (!id || !import.meta.client) {
    receiptMenuFixedStyle.value = null
    return
  }
  const el = getVisibleMenuAnchorElement('data-receipt-actions-anchor', id)
  if (!el) {
    receiptMenuFixedStyle.value = null
    return
  }
  const r = el.getBoundingClientRect()
  const estimatedMenuHeight = receiptMenuPanelRef.value?.panel?.offsetHeight || 240
  receiptMenuFixedStyle.value = computeFixedAnchoredMenuStyle(r, {
    estimatedMenuHeight,
    margin: 4,
    viewportPadding: 8,
  })
}

function addReceiptMenuPositionListeners() {
  if (!import.meta.client) return
  window.addEventListener('scroll', updateReceiptMenuPosition, true)
  window.addEventListener('resize', updateReceiptMenuPosition)
}

function removeReceiptMenuPositionListeners() {
  if (!import.meta.client) return
  window.removeEventListener('scroll', updateReceiptMenuPosition, true)
  window.removeEventListener('resize', updateReceiptMenuPosition)
}

let receiptMenuOutsideHandler: ((e: MouseEvent) => void) | null = null

function removeReceiptMenuOutsideListener() {
  if (receiptMenuOutsideHandler && import.meta.client) {
    document.removeEventListener('click', receiptMenuOutsideHandler, true)
    receiptMenuOutsideHandler = null
  }
}

watch(openReceiptMenuId, (id) => {
  removeReceiptMenuOutsideListener()
  removeReceiptMenuPositionListeners()
  receiptMenuFixedStyle.value = null
  if (!id || !import.meta.client) return

  nextTick(() => {
    updateReceiptMenuPosition()
    addReceiptMenuPositionListeners()
  })

  receiptMenuOutsideHandler = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null
    if (isInsideAnchoredMenu(t)) return
    if (t?.closest?.('[data-receipt-actions-anchor]')) return
    openReceiptMenuId.value = null
    removeReceiptMenuOutsideListener()
  }

  nextTick(() => {
    // second pass after DOM paints so we position using real panel size
    requestAnimationFrame(() => updateReceiptMenuPosition())
    setTimeout(() => {
      if (openReceiptMenuId.value && receiptMenuOutsideHandler) {
        document.addEventListener('click', receiptMenuOutsideHandler, true)
      }
    }, 0)
  })
})

// Reset to first page when filters change
watch([searchQuery, statusFilter, dateFilter, currentSort], () => {
  currentPage.value = 1
})

const toggleSort = (key: string) => {
  if (currentSort.value.key === key) {
    currentSort.value.order = currentSort.value.order === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value.key = key
    currentSort.value.order = 'asc'
  }
}

const isColumnSortable = (key: string) => {
  return sortableColumns.some((col) => col.key === key)
}

// Use formatCurrency from preferences (which includes the correct currency symbol)
const { formatCurrency } = usePreferences()

const formatDate = (date: string | Date) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatTime = (date: string | Date) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  dateFilter.value = 'all'
  currentPage.value = 1
  if (import.meta.client) {
    try {
      localStorage.setItem('receipts-page', '1')
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

watch(
  [highlightFromRoute, isInitialLoading, activeTab],
  async () => {
    const id = highlightFromRoute.value
    if (!id || isInitialLoading.value || activeTab.value !== 'receipts') return
    await nextTick()
    let idx = sortedFilteredReceipts.value.findIndex((r) => r.id === id)
    if (idx === -1) {
      resetFilters()
      await nextTick()
      idx = sortedFilteredReceipts.value.findIndex((r) => r.id === id)
    }
    if (idx === -1) return
    const page = Math.floor(idx / itemsPerPage.value) + 1
    if (currentPage.value !== page) {
      currentPage.value = page
      await nextTick()
    }
    applyReceiptHighlight(id)
  },
  { flush: 'post', immediate: true }
)

const handlePageChange = (page: number) => {
  currentPage.value = page
  // Save to localStorage
  if (import.meta.client) {
    try {
      localStorage.setItem('receipts-page', page.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Watch for page changes to persist
watch(currentPage, (newPage) => {
  openReceiptMenuId.value = null
  if (import.meta.client && activeTab.value === 'receipts') {
    try {
      localStorage.setItem('receipts-page', newPage.toString())
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})

const showCreateReceiptModal = ref(false)
const showQuickSaleModal = ref(false)

const openCreateReceiptModal = () => {
  showCreateReceiptModal.value = true
}

const clearReceiptFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  dateFilter.value = 'all'
}

const openQuickSaleModal = () => {
  showQuickSaleModal.value = true
}

const handleQuickSaleCompleted = async () => {
  showQuickSaleModal.value = false
  await receiptsStore.fetchReceipts()
  await loadCreatorNames()
}

const handleReceiptCreated = async (receipt: Receipt) => {
  // Receipt is already added to store by the modal, but we need to refresh to ensure it appears
  showCreateReceiptModal.value = false
  // Refresh receipts list to ensure staff-created receipts appear
  await receiptsStore.fetchReceipts()
  // Reload creator names after receipts are refreshed
  await loadCreatorNames()
}

const selectedReceipt = ref<Receipt | null>(null)
const showViewReceiptModal = ref(false)
const showReceiptDetailsDrawer = ref(false)
const showReturnReceiptModal = ref(false)
const showTimelineModal = ref(false)
const showDeleteReceiptModal = ref(false)

// Bulk delete receipts
const selectedReceiptsForBulk = ref<Receipt[]>([])
const showBulkDeleteReceiptsModal = ref(false)
const bulkDeleteReceiptsConfirmed = ref(false)
const isBulkDeletingReceipts = ref(false)
const toggleReceiptSelection = (receipt: Receipt, checked: boolean) => {
  const idx = selectedReceiptsForBulk.value.findIndex((r) => r.id === receipt.id)
  if (checked && idx === -1) selectedReceiptsForBulk.value.push(receipt)
  else if (!checked && idx !== -1) selectedReceiptsForBulk.value.splice(idx, 1)
}
const toggleSelectAllReceipts = (checked: boolean) => {
  if (checked) selectedReceiptsForBulk.value = [...paginatedReceipts.value]
  else selectedReceiptsForBulk.value = []
}
const openBulkDeleteReceiptsModal = () => {
  bulkDeleteReceiptsConfirmed.value = false
  showBulkDeleteReceiptsModal.value = true
}
const handleConfirmBulkDeleteReceipts = async () => {
  if (!bulkDeleteReceiptsConfirmed.value || selectedReceiptsForBulk.value.length === 0) return
  isBulkDeletingReceipts.value = true
  const ids = selectedReceiptsForBulk.value.map((r) => r.id)
  const count = ids.length
  try {
    for (const id of ids) {
      await receiptsStore.deleteReceipt(id)
    }
    selectedReceiptsForBulk.value = []
    showBulkDeleteReceiptsModal.value = false
    bulkDeleteReceiptsConfirmed.value = false
    await receiptsStore.fetchReceipts()
    await loadCreatorNames()
    toast.success(`${count} sale${count !== 1 ? 's' : ''} deleted`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete some sales')
  } finally {
    isBulkDeletingReceipts.value = false
  }
}

const { addRecentItem } = useRecentItems()

const handleViewReceiptTimeline = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showTimelineModal.value = true
}

const handleViewReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showReceiptDetailsDrawer.value = true

  addRecentItem({
    id: receipt.id,
    type: 'receipt',
    name: `Receipt #${receipt.receiptNumber}`,
    path: `/dashboard/receipts?receipt=${receipt.id}`,
    metadata: {
      receiptNumber: receipt.receiptNumber,
    },
  })
}

const handleRefundReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showReturnReceiptModal.value = true
}

const handleReceiptReturned = async (receipt: Receipt) => {
  showReturnReceiptModal.value = false
  selectedReceipt.value = null
  // Refresh receipts list
  await receiptsStore.fetchReceipts()
}

const handleDeleteReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showDeleteReceiptModal.value = true
}

const handleReceiptConfirmDelete = (receipt: Receipt) => {
  showDeleteReceiptModal.value = false
  selectedReceipt.value = null

  const removed = receiptsStore.removeReceiptOptimistically(receipt.id)
  if (!removed) return

  toast.deletedWithUndo(
    'Receipt deleted',
    () => {
      receiptsStore.restoreReceipt(receipt)
    },
    async () => {
      try {
        await receiptsStore.deleteReceipt(receipt.id)
        await loadCreatorNames()
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete sale')
      }
    },
    5000
  )
}

// Function to fetch creator name for a given UID
const getCreatorName = (uid: string): string => {
  if (!uid) return 'Unknown'
  return creatorNames.value[uid] || 'Loading...'
}

// Load creator names for all unique creator UIDs in receipts
const loadCreatorNames = async () => {
  if (loadingCreators.value || receipts.value.length === 0) return

  loadingCreators.value = true
  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) {
    const uniqueCreatorUids = [
      ...new Set(
        receipts.value.map((r) => (r as any).actualCreator || r.createdBy).filter(Boolean)
      ),
    ]
    for (const uid of uniqueCreatorUids) {
      creatorNames.value[uid] = 'Demo User'
    }
    loadingCreators.value = false
    return
  }

  const db = getFirestoreInstance()
  if (!db) {
    loadingCreators.value = false
    return
  }

  try {
    // Get unique creator UIDs from receipts (use actualCreator if available, otherwise createdBy)
    const uniqueCreatorUids = [
      ...new Set(
        receipts.value.map((r) => (r as any).actualCreator || r.createdBy).filter(Boolean)
      ),
    ]

    // Fetch names for all unique creators
    await Promise.all(
      uniqueCreatorUids.map(async (uid) => {
        if (creatorNames.value[uid]) return // Already loaded

        try {
          // First try to get from users collection (super admin)
          const userData = await getUserDocument(uid)
          if (userData?.name) {
            creatorNames.value[uid] = userData.name
            return
          }

          // Try to get from staff store cache first (faster if already loaded)
          const cachedStaff = staffStore.staff.find((s) => s.authUid === uid)
          if (cachedStaff) {
            const fullName = `${cachedStaff.firstName || ''} ${cachedStaff.lastName || ''}`.trim()
            if (fullName) {
              creatorNames.value[uid] = fullName
              return
            }
          }

          // If not found in cache, try legacy staff collection (for migration)
          try {
            const staffRef = collection(db, 'staff')
            const staffQuery = query(staffRef, where('authUid', '==', uid))
            const staffSnapshot = await getDocs(staffQuery)

            if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
              const staffDoc = staffSnapshot.docs[0]
              if (staffDoc) {
                const staffData = staffDoc.data()
                const fullName = `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim()
                if (fullName) {
                  creatorNames.value[uid] = fullName
                  return
                }
              }
            }
          } catch (legacyError: any) {
            console.warn(
              `Could not fetch from legacy staff collection for ${uid}:`,
              legacyError.message
            )
          }

          // If still not found, search hierarchical structure
          try {
            const { getStoresCollection, getDepartmentsCollection, getStaffCollection } =
              await import('~/composables/useFirestorePaths')

            // Get all superadmin users from top-level users collection
            const usersRef = collection(db, 'users')
            const usersSnapshot = await getDocs(usersRef)

            for (const userDoc of usersSnapshot.docs) {
              const potentialSuperadminId = userDoc.id
              const userData = userDoc.data()

              // Only search superadmins
              if (userData.role !== 'superAdmin') continue

              try {
                const storesRef = getStoresCollection(db, potentialSuperadminId)
                const storesSnapshot = await getDocs(storesRef)

                for (const storeDoc of storesSnapshot.docs) {
                  const storeId = storeDoc.id
                  const departmentsRef = getDepartmentsCollection(
                    db,
                    potentialSuperadminId,
                    storeId
                  )
                  const departmentsSnapshot = await getDocs(departmentsRef)

                  for (const deptDoc of departmentsSnapshot.docs) {
                    const departmentId = deptDoc.id
                    try {
                      const staffRef = getStaffCollection(
                        db,
                        potentialSuperadminId,
                        storeId,
                        departmentId
                      )
                      const staffSnapshot = await getDocs(staffRef)

                      for (const staffDoc of staffSnapshot.docs) {
                        const staffData = staffDoc.data()
                        if (staffData.authUid === uid) {
                          // Found the staff member!
                          const fullName = `${staffData.firstName || ''} ${
                            staffData.lastName || ''
                          }`.trim()
                          if (fullName) {
                            creatorNames.value[uid] = fullName
                            return
                          }
                          // If no name, try email
                          if (staffData.email) {
                            creatorNames.value[uid] = staffData.email
                            return
                          }
                        }
                      }
                    } catch (e) {
                      continue
                    }
                  }
                }
              } catch (e) {
                continue
              }
            }
          } catch (hierarchicalError: any) {
            console.warn(
              `Could not search hierarchical structure for ${uid}:`,
              hierarchicalError.message
            )
          }

          // If still not found, use UID as fallback
          creatorNames.value[uid] = 'Unknown User'
        } catch (error: any) {
          console.warn(`Failed to fetch creator name for ${uid}:`, error.message)
          creatorNames.value[uid] = 'Unknown User'
        }
      })
    )
  } catch (error: any) {
    console.error('Error loading creator names:', error)
  } finally {
    loadingCreators.value = false
  }
}

async function reloadReceiptsPage() {
  if (!authStore.currentUser) return
  await receiptsStore.fetchReceipts({ force: true })
  await loadCreatorNames()
}

useDashboardPageRefreshRegister(reloadReceiptsPage)

// Load receipts on mount
onMounted(async () => {
  // Add keyboard listener for ESC key
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeyDown)
  }

  // Only run on client
  if (import.meta.server) return

  if (route.query.new === '1') {
    openCreateReceiptModal()
    const { new: _new, ...rest } = route.query
    void router.replace({ query: rest })
  }

  // Set initial loading state (skip skeleton when we already have warm receipts)
  isInitialLoading.value = receiptsStore.receipts.length === 0 && receiptsStore.loading

  // Wait for auth to finish loading before loading receipts
  if (authStore.loading) {
    let resolved = false
    await new Promise((resolve) => {
      const unwatch = watch(
        () => authStore.loading,
        (val) => {
          if (!val && !resolved) {
            resolved = true
            unwatch()
            resolve(true)
          }
        }
      )

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          unwatch()
          resolve(true)
        }
      }, 5000)
    })
  }

  // Only load receipts if user is authenticated
  if (authStore.currentUser) {
    try {
      await receiptsStore.fetchReceipts({
        force: Boolean(highlightFromRoute.value),
      })
      await loadCreatorNames()
    } catch (error: any) {
      console.error('Error loading receipts:', error.message || error)
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 300))
  isInitialLoading.value = false
})

// Cleanup keyboard listener and restore body overflow
onBeforeUnmount(() => {
  clearReceiptHighlightTimer()
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeyDown)
    removeReceiptMenuOutsideListener()
    removeReceiptMenuPositionListeners()
    document.body.style.overflow = ''
  }
})

// Watch for auth state changes
watch(
  () => authStore.currentUser,
  async (user) => {
    if (user && receiptsStore.receipts.length === 0) {
      try {
        await receiptsStore.fetchReceipts()
        // Load creator names after receipts are loaded
        await loadCreatorNames()
      } catch (error: any) {
        console.error('Error loading receipts:', error.message || error)
      }
    }
  },
  { immediate: false }
)

// Watch for receipts changes and load creator names
// Watch for store changes and refetch receipts
watch(
  () => storesStore.currentStoreId,
  async (newStoreId, oldStoreId) => {
    if (newStoreId && newStoreId !== oldStoreId && authStore.currentUser) {
      // console.log('[ReceiptsPage] Store changed, refetching receipts...')
      try {
        await receiptsStore.fetchReceipts()
        // console.log('[ReceiptsPage] Receipts refetched after store change:', receiptsStore.receipts.length)
      } catch (error: any) {
        console.error(
          '[ReceiptsPage] Error refetching receipts after store change:',
          error.message || error
        )
      }
    }
  },
  { immediate: false }
)

watch(
  () => receiptsStore.receipts,
  async (newReceipts) => {
    if (newReceipts && newReceipts.length > 0) {
      await loadCreatorNames()
    }
  },
  { immediate: false }
)
</script>
