<template>
  <IosDrawer
    v-if="nativeIosSheet"
    :model-value="modelValue"
    :title="title"
    :subtitle="undefined"
    :eyebrow="undefined"
    :body-padding="contentPadding || 'p-0'"
    :show-close="showClose"
    :close-on-backdrop="closeOnBackdrop"
    variant="crud"
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
    <!-- Native: right-edge drawer -->
    <Transition v-if="nativeInApp" name="native-drawer-shell">
      <div
        v-if="modelValue"
        class="native-side-drawer-root pointer-events-auto relative flex h-full min-h-0 w-full overflow-hidden"
        role="presentation"
      >
        <div
          class="native-side-drawer-backdrop native-modal-backdrop absolute inset-0"
          aria-hidden="true"
          @click="handleBackdropClick"
        />
        <div
          class="native-side-drawer-stage pointer-events-none relative z-10 flex h-full min-h-0 w-full justify-end"
        >
          <div
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
        </div>
      </div>
    </Transition>

    <!-- Web: centered modal (above SidePanel drawer at z-[1111]) -->
    <div v-else-if="modelValue" class="fixed inset-0 z-[1120] overflow-y-auto" data-dashboard-teleport role="presentation">
      <div
        :class="[
          'absolute inset-0 transition-opacity duration-300',
          backdropClass,
        ]"
        aria-hidden="true"
        @click="handleBackdropClick"
      />

      <div
        class="pointer-events-none relative z-10 flex min-h-full w-full items-end justify-center p-3 sm:min-h-0 sm:h-full sm:items-center sm:p-4 md:p-5"
      >
        <Transition
          enter-active-class="transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          leave-active-class="transition duration-200 ease-in"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-2 sm:scale-[0.98]"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-3 sm:scale-[0.99]"
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
import {
  XMarkIcon,
} from '~/utils/app-icons'
import IosDrawer from '~/components/ios/IosDrawer.vue'
import { setNativeOverlayLock } from '~/utils/native-overlay-lock'
import { blurActiveElementIfNative } from '~/utils/native-focus'
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
const { isCapacitorIos } = useIsCapacitorIos()
const nativeInApp = computed(() => isNativeApp.value)
const nativeIosSheet = computed(() => isCapacitorIos.value)

const resolvedEyebrow = computed(() => props.eyebrow || (props.title ? 'Details' : undefined))

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
  if (nativeInApp.value) {
    const nativeSizeMap = {
      xs: 'dash-overlay-modal--xs',
      sm: 'dash-overlay-modal--sm',
      md: 'dash-overlay-modal--md',
      lg: 'dash-overlay-modal--lg native-side-drawer-panel--wide',
      xl: 'dash-overlay-modal--xl native-side-drawer-panel--wide',
    }
    return nativeSizeMap[props.size]
  }

  const sizeMap = {
    xs: 'dash-overlay-modal--xs mx-auto w-full',
    sm: 'dash-overlay-modal--sm mx-auto w-full',
    md: 'dash-overlay-modal--md mx-auto w-full',
    lg: 'dash-overlay-modal--lg mx-auto w-full',
    xl: 'dash-overlay-modal--xl mx-auto w-full',
  }
  return sizeMap[props.size]
})

const nativeDrawerCompact = computed(() => nativeInApp.value && props.size === 'xs')

const dialogClass = computed(() =>
  nativeInApp.value
    ? [
        'native-side-drawer-panel pointer-events-auto relative flex min-h-0 flex-col overflow-hidden',
        nativeDrawerCompact.value ? 'native-side-drawer-panel--compact' : '',
        modalShellClass,
        'dash-overlay-drawer',
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
</style>
