<template>
  <NuxtLink
    :to="item.href"
    class="s-nav-item"
    :class="{ 's-nav-item--active': active }"
    :aria-current="active ? 'page' : undefined"
    :aria-label="collapsed ? item.label : undefined"
    :data-tutorial="item.name.toLowerCase().replace(/\s+/g, '-')"
    @mouseenter="emit('tip', $event, item.label)"
    @focus="emit('tip', $event, item.label)"
    @mouseleave="emit('untip')"
    @blur="emit('untip')"
  >
    <component
      :is="icon"
      class="s-nav-item__icon"
      :size="20"
      :stroke-width="active ? 2 : 1.75"
      aria-hidden="true"
    />
    <span v-if="!collapsed" class="s-nav-item__label">{{ item.label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DASHBOARD_NAV_ICONS } from '~/utils/dashboard-nav-icons'
import type { ShellNavItem } from '~/utils/shell-nav'

const props = defineProps<{
  item: ShellNavItem
  active: boolean
  collapsed: boolean
}>()

const emit = defineEmits<{
  tip: [event: Event, text: string]
  untip: []
}>()

const icon = computed(() => DASHBOARD_NAV_ICONS[props.item.iconKey])
</script>
