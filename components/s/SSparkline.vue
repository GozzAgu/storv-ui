<template>
  <svg
    class="s-sparkline"
    viewBox="0 0 100 32"
    preserveAspectRatio="none"
    role="img"
    :aria-label="label"
  >
    <path v-if="paths" class="s-sparkline__area" :d="paths.area" />
    <path v-if="paths" class="s-sparkline__line" :d="paths.line" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  values: number[]
  /** Accessible summary of the trend. */
  label: string
}>()

const paths = computed(() => {
  const values = props.values
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const step = 100 / (values.length - 1)
  const points = values.map((v, i) => `${(i * step).toFixed(2)},${(30 - ((v - min) / range) * 28).toFixed(2)}`)
  const line = `M${points.join('L')}`
  return { line, area: `${line}L100,32L0,32Z` }
})
</script>
