<template>
  <button
    v-bind="delegatedAttrs"
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'group relative inline-flex items-center justify-center overflow-hidden rounded-sm border-0 font-semibold tracking-tight cursor-pointer transition-[background-color,color,box-shadow,transform,opacity,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
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
      class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/45 via-transparent to-transparent opacity-45 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-55 dark:from-white/10 dark:opacity-75 dark:group-hover:opacity-85"
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
import { computed, useAttrs } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

/** Native `title` shows browser tooltips; we strip it from the shared Button. */
const delegatedAttrs = computed(() => {
  const raw = { ...(attrs as Record<string, unknown>) }
  delete raw.title
  return raw
})

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
      'bg-linear-to-b from-primary-500/88 to-primary-700/90 text-white backdrop-blur-xl backdrop-saturate-140 ring-1 ring-inset ring-white/28 hover:from-primary-500/92 hover:to-primary-800/92 dark:from-primary-500/82 dark:to-primary-900/86 dark:ring-white/14 dark:hover:to-primary-950/90',
    secondary:
      'bg-linear-to-b from-white/62 to-gray-100/74 text-gray-900 backdrop-blur-xl backdrop-saturate-135 ring-1 ring-inset ring-white/60 hover:from-white/72 hover:to-gray-100/82 dark:from-gray-800/58 dark:to-gray-900/72 dark:text-gray-50 dark:ring-white/9 dark:hover:from-gray-800/66 dark:hover:to-gray-900/78',
    danger:
      'bg-linear-to-b from-red-500/84 to-red-800/90 text-white backdrop-blur-xl backdrop-saturate-135 ring-1 ring-inset ring-white/24 hover:from-red-500/90 hover:to-red-900/94',
    success:
      'bg-linear-to-b from-emerald-500/84 to-emerald-800/90 text-white backdrop-blur-xl backdrop-saturate-135 ring-1 ring-inset ring-white/24 hover:from-emerald-500/90 hover:to-emerald-900/94',
    outline:
      'bg-white/46 text-gray-800 backdrop-blur-xl backdrop-saturate-130 ring-1 ring-inset ring-white/62 hover:bg-white/62 dark:bg-white/5 dark:text-gray-100 dark:ring-white/11 dark:hover:bg-white/9',
    ghost:
      'bg-white/18 text-gray-700 backdrop-blur-lg ring-1 ring-inset ring-white/45 hover:bg-white/34 dark:bg-white/2 dark:text-gray-200 dark:ring-white/8 dark:hover:bg-white/6',
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
