<template>
  <header class="s-auth-header">
    <h1 class="s-auth-header__title">{{ title }}</h1>
    <p v-if="subtitle" class="s-auth-header__subtitle">{{ subtitle }}</p>
    <p v-if="$slots.default" class="s-auth-header__subtitle">
      <slot />
    </p>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>
