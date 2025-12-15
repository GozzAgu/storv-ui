<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/75 backdrop-blur-sm"
          @click="handleBackdropClick"
        ></div>

        <!-- Modal Container -->
        <div class="flex min-h-full items-center justify-center p-2 sm:p-3 md:p-4">
          <Transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div
              v-if="modelValue"
              :class="[
                'relative w-full bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 transform transition-all max-h-[calc(100vh-2rem)] flex flex-col',
                sizeClasses
              ]"
              @click.stop
            >
              <!-- Header -->
              <div
                v-if="title || $slots.header || showClose"
                class="flex items-center justify-between p-2.5 sm:p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
              >
                <div class="flex items-center gap-1.5 sm:gap-2.5 flex-1 min-w-0">
                  <slot name="header">
                    <h3 v-if="title" class="text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {{ title }}
                    </h3>
                  </slot>
                </div>
                <button
                  v-if="showClose"
                  @click="handleClose"
                  class="p-1 sm:p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
                  aria-label="Close modal"
                >
                  <XMarkIcon class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              <!-- Content -->
              <div class="overflow-y-auto flex-1 min-h-0" :class="contentPadding">
                <slot />
              </div>

              <!-- Footer -->
              <div
                v-if="$slots.footer"
                class="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-1.5 sm:gap-2.5 p-2.5 sm:p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-md flex-shrink-0"
              >
                <slot name="footer" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
  closeOnBackdrop?: boolean
  contentPadding?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  size: 'md',
  showClose: true,
  closeOnBackdrop: true,
  contentPadding: 'p-3 sm:p-4',
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

