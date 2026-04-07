<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[ 'relative inline-flex items-center justify-center rounded-sm border-0 font-semibold cursor-pointer transition duration-200 ease-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed', sizeClasses, variantBgClasses, variantFocusRingClasses, variantTextClasses, extraClass ]"
    @click="handleClick"
  >
    <span class="relative z-10 inline-flex items-center gap-1.5 sm:gap-2 text-inherit">
      <component
        v-if="loading"
        :is="loadingIcon"
        class="w-5 h-5 animate-spin shrink-0"
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
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
  }
  return sizeMap[props.size]
})

// Solid background for filled variants (fixes “half blue” / transparent default)
const variantBgClasses = computed(() => {
  const map = {
    primary:
      'bg-primary-400 dark:bg-primary-500 text-white hover:bg-primary-500 dark:hover:bg-primary-600 active:bg-primary-600 dark:active:bg-primary-700',
    secondary:
      'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500 active:bg-gray-400 dark:active:bg-gray-400',
    danger:
      'bg-red-500 dark:bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
    success:
      'bg-green-500 dark:bg-green-500 text-white hover:bg-green-600 active:bg-green-700',
    outline:
      'bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-900',
    ghost:
      'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700',
  }
  return map[props.variant]
})

// Keyboard focus only; no ring/border at rest or on hover
const variantFocusRingClasses = computed(() => {
  const map = {
    primary:
      'focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-primary-400/60',
    secondary:
      'focus-visible:ring-2 focus-visible:ring-gray-400/60 focus-visible:ring-offset-2 dark:focus-visible:ring-gray-500/50',
    danger:
      'focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2',
    success:
      'focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2',
    outline:
      'focus-visible:ring-2 focus-visible:ring-gray-400/50 focus-visible:ring-offset-2 dark:focus-visible:ring-gray-500/50',
    ghost:
      'focus-visible:ring-2 focus-visible:ring-gray-400/60 focus-visible:ring-offset-2 dark:focus-visible:ring-gray-500/50',
  }
  return map[props.variant]
})

// Extra text tweaks for outline/ghost (filled variants already set text on bg)
const variantTextClasses = computed(() => {
  const map = {
    primary: '',
    secondary: '',
    danger: '',
    success: '',
    outline: 'hover:text-gray-900 dark:hover:text-white',
    ghost: 'hover:text-gray-900 dark:hover:text-gray-100',
  }
  return map[props.variant]
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
