<template>
  <Teleport to="body">
    <TransitionGroup tag="div" name="toast" class="dash-toast-stack">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="dash-toast"
        role="status"
        :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
      >
        <div class="dash-toast__inner">
          <component
            :is="getIcon(toast.type)"
            :class="['mt-0.5 h-4 w-4 shrink-0', getIconClass(toast.type)]"
            stroke-width="1.75"
            aria-hidden="true"
          />

          <div class="min-w-0 flex-1">
            <p class="dash-toast__message">
              {{ toast.message }}
            </p>
            <button
              v-if="toast.action"
              type="button"
              class="dash-toast__action"
              @click="toast.action.onClick()"
            >
              {{ toast.action.label }}
            </button>
          </div>

          <button
            type="button"
            class="dash-toast__close"
            aria-label="Dismiss"
            @click="removeToast(toast.id)"
          >
            <XMarkIcon class="h-3.5 w-3.5" stroke-width="2" />
          </button>
        </div>

        <div v-if="showsProgress(toast)" class="dash-toast__progress-track" aria-hidden="true">
          <div
            class="dash-toast__progress-bar"
            :class="getProgressClass(toast.type)"
            :style="{ animationDuration: `${toast.duration}ms` }"
          />
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'
import { useAppToast, type Toast, type ToastType } from '~/composables/useAppToast'

const { toasts, removeToast } = useAppToast()

function showsProgress(toast: Toast) {
  return (toast.duration ?? 0) > 0
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

const getIconClass = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'dash-toast__icon--success'
    case 'error':
      return 'dash-toast__icon--error'
    case 'warning':
      return 'dash-toast__icon--warning'
    case 'info':
      return 'dash-toast__icon--info'
    default:
      return 'dash-toast__icon--info'
  }
}

const getProgressClass = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'dash-toast__progress-bar--success'
    case 'error':
      return 'dash-toast__progress-bar--error'
    case 'warning':
      return 'dash-toast__progress-bar--warning'
    case 'info':
      return 'dash-toast__progress-bar--info'
    default:
      return 'dash-toast__progress-bar--info'
  }
}
</script>

<style scoped>
.toast-enter-active {
  transition:
    opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-leave-active {
  transition:
    opacity 0.28s cubic-bezier(0.4, 0, 1, 1),
    transform 0.32s cubic-bezier(0.4, 0, 1, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate3d(100%, 0, 0);
}

.toast-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.dash-toast__progress-bar {
  animation-name: dash-toast-progress;
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition-duration: 0.01ms !important;
  }

  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }

  .dash-toast__progress-bar {
    animation: none;
    transform: scaleX(0);
  }
}
</style>
