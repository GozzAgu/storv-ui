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
      <section class="s-tab-panel">
        <div class="s-tab-panel__head">
          <STabs v-model="activeTab" :tabs="webTabs" label="Transfer views" />
        </div>
        <div class="s-tab-panel__body">
          <!-- New transfer -->
          <SCard
            v-if="activeTab === 'transfer' && canRequestTransfers"
            title="New transfer"
            class="s-transfer"
          >
            <form class="s-form" @submit.prevent="requestTransfer">
              <p class="s-transfer__intro">
                You request a transfer, the sending branch dispatches it, and an admin at the
                receiving branch approves it on arrival. Stock only enters their inventory once they
                approve.
              </p>

              <div class="s-transfer__grid">
                <SSelect
                  :model-value="transferForm.sourceStoreId"
                  label="From branch"
                  placeholder="Choose a branch"
                  :options="sourceStoreOptions"
                  :disabled="sourceStoreLocked"
                  required
                  @update:model-value="onWebSourceStoreChange"
                />
                <SSelect
                  :model-value="transferForm.destinationStoreId"
                  label="To branch"
                  :placeholder="
                    destinationStoreOptions.length ? 'Choose a branch' : 'No other branch available'
                  "
                  :options="destinationStoreOptions"
                  :disabled="!transferForm.sourceStoreId || destinationStoreOptions.length === 0"
                  required
                  @update:model-value="onWebDestinationStoreChange"
                />
              </div>
              <p
                v-if="transferForm.sourceStoreId && destinationStoreOptions.length === 0"
                class="s-notice"
              >
                No other active branch is available to send stock to. Add another branch, or ask the
                account owner to turn on Transfer stock to other branches for your admin login.
              </p>

              <div
                v-if="transferForm.sourceStoreId || transferForm.destinationStoreId"
                class="s-transfer__grid"
              >
                <SField
                  v-if="transferForm.sourceStoreId"
                  v-slot="{ labelId }"
                  label="Take items from category"
                >
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
                <ul
                  v-if="isLoadingItems && availableItems.length === 0"
                  class="s-list"
                  aria-label="Loading items"
                >
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
                    <caption class="ds-sr-only">
                      Items to transfer
                    </caption>
                    <thead>
                      <tr>
                        <th v-if="currentFolderHasSerialNumbers" scope="col" class="s-table__check">
                          <span class="ds-sr-only">Select</span>
                        </th>
                        <th scope="col">Item</th>
                        <th v-if="!currentFolderHasSerialNumbers" scope="col" class="s-table__num">
                          In stock
                        </th>
                        <th v-if="!currentFolderHasSerialNumbers" scope="col" class="s-table__num">
                          Move
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="item in availableItems"
                        :key="item.id"
                        :class="{
                          's-table__row--selected': (transferForm.items[item.id] ?? 0) > 0,
                        }"
                      >
                        <td v-if="currentFolderHasSerialNumbers" class="s-table__check">
                          <SCheckbox
                            :model-value="transferForm.items[item.id] === 1"
                            :aria-label="`Move ${transferItemName(item)}`"
                            @update:model-value="
                              (checked) => (transferForm.items[item.id] = checked ? 1 : 0)
                            "
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
                <SButton
                  variant="primary"
                  type="submit"
                  :disabled="!canTransfer"
                  :loading="isTransferring"
                >
                  <template #leading
                    ><ArrowLeftRight :size="16" :stroke-width="2" aria-hidden="true"
                  /></template>
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
                <template #icon
                  ><ArrowLeftRight :size="24" :stroke-width="1.75" aria-hidden="true"
                /></template>
                <template #actions>
                  <SButton v-if="canRequestTransfers" @click="activeTab = 'transfer'"
                    >New transfer</SButton
                  >
                </template>
              </SEmptyState>
            </SCard>

            <p v-if="transfersAwaitingMe.length" class="s-notice" role="status">
              {{
                transfersAwaitingMe.length === 1
                  ? '1 transfer is waiting for you to check it in.'
                  : `${transfersAwaitingMe.length} transfers are waiting for you to check them in.`
              }}
              Open its actions to approve it into your inventory or reject it.
            </p>

            <section
              v-if="transferHistory.length"
              class="s-table-card"
              aria-label="Transfer history"
            >
              <!-- Phone -->
              <SCard flush class="s-only-sm">
                <ul class="s-list">
                  <li v-for="transfer in transferHistory" :key="transfer.id">
                    <div class="s-list__item s-transfer-row">
                      <button
                        type="button"
                        class="s-list__main s-list__hit"
                        :aria-expanded="expandedTransferIds.has(transfer.id)"
                        @click="toggleTransferItems(transfer.id)"
                      >
                        <span class="s-list__secondary">
                          <span class="s-transfer-ref">{{ transferRef(transfer) }}</span> ·
                          {{ formatTransferDate(transfer.createdAt) }}
                        </span>
                        <span class="s-transfer-route">
                          <span class="s-transfer-route__store">{{
                            transferSourceName(transfer)
                          }}</span>
                          <ArrowRight
                            :size="12"
                            :stroke-width="2"
                            class="s-transfer-route__arrow"
                            aria-label="to"
                          />
                          <span class="s-transfer-route__store">{{
                            transferDestinationName(transfer)
                          }}</span>
                        </span>
                        <span class="s-list__secondary s-loan__items">
                          {{
                            transferItemNames(transfer) || formatTransferProductSummary(transfer)
                          }}
                        </span>
                        <span v-if="transferDecision(transfer)" class="s-list__secondary">
                          {{ transferDecision(transfer) }}
                        </span>
                      </button>
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
                    </div>
                    <div v-if="expandedTransferIds.has(transfer.id)" class="s-transfer-expand">
                      <TransferDetailsPanel
                        :rows="transferItemRows(transfer)"
                        :facts="transferFacts(transfer)"
                        :label="`Items in transfer ${transferRef(transfer)}`"
                      />
                    </div>
                  </li>
                </ul>
              </SCard>

              <!-- Tablet and desktop -->
              <div class="s-table-wrap s-hide-sm">
                <table class="s-table s-transfer-table">
                  <thead>
                    <tr>
                      <th scope="col" class="s-transfer-table__toggle">
                        <span class="ds-sr-only">Details</span>
                      </th>
                      <th scope="col">Transfer</th>
                      <th scope="col">Route</th>
                      <th scope="col">Items</th>
                      <th scope="col">Status</th>
                      <th scope="col" class="s-table__actions">
                        <span class="ds-sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="transfer in transferHistory" :key="transfer.id">
                      <tr
                        class="s-transfer-table__row"
                        :class="{ 's-table__row--expanded': expandedTransferIds.has(transfer.id) }"
                        @click="onTransferRowClick($event, transfer.id)"
                      >
                        <td class="s-transfer-table__toggle">
                          <SIconButton
                            :label="`${
                              expandedTransferIds.has(transfer.id) ? 'Hide' : 'Show'
                            } details for transfer ${transferRef(transfer)}`"
                            size="sm"
                            :aria-expanded="expandedTransferIds.has(transfer.id)"
                            @click="toggleTransferItems(transfer.id)"
                          >
                            <ChevronRight
                              :size="16"
                              :stroke-width="2"
                              class="s-transfer-table__chevron"
                              :class="{
                                's-transfer-table__chevron--open': expandedTransferIds.has(
                                  transfer.id
                                ),
                              }"
                            />
                          </SIconButton>
                        </td>
                        <td class="s-table__nowrap">
                          <span class="s-table__primary s-transfer-ref">{{
                            transferRef(transfer)
                          }}</span>
                          <span class="s-table__secondary">{{
                            formatTransferDate(transfer.createdAt)
                          }}</span>
                        </td>
                        <td>
                          <span class="s-transfer-route">
                            <span class="s-transfer-route__store">{{
                              transferSourceName(transfer)
                            }}</span>
                            <ArrowRight
                              :size="14"
                              :stroke-width="2"
                              class="s-transfer-route__arrow"
                              aria-label="to"
                            />
                            <span class="s-transfer-route__store">{{
                              transferDestinationName(transfer)
                            }}</span>
                          </span>
                          <span v-if="transfer.notes" class="s-table__secondary">{{
                            transfer.notes
                          }}</span>
                        </td>
                        <td>
                          <span class="s-transfer-table__items">{{
                            transferItemNames(transfer) || '—'
                          }}</span>
                          <span class="s-table__secondary">{{ transferUnitLabel(transfer) }}</span>
                        </td>
                        <td>
                          <SBadge :tone="transferStatusTone(transfer.status)" size="sm">
                            {{ getTransferStatusLabel(transfer.status) }}
                          </SBadge>
                          <span v-if="transferDecision(transfer)" class="s-table__secondary">
                            {{ transferDecision(transfer) }}
                          </span>
                          <span
                            v-if="transfer.carrier || transfer.trackingNumber"
                            class="s-table__secondary s-transfer__tracking"
                          >
                            <Truck :size="14" :stroke-width="2" aria-hidden="true" />
                            {{
                              [transfer.carrier, transfer.trackingNumber]
                                .filter(Boolean)
                                .join(' · ')
                            }}
                          </span>
                        </td>
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
                      <tr v-if="expandedTransferIds.has(transfer.id)">
                        <td colspan="6" class="s-table__nested s-transfer-table__nested">
                          <TransferDetailsPanel
                            :rows="transferItemRows(transfer)"
                            :facts="transferFacts(transfer)"
                            :label="`Items in transfer ${transferRef(transfer)}`"
                          />
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </section>
          </template>

          <!-- Branch reports -->
          <template v-else-if="activeTab === 'reports' && canViewFinancials">
            <dl class="s-metrics">
              <div class="s-metrics__item">
                <dt class="s-metrics__label">Revenue</dt>
                <dd class="s-metrics__value">
                  {{ formatCurrency(consolidatedReport.totalRevenue) }}
                </dd>
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
                <dd class="s-metrics__value">
                  {{ formatCurrency(consolidatedReport.avgOrderValue) }}
                </dd>
              </div>
            </dl>

            <section class="s-table-card" aria-label="Sales by branch">
              <div class="s-table-card__head">
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
                      <template #leading
                        ><Download :size="16" :stroke-width="2" aria-hidden="true"
                      /></template>
                      Export
                    </SButton>
                  </div>
                </div>
              </div>

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
                  <template #icon
                    ><BarChart3 :size="24" :stroke-width="1.75" aria-hidden="true"
                  /></template>
                </SEmptyState>
              </SCard>
              <div v-else class="s-table-wrap">
                <table class="s-table">
                  <caption class="ds-sr-only">
                    Sales by branch
                  </caption>
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
                      <td>
                        <span class="s-table__primary">{{ store.name }}</span>
                      </td>
                      <td class="s-table__num">{{ formatCurrency(store.revenue) }}</td>
                      <td class="s-table__num">{{ store.sales }}</td>
                      <td class="s-table__num">{{ store.items }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </template>
        </div>
      </section>

      <SMenu
        :open="Boolean(openTransferMenuId && transferForOpenMenu && transferMenuFixedStyle)"
        :style="transferMenuFixedStyle"
        menu-id="transfer"
        label="Transfer actions"
        @close="closeWebTransferMenu"
      >
        <SMenuItem
          v-if="openMenuActions.includes('receive')"
          label="Approve into inventory"
          :icon="PackageCheck"
          @select="runTransferMenuAction(receiveTransfer)"
        />
        <SMenuItem
          v-if="openMenuActions.includes('dispatch')"
          label="Dispatch"
          :icon="Send"
          @select="runTransferMenuAction(dispatchTransfer)"
        />
        <SMenuItem
          v-if="openMenuActions.includes('track')"
          label="Add tracking"
          :icon="Truck"
          @select="runTransferMenuAction(openTrackingModal)"
        />
        <SMenuItem
          v-if="openMenuActions.includes('reject')"
          label="Reject"
          :icon="CircleX"
          danger
          @select="askRejectTransfer"
        />
        <SMenuItem
          v-if="openMenuActions.includes('cancel')"
          label="Cancel transfer"
          :icon="CircleX"
          danger
          @select="askCancelTransfer"
        />
      </SMenu>

      <SDialog
        v-model:open="showTrackingModal"
        title="Shipment tracking"
        description="Add the carrier and tracking number so the other branch can follow the delivery."
      >
        <form id="transfer-tracking-form" class="s-form" @submit.prevent="saveTracking">
          <SInput
            v-model="trackingForm.carrier"
            label="Carrier"
            placeholder="For example, DHL or GIG"
          />
          <SInput
            v-model="trackingForm.trackingNumber"
            label="Tracking number"
            placeholder="For example, 1234567890"
          />
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
        :description="
          transferToCancel ? `${transferRoute(transferToCancel)}. No stock will move.` : ''
        "
        @update:open="
          (open) => {
            if (!open) transferToCancel = null
          }
        "
      >
        <template #footer>
          <SButton variant="secondary" @click="transferToCancel = null">Keep transfer</SButton>
          <SButton variant="danger" :loading="isCancellingTransfer" @click="confirmCancelTransfer">
            Cancel transfer
          </SButton>
        </template>
      </SDialog>

      <SDialog
        :open="Boolean(transferToReject)"
        role="alertdialog"
        title="Reject this transfer?"
        :description="
          transferToReject
            ? `${transferRoute(
                transferToReject
              )}. Nothing enters your inventory and the stock stays with the sending branch.`
            : ''
        "
        @update:open="
          (open) => {
            if (!open) transferToReject = null
          }
        "
      >
        <form id="transfer-reject-form" class="s-form" @submit.prevent="confirmRejectTransfer">
          <STextarea
            v-model="rejectReason"
            label="Reason"
            required
            :rows="3"
            placeholder="For example, two units arrived damaged"
          />
        </form>
        <template #footer>
          <SButton variant="secondary" @click="transferToReject = null">Keep transfer</SButton>
          <SButton
            variant="danger"
            type="submit"
            form="transfer-reject-form"
            :loading="isRejectingTransfer"
            :disabled="!rejectReason.trim()"
          >
            Reject transfer
          </SButton>
        </template>
      </SDialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  ChevronRight,
  CircleX,
  Download,
  EllipsisVertical,
  Lock,
  PackageCheck,
  Send,
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
import TransferDetailsPanel from '~/components/transfers/TransferDetailsPanel.vue'
import { useStockItemDetailsLookup } from '~/composables/useStockItemDetailsLookup'
import {
  groupedItemNames,
  snapshotStockItemDetails,
  type StockItemDetails,
  type StockItemRow,
} from '~/utils/stock-item-details'
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
import { useTransfersApi } from '~/composables/useTransfersApi'
import { getApiErrorMessage } from '~/utils/api-error-message'
import { friendlyDisplayMessage } from '~/utils/friendly-error'
import { decidedByLine, decidedByName } from '~/utils/decided-by'
import { availableTransferActions, type TransferActor } from '~/utils/transfer-policy'
import {
  OPEN_TRANSFER_STATUSES,
  TRANSFER_MAX_LINES,
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_TONES,
  normalizeTransferStatus,
  type TransferAction,
  type TransferApprovalFields,
} from '~/types/transfers'

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
const { can, canViewFinancials, isAdmin, hasAdminGrant } = usePermissions()
const staffStore = useStaffStore()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

// Security: Enterprise plan + multi-store view. Branch admins can always see transfers touching
// their branch; requesting or changing one also needs the stock-transfers extra (rules enforce it).
const canAccess = computed(() => {
  if (!canUseSubscriptionFeature('multi_store_sync')) return false
  if (userStore.isSuperAdmin) return true
  return can('multiStoreSync', 'view')
})

const canRequestTransfers = computed(
  () =>
    userStore.isSuperAdmin ||
    (can('multiStoreSync', 'create') && (!isAdmin.value || hasAdminGrant('stockTransfers')))
)
const canChangeTransfers = computed(
  () =>
    userStore.isSuperAdmin ||
    (can('multiStoreSync', 'edit') && (!isAdmin.value || hasAdminGrant('stockTransfers')))
)

/** Branch admins send only from their assigned branch; the owner can pick any source. */
const homeStoreId = computed(() => staffStore.getCurrentStaffMember?.storeId || '')
const sourceStoreLocked = computed(() => isAdmin.value && !userStore.isSuperAdmin)

// State
// Notifications link to ?tab=history so approvers land on the transfers waiting for them.
const activeTab = ref<'transfer' | 'reports' | 'history'>(
  useRoute().query.tab === 'history' || !canRequestTransfers.value ? 'history' : 'transfer'
)
// Permissions can arrive after the page: view-only admins never sit on the request form.
watch(canRequestTransfers, (allowed) => {
  if (!allowed && activeTab.value === 'transfer') activeTab.value = 'history'
})
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
    if (!OPEN_TRANSFER_STATUSES.has(normalizeTransferStatus(transfer.status))) continue
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
    // Always reload: branch admins often have a one-branch cache from login.
    await storesStore.fetchStores({ force: true })
    stores.value = storesStore.stores
    if (storesStore.error && destinationStoreOptions.value.length === 0) {
      toast.error(storesStore.error)
    }
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
          ...(item && { details: snapshotStockItemDetails(item, { maxKeys: 10 }) }),
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
    if (!can('multiStoreSync', 'create')) {
      throw new Error('You do not have permission to request transfers')
    }
    if (sourceStoreLocked.value && transferForm.value.sourceStoreId !== homeStoreId.value) {
      throw new Error('You can only send stock from your own branch')
    }

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
        // Serial, IMEI, colour, condition… so both branches see exactly which units are moving.
        ...(item && { details: snapshotStockItemDetails(item, { maxKeys: 10 }) }),
      })
    }
    if (transferredItems.length === 0) {
      toast.error('No items to transfer')
      return
    }
    if (transferredItems.length > TRANSFER_MAX_LINES) {
      toast.error(
        `A transfer can carry at most ${TRANSFER_MAX_LINES} items. Split it into smaller ones.`
      )
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
      // Both branches see the route even when they can't read each other's branch record.
      sourceStoreName: String(sourceStore.name || sourceStore.branchName || '').slice(0, 120),
      destinationStoreName: String(destStore.name || destStore.branchName || '').slice(0, 120),
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

/**
 * Every change after a request goes through the server, which checks who may approve it and, on
 * receive, moves the stock in one transaction. Demo mode keeps its in-browser equivalents.
 */
const transfersApi = useTransfersApi()

function transferErrorMessage(error: unknown, fallback: string): string {
  return friendlyDisplayMessage(getApiErrorMessage(error, ''), fallback)
}

async function runTransferChange(
  work: () => Promise<unknown>,
  messages: { success: string; failure: string }
): Promise<boolean> {
  try {
    await work()
    toast.success(messages.success)
    return true
  } catch (error) {
    console.error('[Transfers] Action failed:', error)
    toast.error(transferErrorMessage(error, messages.failure))
    return false
  } finally {
    await loadTransferHistory()
  }
}

const receiveTransfer = async (transfer: any) => {
  if (isTransferring.value) return
  isTransferring.value = true
  try {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    if (isDemoModeActive()) {
      const { executeDemoTransfer } = await import('~/utils/demo-multi-store')
      await executeDemoTransfer(transfer)
      toast.success('Approved. The stock is now in your inventory.')
      await loadTransferHistory()
      return
    }
    try {
      const result = await transfersApi.receive(transfer.id)
      invalidateFolderItemCaches(transfer.folderId)
      invalidateFolderItemCaches(transfer.destinationFolderId)
      if (result.skipped.length) {
        toast.warning(
          `Approved ${result.moved} item(s) into your inventory. ${
            result.skipped.length
          } couldn’t move: ${result.skipped.join('; ')}.`,
          10000
        )
      } else {
        toast.success(`Approved. ${result.moved} item(s) are now in your inventory.`)
      }
    } catch (error) {
      console.error('[Transfers] Receive failed:', error)
      toast.error(transferErrorMessage(error, 'Couldn’t approve this transfer. Please try again.'))
    }
    await loadTransferHistory()
  } finally {
    isTransferring.value = false
  }
}

const dispatchTransfer = async (transfer: any) => {
  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) {
    const { updateDemoTransferStatus } = await import('~/utils/demo-multi-store')
    await updateDemoTransferStatus(transfer.id, 'in_transit')
    toast.success('Dispatched. The receiving branch will approve it on arrival.')
    await loadTransferHistory()
    return
  }
  await runTransferChange(() => transfersApi.dispatch(transfer.id), {
    success: 'Dispatched. The receiving branch will approve it on arrival.',
    failure: 'Couldn’t dispatch this transfer. Please try again.',
  })
}

const cancelTransfer = async (transfer: any) => {
  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) {
    const { updateDemoTransferStatus } = await import('~/utils/demo-multi-store')
    await updateDemoTransferStatus(transfer.id, 'cancelled')
    toast.success('Transfer cancelled.')
    await loadTransferHistory()
    return true
  }
  return runTransferChange(() => transfersApi.cancel(transfer.id), {
    success: 'Transfer cancelled.',
    failure: 'Couldn’t cancel this transfer. Please try again.',
  })
}

const rejectTransfer = async (transfer: any, reason: string) => {
  const { isDemoModeActive } = await import('~/utils/demo-mode')
  if (isDemoModeActive()) {
    const { updateDemoTransferStatus } = await import('~/utils/demo-multi-store')
    await updateDemoTransferStatus(transfer.id, 'rejected', { rejectionReason: reason })
    toast.success('Transfer rejected. The stock stays with the sending branch.')
    await loadTransferHistory()
    return true
  }
  return runTransferChange(() => transfersApi.reject(transfer.id, reason), {
    success: 'Transfer rejected. The stock stays with the sending branch.',
    failure: 'Couldn’t reject this transfer. Please try again.',
  })
}

const openTrackingModal = (t: any) => {
  selectedTransferForTracking.value = t
  trackingForm.value = { carrier: t.carrier || '', trackingNumber: t.trackingNumber || '' }
  showTrackingModal.value = true
}

const saveTracking = async () => {
  const t = selectedTransferForTracking.value
  if (!t) return
  const carrier = trackingForm.value.carrier.trim()
  const trackingNumber = trackingForm.value.trackingNumber.trim()

  const { isDemoModeActive } = await import('~/utils/demo-mode')
  let saved = true
  if (isDemoModeActive()) {
    const { updateDemoTransferStatus } = await import('~/utils/demo-multi-store')
    await updateDemoTransferStatus(t.id, t.status, {
      carrier: carrier || undefined,
      trackingNumber: trackingNumber || undefined,
    })
    toast.success('Tracking info saved.')
    await loadTransferHistory()
  } else {
    saved = await runTransferChange(() => transfersApi.track(t.id, carrier, trackingNumber), {
      success: 'Tracking info saved.',
      failure: 'Couldn’t save the tracking info. Please try again.',
    })
  }
  if (!saved) return
  showTrackingModal.value = false
  selectedTransferForTracking.value = null
  trackingForm.value = { carrier: '', trackingNumber: '' }
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

    if (!can('multiStoreSync', 'view')) return

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
      // Branch admins may only read transfers that touch their store; a full collection
      // query fails rules when other branches have transfers they cannot see.
      const homeId = sourceStoreLocked.value ? homeStoreId.value : ''
      let transferDocs: Awaited<ReturnType<typeof getDocs>>['docs'] = []
      if (homeId) {
        const [asSource, asDest] = await Promise.all([
          getDocs(query(transfersRef, firestoreWhere('sourceStoreId', '==', homeId))),
          getDocs(query(transfersRef, firestoreWhere('destinationStoreId', '==', homeId))),
        ])
        const byId = new Map<string, (typeof asSource.docs)[number]>()
        for (const d of [...asSource.docs, ...asDest.docs]) byId.set(d.id, d)
        transferDocs = [...byId.values()]
      } else {
        try {
          transferDocs = (await getDocs(query(transfersRef, orderBy('createdAt', 'desc')))).docs
        } catch (queryError: any) {
          console.warn('[TransferHistory] orderBy failed, trying without:', queryError.message)
          transferDocs = (await getDocs(query(transfersRef))).docs
        }
      }

      // Sort manually if orderBy didn't work
      const transfers = transferDocs.map((doc) => {
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
        throw new Error('Permission denied. Please ensure you are logged in as a super admin.')
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

    // Branch reports include revenue; keep them on the owner (or financials grant).
    if (!canViewFinancials.value) return

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

/**
 * Branch name from the branches this viewer can read, else the name saved on the transfer (admins
 * without the transfer extra only read their own branch). Never shows a raw ID.
 */
const getStoreName = (storeId: string, savedName?: string) => {
  const store = stores.value.find((s) => s.id === storeId)
  return store?.name || store?.branchName || savedName || 'Another branch'
}

const formatTransferProductSummary = (transfer: any) => {
  const items = transfer.items || []
  const totalUnits = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0)
  if (items.length === 0) return `${transfer.itemsCount ?? 0} items`
  if (items.length === 1 && totalUnits === 1) return '1 item'
  return `${totalUnits} units · ${items.length} product${items.length === 1 ? '' : 's'}`
}

const getTransferStatusLabel = (status: string) =>
  TRANSFER_STATUS_LABELS[normalizeTransferStatus(status)]

/** The signed-in user, as the transfer policy sees them for this transfer. */
function transferActorFor(transfer: TransferApprovalFields): TransferActor {
  return {
    uid: useAuthStore().currentUser?.uid ?? '',
    isOwner: userStore.isSuperAdmin,
    isDestinationAdmin:
      isAdmin.value && !!homeStoreId.value && homeStoreId.value === transfer.destinationStoreId,
    canManageTransfers: canChangeTransfers.value,
  }
}

function transferActions(transfer: any): TransferAction[] {
  const fields: TransferApprovalFields = {
    status: normalizeTransferStatus(transfer.status),
    sourceStoreId: String(transfer.sourceStoreId ?? transfer.fromStoreId ?? ''),
    destinationStoreId: String(transfer.destinationStoreId ?? transfer.toStoreId ?? ''),
    createdBy: String(transfer.createdBy ?? ''),
  }
  return availableTransferActions(fields, transferActorFor(fields))
}

const isTransferActionable = (transfer: any) => transferActions(transfer).length > 0

/** Transfers this user can check in right now. */
const transfersAwaitingMe = computed(() =>
  transferHistory.value.filter((t) => transferActions(t).includes('receive'))
)

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
  ...(canRequestTransfers.value ? [{ value: 'transfer', label: 'New transfer' }] : []),
  { value: 'history', label: 'History', count: transferHistory.value.length },
  ...(canViewFinancials.value ? [{ value: 'reports', label: 'Branch reports' }] : []),
])

const storeLabel = (store: any) => store.name || store.branchName || store.id

const storeOptions = computed(() =>
  stores.value.map((store) => ({ label: storeLabel(store), value: store.id }))
)

const sourceStoreOptions = computed(() => {
  if (!sourceStoreLocked.value || !homeStoreId.value) return storeOptions.value
  return storeOptions.value.filter((option) => option.value === homeStoreId.value)
})

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
  return [
    item.brand && item.model ? `${item.brand} ${item.model}` : '',
    serial ? `Serial ${serial}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Fields the history list reads from a storeTransfers doc. */
