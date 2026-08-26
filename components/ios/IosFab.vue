<template>
  <button
    type="button"
    class="ios-fab"
    :class="{ 'ios-fab--secondary': secondary }"
    :aria-label="ariaLabel"
    @click="onClick"
  >
    <component :is="icon" class="h-6 w-6" stroke-width="2" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { useIosHaptics } from '~/composables/useIosHaptics'

const props = withDefaults(
  defineProps<{
    icon: Component
    ariaLabel: string
    secondary?: boolean
    haptic?: 'light' | 'medium' | 'heavy'
  }>(),
  {
    secondary: false,
    haptic: 'medium',
  }
)

const emit = defineEmits<{
  click: []
}>()

const { impact } = useIosHaptics()

function onClick() {
  void impact(props.haptic)
  emit('click')
}
</script>
