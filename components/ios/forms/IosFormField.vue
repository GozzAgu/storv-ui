<template>
  <div class="ios-form__field">
    <label v-if="label" :for="forId" class="ios-form__label dash-drawer-label">
      <span>{{ label }}</span>
      <span v-if="required" class="ios-form__required"> *</span>
      <span v-else-if="isOptionalHint" class="ios-form__optional">Optional</span>
    </label>
    <slot />
    <p v-if="hint && !isOptionalHint" class="ios-form__hint dash-drawer-hint">{{ hint }}</p>
    <p v-if="error" class="ios-form__error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label?: string
  for?: string
  required?: boolean
  hint?: string
  error?: string
}>()

const forId = computed(() => props.for)

const isOptionalHint = computed(
  () => typeof props.hint === 'string' && props.hint.trim().toLowerCase() === 'optional'
)
</script>
