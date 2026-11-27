<template>
  <svg
    :x="x"
    :y="y"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="label ? undefined : 'true'"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    focusable="false"
    class="sv-icon"
  >
    <path
      v-for="(part, i) in parts"
      :key="i"
      :d="part.d"
      :transform="part.transform"
      :fill="part.tone ? 'currentColor' : 'none'"
      :fill-opacity="part.tone ? (part.tone === 'fill' ? 0.3 : 0.14) : undefined"
      :stroke="part.tone && !part.outline ? 'none' : undefined"
      :stroke-width="part.width"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { STORVV_ICONS, type StorvvIconName } from '~/utils/storvv-icons'

/**
 * One icon from Storvv's own set (utils/storvv-icons.ts). Colour comes from the text colour.
 * Works on its own or inside another SVG (x / y place it). Decorative unless `label` is given.
 */
const props = withDefaults(
  defineProps<{
    name: StorvvIconName
    size?: number | string
    strokeWidth?: number
    label?: string
    x?: number | string
    y?: number | string
  }>(),
  { size: 24, strokeWidth: 1.6, label: undefined, x: undefined, y: undefined }
)

const parts = computed(() => STORVV_ICONS[props.name])
</script>
