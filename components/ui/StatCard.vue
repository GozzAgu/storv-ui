<template>
  <div class="dash-stat-card">
    <div class="dash-stat-card__body">
      <p class="dash-stat-card__label">{{ label }}</p>
      <div class="dash-stat-card__row">
        <p class="dash-stat-card__value dash-num">
          <slot name="value">{{ value }}</slot>
        </p>
        <span
          v-if="change !== undefined && change !== null"
          :class="[
            'dash-stat-card__change dash-num',
            changePositive === true
              ? 'dash-stat-card__change--up'
              : changePositive === false
                ? 'dash-stat-card__change--down'
                : 'dash-stat-card__change--neutral',
          ]"
        >
          {{ change }}
        </span>
      </div>
      <p
        v-if="(subtext !== undefined && subtext !== null && subtext !== '') || $slots.subtext"
        :class="['dash-stat-card__subtext', resolvedSubtextClass]"
      >
        <slot name="subtext">{{ subtext }}</slot>
      </p>
      <div v-if="sparklineData && sparklineData.length > 1" class="dash-stat-card__sparkline">
        <svg class="h-full w-full" viewBox="0 0 200 28" preserveAspectRatio="none">
          <path :d="sparklineAreaPath" />
          <path
            :d="sparklinePath"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value?: string | number
    subtext?: string
    subtextClass?: string
    change?: string | null
    changePositive?: boolean | null
    sparklineData?: number[]
    icon?: any
    iconClass?: string
    iconBgClass?: string
  }>(),
  {
    change: undefined,
    changePositive: null,
    sparklineData: undefined,
    icon: undefined,
    iconClass: '',
    iconBgClass: '',
  }
)

const resolvedSubtextClass = computed(() => {
  const token = props.subtextClass?.trim().toLowerCase() || ''
  if (token.includes('success') || token.includes('emerald') || token.includes('3f8f7c')) {
    return 'dash-stat-card__subtext--success'
  }
  if (token.includes('warning') || token.includes('amber') || token.includes('b9791c')) {
    return 'dash-stat-card__subtext--warning'
  }
  if (token.includes('danger') || token.includes('red')) {
    return 'dash-stat-card__subtext--danger'
  }
  return ''
})

const sparklinePath = computed(() => {
  const data = props.sparklineData
  if (!data || data.length < 2) return ''
  return buildPath(data)
})

const sparklineAreaPath = computed(() => {
  const data = props.sparklineData
  if (!data || data.length < 2) return ''
  const line = buildPath(data)
  const w = 200
  const h = 28
  return `${line} L ${w},${h} L 0,${h} Z`
})

function buildPath(data: number[]) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 200
  const h = 28
  const padding = 2
  const step = (w - padding * 2) / (data.length - 1)
  const points = data.map((val, i) => {
    const x = padding + i * step
    const y = h - padding - ((val - min) / range) * (h - padding * 2)
    return `${x},${y}`
  })
  return `M ${points.join(' L ')}`
}
</script>
