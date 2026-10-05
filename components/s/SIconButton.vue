<template>
  <button
    :type="type"
    class="s-c s-icon-btn"
    :class="[variant !== 'ghost' && `s-icon-btn--${variant}`, size === 'sm' && 's-icon-btn--sm']"
    :aria-label="badgeLabel"
    :aria-busy="loading ? 'true' : undefined"
    :disabled="disabled || loading"
    :title="tooltip ? label : undefined"
  >
    <SSpinner v-if="loading" :size="size === 'sm' ? 16 : 20" />
    <slot v-else />
    <span v-if="badge && badge > 0" class="s-icon-btn__badge" aria-hidden="true">
      {{ badge > 99 ? '99+' : badge }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SSpinner from '~/components/s/SSpinner.vue'

const props = withDefaults(
  defineProps<{
    /** Accessible name; required because the button has no visible text. */
    label: string
    variant?: 'ghost' | 'secondary'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit'
    badge?: number
    loading?: boolean
    disabled?: boolean
    tooltip?: boolean
  }>(),
  { variant: 'ghost', size: 'md', type: 'button' }
)

const badgeLabel = computed(() =>
  props.badge && props.badge > 0 ? `${props.label}, ${props.badge} unread` : props.label
)
</script>
