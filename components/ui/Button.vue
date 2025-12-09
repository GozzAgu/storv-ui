<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-1.5 sm:gap-2 font-medium rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      sizeClasses,
      variantClasses,
      extraClass
    ]"
    @click="handleClick"
  >
    <component
      v-if="loading"
      :is="loadingIcon"
      class="w-5 h-5 animate-spin"
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
    sm: 'px-2.5 py-1.5 text-xs sm:text-sm',
    md: 'px-3.5 py-2 text-xs sm:text-sm',
    lg: 'px-5 py-2.5 text-sm sm:text-base',
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

const variantClasses = computed(() => {
  const variantMap = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white active:scale-[0.98] focus:ring-primary-500/20 dark:focus:ring-offset-gray-800',
    secondary: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 active:scale-[0.98] focus:ring-gray-500/20 dark:focus:ring-offset-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white active:scale-[0.98] focus:ring-red-500/20 dark:focus:ring-offset-gray-800',
    success: 'bg-green-600 hover:bg-green-700 text-white active:scale-[0.98] focus:ring-green-500/20 dark:focus:ring-offset-gray-800',
    outline: 'border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 active:scale-[0.98] focus:ring-gray-500/20 dark:focus:ring-offset-gray-800',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 active:scale-[0.98] focus:ring-gray-500/20 dark:focus:ring-offset-gray-800',
  }
  return variantMap[props.variant]
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

