<template>
  <div class="s-c s-swap-ins">
    <div v-if="loading" class="s-table-wrap" role="status" aria-label="Loading swap-ins">
      <div v-for="i in 4" :key="i" class="s-swap-ins__skeleton">
        <SSkeleton width="40%" height="14px" />
        <SSkeleton width="20%" height="14px" />
      </div>
    </div>

    <SCard v-else-if="loadError">
      <SEmptyState title="Couldn't load swap-ins" :description="loadError">
        <template #actions><SButton @click="load">Try again</SButton></template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="filteredItems.length === 0">
      <SEmptyState :title="emptyTitle" :description="emptyDescription" />
    </SCard>

    <div v-else class="s-table-wrap">
      <table class="s-table">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col" class="s-hide-sm">Category</th>
            <th scope="col" class="s-hide-md">Date in</th>
            <th v-if="canViewProfitAndCost" scope="col" class="s-table__num">Cost price</th>
            <th v-if="canViewFinancials" scope="col" class="s-table__num">Unit price</th>
            <th scope="col">Status</th>
            <th v-if="canManageInventoryItems" scope="col" class="s-table__actions">
              <span class="ds-sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in paginatedItems"
            :key="item.id"
            class="s-table__row--interactive"
            tabindex="0"
            @click="openItem(item)"
            @keydown.enter.self="openItem(item)"
          >
            <td>
              <div class="s-swap-ins__name">
                <span class="s-table__primary">{{ getInventoryItemDisplayName(item) }}</span>
                <span v-if="itemSerial(item)" class="s-table__secondary">
                  Serial: {{ itemSerial(item) }}
                </span>
              </div>
            </td>
            <td class="s-hide-sm">{{ folderName(item.folderId) }}</td>
            <td class="s-hide-md s-table__muted">
              {{ formatDate(item.dateIn ?? item.createdAt) }}
            </td>
            <td v-if="canViewProfitAndCost" class="s-table__num">
              <template v-if="resolveItemUnitCost(item) !== undefined">
                {{ formatCurrency(resolveItemUnitCost(item)!) }}
              </template>
              <span v-else class="s-table__muted">–</span>
            </td>
            <td v-if="canViewFinancials" class="s-table__num">
              <SBadge v-if="!hasSaleUnitPrice(item)" tone="warning">No price</SBadge>
              <template v-else>{{ formatCurrency(Number(item.price) || 0) }}</template>
            </td>
            <td>
              <SBadge :tone="item.dateOut ? 'neutral' : 'success'">
                {{ item.dateOut ? 'Sold' : 'In stock' }}
              </SBadge>
            </td>
            <td v-if="canManageInventoryItems" class="s-table__actions" @click.stop>
              <SButton
                v-if="!item.dateOut"
                size="sm"
                :to="itemLink(item, true)"
                :aria-label="`Edit ${getInventoryItemDisplayName(item)}`"
              >
                Edit
              </SButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <SPagination
      v-if="!loading && filteredItems.length > PAGE_SIZE"
      :current-page="currentPage"
      :page-size="PAGE_SIZE"
      :total="filteredItems.length"
      label="Swap-ins pagination"
      @page-change="(page: number) => (currentPage = page)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import { useInventoryStore, type InventoryItem } from '~/stores/inventory'
import {
  getInventoryItemDisplayName,
  getInventoryItemField,
} from '~/composables/useInventoryItemDisplay'
import { useDashboardPaths } from '~/composables/useDashboardPaths'
import { usePreferences } from '~/composables/usePreferences'
import { resolveItemUnitCost } from '~/utils/inventory-item-cost'
import { hasSaleUnitPrice } from '~/utils/inventory-item-price'
import type { SwapInStatusFilter } from '~/utils/swap-in-credit'

const emit = defineEmits<{ count: [value: number] }>()

const PAGE_SIZE = 20

const inventoryStore = useInventoryStore()
const { canManageInventoryItems, canViewFinancials, canViewProfitAndCost } = usePermissions()
const { formatCurrency } = usePreferences()
const { dashPath } = useDashboardPaths()

const items = ref<InventoryItem[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)
/** Search and status come from the toolbar in the page's card header. */
const props = defineProps<{ search: string; status: SwapInStatusFilter }>()
const searchQuery = computed(() => props.search)
const statusFilter = computed(() => props.status)
const currentPage = ref(1)

async function load() {
  loading.value = true
  loadError.value = null
  try {
    items.value = await inventoryStore.fetchSwapInItems()
  } catch (error) {
    console.error('[inventory] Swap-ins load failed:', error)
    loadError.value = error instanceof Error ? error.message : 'Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

/** Unsold swap-ins: the number the tab badge shows. */
watch(items, (list) => emit('count', list.filter((item) => !item.dateOut).length), {
  immediate: true,
})

const foldersById = computed(() => new Map(inventoryStore.folders.map((f) => [f.id, f])))

function folderName(folderId: string): string {
  return foldersById.value.get(folderId)?.name ?? '–'
}

function itemSerial(item: InventoryItem): string {
  return (
    getInventoryItemField(item, 'serialNo') ||
    getInventoryItemField(item, 'serialNumber') ||
    getInventoryItemField(item, 'serial')
  )
}

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return items.value.filter((item) => {
    if (statusFilter.value === 'in-stock' && item.dateOut) return false
    if (statusFilter.value === 'sold' && !item.dateOut) return false
    if (statusFilter.value === 'no-price' && (item.dateOut || hasSaleUnitPrice(item))) return false
    if (!q) return true
    return [getInventoryItemDisplayName(item), itemSerial(item), folderName(item.folderId)]
      .join(' ')
      .toLowerCase()
      .includes(q)
  })
})

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
})

const paginatedItems = computed(() =>
  filteredItems.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)

const emptyTitle = computed(() => {
  if (items.value.length === 0) return 'No swap-ins yet'
  if (searchQuery.value.trim()) return 'No matching swap-ins'
  if (statusFilter.value === 'no-price') return 'Every swap-in has a price'
  return 'No swap-ins here'
})

const emptyDescription = computed(() =>
  items.value.length === 0
    ? 'Devices you take in as part payment on a sale will show here.'
    : 'Try another search or status.'
)

/** The item in its category; `edit` opens its edit form there. */
function itemLink(item: InventoryItem, edit = false) {
  return {
    path: dashPath(`/inventory/${item.folderId}`),
    query: edit ? { item: item.id, edit: '1' } : { item: item.id },
  }
}

function openItem(item: InventoryItem) {
  void navigateTo(itemLink(item))
}

function formatDate(value: unknown): string {
  if (!value) return '–'
  const date =
    value instanceof Date
      ? value
      : typeof (value as { toDate?: () => Date }).toDate === 'function'
      ? (value as { toDate: () => Date }).toDate()
      : new Date(value as string)
  if (!Number.isFinite(date.getTime())) return '–'
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.s-swap-ins {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-4, 16px);
}

.s-swap-ins__name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-swap-ins__skeleton {
  display: flex;
  justify-content: space-between;
  padding: var(--s-space-3, 12px) var(--s-space-4, 16px);
}
</style>
