<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[105] overflow-hidden" role="presentation">
      <div
        :class="[
          'absolute inset-0 transition-opacity duration-300',
          backdropClass,
          blurBackdrop ? 'backdrop-blur-[3px]' : '',
        ]"
        aria-hidden="true"
        @click="handleBackdropClick"
      />

      <div
        class="pointer-events-none relative z-10 flex min-h-full items-end justify-center sm:items-center sm:p-4 md:p-5"
      >
        <Transition
          enter-active-class="transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-2 sm:scale-[0.98]"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-3 sm:scale-[0.99]"
        >
          <div
            v-if="modelValue"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="labelledBy"
            :aria-describedby="describedBy"
            :class="[
              'pointer-events-auto relative max-h-[min(92dvh,calc(100dvh-1rem))]',
              shellClass,
              'rounded-t-xl sm:rounded-xl',
              sizeClasses,
            ]"
            @click.stop
          >
            <div
              v-if="title || subtitle || $slots.header || showClose"
              :class="headerClass"
            >
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
  contentPadding: 'px-4 py-4 sm:px-5 sm:py-5',
  blurBackdrop: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const {
  backdropClass,
  shellClass,
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