interface TransferRecord {
  id?: string
  sourceStoreId?: string
  sourceStoreName?: string
  destinationStoreId?: string
  destinationStoreName?: string
  items?: Array<{ quantity?: number | string }>
  itemsCount?: number
  createdAt?: unknown
  approvedAt?: unknown
  approvedBy?: string
  dispatchedAt?: unknown
  dispatchedBy?: string
  dispatchedByName?: string
  receivedAt?: unknown
  receivedBy?: string
  receivedByName?: string
  completedAt?: unknown
  completedBy?: string
  rejectedAt?: unknown
  rejectedBy?: string
  rejectedByName?: string
  cancelledAt?: unknown
  cancelledBy?: string
  cancelledByName?: string
  rejectionReason?: string
  skippedItems?: string[]
  carrier?: string
  trackingNumber?: string
  notes?: string
}

function transferSourceName(transfer: TransferRecord): string {
  return getStoreName(transfer.sourceStoreId || '', transfer.sourceStoreName)
}

function transferDestinationName(transfer: TransferRecord): string {
  return getStoreName(transfer.destinationStoreId || '', transfer.destinationStoreName)
}

function transferRoute(transfer: TransferRecord): string {
  return `${transferSourceName(transfer)} → ${transferDestinationName(transfer)}`
}

