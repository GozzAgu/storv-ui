<template>
  <div
    class="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white/90 shadow-sm transition duration-300 dark:border-gray-800/70 dark:bg-gray-900/35 dark:shadow-none"
  >
    <div
      class="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-gray-100/90 to-transparent opacity-60 blur-2xl dark:from-gray-800/40 dark:to-transparent"
      aria-hidden="true"
    />
    <div class="relative p-3 sm:p-3.5">
      <p
        class="text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500"
      >
        {{ label }}
      </p>
      <div class="mt-1 flex items-baseline justify-between gap-2">
        <p
          class="text-lg font-semibold tabular-nums tracking-tight text-gray-900 dark:text-gray-50 sm:text-xl"
        >
          {{ value }}
        </p>
        <span
          v-if="change !== undefined && change !== null"
          :class="[
            'flex-shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
            changePositive === true
              ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : changePositive === false
                ? 'bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
          ]"
        >
          {{ change }}
        </span>
      </div>
      <p
        v-if="subtext"
        :class="[
          'mt-1 text-[10px] leading-snug',
          subtextClass || 'text-gray-500 dark:text-gray-400',
        ]"
      >
        {{ subtext }}
      </p>
      <div v-if="sparklineData && sparklineData.length > 1" class="mt-2 h-5 w-full">
        <svg class="h-full w-full" viewBox="0 0 200 28" preserveAspectRatio="none">
          <path
            :d="sparklineAreaPath"
            class="fill-gray-400/[0.12] dark:fill-gray-500/[0.15]"
          />
          <path
            :d="sparklinePath"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-gray-500/90 dark:text-gray-400/90"
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
