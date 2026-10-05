<template>
  <div class="ds-root s-c s-page">
    <SPageHeader title="Transfers">
      <template #description>
        Move stock between branches and compare how each branch is selling.
      </template>
    </SPageHeader>

    <PlanGate
      v-if="!canUseSubscriptionFeature('multi_store_sync')"
      feature="multi_store_sync"
      description="Move stock between branches with approval and tracking, and see sales across every branch."
    />

    <SCard v-else-if="!canAccess">
      <SEmptyState
        title="You don't have access to transfers"
        description="Ask the account owner to give you access to transfers between branches."
      >
        <template #icon><Lock :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <STabs v-model="activeTab" :tabs="webTabs" label="Transfer views" />

      <!-- New transfer -->
      <SCard
        v-if="activeTab === 'transfer'"
        title="New transfer"
        class="s-transfer"
      >
        <form class="s-form" @submit.prevent="requestTransfer">
          <p class="s-transfer__intro">
            A transfer goes from requested, to approved and in transit, to complete. Stock only
            moves when you complete it.
          </p>

          <div class="s-transfer__grid">
            <SSelect
              :model-value="transferForm.sourceStoreId"
              label="From branch"
              placeholder="Choose a branch"
              :options="storeOptions"
              required
              @update:model-value="onWebSourceStoreChange"
            />
            <SSelect
              :model-value="transferForm.destinationStoreId"
              label="To branch"
              placeholder="Choose a branch"
              :options="destinationStoreOptions"
              :disabled="!transferForm.sourceStoreId"
              required
              @update:model-value="onWebDestinationStoreChange"
            />
          </div>

          <div v-if="transferForm.sourceStoreId || transferForm.destinationStoreId" class="s-transfer__grid">
            <SField v-if="transferForm.sourceStoreId" v-slot="{ labelId }" label="Take items from category">
              <DashboardFolderDrillPicker
                :aria-labelledby="labelId"
                :key="`src-${transferForm.sourceStoreId}`"
                v-model="transferForm.folderId"
                :folders="sourceFolders"
                empty-label="This branch has no categories yet."
                @change="onSourceFolderChange"
              />
            </SField>
            <SField
              v-if="transferForm.destinationStoreId"
              label="Put items in category"
              v-slot="{ labelId, describedBy }"
              hint="If the category has subcategories, open it and pick where items should go."
            >
              <DashboardFolderDrillPicker
                :aria-labelledby="labelId"
                :aria-describedby="describedBy"
                :key="`dest-${transferForm.destinationStoreId}`"
                v-model="transferForm.destinationFolderId"
                :folders="destinationFolders"
                empty-label="This branch has no categories yet."
              />
            </SField>
          </div>

          <template v-if="transferForm.folderId">
            <ul v-if="isLoadingItems && availableItems.length === 0" class="s-list" aria-label="Loading items">
              <li v-for="i in 4" :key="i" class="s-list__item" aria-hidden="true">
                <div class="s-list__main">
                  <SSkeleton width="40%" height="14px" />
                  <SSkeleton width="25%" height="12px" />
                </div>
              </li>
            </ul>
            <p v-else-if="availableItems.length === 0" class="s-notice">
              Nothing in this category can be moved right now. Items that are sold, on loan or
              already in a transfer are left out.
            </p>
            <div v-else class="s-table-wrap s-transfer__items">
              <table class="s-table">
                <caption class="ds-sr-only">Items to transfer</caption>
                <thead>
                  <tr>
                    <th v-if="currentFolderHasSerialNumbers" scope="col" class="s-table__check">
                      <span class="ds-sr-only">Select</span>
                    </th>
                    <th scope="col">Item</th>
                    <th v-if="!currentFolderHasSerialNumbers" scope="col" class="s-table__num">In stock</th>
                    <th v-if="!currentFolderHasSerialNumbers" scope="col" class="s-table__num">Move</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in availableItems"
                    :key="item.id"
                    :class="{ 's-table__row--selected': (transferForm.items[item.id] ?? 0) > 0 }"
                  >
                    <td v-if="currentFolderHasSerialNumbers" class="s-table__check">
                      <SCheckbox
                        :model-value="transferForm.items[item.id] === 1"
                        :aria-label="`Move ${transferItemName(item)}`"
                        @update:model-value="(checked) => (transferForm.items[item.id] = checked ? 1 : 0)"
                      />
                    </td>
                    <td>
                      <span class="s-table__primary">{{ transferItemName(item) }}</span>
                      <span v-if="transferItemMeta(item)" class="s-table__secondary">
                        {{ transferItemMeta(item) }}
                      </span>
                    </td>
                    <td v-if="!currentFolderHasSerialNumbers" class="s-table__num">
                      {{ getAvailableQuantity(item) }}
                    </td>
                    <td v-if="!currentFolderHasSerialNumbers" class="s-table__num">
                      <SInput
                        class="s-transfer__qty"
                        type="number"
                        inputmode="numeric"
                        :model-value="transferForm.items[item.id] ?? null"
                        :aria-label="`Quantity of ${transferItemName(item)} to move`"
                        :min="0"
                        :max="getAvailableQuantity(item)"
                        placeholder="0"
                        @update:model-value="(value) => setTransferQuantity(item.id, value)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <STextarea
            v-model="transferForm.notes"
            label="Notes (optional)"
            :rows="2"
            placeholder="Anything the other branch should know"
          />

          <div class="s-transfer__actions">
            <SButton variant="primary" type="submit" :disabled="!canTransfer" :loading="isTransferring">
              <template #leading><ArrowLeftRight :size="16" :stroke-width="2" aria-hidden="true" /></template>
              Request transfer
            </SButton>
          </div>
        </form>
      </SCard>

      <!-- History -->
      <template v-else-if="activeTab === 'history'">
        <SCard v-if="isLoadingHistory && transferHistory.length === 0" flush aria-busy="true">
          <ul class="s-list" aria-label="Loading transfers">
            <li v-for="i in 5" :key="i" class="s-list__item" aria-hidden="true">
              <div class="s-list__main">
                <SSkeleton width="40%" height="14px" />
                <SSkeleton width="25%" height="12px" />
              </div>
              <SSkeleton width="72px" height="14px" />
            </li>
          </ul>
        </SCard>
        <SCard v-else-if="transferHistory.length === 0">
          <SEmptyState
            title="No transfers yet"
            description="Transfers between your branches will show here, with their status and tracking."
          >
            <template #icon><ArrowLeftRight :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
            <template #actions>
              <SButton @click="activeTab = 'transfer'">New transfer</SButton>
            </template>
          </SEmptyState>
        </SCard>

        <template v-else>
          <!-- Phone -->
          <SCard flush class="s-only-sm">
            <ul class="s-list">
              <li v-for="transfer in transferHistory" :key="transfer.id" class="s-list__item">
                <div class="s-list__main">
                  <span class="s-list__primary">{{ transferRoute(transfer) }}</span>
                  <span class="s-list__secondary">
                    {{ formatTransferProductSummary(transfer) }} · {{ formatDateShort(transfer.createdAt) }}
                  </span>
                </div>
                <div class="s-list__end">
                  <SBadge :tone="transferStatusTone(transfer.status)" size="sm">
                    {{ getTransferStatusLabel(transfer.status) }}
                  </SBadge>
                  <SIconButton
                    v-if="isTransferActionable(transfer)"
                    label="Transfer actions"
                    size="sm"
                    :data-transfer-actions-anchor="transfer.id"
                    aria-haspopup="menu"
                    :aria-expanded="openTransferMenuId === transfer.id"
                    @click="toggleTransferMenu(transfer.id)"
                  >
                    <EllipsisVertical :size="16" :stroke-width="2" />
                  </SIconButton>
                </div>
              </li>
            </ul>
          </SCard>

          <!-- Tablet and desktop -->
          <div class="s-table-wrap s-hide-sm">
            <table class="s-table">
              <thead>
                <tr>
                  <th scope="col">Route</th>
                  <th scope="col">Items</th>
                  <th scope="col">Status</th>
                  <th scope="col" class="s-hide-md">Requested</th>
                  <th scope="col" class="s-table__actions"><span class="ds-sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transfer in transferHistory" :key="transfer.id">
                  <td>
                    <span class="s-table__primary">{{ transferRoute(transfer) }}</span>
                    <span v-if="transfer.notes" class="s-table__secondary">{{ transfer.notes }}</span>
                  </td>
                  <td>
                    <span class="s-table__primary">{{ formatTransferProductSummary(transfer) }}</span>
                    <span v-if="transferItemsPreview(transfer)" class="s-table__secondary">
                      {{ transferItemsPreview(transfer) }}
                    </span>
                  </td>
                  <td>
                    <SBadge :tone="transferStatusTone(transfer.status)" size="sm">
                      {{ getTransferStatusLabel(transfer.status) }}
                    </SBadge>
                    <span v-if="transfer.carrier || transfer.trackingNumber" class="s-table__secondary s-transfer__tracking">
                      <Truck :size="14" :stroke-width="2" aria-hidden="true" />
                      {{ [transfer.carrier, transfer.trackingNumber].filter(Boolean).join(' · ') }}
                    </span>
                  </td>
                  <td class="s-hide-md s-table__nowrap">{{ formatDateShort(transfer.createdAt) }}</td>
                  <td class="s-table__actions">
                    <SIconButton
                      v-if="isTransferActionable(transfer)"
                      label="Transfer actions"
                      size="sm"
                      :data-transfer-actions-anchor="transfer.id"
                      aria-haspopup="menu"
                      :aria-expanded="openTransferMenuId === transfer.id"
                      @click="toggleTransferMenu(transfer.id)"
                    >
                      <EllipsisVertical :size="16" :stroke-width="2" />
                    </SIconButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </template>

      <!-- Branch reports -->
      <template v-else-if="activeTab === 'reports'">
        <div class="s-toolbar">
          <SSelect
            v-model="reportFilters.dateRange"
            class="s-toolbar__filter"
            aria-label="Date range"
            :options="reportRangeOptions"
            @update:model-value="loadConsolidatedReports"
          />
          <SSelect
            v-model="reportFilters.storeIds"
            class="s-toolbar__filter"
            aria-label="Branch"
            :options="reportStoreOptions"
            @update:model-value="loadConsolidatedReports"
          />
          <div class="s-toolbar__end">
            <SButton variant="secondary" @click="exportConsolidatedReport">
              <template #leading><Download :size="16" :stroke-width="2" aria-hidden="true" /></template>
              Export
            </SButton>
          </div>
        </div>

        <dl class="s-metrics">
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Revenue</dt>
            <dd class="s-metrics__value">{{ formatCurrency(consolidatedReport.totalRevenue) }}</dd>
          </div>
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Sales</dt>
            <dd class="s-metrics__value">{{ consolidatedReport.totalSales }}</dd>
          </div>
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Items sold</dt>
            <dd class="s-metrics__value">{{ consolidatedReport.totalItems }}</dd>
          </div>
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Average sale</dt>
            <dd class="s-metrics__value">{{ formatCurrency(consolidatedReport.avgOrderValue) }}</dd>
          </div>
        </dl>

        <SCard
          v-if="isLoadingReports && consolidatedReport.storeBreakdown.length === 0"
          flush
          aria-busy="true"
        >
          <ul class="s-list" aria-label="Loading branch sales">
            <li v-for="i in 3" :key="i" class="s-list__item" aria-hidden="true">
              <div class="s-list__main">
                <SSkeleton width="40%" height="14px" />
              </div>
              <SSkeleton width="72px" height="14px" />
            </li>
          </ul>
        </SCard>
        <SCard v-else-if="consolidatedReport.storeBreakdown.length === 0">
          <SEmptyState title="No sales in this period" description="Try a longer date range.">
            <template #icon><BarChart3 :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
          </SEmptyState>
        </SCard>
        <div v-else class="s-table-wrap">
          <table class="s-table">
            <caption class="ds-sr-only">Sales by branch</caption>
            <thead>
              <tr>
                <th scope="col">Branch</th>
                <th scope="col" class="s-table__num">Revenue</th>
                <th scope="col" class="s-table__num">Sales</th>
                <th scope="col" class="s-table__num">Items sold</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="store in consolidatedReport.storeBreakdown" :key="store.id">
                <td><span class="s-table__primary">{{ store.name }}</span></td>
                <td class="s-table__num">{{ formatCurrency(store.revenue) }}</td>
                <td class="s-table__num">{{ store.sales }}</td>
                <td class="s-table__num">{{ store.items }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <SMenu
        :open="Boolean(openTransferMenuId && transferForOpenMenu && transferMenuFixedStyle)"
        :style="transferMenuFixedStyle"
        menu-id="transfer"
        label="Transfer actions"
        @close="closeWebTransferMenu"
      >
        <template v-if="transferForOpenMenu?.status === 'pending_approval'">
          <SMenuItem label="Approve" :icon="CircleCheck" @select="runTransferMenuAction(approveTransfer)" />
          <SMenuItem label="Cancel transfer" :icon="CircleX" danger @select="askCancelTransfer" />
        </template>
        <template v-else-if="transferForOpenMenu?.status === 'in_transit'">
          <SMenuItem label="Complete" :icon="CircleCheck" @select="runTransferMenuAction(completeTransfer)" />
          <SMenuItem label="Add tracking" :icon="Truck" @select="runTransferMenuAction(openTrackingModal)" />
          <SMenuItem label="Cancel transfer" :icon="CircleX" danger @select="askCancelTransfer" />
        </template>
      </SMenu>

      <SDialog
        v-model:open="showTrackingModal"
        title="Shipment tracking"
        description="Add the carrier and tracking number so the other branch can follow the delivery."
      >
        <form id="transfer-tracking-form" class="s-form" @submit.prevent="saveTracking">
          <SInput v-model="trackingForm.carrier" label="Carrier" placeholder="For example, DHL or GIG" />
          <SInput v-model="trackingForm.trackingNumber" label="Tracking number" placeholder="For example, 1234567890" />
        </form>
        <template #footer>
          <SButton variant="secondary" @click="showTrackingModal = false">Cancel</SButton>
          <SButton variant="primary" type="submit" form="transfer-tracking-form">Save</SButton>
        </template>
      </SDialog>

      <SDialog
        :open="Boolean(transferToCancel)"
        role="alertdialog"
        title="Cancel this transfer?"
        :description="transferToCancel ? `${transferRoute(transferToCancel)}. No stock will move.` : ''"
        @update:open="(open) => { if (!open) transferToCancel = null }"
      >
        <template #footer>
          <SButton variant="secondary" @click="transferToCancel = null">Keep transfer</SButton>
          <SButton variant="danger" :loading="isCancellingTransfer" @click="confirmCancelTransfer">
            Cancel transfer
          </SButton>
        </template>
      </SDialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import {
  ArrowLeftRight,
  BarChart3,
  CircleCheck,
  CircleX,
  Download,
  EllipsisVertical,
  Lock,
  Truck,
} from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import SField from '~/components/s/SField.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SInput from '~/components/s/SInput.vue'
import SMenu from '~/components/s/SMenu.vue'
import SMenuItem from '~/components/s/SMenuItem.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSelect from '~/components/s/SSelect.vue'
import STabs from '~/components/s/STabs.vue'
import STextarea from '~/components/s/STextarea.vue'
import PlanGate from '~/components/subscription/PlanGate.vue'
import { getVisibleMenuAnchorElement } from '~/utils/menuAnchor'
import DashboardFolderDrillPicker from '~/components/dashboard/DashboardFolderDrillPicker.vue'
import { useStoresStore } from '~/stores/stores'
import { useInventoryStore } from '~/stores/inventory'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { usePermissions } from '~/composables/usePermissions'
import { usePreferences } from '~/composables/usePreferences'
import { useAppToast } from '~/composables/useAppToast'
import { useFirestore } from '~/composables/useFirestore'
import { useDashboardPageRefreshRegister } from '~/composables/useDashboardPageRefresh'
import { CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import { invalidateFolderItemCaches } from '~/utils/inventory-items-firestore'

definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: 'Multi-Store Sync - Storvv',
})

