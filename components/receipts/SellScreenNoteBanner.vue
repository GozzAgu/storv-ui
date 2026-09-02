<template>
  <div v-if="note" class="dash-drawer-callout">
    <div class="flex gap-2">
      <BookmarkSquareIcon
        class="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
      />
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
          Store note
        </p>
        <p class="mt-0.5 whitespace-pre-wrap text-xs text-gray-800 dark:text-gray-200">
          {{ note }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  BookmarkSquareIcon,
} from '~/utils/app-icons'
import { useStoresStore } from '~/stores/stores'

const storesStore = useStoresStore()
const note = computed(() => (storesStore.currentStore?.sellScreenNote ?? '').trim())
</script>
