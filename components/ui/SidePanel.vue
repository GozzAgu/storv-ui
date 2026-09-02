<template>
  <IosDrawer
    v-if="nativeIosSheet"
    :model-value="modelValue"
    :title="title"
    :subtitle="iosCrudSheet ? undefined : subtitle"
    :eyebrow="iosCrudSheet ? undefined : resolvedEyebrow"
    :body-padding="resolvedContentPadding"
    :show-close="showClose"
    :close-on-backdrop="closeOnBackdrop"
    :variant="nativeSheetVariant"
    :footer-variant="footerVariant"
    mount="overlay-host"
    @update:model-value="emit('update:modelValue', $event)"
    @close="emit('close')"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.leading" #leading>
      <slot name="leading" />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </IosDrawer>

  <Teleport v-else :to="teleportTarget">
    <!-- Web: frosted glass backdrop -->
    <Transition
      v-if="!nativeInApp"
      enter-active-class="transition-opacity duration-[400ms] ease-out"
      leave-active-class="transition-opacity duration-[320ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        :class="[
          'fixed inset-0 z-[1100]',
          backdropClass,
        ]"
        aria-hidden="true"
        @click="handleBackdropClick"
      />
    </Transition>

    <!-- Web: drawer panel slides from the right edge -->
    <Transition
      v-if="!nativeInApp"
      enter-active-class="side-panel-enter-active"
      leave-active-class="side-panel-leave-active"
      enter-from-class="side-panel-enter-from"
      enter-to-class="side-panel-enter-to"
      leave-from-class="side-panel-leave-from"
      leave-to-class="side-panel-leave-to"
    >
      <div
        v-if="modelValue"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="labelledBy"
        :aria-describedby="describedBy"
        :class="panelDialogClass"
        @click.stop
      >
        <!-- Header -->
        <div
          v-if="title || subtitle || $slots.header || showClose"
          :class="[dense ? headerDenseClass : headerClass]"
        >
          <div class="flex min-w-0 flex-1 items-start gap-3 pr-1">
            <slot name="header">
              <div v-if="title || subtitle" class="min-w-0">
                <p v-if="eyebrow" :class="eyebrowClass">
                  {{ eyebrow }}
                </p>
                <h3 v-if="title" :id="titleId" :class="dense ? titleDenseClass : titleClass">
                  {{ title }}
                </h3>
                <p
                  v-if="subtitle"
                  :id="subtitleId"
                  :class="dense ? subtitleDenseClass : subtitleClass"
                >
                  {{ subtitle }}
                </p>
              </div>
            </slot>
          </div>
          <button
            v-if="showClose"
            type="button"
            :class="closeButtonClass"
            aria-label="Close panel"
            @click="handleClose"
          >
            <XMarkIcon class="h-4 w-4" stroke-width="1.75" />
          </button>
        </div>

        <!-- Body -->
        <div
          :class="[
            bodyClass,
            fitContent ? 'dash-overlay-body--fit-content' : '',
            'side-panel-body-scroll flex flex-col',
            fitContent ? 'min-h-0 shrink-0' : 'min-h-0 flex-1',
            resolvedContentPadding,
          ]"
        >
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" :class="dense ? footerDenseClass : footerClass">
          <slot name="footer" />
        </div>
      </div>
    </Transition>

    <!-- Native (Android): slide-in drawer -->
    <Transition v-if="nativeInApp" name="native-drawer-shell">
      <div v-if="modelValue" class="native-side-drawer-root" role="presentation">
        <div
          class="native-side-drawer-backdrop native-modal-backdrop absolute inset-0"
          aria-hidden="true"
          @click="handleBackdropClick"
        />
        <div class="native-side-drawer-stage">
          <div
            role="dialog"
            aria-modal="true"
            :aria-labelledby="labelledBy"
            :aria-describedby="describedBy"
            :class="panelDialogClass"
            @click.stop
          >
        <!-- Header -->
        <div
          v-if="title || subtitle || $slots.header || showClose"
          :class="[dense ? headerDenseClass : headerClass]"
        >
          <div class="flex min-w-0 flex-1 items-start gap-3 pr-1">
            <slot name="header">
              <div v-if="title || subtitle" class="min-w-0">
                <p v-if="eyebrow" :class="eyebrowClass">
                  {{ eyebrow }}
                </p>
                <h3 v-if="title" :id="titleId" :class="dense ? titleDenseClass : titleClass">
                  {{ title }}
                </h3>
                <p
                  v-if="subtitle"
                  :id="subtitleId"
                  :class="dense ? subtitleDenseClass : subtitleClass"
                >
                  {{ subtitle }}
                </p>
              </div>
            </slot>
          </div>
          <button
            v-if="showClose"
            type="button"
            :class="closeButtonClass"
            aria-label="Close panel"
            @click="handleClose"
          >
            <XMarkIcon class="h-4 w-4" stroke-width="1.75" />
          </button>
        </div>

        <!-- Body -->
        <div
          :class="[
            bodyClass,
            'side-panel-body-scroll flex min-h-0 flex-1 flex-col',
            resolvedContentPadding,
          ]"
        >
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" :class="dense ? footerDenseClass : footerClass">
          <slot name="footer" />
        </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, useId } from 'vue'