/** Short, stable reference people can quote to each other, e.g. "TR-7F3K2A". */
function transferRef(transfer: { id?: string }): string {
  const id = String(transfer.id || '').replace(/[^a-z0-9]/gi, '')
  return `TR-${id.slice(-6).toUpperCase()}`
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  const d =
    typeof value === 'object' && value !== null && 'toDate' in value
      ? (value as { toDate: () => Date }).toDate()
      : new Date(value as string | number)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "15 Oct 2026, 14:32". */
function formatTransferDate(value: unknown): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function transferUnitCount(transfer: TransferRecord): number {
  const items = transfer.items || []
  if (items.length === 0) return Number(transfer.itemsCount) || 0
  return items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)
}

function transferUnitLabel(transfer: TransferRecord): string {
  const units = transferUnitCount(transfer)
  return `${units} unit${units === 1 ? '' : 's'}`
}

/** Dates, tracking and notes for the expanded panel; anything not recorded is left out. */
function transferFacts(transfer: TransferRecord): Array<{ label: string; value: string }> {
  const facts: Array<{ label: string; value: string }> = [
    { label: 'Requested', value: formatTransferDate(transfer.createdAt) },
  ]
  const viewer = useAuthStore().currentUser?.uid
  /** "13 Nov 2026, 10:02 · Ada" when we know who did it. */
  const when = (at: unknown, name: unknown, uid: unknown) => {
    const who = decidedByName(name, uid, viewer)
    return who ? `${formatTransferDate(at)} · ${who}` : formatTransferDate(at)
  }
  const dispatchedAt = transfer.dispatchedAt ?? transfer.approvedAt
  if (dispatchedAt) {
    facts.push({
      label: 'Dispatched',
      value: when(
        dispatchedAt,
        transfer.dispatchedByName,
        transfer.dispatchedBy ?? transfer.approvedBy
      ),
    })
  }
  const receivedAt = transfer.receivedAt ?? transfer.completedAt
  if (receivedAt) {
    facts.push({
      label: 'Approved on arrival',
      value: when(receivedAt, transfer.receivedByName, transfer.receivedBy ?? transfer.completedBy),
    })
  }
  if (transfer.rejectedAt) {
    facts.push({
      label: 'Rejected',
      value: when(transfer.rejectedAt, transfer.rejectedByName, transfer.rejectedBy),
    })
  }
  if (transfer.cancelledAt) {
    facts.push({
      label: 'Cancelled',
      value: when(transfer.cancelledAt, transfer.cancelledByName, transfer.cancelledBy),
    })
  }
  if (transfer.rejectionReason)
    facts.push({ label: 'Reason', value: String(transfer.rejectionReason) })
  if (transfer.skippedItems?.length)
    facts.push({ label: 'Not moved', value: transfer.skippedItems.join('; ') })
  if (transfer.carrier) facts.push({ label: 'Carrier', value: String(transfer.carrier) })
  if (transfer.trackingNumber)
    facts.push({ label: 'Tracking number', value: String(transfer.trackingNumber) })
  if (transfer.notes) facts.push({ label: 'Notes', value: String(transfer.notes) })
  return facts
}