const { formatCurrency } = usePreferences()
const toast = useAppToast()
const storesStore = useStoresStore()
const inventoryStore = useInventoryStore()
const userStore = useUserStore()
const { can } = usePermissions()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

// Security: Enterprise plan + multi-store view grant (owners always have full grants)
const canAccess = computed(
  () => can('multiStoreSync', 'view') && canUseSubscriptionFeature('multi_store_sync')
)

function formatDateShort(date: unknown) {
  if (!date) return ''
  const d =
    date && typeof date === 'object' && 'toDate' in date
      ? (date as { toDate: () => Date }).toDate()
      : new Date(date as string | number)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// State
const activeTab = ref<'transfer' | 'reports' | 'history'>('transfer')
const stores = ref<any[]>([])
const sourceFolders = ref<any[]>([])
const destinationFolders = ref<any[]>([])
const availableItems = ref<any[]>([])
const transferHistory = ref<any[]>([])
const isTransferring = ref(false)
const isLoadingItems = ref(false)
const isLoadingHistory = ref(false)
const isLoadingReports = ref(false)
const showTrackingModal = ref(false)
const selectedTransferForTracking = ref<any>(null)
const trackingForm = ref({ carrier: '', trackingNumber: '' })

// Transfer Form
const transferForm = ref({
  sourceStoreId: '',
  destinationStoreId: '',
  folderId: '',
  destinationFolderId: '',
  items: {} as Record<string, number>,
  notes: '',
})

// Report Filters
const reportFilters = ref({
  dateRange: '30',
  storeIds: 'all',
})

// Consolidated Report
const consolidatedReport = ref({
  totalRevenue: 0,
  totalSales: 0,
  totalItems: 0,
  avgOrderValue: 0,
  storeBreakdown: [] as any[],
})

// Computed
const currentFolderHasSerialNumbers = computed(() => {
  const folder = sourceFolders.value.find((f) => f.id === transferForm.value.folderId)
  return folder?.hasSerialNumbers || false
})

const canTransfer = computed(() => {
  return (
    transferForm.value.sourceStoreId &&
    transferForm.value.destinationStoreId &&
    transferForm.value.folderId &&
    transferForm.value.destinationFolderId &&
    Object.values(transferForm.value.items).some((qty) => qty > 0)
  )
})

// Helper function to remove undefined values from object (Firestore doesn't allow undefined)
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined)
  }
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value)
      }
    }
    return cleaned
  }
  return obj
}

