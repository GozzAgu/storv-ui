<template>
  <Teleport to="body">
    <div
      v-if="open && style"
      ref="panelRef"
      v-bind="$attrs"
      :data-context-menu="menuId"
      class="ds-root s-c s-popover s-menu"
      role="menu"
      :aria-label="label"
      :style="style"
      @click.stop
      @keydown="onKeydown"
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch, type CSSProperties } from 'vue'

/**
 * Row action menu positioned by the caller (fixed coordinates next to its trigger).
 * `data-context-menu` lets the caller's outside-click handler ignore clicks inside it.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    open: boolean
    style?: CSSProperties | null
    menuId?: string
    label?: string
  }>(),
  { style: null, menuId: 'menu', label: 'Actions' }
)

const emit = defineEmits<{ close: [] }>()

const panelRef = ref<HTMLElement | null>(null)

function items() {
  return Array.from(panelRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
}

let trigger: HTMLElement | null = null

watch(
  () => props.open && !!props.style,
  async (visible) => {
    if (!visible) {
      const focusWasInside = !document.activeElement || document.activeElement === document.body
      if (focusWasInside && trigger?.isConnected) trigger.focus()
      trigger = null
      return
    }
    trigger = document.activeElement as HTMLElement | null
    await nextTick()
    items()[0]?.focus()
  }
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' || event.key === 'Tab') {
    event.preventDefault()
    emit('close')
    return
  }
  const list = items()
  if (!list.length) return
  const index = list.indexOf(document.activeElement as HTMLElement)
  let next = -1
  if (event.key === 'ArrowDown') next = (index + 1) % list.length
  else if (event.key === 'ArrowUp') next = (index - 1 + list.length) % list.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = list.length - 1
  if (next < 0) return
  event.preventDefault()
  list[next]?.focus()
}

defineExpose({ panel: panelRef })
</script>
