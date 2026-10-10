<template>
  <div class="ds-root s-c s-page">
    <SPageHeader title="Trade-ins">
      <template #description>
        Items you've bought back from customers. Each one goes into stock at what you paid.
      </template>
      <template v-if="canAccess && storesStore.currentStoreId" #actions>
        <SButton variant="primary" @click="showCreateModal = true">
          <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
          Record trade-in
        </SButton>
      </template>
    </SPageHeader>

    <SCard v-if="!canAccess">
      <SEmptyState
        title="You don't have access to trade-ins"
        description="Ask the account owner to give you access to trade-ins."
      >
        <template #icon><Lock :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="!storesStore.currentStoreId && !buybacksStore.loading">
      <SEmptyState
        title="Choose a branch"
        description="Trade-ins are kept per branch. Pick one from the branch switcher to see its trade-ins."
      >
        <template #icon><Store :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="buybacksStore.loading && buybacksStore.buybacks.length === 0" flush aria-busy="true">
      <ul class="s-list" aria-label="Loading trade-ins">
        <li v-for="i in 6" :key="i" class="s-list__item" aria-hidden="true">
          <div class="s-list__main">
            <SSkeleton width="40%" height="14px" />
            <SSkeleton width="25%" height="12px" />
          </div>
          <SSkeleton width="72px" height="14px" />
        </li>
      </ul>
    </SCard>

    <SCard v-else-if="buybacksStore.error">
      <SEmptyState title="Couldn't load trade-ins" :description="buybacksStore.error">
        <template #icon><TriangleAlert :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton @click="buybacksStore.fetchCustomerBuybacks(true)">Try again</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="buybacksStore.buybacks.length === 0">
      <SEmptyState
        title="No trade-ins yet"
        description="When a customer sells you an item, record it here. It's added to stock in the category you choose, at the price you paid."
      >
        <template #icon><Undo2 :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton variant="primary" @click="showCreateModal = true">
            <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
            Record trade-in
          </SButton>
        </template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <dl class="s-metrics">
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Trade-ins</dt>
          <dd class="s-metrics__value">{{ buybacksStore.buybacks.length }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Total paid</dt>
          <dd class="s-metrics__value">{{ formatCurrency(totalPaid) }}</dd>
        </div>
      </dl>

      <div class="s-toolbar">
        <SSearch
          v-model="searchQuery"
          class="s-toolbar__search"
          placeholder="Search trade-ins"
          label="Search trade-ins by customer, phone or item"
        />
      </div>

      <SCard v-if="filteredBuybacks.length === 0">
        <SEmptyState title="No trade-ins found" description="Try another customer name, phone number or item.">
          <template #icon><SearchX :size="24" :stroke-width="1.75" /></template>
          <template #actions>
            <SButton @click="searchQuery = ''">Clear search</SButton>
          </template>
        </SEmptyState>
      </SCard>

      <template v-else>
        <!-- Phone -->
        <SCard flush class="s-only-sm">
          <ul class="s-list">
            <li v-for="row in paginatedBuybacks" :key="row.id">
              <NuxtLink :to="inventoryItemLink(row)" class="s-list__item s-list__item--interactive">
                <span class="s-list__main">
                  <span class="s-list__primary">{{ row.itemSummary }}</span>
                  <span class="s-list__secondary">{{ row.customerName }} · {{ formatDay(row.createdAt) }}</span>
                </span>
                <span class="s-list__end">
                  <span class="s-list__value">{{ formatCurrency(row.purchasePrice) }}</span>
                </span>
              </NuxtLink>
            </li>
          </ul>
        </SCard>

        <!-- Tablet and desktop -->
        <div class="s-table-wrap s-hide-sm">
          <table class="s-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Customer</th>
                <th scope="col" class="s-table__num">Paid</th>
                <th scope="col" class="s-hide-md">Method</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paginatedBuybacks" :key="row.id">
                <td>
                  <NuxtLink :to="inventoryItemLink(row)" class="s-table__primary s-link">
                    {{ row.itemSummary }}
                  </NuxtLink>
                  <span class="s-table__secondary">{{ folderName(row.folderId) }}</span>
                </td>
                <td>
                  <span class="s-table__primary">{{ row.customerName }}</span>
                  <span v-if="row.customerPhone" class="s-table__secondary">{{ row.customerPhone }}</span>
                </td>
                <td class="s-table__num">{{ formatCurrency(row.purchasePrice) }}</td>
                <td class="s-hide-md">{{ row.paymentMethod || EMPTY_CELL }}</td>
                <td class="s-table__nowrap">{{ formatDay(row.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <SPagination
          :current-page="currentPage"
          :page-size="PAGE_SIZE"
          :total="filteredBuybacks.length"
          label="Trade-ins pagination"
          @page-change="(page) => (currentPage = page)"
        />
      </template>
    </template>

    <CreateBuybackModal v-model="showCreateModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Lock, Plus, SearchX, Store, TriangleAlert, Undo2 } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import CreateBuybackModal from '~/components/buybacks/CreateBuybackModal.vue'
import { useCustomerBuybacksStore, type CustomerBuyback } from '~/stores/customerBuybacks'
import { useInventoryStore } from '~/stores/inventory'
import { useStoresStore } from '~/stores/stores'
import { usePreferences } from '~/composables/usePreferences'
import { EMPTY_CELL } from '~/utils/ui-empty'

definePageMeta({
  layout: 'dashboard',
})

const PAGE_SIZE = 50

const buybacksStore = useCustomerBuybacksStore()
const inventoryStore = useInventoryStore()
const storesStore = useStoresStore()
const { formatCurrency } = usePreferences()
const { can } = usePermissions()

const canAccess = computed(() => can('buybacks', 'view'))

const totalPaid = computed(() =>
  buybacksStore.buybacks.reduce((sum, row) => sum + (row.purchasePrice ?? 0), 0)
)

const searchQuery = ref('')
const currentPage = ref(1)

const filteredBuybacks = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return buybacksStore.buybacks
  return buybacksStore.buybacks.filter((row) =>
    [row.customerName, row.customerPhone, row.itemSummary].some((value) =>
      value?.toLowerCase().includes(q)
    )
  )
})

const paginatedBuybacks = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredBuybacks.value.slice(start, start + PAGE_SIZE)
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const showCreateModal = ref(false)

function folderName(folderId: string) {
  return inventoryStore.getFolderById(folderId)?.name || 'Inventory'
}

function formatDay(v: Date | undefined) {
  if (!v) return EMPTY_CELL
  try {
    return v.toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return EMPTY_CELL
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
    await buybacksStore.fetchCustomerBuybacks(false)
  }
})
</script>
