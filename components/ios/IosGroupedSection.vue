<template>
  <section class="ios-grouped-list">
    <p v-if="label" class="ios-grouped-section__header">{{ label }}</p>
    <div class="ios-grouped-section">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>
