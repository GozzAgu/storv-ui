<template>
  <div :class="['w-full max-w-none space-y-5 pb-6 sm:space-y-6 sm:pb-8', 'dash-page--unified']">
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Inventory</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Customer buybacks</h1>
      </template>
      <template
        v-if="canAccess && !buybacksStore.loading && buybacksStore.buybacks.length > 0"
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
        Only store owners can record buybacks because new inventory rows are created.
      </p>
    </div>

    <template v-else>
      <div
        v-if="!storesStore.currentStoreId && !buybacksStore.loading"
        class="rounded-sm bg-white/90 dark:!bg-dashboard-card sm:px-10"
      >
        <DashboardTableEmptyState
          :icon="BuildingStorefrontIcon"
          title="Select a store"
          description="Use the store selector in the top bar to record buybacks for a branch."
          :tips="['Buybacks are tracked per store', 'Items appear in the category you choose']"
          :fill="false"
        />
      </div>

      <template v-else>
        <div class="data-table-shell flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            v-if="buybacksStore.loading && buybacksStore.buybacks.length === 0"
            class="p-6 sm:p-8"
          >
            <div class="space-y-3">
              <div v-for="i in 5" :key="i" class="h-10 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10" />
            </div>
          </div>

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
          >
            <Button variant="primary" size="sm" :icon="ArrowUturnLeftIcon" @click="showCreateModal = true">
              Record buyback
            </Button>
          </DashboardTableEmptyState>

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
                    <NuxtLink
                      :to="inventoryItemLink(row)"
                      class="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      View in stock
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>

    <CreateBuybackModal v-model="showCreateModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  ArrowUturnLeftIcon,
  BuildingStorefrontIcon,
  InboxArrowDownIcon,
} from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import CreateBuybackModal from '~/components/buybacks/CreateBuybackModal.vue'
import { useCustomerBuybacksStore, type CustomerBuyback } from '~/stores/customerBuybacks'
import { useInventoryStore } from '~/stores/inventory'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'

definePageMeta({
  layout: 'dashboard',
})

const { eyebrowClass, pageTitleClass, headerBtnClass } = useDashboardPageChrome()

const buybacksStore = useCustomerBuybacksStore()
const inventoryStore = useInventoryStore()
const storesStore = useStoresStore()
const userStore = useUserStore()
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

const canAccess = computed(() => userStore.isSuperAdmin)

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
