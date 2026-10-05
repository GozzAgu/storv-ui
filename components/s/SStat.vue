<template>
  <component :is="to ? NuxtLink : 'div'" :to="to" class="s-c s-stat">
    <span v-if="$slots.icon" class="s-stat__head">
      <span class="s-stat__icon" :class="tone ? `s-stat__icon--${tone}` : undefined" aria-hidden="true">
        <slot name="icon" />
      </span>
      <span class="s-stat__label">{{ label }}</span>
    </span>
    <span v-else class="s-stat__label">{{ label }}</span>
    <span class="s-stat__value">
      <slot>{{ value }}</slot>
    </span>
    <span v-if="delta !== undefined || hint" class="s-stat__foot">
      <span
        v-if="delta !== undefined"
        class="s-stat__delta"
        :class="delta > 0 ? 's-stat__delta--up' : delta < 0 ? 's-stat__delta--down' : ''"
      >
        <span class="ds-sr-only">{{ delta > 0 ? 'Up' : delta < 0 ? 'Down' : 'No change' }}</span>
        {{ delta > 0 ? '+' : '' }}{{ formatDelta(delta) }}%
      </span>
      <span v-if="hint" :class="tone ? `s-stat__hint--${tone}` : undefined">{{ hint }}</span>
    </span>
    <span v-if="$slots.visual" class="s-stat__visual">
      <slot name="visual" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'

defineProps<{
  label: string
  value?: string | number
  /** Percentage change versus the comparison period. */
  delta?: number
  hint?: string
  /** Colours the hint and icon when the value needs attention. */
  tone?: 'success' | 'warning' | 'error'
  to?: string
}>()

const NuxtLink = resolveComponent('NuxtLink')

function formatDelta(delta: number) {
  return Math.abs(delta) >= 10 ? Math.round(delta) : Number(delta.toFixed(1))
}
</script>
