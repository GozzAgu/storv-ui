<script setup lang="ts">
import { computed } from 'vue'
import {
  BookmarkSquareIcon,
} from '~/utils/app-icons'
import { useStoresStore } from '~/stores/stores'

const storesStore = useStoresStore()
const note = computed(() => (storesStore.currentStore?.sellScreenNote ?? '').trim())
</script>

<template>
  <div
    v-if="note"
    class="rounded-sm border border-amber-200/90 bg-amber-50/90 px-3 py-2 dark:border-amber-800/60 dark:bg-amber-950/35"
  >
    <div class="flex gap-2">
      <BookmarkSquareIcon
        class="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400"
        aria-hidden="true"
      />
      <div class="min-w-0 flex-1">
        <p
          class="text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300"
        >
          Store note
        </p>
        <p class="mt-0.5 whitespace-pre-wrap text-xs text-amber-950 dark:text-amber-100">
          {{ note }}
        </p>
      </div>
    </div>
  </div>
</template>
