<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'group relative inline-flex items-center justify-center overflow-hidden rounded-2xl border-0 font-semibold tracking-tight cursor-pointer transition-all duration-200 ease-out',
      'focus:outline-none disabled:opacity-45 disabled:cursor-not-allowed',
      'active:scale-[0.98] motion-reduce:active:scale-100',
      sizeClasses,
      variantSurfaceClasses,
      variantFocusRingClasses,
      variantTextClasses,
      extraClass,
    ]"
    @click="handleClick"
  >
    <!-- Specular highlight (glass) -->
    <span
      class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/45 via-transparent to-transparent opacity-50 dark:from-white/10 dark:opacity-80"
      aria-hidden="true"
    />
    <span class="relative z-10 inline-flex items-center gap-1.5 text-inherit sm:gap-2">
      <component
        v-if="loading"
        :is="loadingIcon"
        class="h-5 w-5 shrink-0 animate-spin"
      />
      <component
        v-else-if="icon && !iconRight"
        :is="icon"
        :class="iconSize"
      />
      <slot />
      <component
        v-if="icon && iconRight"
        :is="icon"
        :class="iconSize"
      />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  icon?: any
  iconRight?: boolean
  extraClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  iconRight: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const loadingIcon = ArrowPathIcon

const sizeClasses = computed(() => {
  const sizeMap = {
    sm: 'px-3 py-1.5 text-xs sm:text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return sizeMap[props.size]
})

const iconSize = computed(() => {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-5 w-5',
  }
  return sizeMap[props.size]
})

/** Glass-forward surfaces: blur + translucent fills + inset/edge light */
const variantSurfaceClasses = computed(() => {
  const map = {
    primary:
      'bg-linear-to-b from-primary-400/95 to-primary-700/98 text-white backdrop-blur-md backdrop-saturate-125 ring-1 ring-inset ring-white/35 hover:from-primary-400 hover:to-primary-800 dark:from-primary-500/90 dark:to-primary-900/95 dark:ring-white/15 dark:hover:to-primary-950',
    secondary:
      'bg-linear-to-b from-white/80 to-gray-100/90 text-gray-900 backdrop-blur-xl ring-1 ring-inset ring-white/80 hover:from-white hover:to-gray-100 dark:from-gray-800/75 dark:to-gray-900/85 dark:text-gray-50 dark:ring-white/8 dark:hover:from-gray-800 dark:hover:to-gray-900',
    danger:
      'bg-linear-to-b from-red-500/92 to-red-800/98 text-white backdrop-blur-md ring-1 ring-inset ring-white/30 hover:from-red-500 hover:to-red-900',
    success:
      'bg-linear-to-b from-emerald-500/92 to-emerald-800/98 text-white backdrop-blur-md ring-1 ring-inset ring-white/30 hover:from-emerald-500 hover:to-emerald-900',
    outline:
      'bg-white/55 text-gray-800 backdrop-blur-xl ring-1 ring-inset ring-white/70 hover:bg-white/75 dark:bg-white/6 dark:text-gray-100 dark:ring-white/10 dark:hover:bg-white/12',
    ghost:
      'bg-transparent text-gray-700 backdrop-blur-sm hover:bg-white/40 dark:text-gray-200 dark:hover:bg-white/8',
  }
  return map[props.variant]
})

const variantFocusRingClasses = computed(() => {
  const map = {
    primary:
      'focus-visible:ring-2 focus-visible:ring-primary-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80 dark:focus-visible:ring-primary-300/60 dark:focus-visible:ring-offset-[#0c0e14]',
    secondary:
      'focus-visible:ring-2 focus-visible:ring-gray-400/50 focus-visible:ring-offset-2 dark:focus-visible:ring-gray-500/45 dark:focus-visible:ring-offset-[#0c0e14]',
    danger:
      'focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]',
    success:
      'focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]',
    outline:
      'focus-visible:ring-2 focus-visible:ring-primary-500/45 focus-visible:ring-offset-2 dark:focus-visible:ring-primary-400/40 dark:focus-visible:ring-offset-[#0c0e14]',
    ghost:
      'focus-visible:ring-2 focus-visible:ring-gray-400/50 focus-visible:ring-offset-2 dark:focus-visible:ring-gray-500/40 dark:focus-visible:ring-offset-[#0c0e14]',
  }
  return map[props.variant]
})

const variantTextClasses = computed(() => {
  const map = {
    primary: '',
    secondary: '',
    danger: '',
    success: '',
    outline: 'hover:text-gray-900 dark:hover:text-white',
    ghost: 'hover:text-gray-900 dark:hover:text-gray-50',
  }
  return map[props.variant]
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
