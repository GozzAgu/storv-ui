<template>
  <nav class="dash-segment-tabs" aria-label="Social Sales sections">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="dash-segment-tabs__btn"
      :class="{ 'dash-segment-tabs__btn--active': isActive(item.to) }"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { label: 'Dashboard', to: '/dashboard/social-sales' },
  { label: 'Leads', to: '/dashboard/social-sales/leads' },
  { label: 'Analytics', to: '/dashboard/social-sales/analytics' },
]

function isActive(path: string) {
  if (path === '/dashboard/social-sales') {
    return route.path === path || route.path === `${path}/`
  }
  return route.path.startsWith(path)
}
</script>
