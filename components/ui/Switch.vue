<template>
  <label :class="['dash-switch', disabled ? 'dash-switch--disabled' : '']">
    <input
      type="checkbox"
      class="dash-switch__input"
      :checked="modelValue"
      :disabled="disabled"
      :aria-label="ariaLabel"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="dash-switch__track" aria-hidden="true">
      <span class="dash-switch__thumb" />
    </span>
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    modelValue: false,
    disabled: false,
  }
)

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>
