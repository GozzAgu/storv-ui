<template>
  <header class="s-topbar">
    <div v-if="$slots.lead" class="s-topbar__lead">
      <slot name="lead" />
    </div>

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
import { Search } from '@lucide/vue'

defineProps<{
  title: string
}>()

const emit = defineEmits<{
  search: []
}>()

const shortcutLabel = ref('Ctrl K')

onMounted(() => {
  if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
    shortcutLabel.value = '⌘K'
  }
})
</script>
