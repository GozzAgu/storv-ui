<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      name="toast"
      class="pointer-events-none fixed right-0 top-0 z-9999 flex w-full max-w-[min(100vw-1.25rem,20rem)] flex-col gap-2.5 p-3 sm:right-4 sm:top-4 sm:max-w-[20rem]"
      :style="{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'toast-glass pointer-events-auto relative overflow-hidden rounded-xl',
          'border border-white/50 bg-white/70 backdrop-blur-xl backdrop-saturate-150',
          'dark:border-white/10 dark:bg-zinc-900/65',
        ]"
        role="status"
        :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
      >
        <div class="flex items-start gap-2.5 px-3.5 pb-2.5 pt-3">
          <component
            :is="getIcon(toast.type)"
            :class="['mt-0.5 h-4 w-4 shrink-0', getIconClass(toast.type)]"
            stroke-width="1.75"
            aria-hidden="true"
          />

          <div class="min-w-0 flex-1 pt-px">
            <p class="text-[13px] font-medium leading-snug text-zinc-800 dark:text-zinc-100">
              {{ toast.message }}
            </p>
            <button
              v-if="toast.action"
              type="button"
              class="mt-1.5 text-xs font-medium text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
              @click="toast.action.onClick()"
            >
              {{ toast.action.label }}
            </button>
          </div>

          <button
            type="button"
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
            aria-label="Dismiss"
            @click="removeToast(toast.id)"
          >
            <XMarkIcon class="h-3.5 w-3.5" stroke-width="2" />
          </button>
        </div>

        <div
          v-if="showsProgress(toast)"
          class="h-[2px] w-full bg-zinc-900/5 dark:bg-white/8"
          aria-hidden="true"
        >
          <div
            class="toast-progress h-full origin-left"
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
      return 'text-emerald-600 dark:text-emerald-400'
    case 'error':
      return 'text-red-600 dark:text-red-400'
    case 'warning':
      return 'text-amber-600 dark:text-amber-400'
    case 'info':
      return 'text-sky-600 dark:text-sky-400'
    default:
      return 'text-zinc-500 dark:text-zinc-400'
  }
}

const getProgressClass = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-500/80 dark:bg-emerald-400/90'
    case 'error':
      return 'bg-red-500/80 dark:bg-red-400/90'
    case 'warning':
      return 'bg-amber-500/80 dark:bg-amber-400/90'
    case 'info':
      return 'bg-sky-500/80 dark:bg-sky-400/90'
    default:
      return 'bg-zinc-400/80'
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

/* Slide in from the right */
.toast-enter-from {
  opacity: 0;
  transform: translate3d(100%, 0, 0);
}

.toast-leave-to {
  opacity: 0;
  transform: translate3d(100%, 0, 0);
}

.toast-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-progress {
  animation-name: toast-progress-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes toast-progress-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

@supports not (backdrop-filter: blur(1px)) {
  .toast-glass {
    background-color: rgb(255 255 255 / 0.95);
  }

  :global(.dark) .toast-glass {
    background-color: rgb(24 24 27 / 0.95);
  }
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

  .toast-progress {
    animation: none;
    transform: scaleX(0);
  }
}
</style>
