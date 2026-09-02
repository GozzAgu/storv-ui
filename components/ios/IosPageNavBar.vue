<template>
  <header class="ios-page-nav-bar">
    <div class="ios-page-nav-bar__side">
      <slot name="leading">
        <DashboardBackButton
          v-if="showBack"
          :to="backTo"
          :label="backLabel"
          variant="icon"
          :fallback-to="fallbackTo"
        />
        <span v-else class="ios-page-nav-bar__spacer" aria-hidden="true" />
      </slot>
    </div>
    <h1 class="ios-page-nav-bar__title">{{ title }}</h1>
    <div class="ios-page-nav-bar__side ios-page-nav-bar__side--trailing">
      <slot name="trailing">
        <span class="ios-page-nav-bar__spacer" aria-hidden="true" />
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import DashboardBackButton from '~/components/dashboard/DashboardBackButton.vue'

withDefaults(
  defineProps<{
    title: string
    showBack?: boolean
    backTo?: RouteLocationRaw | null
    backLabel?: string
    fallbackTo?: RouteLocationRaw
  }>(),
  {
    showBack: false,
    backTo: null,
    backLabel: 'Back',
    fallbackTo: '/dashboard',
  }
)
</script>
