<script setup lang="ts">
import { Squares2X2Icon, TableCellsIcon } from '~/utils/app-icons'
import type { NativeTableLayoutMode } from '~/utils/native-table-cards'

const model = defineModel<NativeTableLayoutMode>({ default: 'cards' })

const { viewToggleClass, viewToggleBtnClass, viewToggleBtnActiveClass } = useDashboardGridPagesChrome()
</script>

<template>
  <div
    data-native-table-layout-toggle
    :class="viewToggleClass"
    role="group"
    aria-label="Table layout"
  >
    <button
      type="button"
      :class="[viewToggleBtnClass, model === 'cards' ? viewToggleBtnActiveClass : '']"
      :aria-pressed="model === 'cards'"
      @click="model = 'cards'"
    >
      <Squares2X2Icon class="h-3.5 w-3.5" aria-hidden="true" />
      <span class="sr-only">Cards</span>
    </button>
    <button
      type="button"
      :class="[viewToggleBtnClass, model === 'table' ? viewToggleBtnActiveClass : '']"
      :aria-pressed="model === 'table'"
      @click="model = 'table'"
    >
      <TableCellsIcon class="h-3.5 w-3.5" aria-hidden="true" />
      <span class="sr-only">Table</span>
    </button>
  </div>
</template>
