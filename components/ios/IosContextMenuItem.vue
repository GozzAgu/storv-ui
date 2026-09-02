<template>
  <component
    :is="href ? 'a' : 'button'"
    :type="href ? undefined : 'button'"
    :href="href"
    :target="href ? target : undefined"
    :rel="href && target === '_blank' ? 'noopener' : undefined"
    role="menuitem"
    class="ios-context-menu__item"
    :class="{ 'ios-context-menu__item--danger': danger }"
    :disabled="href ? undefined : disabled"
    @click="emit('click')"
  >
    <component
      :is="icon"
      v-if="icon"
      class="ios-context-menu__icon"
      :class="iconClass"
      aria-hidden="true"
    />
    <span>{{ label }}</span>
  </component>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    label: string
    icon?: Component
    /** Extra classes for the icon, e.g. `animate-spin` while an action runs */
    iconClass?: string
    /** Renders the row as a link instead of a button */
    href?: string
    target?: string
    danger?: boolean
    disabled?: boolean
  }>(),
  {
    target: '_blank',
  }
)

const emit = defineEmits<{
  click: []
}>()
</script>
