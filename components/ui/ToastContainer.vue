<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      name="toast"
      class="fixed top-16 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none"
      style="max-width: 400px;"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto relative flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-sm animate-slide-in',
          getToastClasses(toast.type)
        ]"
        role="alert"
      >
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5">
          <div :class="getIconContainerClasses(toast.type)" class="w-7 h-7 rounded-lg flex items-center justify-center">
            <component :is="getIcon(toast.type)" :class="getIconClasses(toast.type)" class="w-4 h-4 stroke-1" stroke-width="1.5" />
          </div>
        </div>
        
        <!-- Message -->
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium leading-relaxed" :class="getTextClasses(toast.type)">
            {{ toast.message }}
          </p>
        </div>
        
        <!-- Close Button -->
        <button
          @click="removeToast(toast.id)"
          class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Close notification"
        >
          <XMarkIcon class="w-4 h-4 stroke-1" stroke-width="1.5" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline'
import { useToast, type ToastType } from '~/composables/useToast'

const { toasts, removeToast } = useToast()

const getToastClasses = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-white/95 dark:bg-gray-800/95 border-green-200/60 dark:border-green-800/40'
    case 'error':
      return 'bg-white/95 dark:bg-gray-800/95 border-red-200/60 dark:border-red-800/40'
    case 'warning':
      return 'bg-white/95 dark:bg-gray-800/95 border-yellow-200/60 dark:border-yellow-800/40'
    case 'info':
      return 'bg-white/95 dark:bg-gray-800/95 border-blue-200/60 dark:border-blue-800/40'
    default:
      return 'bg-white/95 dark:bg-gray-800/95 border-gray-200/60 dark:border-gray-700/40'
  }
}

const getIconContainerClasses = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20'
    case 'error':
      return 'bg-red-50 dark:bg-red-900/20'
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-900/20'
    case 'info':
      return 'bg-blue-50 dark:bg-blue-900/20'
    default:
      return 'bg-gray-50 dark:bg-gray-700/50'
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
      return 'text-yellow-600 dark:text-yellow-400'
    case 'info':
      return 'text-blue-600 dark:text-blue-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const getTextClasses = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'text-gray-900 dark:text-gray-100'
    case 'error':
      return 'text-gray-900 dark:text-gray-100'
    case 'warning':
      return 'text-gray-900 dark:text-gray-100'
    case 'info':
      return 'text-gray-900 dark:text-gray-100'
    default:
      return 'text-gray-900 dark:text-gray-100'
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>

