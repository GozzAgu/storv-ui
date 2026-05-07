<template>
  <div
    class="group relative overflow-hidden rounded-xl bg-white/85 ring-1 ring-inset ring-gray-200/55 backdrop-blur-md transition duration-300 dark:bg-dashboard-card/88 dark:ring-white/[0.06] dark:backdrop-blur-xl"
  >
    <!-- Specular highlight -->
    <span
      class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/50 via-transparent to-transparent opacity-70 dark:from-white/[0.06] dark:opacity-100"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-linear-to-br from-primary-400/10 to-transparent opacity-90 blur-2xl dark:from-primary-400/15 sm:h-32 sm:w-32"
      aria-hidden="true"
    />
    <div class="relative p-2.5 sm:p-3 md:p-3.5">
      <p
        class="text-[9px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400 sm:text-[10px]"
      >
        {{ label }}
      </p>
      <div class="mt-1.5 flex min-w-0 items-baseline justify-between gap-1.5 sm:gap-2">
        <p
          class="min-w-0 flex-1 text-xs font-semibold tabular-nums tracking-tight leading-tight text-gray-900 dark:text-gray-50 sm:text-sm md:text-base lg:text-lg xl:text-xl sm:leading-snug"
        >
          <slot name="value">{{ value }}</slot>
        </p>
        <span
          v-if="change !== undefined && change !== null"
          :class="[ 'shrink-0 rounded-full px-1 py-0.5 text-[9px] font-semibold tabular-nums sm:px-2 sm:py-0.5 sm:text-[10px] md:text-[11px]', changePositive === true ? 'bg-emerald-500/[0.12] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : changePositive === false ? 'bg-red-500/[0.12] text-red-700 dark:bg-red-500/15 dark:text-red-400' : 'bg-gray-100/90 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400', ]"
        >
          {{ change }}
        </span>
      </div>
      <p
        v-if="subtext !== undefined && subtext !== null && subtext !== '' || $slots.subtext"
        :class="[ 'mt-1 text-[9px] leading-relaxed sm:text-[10px] md:text-[11px]', subtextClass || 'text-gray-500 dark:text-gray-400', ]"
      >
        <slot name="subtext">{{ subtext }}</slot>
      </p>
      <div v-if="sparklineData && sparklineData.length > 1" class="mt-2 h-5 w-full sm:h-[1.375rem]">
        <svg class="h-full w-full" viewBox="0 0 200 28" preserveAspectRatio="none">
          <path
            :d="sparklineAreaPath"
            class="fill-primary-500/[0.08] dark:fill-primary-400/[0.12]"
          />
          <path
            :d="sparklinePath"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-primary-500/35 dark:text-primary-300/45"
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
