<template>
  <div
    ref="rootRef"
    class="fixed z-[100] touch-none select-none overflow-visible"
    :class="[
      anchorClasses,
      layout === 'column' ? 'flex flex-col items-end gap-1.5' : 'flex flex-row items-end gap-2',
      extraClass,
    ]"
    :style="fabStyle"
  >
    <button
      type="button"
      class="flex h-7 shrink-0 cursor-grab items-center justify-center rounded-full bg-white/95 text-gray-400 backdrop-blur-sm active:cursor-grabbing dark:bg-gray-800/95 dark:text-gray-500"
      :class="layout === 'column' ? 'w-10' : 'w-9'"
      aria-label="Drag to reposition"
      @pointerdown="onHandlePointerDown"
    >
      <span class="flex flex-col gap-0.5" aria-hidden="true">
        <span class="block h-0.5 w-4 rounded-full bg-current opacity-60" />
        <span class="block h-0.5 w-4 rounded-full bg-current opacity-60" />
        <span class="block h-0.5 w-4 rounded-full bg-current opacity-60" />
      </span>
    </button>
    <div class="min-w-0">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDraggableFab } from '~/composables/useDraggableFab'

const props = withDefaults(
  defineProps<{
    /** localStorage key (unique per screen, e.g. route-based). */
    storageKey: string
    /** `row`: grip to the left (e.g. tooltip + FAB). `column`: grip above a vertical stack. */
    layout?: 'row' | 'column'
    /** Tailwind classes for default anchor before first measure (bottom-right). */
    anchorClass?: string
    /** Extra classes on the fixed root wrapper. */
    extraClass?: string
  }>(),
  {
    layout: 'row',
    /** Clears fixed pagination bars (~48px) + safe area */
    anchorClass: 'bottom-32 right-4 sm:bottom-36 sm:right-6',
    extraClass: '',
  }
)

const { rootRef, fabStyle, anchorClasses, onHandlePointerDown } = useDraggableFab(
  props.storageKey,
  props.anchorClass
)
</script>
