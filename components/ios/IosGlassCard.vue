<template>
  <component
    :is="tag"
    :class="[
      'ios-glass-card',
      elevated ? 'ios-glass-card--elevated' : '',
      pressable ? 'ios-glass-card--pressable' : '',
      paddingClass,
      className,
    ]"
    v-bind="passthroughAttrs"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

const props = withDefaults(
  defineProps<{
    tag?: string
    elevated?: boolean
    pressable?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
    class?: string
  }>(),
  {
    tag: 'div',
    elevated: false,
    pressable: false,
    padding: 'md',
    class: '',
  }
)

const attrs = useAttrs()
const className = computed(() => props.class)
const passthroughAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

const paddingClass = computed(() => {
  switch (props.padding) {
    case 'none':
      return 'p-0'
    case 'sm':
      return 'p-3'
    case 'lg':
      return 'p-6'
    default:
      return 'p-4'
  }
})
</script>