async function resolveOwnerUserId(): Promise<string> {
  const authStore = useAuthStore()
  const uid = (await getQueryUserId()) ?? authStore.currentUser?.uid
  if (!uid) throw new Error('User not authenticated')
  return uid
}

/** Item IDs already claimed by open transfers (pending / in transit). */
const itemsLockedInOpenTransfers = computed(() => {
  const locked = new Set<string>()
  for (const transfer of transferHistory.value) {
    const status = String(transfer.status || '').toLowerCase()
    if (status !== 'pending_approval' && status !== 'in_transit') continue
    for (const line of transfer.items || []) {
      if (line?.itemId) locked.add(String(line.itemId))
    }
  }
  return locked
})

function isItemAvailableForTransfer(item: any, hasSerialNumbers: boolean) {
  const dateOut = item.dateOut
  if (dateOut && dateOut !== null && dateOut !== '') return false

  const loanId = item.sellerLoanOutId
  if (loanId != null && loanId !== undefined && String(loanId).trim() !== '') return false

  // Only block items still sitting in an open transfer, not stock that previously arrived via transfer
  if (itemsLockedInOpenTransfers.value.has(String(item.id))) return false

  if (hasSerialNumbers) return true
  const quantity = item.quantity || item.Quantity || 0
  return quantity > 0
}

function resetTransferSelection(opts?: { keepStores?: boolean; keepDestination?: boolean }) {
  if (!opts?.keepStores) {
    transferForm.value.sourceStoreId = ''
    transferForm.value.destinationStoreId = ''
  }
  if (!opts?.keepDestination) {
    transferForm.value.destinationFolderId = ''
    destinationFolders.value = []
  }
  transferForm.value.folderId = ''
  transferForm.value.items = {}
  transferForm.value.notes = opts?.keepStores ? transferForm.value.notes : ''
  availableItems.value = []
  if (!opts?.keepStores) sourceFolders.value = []
}

// Methods
const loadStores = async () => {
  try {
    await storesStore.fetchStores()
    stores.value = storesStore.stores
  } catch (error: any) {
    toast.error('Failed to load stores: ' + error.message)
  }
}

const onSourceStoreChange = async () => {
  transferForm.value.folderId = ''
  transferForm.value.items = {}
  availableItems.value = []
  sourceFolders.value = []

  if (
    transferForm.value.destinationStoreId &&
    transferForm.value.destinationStoreId === transferForm.value.sourceStoreId
  ) {
    transferForm.value.destinationStoreId = ''
    transferForm.value.destinationFolderId = ''
    destinationFolders.value = []
  }

  await loadSourceStoreInventory()
}

const onDestinationStoreChange = async () => {
  transferForm.value.destinationFolderId = ''
  destinationFolders.value = []
  await loadDestinationStoreFolders()
}

const onSourceFolderChange = async () => {
  transferForm.value.items = {}
  availableItems.value = []
  await loadFolderItems()
}

const loadSourceStoreInventory = async () => {
  if (!transferForm.value.sourceStoreId) {
    sourceFolders.value = []
    return
  }

  const storeId = transferForm.value.sourceStoreId
  try {
    // Branch-scoped load, never mutates the app's current store (same pattern as copy-from-branch)
    sourceFolders.value = await inventoryStore.fetchFolderTemplatesForStore(storeId)
  } catch (error: any) {
    sourceFolders.value = []
    toast.error('Failed to load categories: ' + error.message)
  }
}

