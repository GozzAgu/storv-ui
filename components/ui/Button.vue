<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'animated-button group relative inline-flex items-center justify-center overflow-hidden rounded-full border-none font-semibold cursor-pointer transition-all duration-[0.6s] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      'ease-[cubic-bezier(0.23,1,0.32,1)]',
      sizeClasses,
      variantBgClasses,
      variantRingClasses,
      variantTextClasses,
      extraClass
    ]"
    @click="handleClick"
  >
    <span class="relative z-10 inline-flex items-center gap-1.5 sm:gap-2 text-inherit group-hover:text-white">
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
    <span
      aria-hidden="true"
      :class="['animated-button__ripple', variantRippleClasses]"
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
    primary: 'bg-primary-400 dark:bg-primary-500 text-white hover:bg-primary-500 dark:hover:bg-primary-600',
    secondary: 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500',
    danger: 'bg-red-500 dark:bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-600',
    success: 'bg-green-500 dark:bg-green-500 text-white hover:bg-green-600 dark:hover:bg-green-600',
    outline: 'bg-transparent dark:bg-transparent',
    ghost: 'bg-transparent dark:bg-transparent',
  }
  return map[props.variant]
})

// Ring (subtle border glow) and hover ring – variant-specific
const variantRingClasses = computed(() => {
  const map = {
    primary:
      'ring-2 ring-primary-400/25 hover:ring-4 hover:ring-primary-400/40 dark:ring-white/15 dark:hover:ring-primary-400/40',
    secondary:
      'ring-2 ring-gray-300/80 hover:ring-4 hover:ring-gray-400/60 dark:ring-white/10 dark:hover:ring-white/20',
    danger:
      'ring-2 ring-red-500/25 hover:ring-4 hover:ring-red-500/40 dark:ring-red-400/20 dark:hover:ring-red-400/35',
    success:
      'ring-2 ring-green-500/25 hover:ring-4 hover:ring-green-500/40 dark:ring-green-400/20 dark:hover:ring-green-400/35',
    outline:
      'ring-2 ring-gray-200 hover:ring-4 hover:ring-gray-300 dark:ring-gray-600 dark:hover:ring-gray-500',
    ghost:
      'ring-2 ring-transparent hover:ring-2 hover:ring-gray-200 dark:hover:ring-gray-600',
  }
  return map[props.variant]
})

// Text color for outline/ghost; filled variants use variantBgClasses for text
const variantTextClasses = computed(() => {
  const map = {
    primary: 'focus-visible:ring-primary-500/30',
    secondary: 'focus-visible:ring-gray-500/30',
    danger: 'focus-visible:ring-red-500/30',
    success: 'focus-visible:ring-green-500/30',
    outline:
      'text-gray-700 dark:text-gray-300 group-hover:text-white focus-visible:ring-gray-500/30',
    ghost:
      'text-gray-600 dark:text-gray-400 group-hover:text-white focus-visible:ring-gray-500/30',
  }
  return map[props.variant]
})

// Ripple circle color
const variantRippleClasses = computed(() => {
  const map = {
    primary: 'bg-primary-400 dark:bg-primary-400',
    secondary: 'bg-gray-400 dark:bg-gray-500',
    danger: 'bg-red-500 dark:bg-red-400',
    success: 'bg-green-500 dark:bg-green-400',
    outline: 'bg-gray-400 dark:bg-gray-500',
    ghost: 'bg-gray-300 dark:bg-gray-500',
  }
  return map[props.variant]
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.animated-button:active {
  transform: scale(0.95);
}

.animated-button__ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  pointer-events: none;
  transition:
    width 0.8s cubic-bezier(0.23, 1, 0.32, 1),
    height 0.8s cubic-bezier(0.23, 1, 0.32, 1),
    opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}

.animated-button:hover .animated-button__ripple {
  width: 150px;
  height: 150px;
  opacity: 1;
}

/* Text and icons white on hover (ripple or darker bg) */
.animated-button:hover .relative.z-10 {
  color: white !important;
}

.animated-button:hover .relative.z-10 svg {
  color: white !important;
  stroke: white;
}

.animated-button:disabled:hover .animated-button__ripple {
  width: 20px;
  height: 20px;
  opacity: 0;
}
</style>
