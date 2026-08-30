<template>
  <button
    v-bind="delegatedAttrs"
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'group relative inline-flex items-center justify-center overflow-hidden border-0 font-semibold tracking-tight cursor-pointer transition-[background-color,color,box-shadow,transform,opacity] duration-200 ease-out',
      'focus:outline-none disabled:opacity-45 disabled:cursor-not-allowed',
      'active:scale-[0.98] motion-reduce:active:scale-100',
      iosNativeClasses,
      radiusClass,
      sizeClasses,
      variantSurfaceClasses,
      variantFocusRingClasses,
      variantTextClasses,
      props.extraClass,
    ]"
    @click="handleClick"
  >
    <span
      v-if="showGlassHighlight"
      class="pointer-events-none absolute inset-0 bg-linear-to-br from-white/45 via-transparent to-transparent opacity-45 transition-opacity duration-300 group-hover:opacity-55 dark:from-white/10 dark:opacity-75 dark:group-hover:opacity-85"
      aria-hidden="true"
    />
    <span
      class="relative z-10 inline-flex items-center text-inherit"
      :class="iconOnlyIos ? 'gap-0' : 'gap-1.5 sm:gap-2'"
    >
      <component v-if="loading" :is="loadingIcon" class="h-5 w-5 shrink-0 animate-spin" />
      <component
        v-else-if="icon && !iconRight"
        :is="icon"
        :class="iconSize"
        :stroke-width="1.75"
      />
      <span v-if="iconOnlyIos" class="sr-only"><slot /></span>
      <slot v-else />
      <component v-if="icon && iconRight" :is="icon" :class="iconSize" :stroke-width="1.75" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import {
  ArrowPathIcon,
} from '~/utils/app-icons'
defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

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

const { isCapacitorIos } = useIsCapacitorIos()
const iconOnlyIos = computed(() => isCapacitorIos.value && !!props.icon && !props.loading)

const iosNativeClasses = computed(() => {
  if (!isCapacitorIos.value) return ''
  const parts = ['ios-action-btn']
  if (iconOnlyIos.value) parts.push('ios-action-btn--icon-only')
  else parts.push(`ios-action-btn--${props.variant}`)
  return parts.join(' ')
})

const radiusClass = computed(() => {
  if (iconOnlyIos.value) return '!rounded-full'
  if (isCapacitorIos.value) return '!rounded-[var(--ios-radius-md,0.75rem)]'
  return '!rounded-full'
})

const showGlassHighlight = computed(() => false)

const sizeClasses = computed(() => {
  if (iconOnlyIos.value) {
    const iconOnlyMap = {
      sm: '!h-9 !w-9 !min-w-9 !p-0',
      md: '!h-10 !w-10 !min-w-10 !p-0',
      lg: '!h-11 !w-11 !min-w-11 !p-0',
    }
    return iconOnlyMap[props.size]
  }
  if (isCapacitorIos.value) {
    const iosTextMap = {
      sm: 'ios-action-btn--sm',
      md: 'ios-action-btn--md',
      lg: 'ios-action-btn--lg',
    }
    return iosTextMap[props.size]
  }
  const sizeMap = {
    sm: 'px-3.5 py-1.5 text-xs sm:text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return sizeMap[props.size]
})

const iconSize = computed(() => {
  if (iconOnlyIos.value) {
    const iconOnlyMap = {
      sm: 'h-[1.125rem] w-[1.125rem]',
      md: 'h-5 w-5',
      lg: 'h-5 w-5',
    }
    return iconOnlyMap[props.size]
  }
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-5 w-5',
  }
  return sizeMap[props.size]
})

const outlineSurfaceClasses =
  'border-[1.5px] border-[rgb(20_63_141/0.35)] bg-transparent text-[#143f8d] hover:border-[#143f8d] hover:bg-[rgb(20_63_141/0.06)] dark:border-white/15 dark:text-gray-100 dark:hover:border-white/25 dark:hover:bg-white/[0.06]'

const variantSurfaceClasses = computed(() => {
  if (isCapacitorIos.value) {
    return 'shadow-none'
  }
  const map = {
    primary: outlineSurfaceClasses,
    secondary:
      'border-0 bg-transparent text-gray-700 hover:bg-gray-900/[0.05] hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-gray-50',
    danger:
      'border-0 bg-red-600 text-white shadow-[0_4px_16px_rgb(220_38_38/0.18)] hover:bg-red-700 active:bg-red-800',
    success:
      'border-0 bg-emerald-600 text-white shadow-[0_4px_16px_rgb(5_150_105/0.18)] hover:bg-emerald-700 active:bg-emerald-800',
    outline: outlineSurfaceClasses,
    ghost:
      'border-0 bg-transparent text-gray-700 hover:bg-gray-900/[0.05] dark:text-gray-200 dark:hover:bg-white/[0.06]',
  }
  return map[props.variant]
})

const variantFocusRingClasses = computed(() => {
  const outlineFocus =
    'focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]'
  const map = {
    primary: outlineFocus,
    secondary:
      'focus-visible:ring-2 focus-visible:ring-gray-400/45 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]',
    danger:
      'focus-visible:ring-2 focus-visible:ring-red-400/55 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]',
    success:
      'focus-visible:ring-2 focus-visible:ring-emerald-400/55 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]',
    outline: outlineFocus,
    ghost:
      'focus-visible:ring-2 focus-visible:ring-gray-400/45 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]',
  }
  return map[props.variant]
})

const variantTextClasses = computed(() => '')

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return
  // Submit buttons rely on native form submit; emitting click as well causes double saves (common on iOS).
  if (props.type === 'submit') return
  emit('click', event)
}
</script>