const loadDestinationStoreFolders = async () => {
  if (!transferForm.value.destinationStoreId) {
    destinationFolders.value = []
    transferForm.value.destinationFolderId = ''
    return
  }

  const storeId = transferForm.value.destinationStoreId
  try {
    destinationFolders.value = await inventoryStore.fetchFolderTemplatesForStore(storeId)
  } catch (error: any) {
    toast.error('Failed to load destination categories: ' + error.message)
    destinationFolders.value = []
  }
}

const loadFolderItems = async () => {
  if (!transferForm.value.folderId || !transferForm.value.sourceStoreId) {
    availableItems.value = []
    return
  }

  isLoadingItems.value = true
  try {
    const folderItems = await inventoryStore.fetchItemsAllChunkedForStore(
      transferForm.value.sourceStoreId,
      transferForm.value.folderId,
      { force: true }
    )

    const folder = sourceFolders.value.find((f) => f.id === transferForm.value.folderId)
    const hasSerialNumbers = folder?.hasSerialNumbers || false
    availableItems.value = folderItems.filter((item) =>
      isItemAvailableForTransfer(item, hasSerialNumbers)
    )
  } catch (error: any) {
    availableItems.value = []
    toast.error('Failed to load items: ' + error.message)
  } finally {
    isLoadingItems.value = false
  }
}

const getAvailableQuantity = (item: any) => {
  // Get folder info from sourceFolders
  const folder = sourceFolders.value.find((f) => f.id === transferForm.value.folderId)
  const hasSerialNumbers = folder?.hasSerialNumbers || false

  if (hasSerialNumbers) {
    // For serial numbers, each unsold item counts as 1
    // Since we already filtered out sold items, each item in availableItems is available
    return 1
  }

  // For bulk items, use quantity field
  // Make sure we're not counting sold items
  const dateOut = item.dateOut
  if (dateOut && dateOut !== null && dateOut !== '') {
    return 0 // Item is sold
  }

  const loanId = item.sellerLoanOutId
  if (loanId != null && loanId !== undefined && String(loanId).trim() !== '') {
    return 0
  }

  return item.quantity || item.Quantity || 0
}

// Create a transfer request (pending approval). No stock is moved until transfer is completed.
const requestTransfer = async () => {
  if (!canTransfer.value) return

  isTransferring.value = true
  try {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    if (isDemoModeActive()) {
      const sourceFolder = sourceFolders.value.find((f) => f.id === transferForm.value.folderId)
      const transferredItems: any[] = []
      for (const [itemId, qty] of Object.entries(transferForm.value.items)) {
        const quantity = Number(qty)
        if (quantity <= 0) continue
        const item = availableItems.value.find((i) => i.id === itemId)
        transferredItems.push({
          itemId,
          quantity,
          itemName: item?.name || item?.itemName || 'Unnamed Item',
        })
      }
      const { addDemoTransferRequest } = await import('~/utils/demo-multi-store')
      await addDemoTransferRequest({
        sourceStoreId: transferForm.value.sourceStoreId,
        destinationStoreId: transferForm.value.destinationStoreId,
        folderId: transferForm.value.folderId,
        destinationFolderId: transferForm.value.destinationFolderId,
        items: transferredItems,
        itemsCount: transferredItems.length,
        hasSerialNumbers: sourceFolder?.hasSerialNumbers || false,
        notes: transferForm.value.notes || '',
      })
      toast.success(
        'Transfer requested. Approve it from Transfer History, then complete when stock arrives.'
      )
      resetTransferSelection()
      await loadTransferHistory()
      return
    }

    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid
    if (!userId) throw new Error('User not authenticated')
    if (userStore.userData?.role !== 'superAdmin')
      throw new Error('Only super admins can transfer items')

    const db = useFirestore().getFirestoreInstance()
    if (!db) throw new Error(CLOUD_UNAVAILABLE_MESSAGE)

    const sourceFolder = sourceFolders.value.find((f) => f.id === transferForm.value.folderId)
    const hasSerialNumbers = sourceFolder?.hasSerialNumbers || false

    const {
      getDoc,
      setDoc,
      serverTimestamp,
      collection,
      doc: createDoc,
    } = await import('firebase/firestore')
    const { getStoreDocument } = await import('~/composables/useFirestorePaths')
    const pathUserId = await resolveOwnerUserId()

    const sourceStoreRef = getStoreDocument(db, pathUserId, transferForm.value.sourceStoreId)
    const destStoreRef = getStoreDocument(db, pathUserId, transferForm.value.destinationStoreId)
    const [sourceStoreSnap, destStoreSnap] = await Promise.all([
      getDoc(sourceStoreRef),
      getDoc(destStoreRef),
    ])
    if (!sourceStoreSnap.exists() || !destStoreSnap.exists())
      throw new Error('One or both stores not found')
    const sourceStore = sourceStoreSnap.data()
    const destStore = destStoreSnap.data()
    if (
      (sourceStore.ownerId && sourceStore.ownerId !== pathUserId) ||
      (destStore.ownerId && destStore.ownerId !== pathUserId)
    )
      throw new Error('You do not have permission to transfer items between these stores')

    const transferredItems: any[] = []
    for (const [itemId, qty] of Object.entries(transferForm.value.items)) {
      const quantity = Number(qty)
      if (quantity <= 0) continue
      if (itemsLockedInOpenTransfers.value.has(itemId)) {
        throw new Error(
          'One or more selected items are already in an open transfer. Finish or cancel that transfer first.'
        )
      }
      const item = availableItems.value.find((i) => i.id === itemId)
      transferredItems.push({
        itemId,
        quantity,
        itemName: item?.name || item?.itemName || 'Unnamed Item',
        serialNumber: item?.serialNo || item?.serialNumber || null,
      })
    }
    if (transferredItems.length === 0) {
      toast.error('No items to transfer')
      return
    }

    const transfersRef = collection(db, 'users', pathUserId, 'storeTransfers')
    const transferRef = createDoc(transfersRef)
    await setDoc(transferRef, {
      sourceStoreId: transferForm.value.sourceStoreId,
      destinationStoreId: transferForm.value.destinationStoreId,
      folderId: transferForm.value.folderId,
      destinationFolderId: transferForm.value.destinationFolderId,
      items: transferredItems,
      itemsCount: transferredItems.length,
      hasSerialNumbers: hasSerialNumbers,
      notes: transferForm.value.notes || '',
      status: 'pending_approval',
      createdBy: userId,
      createdAt: serverTimestamp(),
    })

    toast.success(
      'Transfer requested. Approve it from Transfer History, then complete when stock arrives.'
    )
    resetTransferSelection()
    await loadTransferHistory()
  } catch (error: any) {
    toast.error(error.message || 'Failed to create transfer request')
  } finally {
    isTransferring.value = false
  }
}

