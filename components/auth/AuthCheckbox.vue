<template>
  <label class="s-check s-auth-check" :class="{ 's-check--disabled': disabled }">
    <input
      type="checkbox"
      class="s-check__input"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="s-check__box" aria-hidden="true">
      <Check :size="14" :stroke-width="2.5" />
    </span>
    <span v-if="$slots.default" class="s-check__text">
      <span class="s-check__label"><slot /></span>
    </span>
  </label>
</template>

<script setup lang="ts">
import { Check } from '@lucide/vue'

defineProps<{
  modelValue: boolean
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>
