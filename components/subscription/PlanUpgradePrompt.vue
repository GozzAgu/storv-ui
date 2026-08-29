<template>
  <FeatureGateCard v-bind="props" />
</template>

<script setup lang="ts">
import type { SubscriptionFeature } from '~/types/subscription'

const props = withDefaults(
  defineProps<{
    feature: SubscriptionFeature
    title?: string
    description?: string
    extraClass?: string
    titleClass?: string
    descClass?: string
    helpHref?: string
  }>(),
  {
    helpHref: '/dashboard/help#settings-subscription',
  }
)
</script>
