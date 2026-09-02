<template>
  <header class="auth-page-header">
    <a
      v-if="showLogo"
      href="https://www.storvv.com"
      class="auth-page-header__logo-wrap"
      aria-label="Storvv home"
    >
      <img src="/storvv logo mobile.png" alt="Storvv" class="auth-page-header__logo" width="44" height="44" />
    </a>
    <h1 class="auth-page-header__title">{{ title }}</h1>
    <p v-if="subtitle" class="auth-page-header__subtitle">{{ subtitle }}</p>
    <p v-if="$slots.default" class="auth-page-header__lede">
      <slot />
    </p>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    showLogo?: boolean
  }>(),
  {
    showLogo: true,
  }
)
</script>
