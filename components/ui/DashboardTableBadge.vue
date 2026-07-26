<template>
  <span :class="badgeClass">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  badgeClass: string
  label?: string
}>()
</script>
