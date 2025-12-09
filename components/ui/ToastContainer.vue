<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      name="toast"
      class="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      style="max-width: 420px;"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl animate-slide-in',
          getToastClasses(toast.type)
        ]"
        role="alert"
      >
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5">
          <component :is="getIcon(toast.type)" :class="getIconClasses(toast.type)" class="w-5 h-5" />
        </div>
        
        <!-- Message -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium" :class="getTextClasses(toast.type)">
            {{ toast.message }}
          </p>
        </div>
        
        <!-- Close Button -->
        <button
          @click="removeToast(toast.id)"
          class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close notification"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid'
import { useToast, type ToastType } from '~/composables/useToast'

const { toasts, removeToast } = useToast()

const getToastClasses = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50/60 dark:bg-green-900/20 border-green-200/40 dark:border-green-800/40 shadow-lg shadow-green-500/10'
    case 'error':
      return 'bg-red-50/60 dark:bg-red-900/20 border-red-200/40 dark:border-red-800/40 shadow-lg shadow-red-500/10'
    case 'warning':
      return 'bg-yellow-50/60 dark:bg-yellow-900/20 border-yellow-200/40 dark:border-yellow-800/40 shadow-lg shadow-yellow-500/10'
    case 'info':
      return 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-200/40 dark:border-blue-800/40 shadow-lg shadow-blue-500/10'
    default:
      return 'bg-white/60 dark:bg-gray-900/20 border-gray-200/40 dark:border-gray-800/40 shadow-lg shadow-gray-500/10'
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
      return 'text-green-800 dark:text-green-200'
    case 'error':
      return 'text-red-800 dark:text-red-200'
    case 'warning':
      return 'text-yellow-800 dark:text-yellow-200'
    case 'info':
      return 'text-blue-800 dark:text-blue-200'
    default:
      return 'text-gray-800 dark:text-gray-200'
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

