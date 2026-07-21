<template>
  <NuxtLink v-if="to" :to="to" :class="rootClass" :aria-label="ariaLabel">
    <ChevronLeftIcon class="h-4 w-4 shrink-0" stroke-width="2" aria-hidden="true" />
    <span v-if="variant === 'text'" class="truncate">{{ label }}</span>
  </NuxtLink>
  <button v-else type="button" :class="rootClass" :aria-label="ariaLabel" @click="onClick">
    <ChevronLeftIcon class="h-4 w-4 shrink-0" stroke-width="2" aria-hidden="true" />
    <span v-if="variant === 'text'" class="truncate">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import {
  ChevronLeftIcon,
} from '~/utils/app-icons'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    to?: RouteLocationRaw | null
    label?: string
    variant?: 'icon' | 'text'
    fallbackTo?: RouteLocationRaw
  }>(),
  {
    label: 'Back',
    variant: 'icon',
    fallbackTo: '/dashboard',
  }
)

const router = useRouter()

const ariaLabel = computed(() => props.label || 'Back')

const rootClass = computed(() => {
  const base =
    'group inline-flex shrink-0 items-center text-gray-500 transition-colors duration-150 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus-visible:ring-offset-dashboard-card'

  if (props.variant === 'text') {
    return [base, 'gap-0.5 rounded-lg py-1 pl-0.5 pr-1.5 text-xs font-medium tracking-tight']
  }

  return [
    base,
    'h-8 w-8 justify-center rounded-lg hover:bg-gray-100/90 active:bg-gray-100 dark:hover:bg-white/[0.06] dark:active:bg-white/[0.08]',
  ]
})

function onClick() {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }

  void navigateTo(props.fallbackTo)
}
</script>
