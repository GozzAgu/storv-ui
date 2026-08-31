<template>
  <section class="ios-settings-group">
    <h2 class="ios-settings-group__title">{{ title }}</h2>
    <div class="ios-settings-group__card">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>
