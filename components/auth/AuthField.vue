<template>
  <div class="auth-field">
    <div v-if="label || $slots['label-right']" class="auth-field__label-row">
      <label v-if="label" :for="inputId" class="auth-field__label">
        {{ label }}
      </label>
      <slot name="label-right" />
    </div>
    <div class="auth-field__control" :class="{ 'auth-field__control--with-icon': !!icon }">
      <component :is="icon" v-if="icon" class="auth-field__leading-icon" aria-hidden="true" />
      <input
        :id="inputId"
        v-model="model"
        :type="resolvedType"
        :autocomplete="autocomplete"
        :required="required"
        :placeholder="placeholder"
        :minlength="minlength"
        :disabled="disabled"
        class="app-field auth-field-input w-full"
        :class="[
          passwordToggle ? 'auth-field-input--password' : '',
          passwordToggle && biometricAutofill ? 'auth-field-input--password-biometric' : '',
          icon ? 'auth-field-input--with-icon' : '',
          inputClass,
        ]"
        @focus="$emit('focus', $event)"
        v-bind="inputAttrs"
      />
      <button
        v-if="showClear && model.length > 0 && !passwordToggle"
        type="button"
        class="auth-field__clear"
        aria-label="Clear input"
        @click="model = ''"
      >
        <XMarkIcon class="h-4 w-4" />
      </button>
      <button
        v-if="biometricAutofill"
        type="button"
        class="auth-field__biometric"
        :aria-label="biometricLabel || 'Autofill with biometrics'"
        @click="$emit('biometric-autofill')"
      >
        <FingerPrintIcon class="h-4 w-4" />
      </button>
      <button
        v-if="passwordToggle"
        type="button"
        class="auth-field__toggle"
        :class="{ 'auth-field__toggle--with-biometric': biometricAutofill }"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        @click="showPassword = !showPassword"
      >
        <EyeSlashIcon v-if="showPassword" class="h-4 w-4" />
        <EyeIcon v-else class="h-4 w-4" />
      </button>
    </div>
    <slot name="hint" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, type Component } from 'vue'
import { EyeIcon, EyeSlashIcon, XMarkIcon, FingerPrintIcon } from '~/utils/app-icons'

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
