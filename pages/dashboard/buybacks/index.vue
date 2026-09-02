<template>
  <div :class="[pageWithFixedFooterClass, 'dash-page--unified']">
    <div v-if="isCapacitorIos" class="ios-sales-shell" data-buybacks-page>
      <IosPageNavBar title="Buybacks" />

      <IosQuickActionBar
        v-if="canAccess"
        v-model="iosBuybackTab"
        aria-label="Buyback actions"
        :options="iosBuybackQuickActions"
      />

      <template v-if="canAccess && storesStore.currentStoreId">
        <IosTransactionListSkeleton
          v-if="buybacksStore.loading && buybacksStore.buybacks.length === 0"
          :count="8"
        />

        <DashboardTableEmptyState
          v-else-if="buybacksStore.error"
          :icon="InboxArrowDownIcon"
          title="Could not load buybacks"
          :description="buybacksStore.error"
        />

        <DashboardTableEmptyState
          v-else-if="buybacksStore.buybacks.length === 0"
          :icon="InboxArrowDownIcon"
          title="No buybacks yet"
          description="Record customer trade-ins here to add stock and track what you paid."
        />

        <div v-else class="ios-receipt-transaction-list">
          <IosReceiptTransactionRow
            v-for="(row, index) in buybacksStore.buybacks"
            :key="row.id"
            :title="row.customerName"
            :subtitle="`${row.itemSummary} · ${folderName(row.folderId)}`"
            :amount="formatBuybackAmount(row.purchasePrice)"
            amount-tone="negative"
            :date="formatWhenShort(row.createdAt)"
            variant="debit"
            :last="index === buybacksStore.buybacks.length - 1"
            show-menu
            menu-kind="buyback"
            :menu-id="row.id"
            @click="navigateTo(inventoryItemLink(row))"
            @menu="toggleBuybackMenu(row.id)"
          />
        </div>
      </template>

      <DashboardTableEmptyState
        v-else-if="canAccess && !storesStore.currentStoreId"
        :icon="BuildingStorefrontIcon"
        title="Select a store"
        description="Use the store selector to record buybacks for a branch."
      />
    </div>

    <template v-else>
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Inventory</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Customer buybacks</h1>
      </template>
      <template
        v-if="canAccess && buybacksStore.loading && buybacksStore.buybacks.length === 0"
        #description
      >
        <DashPageMetricsSkeleton :count="2" />
      </template>
      <template
        v-else-if="canAccess && !buybacksStore.loading && buybacksStore.buybacks.length > 0"
        #description
      >
        <DashboardPageMetrics :metrics="buybackHeaderMetrics" aria-label="Buyback summary" />
      </template>
      <template v-if="canAccess" #actions>
        <Button
          v-if="canAccess"
          variant="primary"
          size="sm"
          :icon="ArrowUturnLeftIcon"
          :extra-class="headerBtnClass"
          @click="showCreateModal = true"
        >
          Record buyback
        </Button>
      </template>
    </DashboardPageHeader>

    <div
      v-if="!canAccess"
      class="rounded-sm bg-red-50/90 px-4 py-4 dark:bg-red-950/25 sm:px-5 sm:py-5"
    >
      <p class="text-xs font-medium text-red-800 dark:text-red-200">
        Sign in to record customer buybacks for your branch.
      </p>
    </div>

    <template v-else>
      <div
        v-if="!storesStore.currentStoreId && !buybacksStore.loading"
        :class="tableShellFlexClass"
      >
        <DashboardTableEmptyState
          :icon="BuildingStorefrontIcon"
          title="Select a store"
          description="Use the store selector in the top bar to record buybacks for a branch."
          :tips="['Buybacks are tracked per store', 'Items appear in the category you choose']"
        />
      </div>

      <div v-else :class="tableShellFlexClass">
          <DashTableSkeleton
            v-if="buybacksStore.loading && buybacksStore.buybacks.length === 0"
            :columns="[
              { label: 'Customer', lines: 2 },
              { label: 'Item', lines: 2 },
              { label: 'Paid', bone: '4.5rem' },
              { label: 'Method', bone: '4.5rem' },
              { label: 'Date', bone: '5.5rem' },
              { label: 'Actions', class: 'dashboard-table__col-actions', bone: '1.5rem' },
            ]"
            :rows="8"
            leading="none"
            flush
            aria-label="Loading buybacks"
          />

          <div v-else-if="buybacksStore.error" class="px-4 py-10 text-center sm:px-6">
            <p class="text-sm font-medium text-red-600 dark:text-red-400">
              Could not load buybacks.
            </p>
            <p class="mx-auto mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
              {{ buybacksStore.error }}
            </p>
          </div>

          <DashboardTableEmptyState
            v-else-if="buybacksStore.buybacks.length === 0"
            :icon="InboxArrowDownIcon"
            title="No buybacks yet"
            description="When customers sell items to your store, record them here to add stock and track what you paid."
            :tips="[
              'Items go into the inventory category you pick',
              'Use swap-in on a receipt when trade-in credit applies to a sale',
            ]"
          />

          <div v-else class="overflow-x-auto">
            <table class="dashboard-table min-w-full">
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Item</th>
                  <th scope="col">Paid</th>
                  <th scope="col">Method</th>
                  <th scope="col">Date</th>
                  <th scope="col" class="dashboard-table__col-actions">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in buybacksStore.buybacks" :key="row.id">
                  <td class="max-w-[14rem]">
                    <span class="dashboard-table__primary block truncate">
                      {{ row.customerName }}
                    </span>
                    <span
                      v-if="row.customerPhone"
                      class="dashboard-table__muted mt-0.5 block truncate text-[10px]"
                    >
                      {{ row.customerPhone }}
                    </span>
                  </td>
                  <td class="max-w-[16rem]">
                    <span class="dashboard-table__primary block truncate">
                      {{ row.itemSummary }}
                    </span>
                    <span class="dashboard-table__muted mt-0.5 block truncate text-[10px]">
                      {{ folderName(row.folderId) }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap tabular-nums">
                    {{ formatCurrency(row.purchasePrice) }}
                  </td>
                  <td class="whitespace-nowrap">{{ row.paymentMethod }}</td>
                  <td class="whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">
                    {{ formatWhen(row.createdAt) }}
                  </td>
                  <td class="dashboard-table__col-actions">
                    <button
                      type="button"
                      class="dashboard-table__action-btn"
                      :data-buyback-actions-anchor="row.id"
                      aria-label="Buyback actions"
                      @click="toggleBuybackMenu(row.id)"
                    >
                      <EllipsisVerticalIcon class="h-4 w-4" stroke-width="2" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
    </template>
    </template>

    <CreateBuybackModal v-model="showCreateModal" />

    <IosContextMenu
      :open="Boolean(openBuybackMenuId && buybackForOpenMenu && buybackMenuFixedStyle)"
      :style="buybackMenuFixedStyle"
      menu-id="buyback"
    >
      <IosContextMenuItem
        label="View in stock"
        :icon="BuildingStorefrontIcon"
        @click="
          () => {
            navigateTo(inventoryItemLink(buybackForOpenMenu))
            closeBuybackMenu()
          }
        "
      />
    </IosContextMenu>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  ArrowUturnLeftIcon,
  BuildingStorefrontIcon,
  EllipsisVerticalIcon,
  InboxArrowDownIcon,
} from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import IosContextMenu from '~/components/ios/IosContextMenu.vue'
import IosContextMenuItem from '~/components/ios/IosContextMenuItem.vue'
import IosPageNavBar from '~/components/ios/IosPageNavBar.vue'
import IosQuickActionBar, { type IosQuickActionOption } from '~/components/ios/IosQuickActionBar.vue'
import IosTransactionListSkeleton from '~/components/ios/IosTransactionListSkeleton.vue'
import IosReceiptTransactionRow from '~/components/ios/IosReceiptTransactionRow.vue'
import CreateBuybackModal from '~/components/buybacks/CreateBuybackModal.vue'
import { useCustomerBuybacksStore, type CustomerBuyback } from '~/stores/customerBuybacks'
import { useInventoryStore } from '~/stores/inventory'
import { useStoresStore } from '~/stores/stores'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'dashboard',
})

