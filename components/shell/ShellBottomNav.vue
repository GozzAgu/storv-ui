<template>
  <nav class="s-bottomnav" aria-label="Primary">
    <NuxtLink
      v-for="item in items"
      :key="item.name"
      :to="item.href"
      class="s-bottomnav__item"
      :class="{ 's-bottomnav__item--active': isActive(item) }"
      :aria-current="isActive(item) ? 'page' : undefined"
    >
      <component
        :is="DASHBOARD_NAV_ICONS[item.iconKey]"
        :size="20"
        :stroke-width="isActive(item) ? 2 : 1.75"
        aria-hidden="true"
      />
      <span class="s-bottomnav__label">{{ item.label }}</span>
    </NuxtLink>
    <button
      type="button"
      class="s-bottomnav__item"
      :class="{ 's-bottomnav__item--active': moreActive }"
      aria-controls="shell-sidebar"
      @click="emit('more')"
    >
      <Ellipsis :size="20" :stroke-width="moreActive ? 2 : 1.75" aria-hidden="true" />
      <span class="s-bottomnav__label">More</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Ellipsis } from '@lucide/vue'
import { DASHBOARD_NAV_ICONS } from '~/utils/dashboard-nav-icons'
import type { ShellNavItem } from '~/utils/shell-nav'

const props = defineProps<{
  items: ShellNavItem[]
  isActive: (item: ShellNavItem) => boolean
}>()

const emit = defineEmits<{
  more: []
}>()

const moreActive = computed(() => !props.items.some((item) => props.isActive(item)))
</script>
