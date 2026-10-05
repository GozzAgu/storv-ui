<template>
  <div class="s-field">
    <div v-if="label || $slots['label-right']" class="s-auth-field__label-row">
      <label v-if="label" :for="inputId" class="s-field__label">{{ label }}</label>
      <slot name="label-right" />
    </div>
    <div class="s-control s-control--lg" :class="{ 's-control--disabled': disabled }">
      <component
        :is="icon"
        v-if="icon"
        class="s-auth-field__icon"
        :size="18"
        :stroke-width="1.75"
        aria-hidden="true"
      />
      <input
        :id="inputId"
        v-model="model"
        class="s-control__input"
        :class="inputClass"
        :type="resolvedType"
        :autocomplete="autocomplete"
        :required="required"
        :placeholder="placeholder"
        :minlength="minlength"
        :disabled="disabled"
        v-bind="inputAttrs"
        @focus="$emit('focus', $event)"
      />
      <button
        v-if="showClear && model.length > 0 && !passwordToggle"
        type="button"
        class="s-auth-field__action"
        aria-label="Clear input"
        @click="model = ''"
      >
        <X :size="16" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <button
        v-if="biometricAutofill"
        type="button"
        class="s-auth-field__action"
        :aria-label="biometricLabel || 'Autofill with biometrics'"
        @click="$emit('biometric-autofill')"
      >
        <Fingerprint :size="16" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <button
        v-if="passwordToggle"
        type="button"
        class="s-auth-field__action"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        :aria-pressed="showPassword"
        @click="showPassword = !showPassword"
      >
        <EyeOff v-if="showPassword" :size="16" :stroke-width="1.75" aria-hidden="true" />
        <Eye v-else :size="16" :stroke-width="1.75" aria-hidden="true" />
      </button>
    </div>
    <slot name="hint" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, type Component } from 'vue'
import { Eye, EyeOff, Fingerprint, X } from '@lucide/vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    inputId: string
    type?: string
    autocomplete?: string
    required?: boolean
    placeholder?: string
    minlength?: number | string
    disabled?: boolean
    passwordToggle?: boolean
    showClear?: boolean
    icon?: Component
    biometricAutofill?: boolean
    biometricLabel?: string
    inputClass?: string
  }>(),
  {
    type: 'text',
    required: false,
    passwordToggle: false,
    showClear: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'biometric-autofill': []
  focus: [event: FocusEvent]
}>()

const attrs = useAttrs()
const inputAttrs = computed(() => {
  const raw = { ...(attrs as Record<string, unknown>) }
  delete raw.class
  return raw
})

const model = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v),
})

const showPassword = ref(false)

const resolvedType = computed(() => {
  if (props.passwordToggle) {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})
</script>
