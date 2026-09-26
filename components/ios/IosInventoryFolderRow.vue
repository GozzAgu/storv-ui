<template>
  <div
    class="ios-settings-row ios-inventory-folder-row"
    :class="{
      'ios-settings-row--last': last,
      'ios-inventory-folder-row--selected': selectable && selected,
    }"
  >
    <label
      v-if="selectable"
      class="ios-inventory-folder-row__select"
      @click.stop
    >
      <input
        type="checkbox"
        class="ios-inventory-folder-row__select-input"
        :checked="selected"
        @change="$emit('select', ($event.target as HTMLInputElement).checked)"
      />
      <span class="ios-inventory-folder-row__select-box" aria-hidden="true">
        <svg
          class="ios-inventory-folder-row__select-mark"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
      <span class="sr-only">Select {{ name }}</span>
    </label>
    <button type="button" class="ios-inventory-folder-row__main" @click="$emit('click')">
      <FolderIcon class="ios-settings-row__icon" aria-hidden="true" />
      <span class="ios-inventory-folder-row__body">
        <span class="ios-settings-row__label">{{ name }}</span>
        <span v-if="subtitle" class="ios-inventory-folder-row__subtitle">{{ subtitle }}</span>
      </span>
      <span v-if="value" class="ios-settings-row__value">{{ value }}</span>
    </button>
    <button
      v-if="showMenu"
      type="button"
      class="ios-list-row-menu-btn"
      :data-folder-actions-anchor="menuKind === 'folder' ? menuId : undefined"
      :data-department-actions-anchor="menuKind === 'department' ? menuId : undefined"
      aria-label="More options"
      @click.stop="$emit('menu')"
    >
      <EllipsisVerticalIcon aria-hidden="true" />
    </button>
    <ChevronRightIcon
      v-else
      class="ios-settings-row__chevron ios-inventory-folder-row__chevron"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ChevronRightIcon, EllipsisVerticalIcon, FolderIcon } from '~/utils/app-icons'

withDefaults(
  defineProps<{
    name: string
    subtitle?: string
    value?: string
    last?: boolean
    showMenu?: boolean
    menuId?: string
    menuKind?: 'folder' | 'department'
    selectable?: boolean
    selected?: boolean
  }>(),
  {
    menuKind: 'folder',
    selectable: false,
    selected: false,
  }
)

defineEmits<{
  click: []
  menu: []
  select: [checked: boolean]
}>()
</script>
