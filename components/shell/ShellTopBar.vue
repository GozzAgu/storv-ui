<template>
  <header class="s-topbar">
    <SIconButton
      class="s-topbar__menu"
      label="Open menu"
      aria-controls="shell-sidebar"
      @click="emit('open-menu')"
    >
      <Menu :size="20" :stroke-width="1.75" aria-hidden="true" />
    </SIconButton>

    <h1 class="s-topbar__title">{{ title }}</h1>

    <button type="button" class="s-topbar__search" aria-label="Search" @click="emit('search')">
      <Search class="s-topbar__search-icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
      <span class="s-topbar__search-text">Search products, sales, customers</span>
      <kbd class="s-kbd">{{ shortcutLabel }}</kbd>
    </button>

    <div class="s-topbar__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Menu, Search } from '@lucide/vue'
import SIconButton from '~/components/s/SIconButton.vue'

defineProps<{
  title: string
}>()

const emit = defineEmits<{
  'open-menu': []
  search: []
}>()

const shortcutLabel = ref('Ctrl K')

onMounted(() => {
  if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
    shortcutLabel.value = '⌘K'
  }
})
</script>
