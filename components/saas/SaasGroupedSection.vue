<template>
  <section class="saas-grouped-section">
    <p v-if="title" class="saas-grouped-section__header">{{ title }}</p>
    <div>
      <slot />
    </div>
    <p v-if="footer" class="px-4 pb-3 pt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
      {{ footer }}
    </p>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    footer?: string
  }>(),
  {
    title: '',
    footer: '',
  }
)
</script>
