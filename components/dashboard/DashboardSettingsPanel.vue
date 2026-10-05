<template>
  <SCard :id="id" :title="title" :description="subtitle" :class="{ 's-settings-panel--compact': compact }">
    <template v-if="$slots.actions || badge" #actions>
      <slot name="actions" />
      <SBadge v-if="badge && !$slots.actions" tone="accent">{{ badge }}</SBadge>
    </template>
    <slot />
  </SCard>
</template>

<script setup lang="ts">
import SBadge from '~/components/s/SBadge.vue'
import SCard from '~/components/s/SCard.vue'

defineProps<{
  id?: string
  title: string
  subtitle?: string
  badge?: string
  compact?: boolean
}>()
</script>
