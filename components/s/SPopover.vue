<template>
  <div ref="rootRef" class="s-c s-pop-anchor">
    <slot name="trigger" :open="open" :toggle="toggle" :close="close" />
    <Transition name="s-pop">
      <div
        v-if="open"
        :class="[bare ? 's-popover-host' : 's-popover', align === 'start' && 's-popover--start', panelClass]"
        :role="role"
        :aria-label="label"
        @click.stop
        @keydown="onPanelKeydown"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { useShellPopover } from '~/composables/useShellPopover'

const props = withDefaults(
  defineProps<{
    /** Accessible name for the panel. */
    label?: string
    role?: 'menu' | 'dialog' | 'listbox'
    align?: 'start' | 'end'
    /** Top-bar popovers share one open slot (see useActiveHeaderMenu). */
    headerMenuId?: string
    /** Render children without the default panel surface. */
    bare?: boolean
    panelClass?: string
  }>(),
  { role: 'dialog', align: 'end' }
)

const emit = defineEmits<{ 'update:open': [open: boolean] }>()

const { open, rootRef, toggle, close } = useShellPopover(props.headerMenuId)

const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"], [role="option"]'

function menuItems() {
  return Array.from(rootRef.value?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [])
}

watch(open, async (isOpen) => {
  emit('update:open', isOpen)
  if (!isOpen || props.role === 'dialog') return
  await nextTick()
  menuItems()[0]?.focus()
})

function onPanelKeydown(event: KeyboardEvent) {
  if (props.role === 'dialog') return
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  const items = menuItems()
  if (!items.length) return
  event.preventDefault()
  const index = items.indexOf(document.activeElement as HTMLElement)
  const next =
    event.key === 'ArrowDown'
      ? (index + 1) % items.length
      : (index - 1 + items.length) % items.length
  items[next]?.focus()
}

defineExpose({ open, toggle, close })
</script>
