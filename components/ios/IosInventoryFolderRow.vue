<template>
  <div
    class="ios-settings-row ios-inventory-folder-row"
    :class="{ 'ios-settings-row--last': last }"
  >
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
  }>(),
  {
    menuKind: 'folder',
  }
)

defineEmits<{
  click: []
  menu: []
}>()
</script>
