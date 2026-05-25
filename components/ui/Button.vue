<template>
 <button
 v-bind="delegatedAttrs"
 :type="type"
 :disabled="disabled || loading"
 :class="[
 'group relative inline-flex items-center justify-center overflow-hidden border-0 font-semibold tracking-tight cursor-pointer transition-[background-color,color,box-shadow,transform,opacity] duration-200 ease-out',
 'focus:outline-none disabled:opacity-45 disabled:cursor-not-allowed',
 'active:scale-[0.98] motion-reduce:active:scale-100',
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
 <span class="relative z-10 inline-flex items-center gap-1.5 text-inherit sm:gap-2">
 <component v-if="loading" :is="loadingIcon" class="h-5 w-5 shrink-0 animate-spin" />
 <component v-else-if="icon && !iconRight" :is="icon" :class="iconSize" />
 <slot />
 <component v-if="icon && iconRight" :is="icon" :class="iconSize" />
 </span>
 </button>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

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

const radiusClass = 'rounded-sm'

const showGlassHighlight = computed(
 () => props.variant === 'secondary' || props.variant === 'outline' || props.variant === 'ghost'
)

const sizeClasses = computed(() => {
 const sizeMap = {
 sm: 'px-3.5 py-1.5 text-xs sm:text-sm',
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

const variantSurfaceClasses = computed(() => {
 const map = {
 primary:
 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-500 dark:active:bg-primary-700',
 secondary:
 'bg-white text-gray-900 hover:bg-gray-50 dark:bg-gray-800/90 dark:text-gray-50 dark:hover:bg-gray-800',
 danger:
 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
 success:
 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800',
 outline:
 'bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-900/40 dark:text-gray-100 dark:hover:bg-gray-800/60',
 ghost:
 'bg-transparent text-gray-700 hover:bg-gray-100/80 dark:text-gray-200 dark:hover:bg-gray-800/50',
 }
 return map[props.variant]
})

const variantFocusRingClasses = computed(() => {
 const map = {
 primary:
 'focus-visible:ring-2 focus-visible:ring-primary-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0c0e14]',
 secondary:
 'focus-visible:ring-2 focus-visible:ring-gray-400/45 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]',
 danger:
 'focus-visible:ring-2 focus-visible:ring-red-400/55 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]',
 success:
 'focus-visible:ring-2 focus-visible:ring-emerald-400/55 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]',
 outline:
 'focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]',
 ghost:
 'focus-visible:ring-2 focus-visible:ring-gray-400/45 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0c0e14]',
 }
 return map[props.variant]
})

const variantTextClasses = computed(() => '')

const handleClick = (event: MouseEvent) => {
 if (!props.disabled && !props.loading) {
 emit('click', event)
 }
}
</script>
