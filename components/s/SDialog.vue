<template>
  <Teleport to="body">
    <Transition name="s-dialog" @after-leave="restoreFocus">
      <div
        v-if="open"
        class="s-c s-dialog-layer"
        :class="placement !== 'center' && `s-dialog-layer--${placement}`"
        data-dashboard-teleport
      >
        <div class="s-dialog__scrim" aria-hidden="true" @click="dismissible && close()" />
        <div
          ref="panelRef"
          class="s-dialog"
          :class="`s-dialog--${size}`"
          :role="role"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          @keydown="onKeydown"
        >
          <header class="s-dialog__head">
            <div v-if="$slots.header" :id="titleId" class="s-dialog__titles">
              <slot name="header" />
            </div>
            <div v-else class="s-dialog__titles">
              <h2 :id="titleId" class="s-dialog__title">{{ title }}</h2>
              <p v-if="description" :id="descriptionId" class="s-dialog__description">
                {{ description }}
              </p>
            </div>
            <SIconButton
              v-if="dismissible"
              class="s-dialog__close"
              label="Close"
              size="sm"
              @click="close"
            >
              <X :size="18" :stroke-width="1.75" aria-hidden="true" />
            </SIconButton>
          </header>
          <div v-if="$slots.default" class="s-dialog__body"><slot /></div>
          <footer v-if="$slots.footer" class="s-dialog__foot"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, useId, watch } from 'vue'
import { X } from '@lucide/vue'
import SIconButton from '~/components/s/SIconButton.vue'
import { isCapacitorNative } from '~/utils/capacitor-env'
import { blurActiveElementIfNative } from '~/utils/native-focus'

const props = withDefaults(
  defineProps<{
    /** Required unless the `header` slot supplies the heading. */
    title?: string
    description?: string
    size?: 'sm' | 'md' | 'lg'
    /** `right` is a side sheet; `bottom` is a phone sheet. */
    placement?: 'center' | 'right' | 'bottom'
    /** Scrim click, Escape and the close button dismiss it. Turn off while saving. */
    dismissible?: boolean
    /** Use `alertdialog` for destructive confirmations. */
    role?: 'dialog' | 'alertdialog'
  }>(),
  { size: 'md', placement: 'center', dismissible: true, role: 'dialog' }
)

const open = defineModel<boolean>('open', { default: false })

const panelRef = ref<HTMLElement | null>(null)
const uid = useId()
const titleId = `s-dialog-${uid}-title`
const descriptionId = `s-dialog-${uid}-desc`
let returnFocusTo: HTMLElement | null = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusables() {
  return Array.from(panelRef.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  )
}

function close() {
  open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    if (props.dismissible) close()
    return
  }
  if (event.key !== 'Tab') return
  const items = focusables()
  if (!items.length) {
    event.preventDefault()
    return
  }
  const first = items[0]!
  const last = items[items.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

const hasDom = typeof document !== 'undefined'

function lockScroll(locked: boolean) {
  if (!hasDom) return
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}

function restoreFocus() {
  returnFocusTo?.focus?.()
  returnFocusTo = null
}

watch(
  open,
  async (isOpen) => {
    if (!hasDom) return
    lockScroll(isOpen)
    if (!isOpen) {
      blurActiveElementIfNative(isCapacitorNative())
      return
    }
    returnFocusTo = document.activeElement as HTMLElement | null
    await nextTick()
    const autofocus = panelRef.value?.querySelector<HTMLElement>('[autofocus], [data-autofocus]')
    ;(autofocus || focusables().find((el) => !el.closest('.s-dialog__head')) || panelRef.value)?.focus()
  },
  { immediate: true, flush: 'post' }
)

onUnmounted(() => lockScroll(false))
</script>
