<template>
  <SCard title="Best selling products" flush class="s-overview-top">
    <template #actions>
      <SButton variant="ghost" size="sm" to="/dashboard/analytics">View report</SButton>
    </template>
    <p v-if="items.length === 0" class="s-list__empty">
      Products you sell will be ranked here by revenue.
    </p>
    <div v-else class="s-table-wrap">
      <table class="s-table">
        <thead>
          <tr>
            <th scope="col" class="s-overview-top__rank s-hide-sm">#</th>
            <th scope="col">Product</th>
            <th scope="col" class="s-table__num">Sold</th>
            <th scope="col" class="s-table__num">Revenue</th>
            <th scope="col" class="s-overview-top__share s-hide-sm">Share</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="item.id">
            <td class="s-overview-top__rank s-hide-sm">{{ index + 1 }}</td>
            <td>
              <span class="s-table__primary s-overview-top__name">{{ item.name }}</span>
            </td>
            <td class="s-table__num">{{ item.sales.toLocaleString('en-US') }}</td>
            <td class="s-table__num">{{ formatCurrency(item.revenue) }}</td>
            <td class="s-overview-top__share s-hide-sm">
              <span class="s-overview-top__meter" aria-hidden="true">
                <span :style="{ width: `${Math.max(item.share, 2)}%` }" />
              </span>
              <span class="s-overview-top__pct">{{ item.share }}%</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </SCard>
</template>

<script setup lang="ts">
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import type { DashboardTopProduct } from '~/composables/useDashboardInsights'

defineProps<{
  items: DashboardTopProduct[]
  formatCurrency: (value: number) => string
}>()
</script>
