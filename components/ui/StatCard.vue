<template>
  <div
    class="relative overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800/80 transition-all duration-200"
  >
    <div class="p-2.5 sm:p-3">
      <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-tight">
        {{ label }}
      </p>
      <div class="mt-0.5 flex items-baseline justify-between gap-2">
        <p class="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 tabular-nums truncate">
          {{ value }}
        </p>
        <span
          v-if="change !== undefined && change !== null"
          :class="[
            'flex-shrink-0 text-[11px] font-medium tabular-nums',
            changePositive === true ? 'text-green-600 dark:text-green-400' : changePositive === false ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          ]"
        >
          {{ change }}
        </span>
      </div>
      <p
        v-if="subtext"
        :class="['mt-0.5 text-[10px] truncate leading-tight', subtextClass || 'text-gray-500 dark:text-gray-400']"
      >
        {{ subtext }}
      </p>
      <div v-if="sparklineData && sparklineData.length > 1" class="mt-1.5 h-5 w-full flex items-end">
        <svg class="w-full h-full min-h-[16px]" viewBox="0 0 200 24" preserveAspectRatio="none">
          <path
            :d="sparklinePath"
            fill="none"
            stroke="currentColor"
            stroke-width="1.25"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-gray-400/80 dark:text-gray-500/80"
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
    value: string | number
    subtext?: string
    subtextClass?: string
    /** e.g. "+28%" or "-5%" - shown in green/red when changePositive is set */
    change?: string | null
    /** true = green, false = red, undefined = grey */
    changePositive?: boolean | null
    /** Optional array of numbers for sparkline (e.g. last 14 days revenue) */
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
    iconBgClass: ''
  }
)

const sparklinePath = computed(() => {
  const data = props.sparklineData
  if (!data || data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 200
  const h = 24
  const padding = 2
  const step = (w - padding * 2) / (data.length - 1)
  const points = data.map((val, i) => {
    const x = padding + i * step
    const y = h - padding - ((val - min) / range) * (h - padding * 2)
    return `${x},${y}`
  })
  return `M ${points.join(' L ')}`
})
</script>
