<template>
  <div class="s-c s-empty">
    <span v-if="$slots.icon" class="s-empty__icon" aria-hidden="true"><slot name="icon" /></span>
    <h3 class="s-empty__title">{{ title }}</h3>
    <p v-if="description" class="s-empty__description">{{ description }}</p>
    <div v-if="$slots.actions" class="s-empty__actions"><slot name="actions" /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>
