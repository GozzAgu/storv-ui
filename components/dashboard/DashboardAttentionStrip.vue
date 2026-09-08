<template>
  <nav v-if="items.length > 0" class="dash-attention-strip" aria-label="Needs attention">
    <p class="dash-attention-strip__label">Needs attention</p>
    <ul class="dash-attention-strip__list">
      <li v-for="item in items" :key="item.id">
        <NuxtLink
          :to="item.href"
          class="dash-attention-chip"
          :class="`dash-attention-chip--${item.level}`"
        >
          <span class="dash-attention-chip__title">{{ item.title }}</span>
          <span class="dash-attention-chip__meta">{{ chipMeta(item) }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { DashboardAlert } from '~/composables/useDashboardInsights'

defineProps<{
  items: DashboardAlert[]
}>()

function chipMeta(item: DashboardAlert): string {
  // Prefer a short count-style lead from the description when present.
  const match = item.description.match(/^(\d+[^\s.]*)/)
  if (match?.[1]) return match[1]
  return item.cta
}
</script>
