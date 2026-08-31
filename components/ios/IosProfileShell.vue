<template>
  <header class="ios-profile-shell">
    <img
      src="/storvv logo mobile.png"
      alt="Storvv"
      class="ios-profile-shell__logo"
      width="28"
      height="28"
      decoding="async"
    />
    <div class="ios-profile-shell__intro">
      <h1 class="ios-profile-shell__title">{{ displayName }}</h1>
      <p v-if="subtitle" class="ios-profile-shell__subtitle">{{ subtitle }}</p>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  displayName: string
  subtitle?: string
}>()
</script>
