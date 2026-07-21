<script setup lang="ts">
import { computed } from 'vue'
import { DASHBOARD_NAV_ICONS, type DashboardNavIconKey } from '~/utils/dashboard-nav-icons'

const props = withDefaults(
  defineProps<{
    name: DashboardNavIconKey
    active?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg'
  }>(),
  {
    active: false,
    size: 'md',
  }
)

const icon = computed(() => DASHBOARD_NAV_ICONS[props.name])

const strokeWidth = computed(() => {
  if (props.active) return 2.25
  if (props.size === 'xs') return 1.65
  return 1.75
})
</script>

<template>
  <component
    :is="icon"
    :class="['dash-nav-icon', `dash-nav-icon--${size}`, { 'dash-nav-icon--active': active }]"
    :stroke-width="strokeWidth"
    aria-hidden="true"
  />
</template>