// Execute the actual stock move (used when completing an in_transit transfer).
const executeTransfer = async (transfer: any) => {
  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) {
    const { executeDemoTransfer } = await import('~/utils/demo-multi-store')
    await executeDemoTransfer(transfer)
    toast.success(`Stock updated: transfer completed in demo.`)
    await loadTransferHistory()
    return
  }

  const authStore = useAuthStore()
  const userId = authStore.currentUser?.uid
  if (!userId) throw new Error('User not authenticated')

  const db = useFirestore().getFirestoreInstance()
  if (!db) throw new Error(CLOUD_UNAVAILABLE_MESSAGE)

  const { getDoc, setDoc, updateDoc, serverTimestamp, query, where, getDocs, doc } =
    await import('firebase/firestore')
  const { deleteDoc } = await import('firebase/firestore')
  const { getInventoryItemDocument, getInventoryItemsCollection } = await import(
    '~/composables/useFirestorePaths'
  )
  const pathUserId = await resolveOwnerUserId()

  const sourceStoreId = transfer.sourceStoreId
  const destinationStoreId = transfer.destinationStoreId
  const folderId = transfer.folderId
  const destinationFolderId = transfer.destinationFolderId
  const hasSerialNumbers = transfer.hasSerialNumbers || false
  const itemsToTransfer = (transfer.items || []).map((i: any) => ({
    itemId: i.itemId,
    quantity: i.quantity || 1,
  }))

  const transferredItems: any[] = []
  const errors: string[] = []

  try {
    for (const { itemId, quantity } of itemsToTransfer) {
      try {
        const sourceItemRef = getInventoryItemDocument(db, pathUserId, sourceStoreId, itemId)
        const sourceItemSnap = await getDoc(sourceItemRef)

        if (!sourceItemSnap.exists()) {
          errors.push(`Item ${itemId} not found`)
          continue
        }

        const sourceItem = sourceItemSnap.data()

        // Check if item is sold
        if (sourceItem.dateOut) {
          errors.push(`Item ${itemId} has already been sold`)
          continue
        }

        const rawLoanId = sourceItem.sellerLoanOutId
        if (rawLoanId !== undefined && rawLoanId !== null && String(rawLoanId).trim() !== '') {
          errors.push(`Item ${itemId} is on a stock loan; return or sell it before transferring`)
          continue
        }

        if (hasSerialNumbers) {
          // For serial numbers, transfer the item itself (move, not duplicate)
          if (quantity !== 1) {
            errors.push(`Serial number items can only be transferred one at a time`)
            continue
          }

          // Create new item in destination store
          // Use pathUserId to ensure Firestore rules allow access
          const destItemsRef = getInventoryItemsCollection(db, pathUserId, destinationStoreId)
          const newItemRef = doc(destItemsRef)
          const {
            createdBy: _createdBy,
            dateOut: _dateOut,
            id: _id,
            isTransferred: _isTransferred,
            transferredTo: _transferredTo,
            transferredFrom: _transferredFrom,
            transferredFromFolder: _transferredFromFolder,
            transferredAt: _transferredAt,
            ...itemDataWithoutSystemFields
          } = sourceItem
          const cleanedItemData = removeUndefined(itemDataWithoutSystemFields)
          const originalDateIn = sourceItem.dateIn || sourceItem.DateIn || null
          await setDoc(newItemRef, {
            ...cleanedItemData,
            id: newItemRef.id,
            folderId: destinationFolderId,
            storeId: destinationStoreId,
            dateIn: originalDateIn,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Provenance only, do NOT mark destination stock as isTransferred
            // (that flag previously blocked the item from ever transferring again)
            transferredFrom: sourceStoreId,
            transferredFromFolder: folderId,
            transferredAt: serverTimestamp(),
          })
          await deleteDoc(sourceItemRef)
          transferredItems.push({
            itemId,
            itemName: sourceItem.name || sourceItem.itemName || 'Unnamed Item',
            quantity: 1,
            serialNumber: sourceItem.serialNo || sourceItem.serialNumber || null,
          })
        } else {
          const availableQty = sourceItem.quantity || sourceItem.Quantity || 0
          if (availableQty < quantity) {
            errors.push(
              `Insufficient quantity for item ${itemId}. Available: ${availableQty}, Requested: ${quantity}`
            )
            continue
          }
          const newQty = availableQty - quantity
          if (newQty <= 0) {
            await deleteDoc(sourceItemRef)
          } else {
            await updateDoc(sourceItemRef, {
              quantity: newQty,
              Quantity: newQty,
              updatedAt: serverTimestamp(),
            })
          }
          const destItemsRef = getInventoryItemsCollection(db, pathUserId, destinationStoreId)
          const existingItemsQuery = query(
            destItemsRef,
            where('folderId', '==', destinationFolderId),
            where('name', '==', sourceItem.name || sourceItem.itemName || '')
          )
          const existingItemsSnap = await getDocs(existingItemsQuery)
          if (existingItemsSnap.empty) {
            const newItemRef = doc(destItemsRef)
            const {
              createdBy: _,
              isTransferred: _isTransferred,
              transferredTo: _transferredTo,
              ...itemDataWithoutCreatedBy
            } = sourceItem
            const cleanedItemData = removeUndefined(itemDataWithoutCreatedBy)
            const originalDateIn = sourceItem.dateIn || sourceItem.DateIn || null
            await setDoc(newItemRef, {
              ...cleanedItemData,
              id: newItemRef.id,
              folderId: destinationFolderId,
              storeId: destinationStoreId,
              dateIn: originalDateIn,
              quantity,
              Quantity: quantity,
              createdBy: userId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              transferredFrom: sourceStoreId,
              transferredFromFolder: folderId,
              transferredAt: serverTimestamp(),
            })
          } else {
            const existingItem = existingItemsSnap.docs[0]
            if (existingItem) {
              const existingQty = existingItem.data().quantity || existingItem.data().Quantity || 0
              const existingData = existingItem.data()
              const originalDateIn =
                existingData.dateIn ||
                existingData.DateIn ||
                sourceItem.dateIn ||
                sourceItem.DateIn ||
                null
              await updateDoc(existingItem.ref, {
                quantity: existingQty + quantity,
                Quantity: existingQty + quantity,
                dateIn: originalDateIn,
                transferredAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              })
            }
          }
          transferredItems.push({
            itemId,
            itemName: sourceItem.name || sourceItem.itemName || 'Unnamed Item',
            quantity,
          })
        }
      } catch (error: any) {
        errors.push(`Error transferring item ${itemId}: ${error.message}`)
      }
    }

    const transferRef = doc(db, 'users', pathUserId, 'storeTransfers', transfer.id)
    await updateDoc(transferRef, {
      status: errors.length > 0 ? 'partial' : 'completed',
      completedAt: serverTimestamp(),
      completedBy: userId,
      items: transferredItems.length ? transferredItems : transfer.items,
      itemsCount: transferredItems.length || (transfer.items || []).length,
    })

    invalidateFolderItemCaches(folderId)
    invalidateFolderItemCaches(destinationFolderId)

    if (errors.length > 0) {
      toast.warning(
        `Transfer completed with ${errors.length} errors. ${transferredItems.length} items moved.`
      )
    } else {
      toast.success(
        `Stock updated: ${transferredItems.length} items moved to ${getStoreName(
          destinationStoreId
        )}.`
      )
    }
    await loadTransferHistory()
  } catch (err: any) {
    toast.error(err?.message || 'Failed to complete transfer')
    throw err
  }
}

const approveTransfer = async (transfer: any) => {
  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) {
    const { updateDemoTransferStatus } = await import('~/utils/demo-multi-store')
    await updateDemoTransferStatus(transfer.id, 'in_transit')
    toast.success('Transfer approved. Stock is in transit.')
    await loadTransferHistory()
    return
  }

  const authStore = useAuthStore()
  const userId = authStore.currentUser?.uid
  if (!userId) return
  const db = useFirestore().getFirestoreInstance()
  if (!db) return
  const { updateDoc, serverTimestamp, doc } = await import('firebase/firestore')
  const pathUserId = await resolveOwnerUserId()
  const transferRef = doc(db, 'users', pathUserId, 'storeTransfers', transfer.id)
  await updateDoc(transferRef, {
    status: 'in_transit',
    approvedAt: serverTimestamp(),
    approvedBy: userId,
  })
  toast.success('Transfer approved. Stock is in transit.')
  await loadTransferHistory()
}

