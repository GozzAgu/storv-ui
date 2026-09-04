<template>
  <article class="analytics-kpi-card" :class="`analytics-kpi-card--${tone}`">
    <div class="analytics-kpi-card__top">
      <span class="analytics-kpi-card__icon" aria-hidden="true">
        <component :is="icon" class="h-4 w-4" stroke-width="1.75" />
      </span>
      <span
        v-if="trend"
        class="analytics-kpi-card__trend"
        :class="trend.positive ? 'analytics-kpi-card__trend--up' : 'analytics-kpi-card__trend--down'"
      >
        <component :is="trend.positive ? ArrowUpIcon : ArrowDownIcon" class="h-3 w-3" aria-hidden="true" />
        {{ trend.value }}
      </span>
    </div>

    <p class="analytics-kpi-card__label">{{ label }}</p>
    <p class="analytics-kpi-card__value dash-num" :title="value">{{ value }}</p>
    <p v-if="secondary" class="analytics-kpi-card__secondary">{{ secondary }}</p>

    <svg
      v-if="sparkline && sparkline.length > 1"
      class="analytics-kpi-card__sparkline"
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        :points="sparklinePoints"
        fill="none"
        stroke="currentColor"
        stroke-width="2.25"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <div v-else-if="progress != null" class="analytics-kpi-card__progress" role="presentation">
      <span
        class="analytics-kpi-card__progress-fill"
        :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { ArrowDownIcon, ArrowUpIcon } from '~/utils/app-icons'

const props = defineProps<{
  icon: Component
  label: string
  value: string
  /** Visual tone drives the icon tile and accent colors. */
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger'
  /** Short line of extra context under the value (e.g. "12% repeat"). */
  secondary?: string
  /** Small up/down badge, e.g. period-over-period change. */
  trend?: { value: string; positive: boolean } | null
  /** Real historical values to trace as a tiny trend line (e.g. revenue per month). */
  sparkline?: number[] | null
  /** 0-100 fill for a slim progress bar - used when a sparkline isn't meaningful. */
  progress?: number | null
}>()

const tone = computed(() => props.tone ?? 'default')

const sparklinePoints = computed(() => {
  const data = props.sparkline ?? []
  if (data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = 100 / (data.length - 1)
  return data
    .map((value, i) => {
      const x = i * stepX
      // Leave a little headroom so peaks don't clip against the viewBox edge.
      const y = 26 - ((value - min) / range) * 24
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
})
</script>

<style scoped>
.analytics-kpi-card {
  display: flex;
  min-height: 7.5rem;
  flex-direction: column;
  gap: 0.375rem;
  border-radius: 0.875rem;
  padding: 0.875rem;
  background: rgb(26 21 35 / 0.04);
}

html.dark .analytics-kpi-card {
  background: rgb(255 255 255 / 0.05);
}

.analytics-kpi-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.analytics-kpi-card__icon {
  display: flex;
  height: 1.875rem;
  width: 1.875rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.625rem;
  background: rgb(26 21 35 / 0.08);
  color: var(--dash-card-ink, #0f172a);
}

html.dark .analytics-kpi-card__icon {
  background: rgb(255 255 255 / 0.1);
  color: #ffffff;
}

.analytics-kpi-card__trend {
  display: inline-flex;
  align-items: center;
  gap: 0.1875rem;
  border-radius: 9999px;
  padding: 0.125rem 0.4rem;
  font-size: 0.6875rem;
  font-weight: 650;
}

.analytics-kpi-card__trend--up {
  background: rgb(52 211 153 / 0.15);
  color: #0d9668;
}

.analytics-kpi-card__trend--down {
  background: rgb(248 113 113 / 0.15);
  color: #dc2626;
}

html.dark .analytics-kpi-card__trend--up {
  color: #34d399;
}

html.dark .analytics-kpi-card__trend--down {
  color: #f87171;
}

.analytics-kpi-card__label {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--dash-card-muted, #64748b);
}

.analytics-kpi-card__value {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.125rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--dash-card-ink, #0f172a);
}

.analytics-kpi-card__secondary {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.6875rem;
  line-height: 1.4;
  color: var(--dash-card-muted, #64748b);
}

.analytics-kpi-card__sparkline {
  margin-top: auto;
  width: 100%;
  height: 1.75rem;
  color: var(--dash-card-accent, #143f8d);
}

.analytics-kpi-card__progress {
  margin-top: auto;
  height: 0.375rem;
  width: 100%;
  overflow: hidden;
  border-radius: 9999px;
  background: rgb(26 21 35 / 0.08);
}

html.dark .analytics-kpi-card__progress {
  background: rgb(255 255 255 / 0.12);
}

.analytics-kpi-card__progress-fill {
  display: block;
  height: 100%;
  border-radius: 9999px;
  background: var(--dash-card-accent, #143f8d);
  transition: width 0.3s ease;
}

/* Tone accents: icon tile + sparkline/progress color follow the metric's meaning. */
.analytics-kpi-card--success .analytics-kpi-card__icon {
  background: rgb(52 211 153 / 0.16);
  color: #0d9668;
}

.analytics-kpi-card--warning .analytics-kpi-card__icon {
  background: rgb(251 191 36 / 0.18);
  color: #b45309;
}

.analytics-kpi-card--danger .analytics-kpi-card__icon {
  background: rgb(248 113 113 / 0.16);
  color: #dc2626;
}

.analytics-kpi-card--accent .analytics-kpi-card__icon {
  background: rgb(113 113 122 / 0.14);
  color: #3f3f46;
}

.analytics-kpi-card--accent .analytics-kpi-card__sparkline {
  color: #3f3f46;
}

html.dark .analytics-kpi-card--success .analytics-kpi-card__icon {
  color: #34d399;
}

html.dark .analytics-kpi-card--warning .analytics-kpi-card__icon {
  color: #fbbf24;
}

html.dark .analytics-kpi-card--danger .analytics-kpi-card__icon {
  color: #f87171;
}

html.dark .analytics-kpi-card--accent .analytics-kpi-card__icon {
  background: rgb(228 228 231 / 0.16);
  color: #e4e4e7;
}

html.dark .analytics-kpi-card--accent .analytics-kpi-card__sparkline {
  color: #e4e4e7;
}

.analytics-kpi-card--warning .analytics-kpi-card__progress-fill {
  background: #f59e0b;
}

.analytics-kpi-card--danger .analytics-kpi-card__progress-fill {
  background: #ef4444;
}
</style>
