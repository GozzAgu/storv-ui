<template>
  <component
    :is="isLink ? NuxtLink : 'button'"
    v-bind="isLink ? { to } : { type, disabled: disabled || loading }"
    class="s-c s-btn"
    :class="[`s-btn--${variant}`, size !== 'md' && `s-btn--${size}`, { 's-btn--block': block }]"
    :aria-busy="loading ? 'true' : undefined"
    @click="onClick"
  >
    <SSpinner v-if="loading" class="s-btn__spinner" :size="size === 'sm' ? 14 : 16" />
    <slot name="leading" />
    <span v-if="$slots.default"><slot /></span>
    <slot name="trailing" />
  </component>
</template>

<script setup lang="ts">
import { computed, resolveComponent } from 'vue'
import SSpinner from '~/components/s/SSpinner.vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit' | 'reset'
    to?: string | Record<string, unknown>
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'secondary', size: 'md', type: 'button' }
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const NuxtLink = resolveComponent('NuxtLink')
const isLink = computed(() => !!props.to && !props.disabled && !props.loading)

function onClick(event: MouseEvent) {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>