/** The receiving branch's decision, shown on the row: "Approved by Ada", "Rejected by you". */
function transferDecision(transfer: TransferRecord & { status?: string }): string | null {
  const viewer = useAuthStore().currentUser?.uid
  switch (normalizeTransferStatus(transfer.status)) {
    case 'completed':
    case 'partial':
      return decidedByLine('Approved', transfer.receivedByName, transfer.receivedBy, viewer)
    case 'rejected':
      return decidedByLine('Rejected', transfer.rejectedByName, transfer.rejectedBy, viewer)
    default:
      return null
  }
}

/** Clicking anywhere on a row opens it, except on its own buttons. */
function onTransferRowClick(event: MouseEvent, transferId: string) {
  if ((event.target as HTMLElement | null)?.closest('button, a, input')) return
  if (window.getSelection()?.toString()) return
  toggleTransferItems(transferId)
}

const expandedTransferIds = ref<Set<string>>(new Set())

function toggleTransferItems(transferId: string) {
  const next = new Set(expandedTransferIds.value)
  if (next.has(transferId)) next.delete(transferId)
  else next.add(transferId)
  expandedTransferIds.value = next
}

interface TransferLine {
  itemId?: string
  itemName?: string
  quantity?: number
  serialNumber?: string | null
  details?: StockItemDetails
}

