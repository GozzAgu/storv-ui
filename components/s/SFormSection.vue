<template>
  <section class="s-form-section">
    <h3 v-if="title && showTitle" class="s-form-section__title">{{ title }}</h3>
    <slot />
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title?: string; showTitle?: boolean }>(), { showTitle: true })
</script>
