<template>
  <Teleport to="body">
    <!--
      Two sibling Transitions (no outer v-if): closing used to unmount the shell instantly,
      so leave animations never ran. Backdrop fades; panel slides on transform only (cleaner on frosted glass).
      z: backdrop 1100, panel 1110 — above DashboardFixedFooter (50) and folder menus (1000).
    -->
    <Transition
      enter-active-class="transition-opacity duration-[400ms] ease-out"
      leave-active-class="transition-opacity duration-[320ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        :class="[ 'fixed inset-0 z-[1100] bg-slate-950/55 dark:bg-black/65', blurBackdrop ? 'backdrop-blur-[2px]' : '', ]"
        aria-hidden="true"
        @click="handleBackdropClick"
      />
    </Transition>

    <Transition
      enter-active-class="side-panel-enter-active"
      leave-active-class="side-panel-leave-active"
      enter-from-class="side-panel-enter-from"
      enter-to-class="side-panel-enter-to"
      leave-from-class="side-panel-leave-from"
      leave-to-class="side-panel-leave-to"
    >
      <div
        v-if="modelValue"
        class="pointer-events-none fixed inset-y-0 right-0 z-[1110] flex h-[100dvh] min-h-[100dvh] w-full items-stretch justify-end"
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="labelledBy"
          :aria-describedby="describedBy"
          :class="[ 'frosted-glass pointer-events-auto flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden border-l border-gray-200/90 pb-[env(safe-area-inset-bottom,0)] text-gray-900 dark:border-gray-800 dark:text-gray-100', 'w-full min-w-0 rounded-none lg:rounded-l-sm', panelWidthClasses, ]"
          @click.stop
        >
            <!-- Header -->
            <div
              v-if="title || subtitle || $slots.header || showClose"
              class="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200/90 bg-transparent px-4 py-3.5 dark:border-gray-800 sm:px-5 sm:py-4"
            >
              <div class="flex min-w-0 flex-1 items-start gap-3 pr-1">
                <slot name="header">
                  <div v-if="title || subtitle" class="min-w-0">
                    <p
                      v-if="eyebrow"
                      class="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500"
                    >
                      {{ eyebrow }}
                    </p>
                    <h3
                      v-if="title"
                      :id="titleId"
                      class="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-[1.0625rem]"
                    >
                      {{ title }}
                    </h3>
                    <p
                      v-if="subtitle"
                      :id="subtitleId"
                      class="mt-1 text-[13px] leading-snug text-gray-500 dark:text-gray-400"
                    >
                      {{ subtitle }}
                    </p>
                  </div>
                </slot>
              </div>
              <button
                v-if="showClose"
                type="button"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-gray-200/90 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-100"
                aria-label="Close panel"
                @click="handleClose"
              >
                <XMarkIcon class="h-4 w-4" stroke-width="1.75" />
              </button>
            </div>

            <!-- Body -->
            <div
              class="side-panel-body-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain bg-transparent"
              :class="contentPadding"
            >
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex shrink-0 flex-col items-stretch justify-end gap-2 border-t border-gray-200/90 bg-transparent px-4 py-3 dark:border-gray-800 sm:flex-row sm:items-center sm:px-5 sm:py-4"
            >
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
   * Width: below `sm`, panel is full width. From `sm` up: `xl` = wide column; else 35% viewport.
   * Height is always full viewport (`100dvh`) so the shell doesn’t stop mid-screen.
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'drawer'
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
  contentPadding: 'p-4 sm:p-5',
  blurBackdrop: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const titleId = useId()
const subtitleId = useId()

const labelledBy = computed(() => (props.title ? titleId : undefined))
const describedBy = computed(() => (props.subtitle ? subtitleId : undefined))

const panelWidthClasses = computed(() => {
  // Full width through tablet (`lg`); partial-width drawer on desktop only
  if (props.size === 'xl') {
    return 'max-lg:w-full lg:w-[min(92vw,72rem)]'
  }
  return 'max-lg:w-full lg:w-[35%]'
})

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

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
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

/* Panel slide: GPU-friendly transform (matches backdrop timing for a cohesive open/close) */
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