const cancelTransfer = async (transfer: any) => {
  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) {
    const { updateDemoTransferStatus } = await import('~/utils/demo-multi-store')
    await updateDemoTransferStatus(transfer.id, 'cancelled')
    toast.success('Transfer cancelled.')
    await loadTransferHistory()
    return
  }

  const authStore = useAuthStore()
  const userId = authStore.currentUser?.uid
  if (!userId) return
  const db = useFirestore().getFirestoreInstance()
  if (!db) return
  const { updateDoc, doc } = await import('firebase/firestore')
  const pathUserId = await resolveOwnerUserId()
  const transferRef = doc(db, 'users', pathUserId, 'storeTransfers', transfer.id)
  await updateDoc(transferRef, { status: 'cancelled' })
  toast.success('Transfer cancelled.')
  await loadTransferHistory()
}

const openTrackingModal = (t: any) => {
  selectedTransferForTracking.value = t
  trackingForm.value = { carrier: t.carrier || '', trackingNumber: t.trackingNumber || '' }
  showTrackingModal.value = true
}

const saveTracking = async () => {
  const t = selectedTransferForTracking.value
  if (!t) return

  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) {
    const { updateDemoTransferStatus } = await import('~/utils/demo-multi-store')
    await updateDemoTransferStatus(t.id, t.status, {
      carrier: trackingForm.value.carrier || undefined,
      trackingNumber: trackingForm.value.trackingNumber || undefined,
    })
    showTrackingModal.value = false
    selectedTransferForTracking.value = null
    trackingForm.value = { carrier: '', trackingNumber: '' }
    toast.success('Tracking info saved.')
    await loadTransferHistory()
    return
  }

  const authStore = useAuthStore()
  const userId = authStore.currentUser?.uid
  if (!userId) return
  const db = useFirestore().getFirestoreInstance()
  if (!db) return
  const { updateDoc, doc } = await import('firebase/firestore')
  const pathUserId = await resolveOwnerUserId()
  const transferRef = doc(db, 'users', pathUserId, 'storeTransfers', t.id)
  await updateDoc(transferRef, {
    carrier: trackingForm.value.carrier || null,
    trackingNumber: trackingForm.value.trackingNumber || null,
  })
  showTrackingModal.value = false
  selectedTransferForTracking.value = null
  trackingForm.value = { carrier: '', trackingNumber: '' }
  toast.success('Tracking info saved.')
  await loadTransferHistory()
}

const completeTransfer = async (transfer: any) => {
  isTransferring.value = true
  try {
    await executeTransfer(transfer)
  } catch (e) {
    // error already toasts in executeTransfer
  } finally {
    isTransferring.value = false
  }
}

const loadTransferHistory = async () => {
  isLoadingHistory.value = true
  try {
    await fetchTransferHistory()
  } finally {
    isLoadingHistory.value = false
  }
}

const fetchTransferHistory = async () => {
  try {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    if (isDemoModeActive()) {
      const { getDemoTransfers } = await import('~/utils/demo-multi-store')
      transferHistory.value = getDemoTransfers()
      return
    }

    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid

    if (!userId) {
      // console.log('[TransferHistory] No user ID')
      return
    }

    // Wait for user data to be loaded if not already
    if (!userStore.userData) {
      await userStore.fetchUserData(userId)
    }

    // Verify user is super admin
    if (userStore.userData?.role !== 'superAdmin') {
      // console.log('[TransferHistory] User is not super admin, role:', userStore.userData?.role)
      return
    }

    // Get Firestore instance
    const db = useFirestore().getFirestoreInstance()
    if (!db) {
      console.error('[TransferHistory] Firestore not initialized')
      return
    }

    // Import Firebase functions
    const {
      collection,
      query,
      orderBy,
      getDocs,
      getDoc,
      where: firestoreWhere,
    } = await import('firebase/firestore')
    const pathUserId = await resolveOwnerUserId()

    // console.log('[TransferHistory] Loading transfer history for userId:', pathUserId, 'auth.uid:', authStore.currentUser?.uid)

    // Fetch transfer history from Firestore
    // The path must match: users/{userId}/storeTransfers where userId == request.auth.uid
    const transfersRef = collection(db, 'users', pathUserId, 'storeTransfers')

    try {
      // Try with orderBy first, if it fails due to missing index, try without
      let transfersQuery
      try {
        transfersQuery = query(transfersRef, orderBy('createdAt', 'desc'))
      } catch (queryError: any) {
        // If orderBy fails, try without it (might be missing index)
        console.warn('[TransferHistory] orderBy failed, trying without:', queryError.message)
        transfersQuery = query(transfersRef)
      }

      const transfersSnap = await getDocs(transfersQuery)

      // console.log('[TransferHistory] Successfully loaded', transfersSnap.docs.length, 'transfers')

      // Sort manually if orderBy didn't work
      const transfers = transfersSnap.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
        }
      })

      // Sort by createdAt descending if available
      const sortedTransfers: any[] = transfers.sort((a: any, b: any) => {
        const aDate = a.createdAt?.toDate
          ? a.createdAt.toDate()
          : a.createdAt
          ? new Date(a.createdAt)
          : new Date(0)
        const bDate = b.createdAt?.toDate
          ? b.createdAt.toDate()
          : b.createdAt
          ? new Date(b.createdAt)
          : new Date(0)
        return bDate.getTime() - aDate.getTime()
      })

      // Fetch item details for transfers that don't have item names stored (backward compatibility)
      const { getInventoryItemDocument, getInventoryItemsCollection } = await import(
        '~/composables/useFirestorePaths'
      )

      for (const transfer of sortedTransfers) {
        if (transfer.items && Array.isArray(transfer.items)) {
          for (const item of transfer.items as any[]) {
            // If item already has itemName, use it (for new transfers)
            if (
              item.itemName &&
              item.itemName !== 'Item' &&
              item.itemName !== 'Item (deleted or moved)'
            ) {
              continue
            }

            // Try to fetch item name if not stored
            if (
              !item.itemName ||
              item.itemName === 'Item' ||
              item.itemName === 'Item (deleted or moved)'
            ) {
              try {
                const sourceStoreId = (transfer as any).sourceStoreId
                const destinationStoreId = (transfer as any).destinationStoreId
                const destinationFolderId = (transfer as any).destinationFolderId

                // First, try to find in destination store (where item was moved to)
                // Search for items that were transferred from the source store
                if (destinationStoreId && destinationFolderId) {
                  try {
                    const destItemsRef = getInventoryItemsCollection(
                      db,
                      pathUserId,
                      destinationStoreId
                    )
                    const transferredItemsQuery = query(
                      destItemsRef,
                      firestoreWhere('folderId', '==', destinationFolderId),
                      firestoreWhere('transferredFrom', '==', sourceStoreId),
                      firestoreWhere('isTransferred', '==', true)
                    )
                    const transferredItemsSnap = await getDocs(transferredItemsQuery)

                    if (!transferredItemsSnap.empty) {
                      // Find the item that matches the original itemId or was transferred around the same time
                      const transferredItems = transferredItemsSnap.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                      })) as any[]

                      // Try to match by original itemId if stored, or just use the first one if only one item
                      let matchedItem: any = null
                      if (transferredItems.length === 1) {
                        matchedItem = transferredItems[0]
                      } else {
                        // Try to find by matching transferredFromFolder and itemId
                        matchedItem = transferredItems.find((ti: any) => {
                          const transferredFromFolder = ti.transferredFromFolder || ti.folderId
                          return transferredFromFolder === (transfer as any).folderId
                        })
                        if (!matchedItem && transferredItems.length > 0) {
                          matchedItem = transferredItems[0] // Fallback to first item
                        }
                      }

                      if (matchedItem) {
                        item.itemName = matchedItem.name || matchedItem.itemName || 'Unnamed Item'
                        if (matchedItem.serialNo || matchedItem.serialNumber) {
                          item.serialNumber = matchedItem.serialNo || matchedItem.serialNumber
                        }
                        continue // Successfully found, skip other attempts
                      }
                    }
                  } catch (queryError) {
                    console.warn('[TransferHistory] Error querying transferred items:', queryError)
                  }
                }

                // Fallback: Try source store (item might still be there if transfer failed or was partial)
                if (sourceStoreId && item.itemId) {
                  try {
                    const itemRef = getInventoryItemDocument(
                      db,
                      pathUserId,
                      sourceStoreId,
                      item.itemId
                    )
                    const itemSnap = await getDoc(itemRef)
                    if (itemSnap.exists()) {
                      const itemData = itemSnap.data() as any
                      item.itemName = itemData.name || itemData.itemName || 'Unnamed Item'
                      if (itemData.serialNo || itemData.serialNumber) {
                        item.serialNumber = itemData.serialNo || itemData.serialNumber
                      }
                      continue // Successfully found
                    }
                  } catch (sourceError) {
                    console.warn('[TransferHistory] Error fetching from source store:', sourceError)
                  }
                }

                // If still no name found, use itemId as fallback
                if (
                  !item.itemName ||
                  item.itemName === 'Item' ||
                  item.itemName === 'Item (deleted or moved)'
                ) {
                  item.itemName = `Item ${item.itemId?.substring(0, 8) || 'Unknown'}`
                }
              } catch (fetchError) {
                console.warn('[TransferHistory] Error fetching item details:', fetchError)
                // Final fallback
                if (
                  !item.itemName ||
                  item.itemName === 'Item' ||
                  item.itemName === 'Item (deleted or moved)'
                ) {
                  item.itemName = `Item ${item.itemId?.substring(0, 8) || 'Unknown'}`
                }
              }
            }
          }
        }
      }

      transferHistory.value = sortedTransfers
    } catch (queryError: any) {
      console.error('[TransferHistory] Query error:', queryError)
      // If it's a permission error, provide more helpful message
      if (queryError.code === 'permission-denied' || queryError.message?.includes('permission')) {
        console.error('[TransferHistory] Permission denied. Check:')
        console.error(' 1. User is logged in as super admin:', userStore.userData?.role)
        console.error(
          ' 2. pathUserId matches auth.uid:',
          pathUserId,
          '===',
          authStore.currentUser?.uid
        )
        console.error(' 3. Firestore rules allow read access to users/{userId}/storeTransfers')
        // Don't show error toast if it's just that there are no transfers yet
        if (queryError.message?.includes('index')) {
          throw new Error(
            'A database index is required for transfer history. Please contact Storvv support if this persists.'
          )
        }
        throw new Error(
          'Permission denied. Please ensure you are logged in as a super admin.'
        )
      }
      // If it's an index error, try without orderBy
      if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
        // console.log('[TransferHistory] Index error, trying without orderBy')
        const transfersQuery = query(transfersRef)
        const transfersSnap = await getDocs(transfersQuery)
        transferHistory.value = transfersSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as object),
        }))
        return
      }
      throw queryError
    }
  } catch (error: any) {
    console.error('[TransferHistory] Failed to load transfer history:', error)
    // Only show toast if it's not a silent return
    if (
      error.message &&
      !error.message.includes('No user ID') &&
      !error.message.includes('not super admin')
    ) {
      toast.error('Failed to load transfer history: ' + error.message)
    }
  }
}

