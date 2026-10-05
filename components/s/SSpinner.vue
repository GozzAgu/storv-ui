<template>
  <Loader2
    class="s-spin"
    :size="size"
    :stroke-width="2"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label"
    :role="label ? 'status' : undefined"
  />
</template>

<script setup lang="ts">
import { Loader2 } from '@lucide/vue'

withDefaults(
  defineProps<{
    size?: number
    /** Announced to screen readers; omit when a parent already conveys the busy state. */
    label?: string
  }>(),
  { size: 16 }
)
</script>
