<template>
  <aside v-if="note" class="s-callout s-store-note" aria-label="Store note">
    <Bookmark class="s-store-note__icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
    <div class="s-store-note__text">
      <strong>Note from your manager</strong>
      <p class="s-store-note__body">{{ note }}</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bookmark } from '@lucide/vue'
import { useStoresStore } from '~/stores/stores'

const storesStore = useStoresStore()
const note = computed(() => (storesStore.currentStore?.sellScreenNote ?? '').trim())
</script>
