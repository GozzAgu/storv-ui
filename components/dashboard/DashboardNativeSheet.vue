<template>
  <Teleport :to="teleportTarget">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <button
        v-if="modelValue"
        type="button"
        :class="[backdropClass, backdropZClass]"
        :aria-label="backdropLabel"
        @click="onBackdropClick"
      />
    </Transition>

    <Transition
      enter-active-class="transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      enter-from-class="opacity-0 translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.4,0,1,1)]"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-full"
    >
      <div
        v-if="modelValue"
        :id="panelId"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel"
        :aria-labelledby="labelledBy"
        :aria-describedby="describedBy"
        :class="sheetClass"
        @click.stop
      >
        <div v-if="showHeader" :class="sheetHeaderClass">
          <div :class="sheetHandleClass" aria-hidden="true" />
          <slot name="header">
            <div class="flex min-w-0 items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p v-if="eyebrow" :class="sheetEyebrowClass">{{ eyebrow }}</p>
                <h2 v-if="title" :id="titleId" :class="sheetTitleClass">{{ title }}</h2>
                <p v-if="subtitle" :id="subtitleId" :class="sheetSubtitleClass">{{ subtitle }}</p>
              </div>
              <button
                v-if="showClose"
                type="button"
                :class="closeButtonClass"
                aria-label="Close"
                @click="close"
              >
                <XMarkIcon class="h-4 w-4" stroke-width="1.75" />
              </button>
            </div>
          </slot>
        </div>

        <div :class="[sheetBodyClass, bodyPaddingClass]">
          <slot />
        </div>

        <div v-if="$slots.footer" :class="sheetFooterClass">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, useId, watch } from 'vue'
import { XMarkIcon } from '~/utils/app-icons'
import {
  useDashboardNativeSheetChrome,
  type DashboardNativeSheetVariant,
} from '~/composables/useDashboardNativeSheetChrome'
import { setNativeOverlayLock } from '~/utils/native-overlay-lock'
import { blurActiveElementIfNative } from '~/utils/native-focus'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    subtitle?: string
    eyebrow?: string
    variant?: DashboardNativeSheetVariant
    showClose?: boolean
    closeOnBackdrop?: boolean
    showHeader?: boolean
    bodyPadding?: string
    ariaLabel?: string
    backdropLabel?: string
    panelId?: string
    /** Where to mount - overlay host for CRUD, body for menu-level sheets */
    mount?: 'overlay-host' | 'body'
  }>(),
  {
    variant: 'crud',
    showClose: true,
    closeOnBackdrop: true,
    showHeader: true,
    bodyPadding: '',
    backdropLabel: 'Close',
    mount: 'overlay-host',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const { isNativeApp } = useCapacitorNativeApp()

const titleId = useId()
const subtitleId = useId()

const {
  backdropClass,
  sheetClass: sheetClassBase,
  sheetHeaderClass,
  sheetHandleClass,
  sheetEyebrowClass,
  sheetTitleClass,
  sheetSubtitleClass,
  sheetBodyClass,
  sheetFooterClass,
  closeButtonClass,
} = useDashboardNativeSheetChrome(props.variant)

const sheetClass = computed(() => sheetClassBase)

const teleportTarget = computed(() =>
  props.mount === 'body' ? 'body' : '#dashboard-native-overlay-host'
)

const backdropZClass = computed(() =>
  props.variant === 'menu' ? 'z-[58]' : 'z-[1099]'
)

const labelledBy = computed(() => (props.title ? titleId : undefined))
const describedBy = computed(() => (props.subtitle ? subtitleId : undefined))

const bodyPaddingClass = computed(() => {
  if (props.bodyPadding) return props.bodyPadding
  if (props.variant === 'menu') return 'px-0 py-0'
  return 'px-4 py-4 sm:px-5 sm:py-5'
})

function close() {
  blurActiveElementIfNative(isNativeApp.value)
  emit('update:modelValue', false)
  emit('close')
}

function onBackdropClick() {
  if (props.closeOnBackdrop) close()
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue && props.closeOnBackdrop) {
    close()
  }
}

function setScrollLock(locked: boolean) {
  if (!import.meta.client) return
  setNativeOverlayLock(locked)
}

watch(
  () => props.modelValue,
  (open) => setScrollLock(open)
)

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  setScrollLock(false)
})
</script>
