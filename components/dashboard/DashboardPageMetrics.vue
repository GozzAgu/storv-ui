<template>
  <div class="dash-page-metrics" :aria-label="ariaLabel">
    <div v-for="metric in metrics" :key="metric.key" class="dash-page-metric" :data-metric-key="metric.key">
      <span class="dash-page-metric__label">{{ metric.label }}</span>
      <span
        class="dash-page-metric__value dash-num"
        :class="metric.tone && metric.tone !== 'default' ? `dash-page-metric__value--${metric.tone}` : ''"
        :title="metric.value"
      >
        {{ metric.value }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardPageMetric } from '~/utils/dashboard-page-metrics'

withDefaults(
  defineProps<{
    metrics: DashboardPageMetric[]
    ariaLabel?: string
  }>(),
  {
    ariaLabel: 'Page summary',
  }
)
</script>
