<template>
  <button
    type="button"
    class="s-sort"
    :class="{ 's-sort--active': !!direction, 's-sort--end': align === 'end' }"
    @click="$emit('sort')"
  >
    <span>{{ label }}</span>
    <ArrowUp v-if="direction === 'asc'" :size="12" :stroke-width="2" aria-hidden="true" />
    <ArrowDown v-else-if="direction === 'desc'" :size="12" :stroke-width="2" aria-hidden="true" />
    <ArrowUpDown v-else class="s-sort__idle" :size="12" :stroke-width="2" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, ArrowUpDown } from '@lucide/vue'

/** Column header button; the parent `<th>` carries `aria-sort`. */
defineProps<{
  label: string
  direction?: 'asc' | 'desc' | null
  align?: 'start' | 'end'
}>()

defineEmits<{ sort: [] }>()
</script>
