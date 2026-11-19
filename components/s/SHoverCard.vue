<template>
  <span
    ref="triggerRef"
    class="s-c s-hovercard__trigger"
    tabindex="0"
    role="button"
    :aria-expanded="open"
    :aria-controls="open ? panelId : undefined"
    :aria-label="label"
    @mouseenter="hoverOpen"
    @mouseleave="hoverClose"
    @focus="show"
    @blur="hoverClose"
    @click.stop="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
  >
    <slot name="trigger" :open="open" />
  </span>

  <Teleport to="body">
    <div
      v-if="open"
      :id="panelId"
      ref="panelRef"
      role="dialog"
      :aria-label="label"
      class="ds-root s-c s-hovercard"
      :style="panelStyle"
      @mouseenter="hoverOpen"
      @mouseleave="hoverClose"
      @click.stop
    >
      <slot :close="dismiss" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

/**
 * A card that opens beside its trigger on hover or keyboard focus, and pins open on tap (for
 * phones). Teleported to <body> so table scroll boxes can't clip it; flips above the trigger
 * when there is no room below, and scrolls inside itself when the content is tall.
 */
const props = withDefaults(
  defineProps<{
    /** Accessible name for the trigger and the card. */
    label?: string
    /** Card width in px on wide screens; phones use the screen width less a gutter. */
    width?: number
    align?: 'start' | 'end'
  }>(),
  { label: 'Details', width: 420, align: 'start' }
)

const panelId = `hovercard-${useId()}`
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const open = ref(false)
const pinned = ref(false)
const panelStyle = ref<Record<string, string>>({})
let timer: ReturnType<typeof setTimeout> | null = null

const GAP = 6
const MARGIN = 12

function place() {
  const rect = triggerRef.value?.getBoundingClientRect()
  if (!rect) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(props.width, vw - MARGIN * 2)
  const preferred = props.align === 'end' ? rect.right - width : rect.left
  const left = Math.min(Math.max(MARGIN, preferred), vw - width - MARGIN)
  const below = vh - rect.bottom - GAP - MARGIN
  const above = rect.top - GAP - MARGIN
  const downward = below >= 280 || below >= above
  panelStyle.value = {
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${Math.max(160, downward ? below : above)}px`,
    ...(downward ? { top: `${rect.bottom + GAP}px` } : { bottom: `${vh - rect.top + GAP}px` }),
  }
}

function show() {
  if (timer) clearTimeout(timer)
  place()
  open.value = true
}

function hoverOpen() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(show, 140)
}

function hoverClose() {
  if (timer) clearTimeout(timer)
  if (pinned.value) return
  timer = setTimeout(() => (open.value = false), 160)
}

function toggle() {
  if (pinned.value && open.value) {
    dismiss()
    return
  }
  pinned.value = true
  show()
}

function dismiss() {
  pinned.value = false
  open.value = false
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    dismiss()
    triggerRef.value?.focus()
  }
}

/** Page scroll closes it; scrolling inside the card does not. */
function onScroll(event: Event) {
  if (panelRef.value && event.target instanceof Node && panelRef.value.contains(event.target))
    return
  dismiss()
}

watch(open, async (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', dismiss)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', dismiss)
    await nextTick()
    place()
  } else {
    pinned.value = false
    document.removeEventListener('click', dismiss)
    document.removeEventListener('keydown', onKey)
    window.removeEventListener('scroll', onScroll, true)
    window.removeEventListener('resize', dismiss)
  }
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  open.value = false
})
</script>

<style scoped>
.s-hovercard__trigger {
  display: block;
  min-width: 0;
  border-radius: 6px;
  cursor: pointer;
  outline: none;
}

.s-hovercard__trigger:focus-visible {
  box-shadow: var(--s-focus-ring);
}

.s-hovercard {
  position: fixed;
  z-index: 1000;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--s-divider);
  border-radius: var(--s-radius-lg);
  background: var(--s-surface);
  box-shadow: var(--s-shadow-lg, 0 12px 32px rgb(0 0 0 / 0.28));
  color: var(--s-text);
  text-align: left;
}

:global(html.dark) .s-hovercard {
  background: var(--s-surface-2);
}
</style>
