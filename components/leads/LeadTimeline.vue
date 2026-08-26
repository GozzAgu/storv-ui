<template>
  <ul v-if="events.length > 0" class="space-y-3">
    <li
      v-for="event in events"
      :key="event.id"
      class="rounded-sm border border-gray-200/80 bg-gray-50/60 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <p class="text-xs text-gray-800 dark:text-gray-200">{{ event.description }}</p>
      <p class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
        {{ formatWhen(event.createdAt) }}
      </p>
    </li>
  </ul>
  <p v-else class="text-xs text-gray-500 dark:text-gray-400">No activity yet.</p>
</template>

<script setup lang="ts">
import type { SalesLeadEvent } from '~/types/leads'

defineProps<{
  events: SalesLeadEvent[]
}>()

function formatWhen(v: Date | undefined) {
  if (!v) return '-'
  try {
    return v.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '-'
  }
}
</script>
