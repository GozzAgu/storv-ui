<script setup lang="ts">
import { computed } from 'vue'
import {
  MARKETING_FEATURE_ICONS,
  type MarketingFeatureIconKey,
} from '~/utils/marketing-feature-icons'

const props = withDefaults(
  defineProps<{
    name: MarketingFeatureIconKey
    active?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg'
  }>(),
  {
    active: false,
    size: 'md',
  }
)

const icon = computed(() => MARKETING_FEATURE_ICONS[props.name])

const strokeWidth = computed(() => {
  if (props.active) return 2.25
  if (props.size === 'xs') return 1.65
  return 1.75
})
</script>

<template>
  <component
    :is="icon"
    :class="['marketing-feature-icon', `marketing-feature-icon--${size}`, { 'marketing-feature-icon--active': active }]"
    :stroke-width="strokeWidth"
    aria-hidden="true"
  />
</template>

<style scoped>
.marketing-feature-icon {
  flex-shrink: 0;
}

.marketing-feature-icon--xs {
  width: 0.875rem;
  height: 0.875rem;
}

.marketing-feature-icon--sm {
  width: 1rem;
  height: 1rem;
}

.marketing-feature-icon--md {
  width: 1.25rem;
  height: 1.25rem;
}

.marketing-feature-icon--lg {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
