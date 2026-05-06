<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      name="toast"
      class="pointer-events-none fixed right-0 top-0 z-9999 flex w-full max-w-[min(100vw-1.25rem,22rem)] flex-col gap-2 p-3 sm:right-1.5 sm:top-1.5 sm:max-w-88 sm:p-3"
      :style="{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto relative overflow-hidden rounded-xl border shadow-md',
          'border-white/40 bg-linear-to-br backdrop-blur-xl backdrop-saturate-125 dark:border-white/10',
          glassSurface,
          getAccent(toast.type),
        ]"
        role="alert"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/25 via-transparent to-transparent opacity-50 dark:from-white/4"
        />

        <div class="relative flex items-start gap-2 pl-2.5 pr-1 py-2 sm:pl-3 sm:pr-1.5 sm:py-2">
          <div
            :class="[
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent',
              getIconShell(toast.type),
            ]"
          >
            <component
              :is="getIcon(toast.type)"
              :class="['h-3.5 w-3.5', getIconClasses(toast.type)]"
              stroke-width="1.5"
            />
          </div>

          <div class="min-w-0 flex-1 pt-px pr-0.5">
            <p
              class="text-[11px] font-normal leading-snug text-zinc-700 antialiased dark:text-zinc-300 sm:text-xs"
            >
              {{ toast.message }}
            </p>
            <template v-if="toast.action">
              <button
                type="button"
                @click="toast.action.onClick()"
                class="mt-1.5 inline-flex text-[11px] font-medium text-primary-600/90 transition-colors duration-200 hover:text-primary-600 dark:text-primary-400/90 dark:hover:text-primary-400"
              >
                {{ toast.action.label }}
              </button>
            </template>
          </div>

          <button
            type="button"
            @click="removeToast(toast.id)"
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors duration-200 hover:bg-black/4 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-white/6 dark:hover:text-zinc-300"
            aria-label="Close"
          >
            <XMarkIcon class="h-3.5 w-3.5" stroke-width="2" />
          </button>
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
import { useAppToast, type ToastType } from '~/composables/useAppToast'

const { toasts, removeToast } = useAppToast()

/** Mostly neutral glass; type cue is the slim left border + icon only */
const glassSurface =
  'from-white/88 to-zinc-50/78 dark:from-zinc-900/72 dark:to-zinc-950/78'

/** Quiet depth + slim left accent instead of loud rings and stripes */
const getAccent = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'shadow-black/[0.04] ring-1 ring-inset ring-black/[0.03] dark:shadow-black/25 dark:ring-white/[0.06] pl-[2px] border-l-2 border-l-emerald-400/55 dark:border-l-emerald-500/45'
    case 'error':
      return 'shadow-black/[0.04] ring-1 ring-inset ring-black/[0.03] dark:shadow-black/25 dark:ring-white/[0.06] pl-[2px] border-l-2 border-l-red-400/50 dark:border-l-red-500/40'
    case 'warning':
      return 'shadow-black/[0.04] ring-1 ring-inset ring-black/[0.03] dark:shadow-black/25 dark:ring-white/[0.06] pl-[2px] border-l-2 border-l-amber-400/50 dark:border-l-amber-500/40'
    case 'info':
      return 'shadow-black/[0.04] ring-1 ring-inset ring-black/[0.03] dark:shadow-black/25 dark:ring-white/[0.06] pl-[2px] border-l-2 border-l-sky-400/50 dark:border-l-sky-500/40'
    default:
      return 'shadow-black/[0.04] ring-1 ring-inset ring-black/[0.03] dark:shadow-black/25 dark:ring-white/[0.06] pl-[2px] border-l-2 border-l-zinc-300/70 dark:border-l-zinc-600/60'
  }
}

const getIconShell = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-500/[0.07] dark:bg-emerald-400/[0.08]'
    case 'error':
      return 'bg-red-500/[0.07] dark:bg-red-400/[0.08]'
    case 'warning':
      return 'bg-amber-500/[0.07] dark:bg-amber-400/[0.08]'
    case 'info':
      return 'bg-sky-500/[0.07] dark:bg-sky-400/[0.08]'
    default:
      return 'bg-zinc-500/[0.06] dark:bg-zinc-400/[0.08]'
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
      return 'text-emerald-600/75 dark:text-emerald-400/80'
    case 'error':
      return 'text-red-600/75 dark:text-red-400/80'
    case 'warning':
      return 'text-amber-600/75 dark:text-amber-400/80'
    case 'info':
      return 'text-sky-600/75 dark:text-sky-400/80'
    default:
      return 'text-zinc-500 dark:text-zinc-400'
  }
}
</script>

<style scoped>
.toast-enter-active {
  transition:
    opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.46s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.38s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity, filter;
}

.toast-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.4, 0, 1, 1),
    transform 0.32s cubic-bezier(0.4, 0, 1, 1),
    filter 0.24s cubic-bezier(0.4, 0, 1, 1);
  will-change: transform, opacity, filter;
}

.toast-enter-from {
  opacity: 0;
  filter: blur(4px);
  transform: translate3d(16px, -6px, 0) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  filter: blur(3px);
  transform: translate3d(10px, -4px, 0) scale(0.97);
}

.toast-move {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition-duration: 0.01ms !important;
  }

  .toast-enter-from,
  .toast-leave-to {
    filter: none;
    transform: none;
  }
}
</style>
