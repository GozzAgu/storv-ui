<template>
  <label
    class="auth-checkbox"
    :class="{ 'auth-checkbox--disabled': disabled }"
  >
    <input
      type="checkbox"
      class="auth-checkbox__input sr-only"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="auth-checkbox__box" aria-hidden="true">
      <svg v-if="modelValue" class="auth-checkbox__check" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 6.2 4.8 8.5 9.5 3.5"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span v-if="$slots.default" class="auth-checkbox__label">
      <slot />
    </span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>
