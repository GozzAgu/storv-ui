<template>
  <Teleport :to="teleportTarget">
    <!-- Web: dimmed backdrop -->
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
          blurBackdrop ? 'backdrop-blur-[3px]' : '',
        ]"
        aria-hidden="true"
        @click="handleBackdropClick"
      />
    </Transition>

    <Transition
      :enter-active-class="
        nativeInApp ? 'side-panel-native-enter-active' : 'side-panel-enter-active'
      "
      :leave-active-class="
        nativeInApp ? 'side-panel-native-leave-active' : 'side-panel-leave-active'
      "
      :enter-from-class="nativeInApp ? 'side-panel-native-enter-from' : 'side-panel-enter-from'"
      :enter-to-class="nativeInApp ? 'side-panel-native-enter-to' : 'side-panel-enter-to'"
      :leave-from-class="nativeInApp ? 'side-panel-native-leave-from' : 'side-panel-leave-from'"
      :leave-to-class="nativeInApp ? 'side-panel-native-leave-to' : 'side-panel-leave-to'"
    >
      <div v-if="modelValue" :class="panelShellClass" role="presentation">
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
            :class="[bodyClass, 'side-panel-body-scroll flex min-h-0 flex-1 flex-col', resolvedContentPadding]"
          >
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" :class="dense ? footerDenseClass : footerClass">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, useId } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  modelValue: boolean
  title?: string
  subtitle?: string
  eyebrow?: string
  /**
   * Kept for API compatibility; all drawers share the same width on desktop (`--dashboard-drawer-width`).
   * Below `lg`, the panel is full width.
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'drawer'
  showClose?: boolean
  closeOnBackdrop?: boolean
  contentPadding?: string
  blurBackdrop?: boolean
  /** Tighter header, body, and footer padding */
  dense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  size: 'md',
  showClose: true,
  closeOnBackdrop: true,
  contentPadding: '',
  blurBackdrop: false,
  dense: false,
})

const { isNativeApp } = useCapacitorNativeApp()
const nativeInApp = computed(() => isNativeApp.value)

const teleportTarget = computed(() =>
  nativeInApp.value ? '#dashboard-native-overlay-host' : 'body'
)

const resolvedContentPadding = computed(() => {
  if (props.contentPadding) return props.contentPadding
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

const panelWidthClasses = 'max-lg:w-full lg:w-[min(92vw,var(--dashboard-drawer-width))]'

const panelShellClass = computed(() =>
  nativeInApp.value
    ? 'side-panel-native-shell pointer-events-auto flex h-full min-h-0 w-full flex-col'
    : 'pointer-events-none fixed inset-y-0 right-0 z-[1110] flex h-[100dvh] min-h-[100dvh] w-full items-stretch justify-end'
)

const panelDialogClass = computed(() =>
  nativeInApp.value
    ? [
        'side-panel-native-dialog flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden',
        drawerShellClass,
      ]
    : [
        'pointer-events-auto flex min-h-0 flex-col overflow-hidden',
        drawerShellClass,
        panelWidthClasses,
      ]
)

const handleClose = () => {
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

  if (nativeInApp.value) {
    const main = document.querySelector<HTMLElement>('[data-dashboard-main]')
    if (main) {
      main.style.overflow = locked ? 'hidden' : ''
    }
    document.documentElement.toggleAttribute('data-native-drawer-open', locked)
    return
  }

  document.body.style.overflow = locked ? 'hidden' : ''
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

/* Native: subtle fade within the content chrome */
.side-panel-native-enter-active {
  transition: opacity 280ms ease-out;
}

.side-panel-native-leave-active {
  transition: opacity 220ms ease-in;
}

.side-panel-native-enter-from,
.side-panel-native-leave-to {
  opacity: 0;
}

.side-panel-native-enter-to,
.side-panel-native-leave-from {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .side-panel-enter-active,
  .side-panel-leave-active,
  .side-panel-native-enter-active,
  .side-panel-native-leave-active {
    transition-duration: 45ms !important;
  }
}
</style>