interface TransferForItems {
  status?: string
  sourceStoreId?: string
  destinationStoreId?: string
  items?: TransferLine[]
}

/** Every item in the transfer by name and quantity; nothing is cut off. */
function transferItemNames(transfer: TransferForItems): string {
  const items = transfer.items || []
  return groupedItemNames(
    items.map((item) => ({ name: item.itemName || 'Item', quantity: item.quantity }))
  )
}

const { detailsFor } = useStockItemDetailsLookup()

/**
 * One row per item with its serial, model, colour and so on. Transfers recorded before details
 * were saved look the unit up where it is now: the sending branch until it arrives, then the
 * receiving one.
 */
function transferItemRows(transfer: TransferForItems): StockItemRow[] {
  const items = transfer.items || []
  const arrived = ['completed', 'completed_partial', 'partial'].includes(transfer.status ?? '')
  const stores = arrived
    ? [transfer.destinationStoreId, transfer.sourceStoreId]
    : [transfer.sourceStoreId, transfer.destinationStoreId]
  return items.map((item, index) => {
    const saved =
      item.details ?? (item.serialNumber ? { serialNo: String(item.serialNumber) } : null)
    const { details, loading } = detailsFor({ itemId: item.itemId, details: item.details }, stores)
    return {
      key: `${item.itemId}-${index}`,
      name: item.itemName || 'Item',
      quantity: Number(item.quantity) || 1,
      details: details ?? saved,
      loading: loading && !saved,
    }
  })
}

