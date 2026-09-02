<template>
  <section class="ios-grouped-list">
    <p v-if="sectionLabel" class="ios-grouped-section__header">{{ sectionLabel }}</p>
    <div class="ios-grouped-section">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label?: string
  header?: string
}>()

const sectionLabel = computed(() => props.header || props.label)
</script>
