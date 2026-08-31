<template>
  <component
    :is="href ? 'NuxtLink' : 'div'"
    :to="href"
    class="ios-home-metric"
    :aria-label="`${label}: ${value}`"
  >
    <ArrowTopRightOnSquareIcon class="ios-home-metric__arrow" aria-hidden="true" />
    <p class="ios-home-metric__value">{{ value }}</p>
    <p class="ios-home-metric__label">{{ label }}</p>
  </component>
</template>

<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from '~/utils/app-icons'

defineProps<{
  label: string
  value: string
  href?: string
}>()
</script>
