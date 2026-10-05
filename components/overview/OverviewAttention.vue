<template>
  <SCard title="Needs attention" flush class="s-overview-attention">
    <ul v-if="items.length > 0" class="s-list">
      <li v-for="item in items" :key="item.id">
        <NuxtLink :to="item.href" class="s-list__item s-list__item--interactive">
          <span
            class="s-overview-attention__mark"
            :class="`s-overview-attention__mark--${item.level}`"
            aria-hidden="true"
          >
            <component :is="levelIcon[item.level]" :size="16" :stroke-width="2" />
          </span>
          <span class="s-list__main">
            <span class="s-list__primary">{{ item.title }}</span>
            <span class="s-list__secondary">{{ item.description }}</span>
          </span>
          <span class="ds-sr-only">{{ item.cta }}</span>
          <ChevronRight class="s-list__lead" :size="16" :stroke-width="2" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>
    <div v-else class="s-overview-attention__clear">
      <span class="s-overview-attention__mark s-overview-attention__mark--ok" aria-hidden="true">
        <Check :size="16" :stroke-width="2" />
      </span>
      <div>
        <p class="s-list__primary">All clear</p>
        <p class="s-list__secondary">Nothing needs your attention right now.</p>
      </div>
    </div>
  </SCard>
</template>

<script setup lang="ts">
import { Check, ChevronRight, CircleAlert, Info, TriangleAlert } from '@lucide/vue'
import SCard from '~/components/s/SCard.vue'
import type { DashboardAlert, DashboardAlertLevel } from '~/composables/useDashboardInsights'

defineProps<{
  items: DashboardAlert[]
}>()

const levelIcon: Record<DashboardAlertLevel, typeof Info> = {
  critical: CircleAlert,
  warning: TriangleAlert,
  info: Info,
}
</script>