function transferStatusTone(status: string) {
  return TRANSFER_STATUS_TONES[normalizeTransferStatus(status)]
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

const openMenuActions = computed<TransferAction[]>(() =>
  transferForOpenMenu.value ? transferActions(transferForOpenMenu.value) : []
)

const transferToReject = ref<any>(null)
const rejectReason = ref('')
const isRejectingTransfer = ref(false)

function askRejectTransfer() {
  transferToReject.value = transferForOpenMenu.value
  rejectReason.value = ''
  closeTransferMenu()
}

async function confirmRejectTransfer() {
  const reason = rejectReason.value.trim()
  if (!transferToReject.value || !reason || isRejectingTransfer.value) return
  isRejectingTransfer.value = true
  try {
    if (await rejectTransfer(transferToReject.value, reason)) transferToReject.value = null
  } finally {
    isRejectingTransfer.value = false
  }
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
    if (await cancelTransfer(transferToCancel.value)) transferToCancel.value = null
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
  // History only needs the signed-in user's branch, so it loads alongside the branch setup.
  const history = loadTransferHistory()
  await prepareBranchAdminWorkspace()
  await loadStores()
  await ensureBranchAdminSourceStore()
  await Promise.all([history, loadConsolidatedReports()])
})

/** Keeps workspaceMembers.admin in sync so cross-branch category reads pass rules. */
async function prepareBranchAdminWorkspace() {
  if (!sourceStoreLocked.value) return
  const { fetchOwnerWorkspaceContext } = await import('~/utils/owner-workspace-context')
  // Sign-in already refreshed this; reuse it when it is under a minute old.
  await fetchOwnerWorkspaceContext()
}

async function ensureBranchAdminSourceStore() {
  if (!sourceStoreLocked.value || !homeStoreId.value) return
  if (transferForm.value.sourceStoreId === homeStoreId.value) return
  transferForm.value.sourceStoreId = homeStoreId.value
  await onSourceStoreChange()
}

async function reloadMultiStorePage() {
  if (!canAccess.value) return
  // History only needs the signed-in user's branch, so it loads alongside the branch setup.
  const history = loadTransferHistory()
  await prepareBranchAdminWorkspace()
  await loadStores()
  await ensureBranchAdminSourceStore()
  await Promise.all([history, loadConsolidatedReports()])
}

watch(canAccess, (ok, wasOk) => {
  if (ok && !wasOk && stores.value.length === 0) void reloadMultiStorePage()
})

useDashboardPageRefreshRegister(reloadMultiStorePage)
</script>
