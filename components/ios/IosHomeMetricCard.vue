<template>
  <component
    :is="href ? 'NuxtLink' : 'div'"
    :to="href"
    class="ios-home-metric"
    :class="
      tone === 'warning' || tone === 'danger' || tone === 'success'
        ? `ios-home-metric--${tone}`
        : undefined
    "
    :aria-label="`${label}: ${value}`"
  >
    <span v-if="icon" class="ios-home-metric__icon" aria-hidden="true">
      <component :is="icon" />
    </span>
    <ArrowTopRightOnSquareIcon class="ios-home-metric__arrow" aria-hidden="true" />
    <p class="ios-home-metric__value">{{ value }}</p>
    <p class="ios-home-metric__label">{{ label }}</p>
  </component>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ArrowTopRightOnSquareIcon } from '~/utils/app-icons'
import type { DashboardPageMetricTone } from '~/utils/dashboard-page-metrics'

defineProps<{
  label: string
  value: string
  href?: string
  tone?: DashboardPageMetricTone
  /** Small glyph shown top-left, above the value - matches the web stat tile icon. */
  icon?: Component
}>()
</script>
