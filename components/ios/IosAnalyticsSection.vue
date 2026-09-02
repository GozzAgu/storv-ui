<template>
  <section class="ios-home-dashboard__section ios-analytics-section">
    <div class="ios-home-dashboard__section-head">
      <div class="min-w-0">
        <h2 class="ios-home-dashboard__section-title">{{ title }}</h2>
        <p v-if="subtitle" class="ios-analytics-section__subtitle">{{ subtitle }}</p>
      </div>
      <NuxtLink v-if="linkTo" :to="linkTo" class="ios-home-dashboard__section-link">
        {{ linkLabel || 'View all' }}
      </NuxtLink>
      <slot name="actions" />
    </div>
    <div class="ios-analytics-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  linkTo?: string
  linkLabel?: string
}>()
</script>
