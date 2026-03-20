<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="handleBackdropClick"
    >
      <!-- Backdrop: no transition so it doesn't "pop" in before the form -->
      <div
        :class="[
          'fixed inset-0 bg-gray-900/50 dark:bg-gray-900/75',
          blurBackdrop ? 'backdrop-blur-sm' : ''
        ]"
        @click="handleBackdropClick"
      ></div>

      <!-- Modal container + content with transition only on the dialog -->
      <div class="flex min-h-full items-center justify-center p-2 sm:p-3 md:p-4">
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
              :class="[
                'relative w-full bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-gray-200/60 dark:ring-gray-700/60 shadow-xl transform transition-all max-h-[calc(100vh-2rem)] flex flex-col',
                sizeClasses
              ]"
              @click.stop
            >
              <!-- Header: compact, modern -->
              <div
                v-if="title || subtitle || $slots.header || showClose"
                class="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700/60 flex-shrink-0"
              >
                <div class="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <slot name="header">
                    <div v-if="title || subtitle" class="min-w-0">
                      <h3 v-if="title" class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate tracking-tight">
                        {{ title }}
                      </h3>
                      <p v-if="subtitle" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                        {{ subtitle }}
                      </p>
                    </div>
                  </slot>
                </div>
                <button
                  v-if="showClose"
                  @click="handleClose"
                  class="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Close modal"
                >
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>

              <!-- Content -->
              <div class="overflow-y-auto flex-1 min-h-0" :class="contentPadding">
                <slot />
              </div>

              <!-- Footer: compact -->
              <div
                v-if="$slots.footer"
                class="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 p-3 sm:p-4 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-2xl flex-shrink-0"
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
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  modelValue: boolean
  title?: string
  subtitle?: string
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
  contentPadding: 'p-3 sm:p-4',
  blurBackdrop: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const sizeClasses = computed(() => {
  const sizeMap = {
    sm: 'max-w-[90%] sm:max-w-sm',
    md: 'max-w-[90%] sm:max-w-lg',
    lg: 'max-w-[95%] sm:max-w-2xl',
    xl: 'max-w-[95%] sm:max-w-4xl',
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

// Handle ESC key
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue && props.closeOnBackdrop) {
    handleClose()
  }
}

// Prevent body scroll when modal is open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