import {
  XMarkIcon,
} from '~/utils/app-icons'
import IosDrawer from '~/components/ios/IosDrawer.vue'
import type { DashboardNativeSheetVariant } from '~/composables/useDashboardNativeSheetChrome'
import { setNativeOverlayLock } from '~/utils/native-overlay-lock'
import { blurActiveElementIfNative } from '~/utils/native-focus'
interface Props {
  modelValue: boolean
  title?: string
  subtitle?: string
  eyebrow?: string
  /**
   * Kept for API compatibility; width is always `--dashboard-drawer-width` on desktop.
   * Below `lg`, the panel is full width.
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'drawer'
  showClose?: boolean
  closeOnBackdrop?: boolean
  contentPadding?: string
  blurBackdrop?: boolean
  /** Tighter header, body, and footer padding */
  dense?: boolean
  /** Shrink drawer height to form content (web); avoids footer pinned to viewport bottom */
  fitContent?: boolean
  /** iOS bottom sheet variant (More-menu chrome) */
  nativeSheetVariant?: DashboardNativeSheetVariant
  /** iOS drawer footer layout */
  footerVariant?: 'actions' | 'menu'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  size: 'md',
  showClose: true,
  closeOnBackdrop: true,
  contentPadding: '',
  blurBackdrop: false,
  dense: false,
  fitContent: false,
  nativeSheetVariant: 'crud',
  footerVariant: 'actions',
})

const { isNativeApp } = useCapacitorNativeApp()
const { isCapacitorIos } = useIsCapacitorIos()
const nativeInApp = computed(() => isNativeApp.value)
const nativeIosSheet = computed(() => isCapacitorIos.value)
const iosCrudSheet = computed(
  () => nativeIosSheet.value && props.nativeSheetVariant === 'crud'
)

const resolvedEyebrow = computed(() => props.eyebrow || (props.title ? 'Details' : undefined))

const teleportTarget = computed(() =>
  nativeInApp.value ? '#dashboard-native-overlay-host' : 'body'
)

const resolvedContentPadding = computed(() => {
  if (props.contentPadding) return props.contentPadding
  if (iosCrudSheet.value) return 'p-0'
  return props.dense ? 'p-0' : 'px-4 py-4 sm:px-5 sm:py-5'
})

const {
  backdropClass,
  drawerShellClass,
  headerClass,
  headerDenseClass,
  bodyClass,
  footerClass,
  footerDenseClass,
  closeButtonClass,
  titleClass,
  titleDenseClass,
  subtitleClass,
  subtitleDenseClass,
  eyebrowClass,
} = useDashboardOverlayChrome()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const titleId = useId()
const subtitleId = useId()

const labelledBy = computed(() => (props.title ? titleId : undefined))
const describedBy = computed(() => (props.subtitle ? subtitleId : undefined))

const fitContent = computed(() => props.fitContent && !nativeInApp.value)

const panelDialogClass = computed(() =>
  nativeIosSheet.value
    ? []
    : nativeInApp.value
    ? [
        'native-side-drawer-panel side-panel-native-dialog flex h-full max-h-full min-h-0 flex-col overflow-hidden',
        drawerShellClass,
      ]
    : [
        'side-panel-drawer pointer-events-auto fixed inset-y-0 right-0 z-[1111] flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden',
        drawerShellClass,
        fitContent.value ? 'side-panel--fit-content !inset-y-auto top-4 sm:top-6' : '',
      ]
)

const handleClose = () => {
  blurActiveElementIfNative(nativeInApp.value)
  emit('update:modelValue', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    handleClose()
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue && props.closeOnBackdrop) {
    handleClose()
  }
}

function setScrollLock(locked: boolean) {
  if (!import.meta.client) return
  if (nativeIosSheet.value) return

  if (nativeInApp.value) {
    setNativeOverlayLock(locked)
    return
  }

  document.body.style.overflow = locked ? 'hidden' : ''
  document.documentElement.toggleAttribute('data-drawer-open', locked)
}

watch(
  () => props.modelValue,
  (isOpen) => {
    setScrollLock(isOpen)
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  setScrollLock(false)
})
</script>

<style scoped>
.side-panel--fit-content {
  height: auto !important;
  max-height: min(92dvh, calc(100dvh - 2rem));
}

.side-panel-body-scroll {
  scrollbar-gutter: stable;
}

.side-panel-body-scroll::-webkit-scrollbar {
  width: 8px;
}

.side-panel-body-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.side-panel-body-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgb(0 0 0 / 0.12);
}

.dark .side-panel-body-scroll::-webkit-scrollbar-thumb {
  background: rgb(255 255 255 / 0.12);
}

/* Web: slide in from the right */
.side-panel-enter-active {
  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.side-panel-leave-active {
  transition: transform 320ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.side-panel-enter-from,
.side-panel-leave-to {
  transform: translate3d(100%, 0, 0);
}

.side-panel-enter-to,
.side-panel-leave-from {
  transform: translate3d(0, 0, 0);
}

@media (prefers-reduced-motion: reduce) {
  .side-panel-enter-active,
  .side-panel-leave-active {
    transition-duration: 45ms !important;
  }
}
</style>
