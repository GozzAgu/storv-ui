<template>
  <Teleport :to="teleportTarget">
    <div v-if="modelValue" :class="rootClass" role="presentation">
      <div
        v-if="!nativeInApp"
        :class="[
          'absolute inset-0 transition-opacity duration-300',
          backdropClass,
          blurBackdrop ? 'backdrop-blur-[3px]' : '',
        ]"
        aria-hidden="true"
        @click="handleBackdropClick"
      />

      <div :class="stageClass">
        <Transition
          :enter-active-class="
            nativeInApp
              ? 'modal-native-enter-active'
              : 'transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
          "
          :leave-active-class="
            nativeInApp ? 'modal-native-leave-active' : 'transition duration-200 ease-in'
          "
          :enter-from-class="
            nativeInApp
              ? 'modal-native-enter-from'
              : 'opacity-0 translate-y-4 sm:translate-y-2 sm:scale-[0.98]'
          "
          :enter-to-class="
            nativeInApp ? 'modal-native-enter-to' : 'opacity-100 translate-y-0 sm:scale-100'
          "
          :leave-from-class="
            nativeInApp ? 'modal-native-leave-from' : 'opacity-100 translate-y-0 sm:scale-100'
          "
          :leave-to-class="
            nativeInApp ? 'modal-native-leave-to' : 'opacity-0 translate-y-3 sm:scale-[0.99]'
          "
        >
          <div
            v-if="modelValue"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="labelledBy"
            :aria-describedby="describedBy"
            :class="dialogClass"
            @click.stop
          >
            <div v-if="title || subtitle || $slots.header || showClose" :class="headerClass">
              <div class="flex min-w-0 flex-1 items-start gap-3 pr-1">
                <slot name="header">
                  <div v-if="title || subtitle" class="min-w-0">
                    <p v-if="eyebrow" :class="eyebrowClass">
                      {{ eyebrow }}
                    </p>
                    <h3 v-if="title" :id="titleId" :class="titleClass">
                      {{ title }}
                    </h3>
                    <p v-if="subtitle" :id="subtitleId" :class="subtitleClass">
                      {{ subtitle }}
                    </p>
                  </div>
                </slot>
              </div>
              <button
                v-if="showClose"
                type="button"
                :class="closeButtonClass"
                aria-label="Close modal"
                @click="handleClose"
              >
                <XMarkIcon class="h-4 w-4" stroke-width="1.75" />
              </button>
            </div>

            <div :class="[bodyClass, 'modal-body-scroll', contentPadding]">
              <slot />
            </div>

            <div v-if="$slots.footer" :class="footerClass">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </div>
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
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
  closeOnBackdrop?: boolean
  contentPadding?: string
  blurBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  size: 'md',
  showClose: true,
  closeOnBackdrop: true,
  contentPadding: 'px-4 py-4 sm:px-5 sm:py-5',
  blurBackdrop: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const { isNativeApp } = useCapacitorNativeApp()
const nativeInApp = computed(() => isNativeApp.value)

const teleportTarget = computed(() =>
  nativeInApp.value ? '#dashboard-native-overlay-host' : 'body'
)

const {
  backdropClass,
  modalShellClass,
  headerClass,
  bodyClass,
  footerClass,
  closeButtonClass,
  titleClass,
  subtitleClass,
  eyebrowClass,
} = useDashboardOverlayChrome()

const titleId = useId()
const subtitleId = useId()

const labelledBy = computed(() => (props.title ? titleId : undefined))
const describedBy = computed(() => (props.subtitle ? subtitleId : undefined))

const sizeClasses = computed(() => {
  const sizeMap = {
    xs: 'dash-overlay-modal--xs mx-auto w-full',
    sm: 'dash-overlay-modal--sm mx-auto w-full',
    md: 'dash-overlay-modal--md mx-auto w-full',
    lg: 'dash-overlay-modal--lg mx-auto w-full',
    xl: 'dash-overlay-modal--xl mx-auto w-full',
  }
  return sizeMap[props.size]
})

const rootClass = computed(() =>
  nativeInApp.value
    ? 'modal-native-shell pointer-events-auto flex h-full min-h-0 w-full flex-col overflow-hidden'
    : 'fixed inset-0 z-[105] overflow-y-auto'
)

const stageClass = computed(() =>
  nativeInApp.value
    ? 'pointer-events-none relative z-10 flex h-full min-h-0 flex-1 items-center justify-center p-3'
    : 'pointer-events-none relative z-10 flex min-h-full w-full items-end justify-center p-3 sm:min-h-0 sm:h-full sm:items-center sm:p-4 md:p-5'
)

const dialogClass = computed(() =>
  nativeInApp.value
    ? [
        'pointer-events-auto relative flex max-h-full w-full min-h-0 flex-col overflow-hidden',
        modalShellClass,
        sizeClasses.value,
      ]
    : [
        'pointer-events-auto relative flex w-full flex-col overflow-hidden',
        modalShellClass,
        'rounded-t-2xl sm:rounded-2xl',
        'max-h-[min(92dvh,calc(100dvh-1rem))] sm:max-h-[min(92dvh,calc(100dvh-2rem))]',
        sizeClasses.value,
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
.modal-body-scroll {
  scrollbar-gutter: stable;
}

.modal-body-scroll::-webkit-scrollbar {
  width: 8px;
}

.modal-body-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgb(0 0 0 / 0.12);
}

.dark .modal-body-scroll::-webkit-scrollbar-thumb {
  background: rgb(255 255 255 / 0.12);
}

.modal-native-enter-active {
  transition: opacity 280ms ease-out, transform 280ms ease-out;
}

.modal-native-leave-active {
  transition: opacity 220ms ease-in, transform 220ms ease-in;
}

.modal-native-enter-from,
.modal-native-leave-to {
  opacity: 0;
  transform: translate3d(0, 6px, 0) scale(0.99);
}

.modal-native-enter-to,
.modal-native-leave-from {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .modal-native-enter-active,
  .modal-native-leave-active {
    transition-duration: 45ms !important;
  }
}
</style>
