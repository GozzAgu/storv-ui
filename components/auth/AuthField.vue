<template>
  <div class="auth-field">
    <div v-if="label || $slots['label-right']" class="auth-field__label-row">
      <label v-if="label" :for="inputId" class="auth-field__label">
        {{ label }}
      </label>
      <slot name="label-right" />
    </div>
    <div class="relative">
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
        :class="[passwordToggle ? 'pr-10' : 'pr-2.5', inputClass]"
        v-bind="inputAttrs"
      />
      <button
        v-if="passwordToggle"
        type="button"
        class="auth-field__toggle"
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
import { computed, ref, useAttrs } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

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
    inputClass?: string
  }>(),
  {
    type: 'text',
    required: false,
    passwordToggle: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
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
