<template>
  <nav class="dash-tabs-rail" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === option.value"
      :class="[
        'dash-tabs-rail__btn',
        modelValue === option.value ? 'dash-tabs-rail__btn--active' : '',
      ]"
      @click="modelValue = option.value"
    >
      {{ option.label }}
      <span v-if="option.count != null" class="tabular-nums">({{ option.count }})</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

export interface CategoryTabOption {
  value: string
  label: string
  count?: number
  icon?: Component
}

defineProps<{
  options: CategoryTabOption[]
  ariaLabel: string
  /** Kept for API compatibility; rail tabs always scroll horizontally when needed. */
  scroll?: boolean
  /** Kept for API compatibility; tabs always use the underline rail. */
  variant?: 'segment' | 'rail'
}>()

const modelValue = defineModel<string>({ required: true })
</script>
