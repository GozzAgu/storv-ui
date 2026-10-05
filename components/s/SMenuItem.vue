<template>
  <button
    type="button"
    role="menuitem"
    class="s-menu-row"
    :class="{ 's-menu-row--danger': danger }"
    :disabled="disabled"
    @click="$emit('select')"
  >
    <component :is="icon" v-if="icon" class="s-menu-row__icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
    <span class="s-menu-row__label">{{ label }}</span>
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

defineEmits<{ select: [] }>()
</script>
