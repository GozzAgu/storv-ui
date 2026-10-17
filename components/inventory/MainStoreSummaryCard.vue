<template>
  <SCard
    v-if="summary && !summary.isOwnBranch && summary.totals"
    class="s-main-store-summary"
    :title="`Main store · ${mainStoreLabel}`"
    :description="`Read-only totals from ${mainStoreLabel}.`"
  >
    <template #actions>
      <SBadge>Read-only</SBadge>
    </template>

    <dl class="s-metrics s-metrics--line" :aria-label="`${mainStoreLabel} summary`">
      <div v-for="metric in metrics" :key="metric.key" class="s-metrics__item">
        <dt class="s-metrics__label">{{ metric.label }}</dt>
        <dd class="s-metrics__value" :class="metric.tone && `s-metrics__value--${metric.tone}`">
          {{ metric.value }}
        </dd>
      </div>
    </dl>

    <template v-if="summary.categories.length > 0">
      <SButton
        variant="ghost"
        size="sm"
        :aria-expanded="expanded"
        :aria-controls="listId"
        @click="expanded = !expanded"
      >
        <template #trailing>
          <ChevronDown
            :size="14"
            :stroke-width="2"
            class="s-main-store-summary__chevron"
            :class="{ 'is-open': expanded }"
            aria-hidden="true"
          />
        </template>
        {{ expanded ? 'Hide categories' : 'Show categories' }}
      </SButton>

      <div v-if="expanded" :id="listId" class="s-table-wrap">
        <table class="s-table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col" class="s-table__num">Products</th>
              <th scope="col" class="s-table__num">Low stock</th>
              <th v-if="showValue" scope="col" class="s-table__num">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in summary.categories" :key="category.id">
              <td>{{ category.name }}</td>
              <td class="s-table__num">{{ category.itemCount }}</td>
              <td
                class="s-table__num"
                :class="category.lowStockCount > 0 ? 's-table__warning' : 's-table__muted'"
              >
                {{ category.lowStockCount }}
              </td>
              <td v-if="showValue" class="s-table__num" data-figure>
                {{ formatCurrency(category.totalValue ?? 0) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </SCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue'
import { ChevronDown } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import { usePreferences } from '~/composables/usePreferences'
import { useAuthStore } from '~/stores/auth'
import { useStoresStore } from '~/stores/stores'
import type { MainStoreSummaryResponse } from '~/types/main-store-summary'
import { resolveApiPath } from '~/utils/api-url'
import { isDemoModeActive } from '~/utils/demo-mode'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'

const authStore = useAuthStore()
const storesStore = useStoresStore()
const { formatCurrency } = usePreferences()

const summary = ref<MainStoreSummaryResponse | null>(null)
const expanded = ref(false)
const listId = useId()

const mainStoreLabel = computed(() => {
  const name = summary.value?.mainStore.name ?? ''
  return getStoreBranchShortLabel(name) || name || 'Main store'
})

const showValue = computed(() => summary.value?.totals?.totalValue !== undefined)

const metrics = computed(() => {
  const totals = summary.value?.totals
  if (!totals) return []
  const rows: Array<{ key: string; label: string; value: string; tone?: string }> = [
    { key: 'categories', label: 'Categories', value: String(totals.categories) },
    { key: 'products', label: 'Products', value: String(totals.products) },
  ]
  if (totals.totalValue !== undefined) {
    rows.push({ key: 'value', label: 'Total value', value: formatCurrency(totals.totalValue) })
  }
  rows.push({
    key: 'low-stock',
    label: 'Low stock',
    value: String(totals.lowStock),
    tone: totals.lowStock > 0 ? 'warning' : undefined,
  })
  return rows
})

async function load() {
  if (isDemoModeActive() || !authStore.currentUser) return
  try {
    const token = await authStore.currentUser.getIdToken()
    summary.value = await $fetch<MainStoreSummaryResponse>(
      resolveApiPath('/api/workspace/main-store-summary'),
      { headers: { Authorization: `Bearer ${token}` } }
    )
  } catch (err) {
    summary.value = null
    console.warn('[MainStoreSummaryCard] Could not load main store totals:', err)
  }
}

onMounted(load)
watch(() => storesStore.currentStoreId, load)

defineExpose({ refresh: load })
</script>
