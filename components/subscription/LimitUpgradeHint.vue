<template>
  <p v-if="message" class="limit-upgrade-hint text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-200/90">
    {{ message }}
    <NuxtLink
      v-if="showLink"
      :to="upgradeHref"
      class="ml-1 font-medium underline underline-offset-2"
    >
      Upgrade
    </NuxtLink>
  </p>
</template>

<script setup lang="ts">
import { getMinimumPlanForFeature, getPlanDisplayName, type SubscriptionFeature } from '~/types/subscription'

const props = withDefaults(
  defineProps<{
    feature?: SubscriptionFeature
    message?: string
    showLink?: boolean
    upgradeHref?: string
  }>(),
  {
    showLink: true,
    upgradeHref: '/dashboard/settings?upgrade=1',
  }
)

const message = computed(() => {
  if (props.message) return props.message
  if (!props.feature) return ''
  const plan = getMinimumPlanForFeature(props.feature)
  if (!plan) return ''
  return `Included on ${getPlanDisplayName(plan)}.`
})
</script>
