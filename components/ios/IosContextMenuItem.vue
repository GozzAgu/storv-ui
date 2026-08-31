<template>
  <button
    type="button"
    role="menuitem"
    class="ios-context-menu__item"
    :class="{ 'ios-context-menu__item--danger': danger }"
    :disabled="disabled"
    @click="emit('click')"
  >
    <component :is="icon" v-if="icon" class="ios-context-menu__icon" aria-hidden="true" />
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  icon?: Component
  danger?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
