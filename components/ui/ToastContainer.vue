<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      name="toast"
      class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-[360px] sm:max-w-[380px]"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto flex items-center gap-3 pl-3 pr-2.5 py-2.5 rounded-lg border-l-[3px] shadow-sm',
          'bg-white dark:bg-gray-800/95 border border-gray-200/80 dark:border-gray-700/80 backdrop-blur-md',
          getAccentBorder(toast.type)
        ]"
        role="alert"
      >
        <component
          :is="getIcon(toast.type)"
          :class="getIconClasses(toast.type)"
          class="w-4 h-4 flex-shrink-0"
          stroke-width="1.5"
        />
        <p class="flex-1 min-w-0 text-[13px] font-medium text-gray-900 dark:text-gray-100 leading-snug">
          {{ toast.message }}
        </p>
        <template v-if="toast.action">
          <button
            @click="toast.action.onClick()"
            class="flex-shrink-0 text-[12px] font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {{ toast.action.label }}
          </button>
        </template>
        <button
          @click="removeToast(toast.id)"
          class="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
          aria-label="Close"
        >
          <XMarkIcon class="w-3.5 h-3.5" stroke-width="2" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline'
import { useToast, type ToastType } from '~/composables/useToast'

const { toasts, removeToast } = useToast()

const getAccentBorder = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'border-l-green-500 dark:border-l-green-400'
    case 'error':
      return 'border-l-red-500 dark:border-l-red-400'
    case 'warning':
      return 'border-l-amber-500 dark:border-l-amber-400'
    case 'info':
      return 'border-l-blue-500 dark:border-l-blue-400'
    default:
      return 'border-l-gray-400 dark:border-l-gray-500'
  }
}

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return CheckCircleIcon
    case 'error':
      return XCircleIcon
    case 'warning':
      return ExclamationTriangleIcon
    case 'info':
      return InformationCircleIcon
    default:
      return InformationCircleIcon
  }
}

const getIconClasses = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'text-green-600 dark:text-green-400'
    case 'error':
      return 'text-red-600 dark:text-red-400'
    case 'warning':
      return 'text-amber-600 dark:text-amber-400'
    case 'info':
      return 'text-blue-600 dark:text-blue-400'
    default:
      return 'text-gray-500 dark:text-gray-400'
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.21, 1.02, 0.73, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.25s cubic-bezier(0.21, 1.02, 0.73, 1);
}
</style>

