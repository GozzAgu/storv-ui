<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 overflow-hidden" role="presentation">
      <!-- Backdrop: receives clicks outside panel -->
      <div
        :class="[
          'absolute inset-0 bg-slate-950/55 transition-opacity duration-300 dark:bg-black/65',
          blurBackdrop ? 'backdrop-blur-[2px]' : '',
        ]"
        aria-hidden="true"
        @click="handleBackdropClick"
      />

      <!-- Full-screen row passes clicks through to backdrop except on the dialog -->
      <div
        class="pointer-events-none relative z-10 flex min-h-full items-end justify-center sm:items-center sm:p-3 md:p-5"
      >
        <Transition
          enter-active-class="transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          enter-from-class="opacity-0 translate-y-6 sm:translate-y-4 sm:scale-[0.97]"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:scale-[0.98]"
        >
          <div
            v-if="modelValue"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="labelledBy"
            :aria-describedby="describedBy"
            :class="[
              'pointer-events-auto relative flex max-h-[min(92dvh,calc(100dvh-1rem))] min-h-0 w-full flex-col overflow-hidden border border-gray-200/90 bg-white pb-[env(safe-area-inset-bottom,0)] text-gray-900 dark:border-gray-800 dark:bg-slate-950 dark:text-gray-100',
              'rounded-t-[1.35rem] sm:rounded-2xl',
              sizeClasses,
            ]"
            @click.stop
          >
            <!-- Header -->
            <div
              v-if="title || subtitle || $slots.header || showClose"
              class="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200/90 bg-white px-4 py-3.5 dark:border-gray-800 dark:bg-slate-950 sm:px-5 sm:py-4"
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
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200/90 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-100"
                aria-label="Close modal"
                @click="handleClose"
              >
                <XMarkIcon class="h-4 w-4" stroke-width="1.75" />
              </button>
            </div>

            <!-- Body -->
            <div
              class="modal-body-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-white dark:bg-slate-950"
              :class="contentPadding"
            >
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex shrink-0 flex-col items-stretch justify-end gap-2 border-t border-gray-200/90 bg-white px-4 py-3 dark:border-gray-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:px-5 sm:py-4"
            >
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
  /** Small label above the title (e.g. "Confirm action") */
  eyebrow?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
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

const sizeClasses = computed(() => {
  const sizeMap = {
    sm: 'max-w-[100%] sm:mx-4 sm:max-w-md',
    md: 'max-w-[100%] sm:mx-4 sm:max-w-lg',
    lg: 'max-w-[100%] sm:mx-4 sm:max-w-2xl',
    xl: 'max-w-[100%] sm:mx-4 sm:max-w-4xl',
  }
  return sizeMap[props.size]
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
/* Prefer overlay scrollbars / thin gutter so wide modal content doesn’t shift */
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
