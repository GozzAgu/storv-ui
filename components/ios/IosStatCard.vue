<template>
  <IosGlassCard :elevated="hero" :padding="hero ? 'lg' : 'md'" :class="cardClass">
    <p class="ios-stat-label">{{ label }}</p>
    <div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <p :class="valueClass">
        <slot name="value">{{ value }}</slot>
      </p>
      <span
        v-if="change !== undefined && change !== null && change !== ''"
        :class="['text-sm font-semibold tabular-nums', deltaClass]"
      >
        {{ change }}
      </span>
    </div>
    <p v-if="subtext" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ subtext }}
    </p>
    <div v-if="sparklineData && sparklineData.length > 1" class="mt-3 h-7 w-full opacity-80">
      <svg class="h-full w-full text-[#143f8d] dark:text-[#9ab5e3]" viewBox="0 0 200 28" preserveAspectRatio="none">
        <path :d="sparklineAreaPath" fill="currentColor" fill-opacity="0.12" />
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
    <slot />
  </IosGlassCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IosGlassCard from '~/components/ios/IosGlassCard.vue'

const props = withDefaults(
  defineProps<{
    label: string
    value?: string | number
    subtext?: string
    change?: string | null
    changePositive?: boolean | null
    sparklineData?: number[]
    hero?: boolean
    accent?: 'default' | 'success' | 'warning' | 'danger'
  }>(),
  {
    value: '',
    subtext: '',
    change: undefined,
    changePositive: null,
    sparklineData: undefined,
    hero: false,
    accent: 'default',
  }
)

const valueClass = computed(() =>
  props.hero ? 'ios-stat-value ios-stat-value--hero' : 'ios-stat-value ios-stat-value--compact'
)

const cardClass = computed(() => {
  if (props.accent === 'warning') return 'border-l-4 border-l-[#ff9500]'
  if (props.accent === 'danger') return 'border-l-4 border-l-[#ff3b30]'
  if (props.accent === 'success') return 'border-l-4 border-l-[#34c759]'
  return ''
})

const deltaClass = computed(() => {
  if (props.changePositive === true) return 'ios-stat-delta--up'
  if (props.changePositive === false) return 'ios-stat-delta--down'
  return 'text-gray-500 dark:text-gray-400'
})

const sparklinePath = computed(() => buildSparklinePath(props.sparklineData ?? [], false))
const sparklineAreaPath = computed(() => buildSparklinePath(props.sparklineData ?? [], true))

function buildSparklinePath(data: number[], area: boolean) {
  if (data.length < 2) return ''
  const w = 200
  const h = 28
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = w / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * step
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  })

  if (!area) return `M ${points.join(' L ')}`

  return `M 0,${h} L ${points.join(' L ')} L ${w},${h} Z`
}
</script>
