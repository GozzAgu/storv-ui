<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      name="s-toast"
      class="s-c s-toast-stack"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="s-toast"
        :class="`s-toast--${toast.type}`"
        :role="toast.type === 'error' ? 'alert' : undefined"
      >
        <component
          :is="getIcon(toast.type)"
          class="s-toast__icon"
          :size="16"
          :stroke-width="1.75"
          aria-hidden="true"
        />

        <div class="s-toast__body">
          <p class="s-toast__message">{{ toast.message }}</p>
          <SButton
            v-if="toast.action"
            class="s-toast__action"
            variant="ghost"
            size="sm"
            @click="toast.action.onClick()"
          >
            {{ toast.action.label }}
          </SButton>
        </div>

        <SIconButton class="s-toast__close" label="Dismiss" size="sm" @click="removeToast(toast.id)">
          <X :size="16" :stroke-width="1.75" aria-hidden="true" />
        </SIconButton>

        <span v-if="showsProgress(toast)" class="s-toast__progress" aria-hidden="true">
          <span
            class="s-toast__progress-bar"
            :style="{ animationDuration: `${toast.duration}ms` }"
          />
        </span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { CircleAlert, CircleCheck, CircleX, Info, X } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import { useAppToast, type Toast, type ToastType } from '~/composables/useAppToast'

const { toasts, removeToast } = useAppToast()

function showsProgress(toast: Toast) {
  return (toast.duration ?? 0) > 0
}

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return CircleCheck
    case 'error':
      return CircleX
    case 'warning':
      return CircleAlert
    default:
      return Info
  }
}
</script>
