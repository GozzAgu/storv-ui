<template>
  <div
    v-if="bannerContent && bannerVisible"
    :class="[rootClass, isCapacitorIos ? 'subscription-billing-banner--ios' : '']"
    class="subscription-billing-banner"
    role="status"
    :aria-label="bannerContent.title"
  >
    <div class="min-w-0 flex-1">
      <p class="text-xs font-semibold" :class="titleClass">{{ bannerContent.title }}</p>
      <p class="mt-0.5 text-[11px] leading-relaxed" :class="messageClass">
        {{ bannerContent.message }}
      </p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <NuxtLink
        :to="bannerContent.actionHref"
        class="rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition"
        :class="actionClass"
      >
        {{ bannerContent.actionLabel }}
      </NuxtLink>
      <button
        type="button"
        class="rounded-md p-1.5 text-[11px] opacity-70 transition hover:opacity-100"
        :class="dismissClass"
        aria-label="Dismiss billing notice"
        @click="dismissBanner(bannerContent.id)"
      >
        <XMarkIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '~/utils/app-icons'

const { bannerContent, bannerVisible, dismissBanner } = useSubscriptionBillingUi()
const { isCapacitorIos } = useIsCapacitorIos()

const rootClass = computed(() => {
  const variant = bannerContent.value?.variant
  const base =
    'mb-3 flex flex-col gap-3 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:px-4'
  if (variant === 'past_due') {
    return `${base} border-red-200/70 bg-red-50/90 dark:border-red-900/40 dark:bg-red-950/30`
  }
  if (variant === 'expired') {
    return `${base} border-amber-200/70 bg-amber-50/90 dark:border-amber-900/40 dark:bg-amber-950/25`
  }
  return `${base} border-sky-200/70 bg-sky-50/90 dark:border-sky-900/40 dark:bg-sky-950/25`
})

const titleClass = computed(() => {
  const variant = bannerContent.value?.variant
  if (variant === 'past_due') return 'text-red-900 dark:text-red-100'
  if (variant === 'expired') return 'text-amber-950 dark:text-amber-100'
  return 'text-sky-950 dark:text-sky-100'
})

const messageClass = computed(() => {
  const variant = bannerContent.value?.variant
  if (variant === 'past_due') return 'text-red-800/90 dark:text-red-200/90'
  if (variant === 'expired') return 'text-amber-900/90 dark:text-amber-100/90'
  return 'text-sky-900/90 dark:text-sky-100/90'
})

const actionClass = computed(() => {
  const variant = bannerContent.value?.variant
  if (variant === 'past_due') {
    return 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
  }
  if (variant === 'expired') {
    return 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600'
  }
  return 'bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600'
})

const dismissClass = computed(() => titleClass.value)
</script>