const { eyebrowClass, pageTitleClass, headerBtnClass, pageWithFixedFooterClass } =
  useDashboardPageChrome()
const { tableShellFlexClass } = useDashboardTableChrome()
const { isCapacitorIos } = useIsCapacitorIos()

const buybacksStore = useCustomerBuybacksStore()
const inventoryStore = useInventoryStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()
const { formatCurrency } = usePreferences()

const buybackHeaderMetrics = computed(() => {
  const rows = buybacksStore.buybacks
  const totalPaid = rows.reduce((sum, row) => sum + (row.purchasePrice ?? 0), 0)
  return [
    {
      key: 'count',
      label: 'Buybacks',
      value: String(rows.length),
    },
    {
      key: 'paid',
      label: 'Total paid',
      value: formatCurrency(totalPaid),
    },
  ]
})

const showCreateModal = ref(false)

const {
  openMenuId: openBuybackMenuId,
  menuFixedStyle: buybackMenuFixedStyle,
  toggleMenu: toggleBuybackMenu,
  closeMenu: closeBuybackMenu,
} = useAnchoredRowMenu({
  anchorAttr: 'data-buyback-actions-anchor',
})

const buybackForOpenMenu = computed(() => {
  const id = openBuybackMenuId.value
  if (!id) return null
  return buybacksStore.buybacks.find((row) => row.id === id) ?? null
})

const iosBuybackTab = ref('list')

const iosBuybackQuickActions = computed((): IosQuickActionOption[] => [
  {
    value: 'add',
    label: 'Record',
    icon: ArrowUturnLeftIcon,
    trailing: 'add',
    action: () => {
      showCreateModal.value = true
    },
  },
  { value: 'list', label: 'Buybacks', icon: InboxArrowDownIcon },
])

const canAccess = computed(() => !!authStore.currentUser)

function formatWhenShort(v: Date | undefined) {
  if (!v) return ''
  try {
    const day = String(v.getDate()).padStart(2, '0')
    const month = String(v.getMonth() + 1).padStart(2, '0')
    const year = v.getFullYear()
    return `${day}.${month}.${year}`
  } catch {
    return ''
  }
}

function formatBuybackAmount(price: number) {
  return formatCurrency(price).replace(/\.00$/, '')
}

function folderName(folderId: string) {
  return inventoryStore.getFolderById(folderId)?.name || 'Inventory'
}

function formatWhen(v: Date | undefined) {
  if (!v) return '-'
  try {
    return v.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '-'
  }
}

function inventoryItemLink(row: CustomerBuyback) {
  return `/dashboard/inventory/${row.folderId}?highlight=${encodeURIComponent(row.inventoryItemId)}`
}

watch(
  () => storesStore.currentStoreId,
  () => {
    if (storesStore.currentStoreId && canAccess.value) {
      buybacksStore.fetchCustomerBuybacks(true)
    } else if (!storesStore.currentStoreId) {
      buybacksStore.clearForUiStoreSwitch()
    }
  }
)

onMounted(async () => {
  if (!canAccess.value) return
  if (inventoryStore.folders.length === 0) {
    await inventoryStore.fetchFolders()
  }
  if (storesStore.currentStoreId) {
    await buybacksStore.fetchCustomerBuybacks(true)
  }
})
</script>