const loadConsolidatedReports = async () => {
  isLoadingReports.value = true
  try {
    await fetchConsolidatedReports()
  } finally {
    isLoadingReports.value = false
  }
}

const fetchConsolidatedReports = async () => {
  try {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    if (isDemoModeActive()) {
      const { getDemoConsolidatedReport } = await import('~/utils/demo-multi-store')
      consolidatedReport.value = getDemoConsolidatedReport(
        reportFilters.value.dateRange,
        reportFilters.value.storeIds
      )
      return
    }

    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid

    if (!userId) return

    // Verify user is super admin
    if (userStore.userData?.role !== 'superAdmin') {
      return
    }

    // Get Firestore instance
    const db = useFirestore().getFirestoreInstance()
    if (!db) {
      console.error(CLOUD_UNAVAILABLE_MESSAGE)
      return
    }

    // Import Firebase functions
    const { collection, query, where, getDocs, Timestamp } = await import('firebase/firestore')
    const { getReceiptsCollection } = await import('~/composables/useFirestorePaths')
    const pathUserId = await resolveOwnerUserId()

    // Calculate date range
    const days =
      reportFilters.value.dateRange === 'all' ? null : parseInt(reportFilters.value.dateRange)
    const startDate = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null

    // Get stores to include
    const storesToInclude =
      reportFilters.value.storeIds === 'all'
        ? stores.value
        : stores.value.filter((s) => s.id === reportFilters.value.storeIds)

    let totalRevenue = 0
    let totalSales = 0
    let totalItems = 0
    const storeBreakdown: any[] = []

    // Aggregate data from each store
    for (const store of storesToInclude) {
      const receiptsRef = getReceiptsCollection(db, pathUserId, store.id)
      let receiptsQuery: any = query(receiptsRef)

      if (startDate) {
        receiptsQuery = query(receiptsRef, where('date', '>=', Timestamp.fromDate(startDate)))
      }

      const receiptsSnap = await getDocs(receiptsQuery)
      const receipts = receiptsSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as object),
      }))

      const storeRevenue = receipts.reduce((sum, r: any) => sum + (r.total || 0), 0)
      const storeSales = receipts.length
      const storeItems = receipts.reduce((sum, r: any) => sum + (r.itemsCount || 0), 0)

      totalRevenue += storeRevenue
      totalSales += storeSales
      totalItems += storeItems

      storeBreakdown.push({
        id: store.id,
        name: store.name || store.branchName || store.id,
        revenue: storeRevenue,
        sales: storeSales,
        items: storeItems,
      })
    }

    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

    consolidatedReport.value = {
      totalRevenue,
      totalSales,
      totalItems,
      avgOrderValue,
      storeBreakdown,
    }
  } catch (error: any) {
    console.error('Failed to load consolidated report:', error)
    toast.error('Failed to load consolidated report: ' + error.message)
  }
}

