<template>
  <ol class="space-y-3">
    <li
      v-for="event in events"
      :key="event.id"
      class="relative border-l-2 border-gray-200 pl-4 dark:border-gray-700"
    >
      <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
        {{ event.description }}
      </p>
      <p class="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
        {{ event.createdByName || 'Staff' }}
        ·
        {{ formatWhen(event.timestamp) }}
      </p>
    </li>
  </ol>
</template>

<script setup lang="ts">
import type { SocialEvent } from '~/types/social-sales'

defineProps<{
  events: SocialEvent[]
}>()

function formatWhen(v: Date) {
  try {
    return v.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '-'
  }
}
</script>
