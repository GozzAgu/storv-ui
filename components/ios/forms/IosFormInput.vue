<template>
  <input
    :id="id"
    v-model="model"
    :type="type"
    :required="required"
    :disabled="disabled"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    :maxlength="maxlength"
    :min="min"
    :max="max"
    :step="step"
    :class="['ios-form__input', inputClass, extraClass]"
  />
</template>

<script setup lang="ts">
import { APP_FIELD_ON_WHITE_CLASS } from '~/utils/app-chrome'

const model = defineModel<string | number | null>({ default: '' })

const props = withDefaults(
  defineProps<{
    id?: string
    type?: string
    required?: boolean
    disabled?: boolean
    placeholder?: string
    autocomplete?: string
    maxlength?: number | string
    min?: number | string
    max?: number | string
    step?: number | string
    extraClass?: string
  }>(),
  {
    type: 'text',
    extraClass: '',
  }
)

const inputClass = APP_FIELD_ON_WHITE_CLASS
</script>