const exportConsolidatedReport = async () => {
  try {
    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid

    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    // Load report data first if not already loaded
    if (
      consolidatedReport.value.totalSales === 0 &&
      consolidatedReport.value.storeBreakdown.length === 0
    ) {
      await loadConsolidatedReports()
    }

    // Generate PDF using jsPDF
    const { default: jsPDF } = await import('jspdf')

    const doc = new jsPDF()

    // Add title
    doc.setFontSize(18)
    doc.text('Consolidated Report', 14, 20)

    // Add date range
    doc.setFontSize(10)
    const dateRangeText =
      reportFilters.value.dateRange === 'all'
        ? 'All Time'
        : `Last ${reportFilters.value.dateRange} days`
    doc.text(`Date Range: ${dateRangeText}`, 14, 30)

    // Add summary
    doc.setFontSize(12)
    doc.text('Summary', 14, 40)
    doc.setFontSize(10)
    doc.text(`Total Revenue: ${formatCurrency(consolidatedReport.value.totalRevenue)}`, 14, 48)
    doc.text(`Total Sales: ${consolidatedReport.value.totalSales}`, 14, 54)
    doc.text(`Total Items: ${consolidatedReport.value.totalItems}`, 14, 60)
    doc.text(
      `Average Order Value: ${formatCurrency(consolidatedReport.value.avgOrderValue)}`,
      14,
      66
    )

    // Add store breakdown table (simple table without autoTable)
    if (consolidatedReport.value.storeBreakdown.length > 0) {
      let yPos = 80
      doc.setFontSize(12)
      doc.text('Store Breakdown', 14, yPos)
      yPos += 8

      // Table header
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Store', 14, yPos)
      doc.text('Revenue', 70, yPos)
      doc.text('Sales', 120, yPos)
      doc.text('Items', 150, yPos)
      yPos += 6

      // Table rows
      doc.setFont('helvetica', 'normal')
      for (const store of consolidatedReport.value.storeBreakdown) {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        doc.text(store.name || '', 14, yPos)
        doc.text(formatCurrency(store.revenue || 0), 70, yPos)
        doc.text((store.sales || 0).toString(), 120, yPos)
        doc.text((store.items || 0).toString(), 150, yPos)
        yPos += 6
      }
    }

    // Save PDF
    const fileName = `consolidated-report-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)

    toast.success('Report exported successfully!')
  } catch (error: any) {
    console.error('Export error:', error)
    toast.error('Export failed: ' + error.message)
  }
}

const getStoreName = (storeId: string) => {
  const store = stores.value.find((s) => s.id === storeId)
  return store?.name || store?.branchName || storeId
}

const formatTransferProductSummary = (transfer: any) => {
  const items = transfer.items || []
  const totalUnits = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0)
  if (items.length === 0) return `${transfer.itemsCount ?? 0} items`
  if (items.length === 1 && totalUnits === 1) return '1 item'
  return `${totalUnits} units · ${items.length} product${items.length === 1 ? '' : 's'}`
}

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pending approval',
  in_transit: 'In transit',
  completed: 'Completed',
  completed_partial: 'Completed (partial)',
  partial: 'Completed (partial)',
  cancelled: 'Cancelled',
}

const getTransferStatusLabel = (status: string) => {
  return TRANSFER_STATUS_LABELS[status] || status || 'Pending'
}

const isTransferActionable = (transfer: any) => {
  const s = (transfer.status || '').toLowerCase()
  return s === 'pending_approval' || s === 'in_transit'
}

const {
  openMenuId: openTransferMenuId,
  menuFixedStyle: transferMenuFixedStyle,
  toggleMenu: toggleTransferMenu,
  closeMenu: closeTransferMenu,
} = useAnchoredRowMenu({
  anchorAttr: 'data-transfer-actions-anchor',
  estimatedMenuHeight: 132,
})

const transferForOpenMenu = computed(() => {
  const id = openTransferMenuId.value
  if (!id) return null
  return transferHistory.value.find((transfer) => transfer.id === id) ?? null
})

const webTabs = computed(() => [
  { value: 'transfer', label: 'New transfer' },
  { value: 'history', label: 'History', count: transferHistory.value.length },
  { value: 'reports', label: 'Branch reports' },
])

const storeLabel = (store: any) => store.name || store.branchName || store.id

const storeOptions = computed(() =>
  stores.value.map((store) => ({ label: storeLabel(store), value: store.id }))
)

const destinationStoreOptions = computed(() =>
  storeOptions.value.filter((option) => option.value !== transferForm.value.sourceStoreId)
)

const reportRangeOptions = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'Last year', value: '365' },
  { label: 'All time', value: 'all' },
]

const reportStoreOptions = computed(() => [
  { label: 'All branches', value: 'all' },
  ...storeOptions.value,
])

async function onWebSourceStoreChange(value: string | number | null | undefined) {
  transferForm.value.sourceStoreId = String(value ?? '')
  await onSourceStoreChange()
}

async function onWebDestinationStoreChange(value: string | number | null | undefined) {
  transferForm.value.destinationStoreId = String(value ?? '')
  await onDestinationStoreChange()
}

function setTransferQuantity(itemId: string, value: string | number | null | undefined) {
  const qty = Number(value)
  transferForm.value.items[itemId] = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0
}

function transferItemName(item: any): string {
  return item.name || item.itemName || 'Unnamed item'
}

function transferItemMeta(item: any): string {
  const serial = item.serialNo || item.serialNumber
  return [item.brand && item.model ? `${item.brand} ${item.model}` : '', serial ? `Serial ${serial}` : '']
    .filter(Boolean)
    .join(' · ')
}

function transferRoute(transfer: any): string {
  return `${getStoreName(transfer.sourceStoreId)} → ${getStoreName(transfer.destinationStoreId)}`
}

function transferItemsPreview(transfer: any): string {
  const items: any[] = transfer.items || []
  if (!items.length) return ''
  const names = items.slice(0, 2).map((item) => item.itemName || 'Item')
  return items.length > 2 ? `${names.join(', ')} +${items.length - 2} more` : names.join(', ')
}

function transferStatusTone(status: string): 'warning' | 'info' | 'success' | 'neutral' {
  const s = (status || '').toLowerCase()
  if (s === 'pending_approval') return 'warning'
  if (s === 'in_transit') return 'info'
  if (s === 'completed' || s === 'completed_partial' || s === 'partial') return 'success'
  return 'neutral'
}

function closeWebTransferMenu() {
  const id = openTransferMenuId.value
  closeTransferMenu()
  if (id) nextTick(() => getVisibleMenuAnchorElement('data-transfer-actions-anchor', id)?.focus())
}

function runTransferMenuAction(action: (transfer: any) => unknown) {
  const transfer = transferForOpenMenu.value
  closeTransferMenu()
  if (transfer) void action(transfer)
}

const transferToCancel = ref<any>(null)
const isCancellingTransfer = ref(false)

function askCancelTransfer() {
  transferToCancel.value = transferForOpenMenu.value
  closeTransferMenu()
}

async function confirmCancelTransfer() {
  if (!transferToCancel.value || isCancellingTransfer.value) return
  isCancellingTransfer.value = true
  try {
    await cancelTransfer(transferToCancel.value)
    transferToCancel.value = null
  } finally {
    isCancellingTransfer.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (!canAccess.value) return
  if (!userStore.userData) {
    const authStore = useAuthStore()
    if (authStore.currentUser?.uid) {
      await userStore.fetchUserData(authStore.currentUser.uid)
    }
  }
  if (!canAccess.value) return
  await loadStores()
  await Promise.all([loadTransferHistory(), loadConsolidatedReports()])
})

async function reloadMultiStorePage() {
  if (!canAccess.value) return
  await loadStores()
  await Promise.all([loadTransferHistory(), loadConsolidatedReports()])
}

watch(canAccess, (ok, wasOk) => {
  if (ok && !wasOk && stores.value.length === 0) void reloadMultiStorePage()
})

useDashboardPageRefreshRegister(reloadMultiStorePage)
</script>
