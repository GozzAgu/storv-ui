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

// type="number" inputs emit strings from the DOM even without a `.number`
// v-model modifier — coerce here so every numeric field bound through this
// component (price, quantity, salary…) round-trips as an actual number
// instead of silently failing strict `typeof === 'number'` checks upstream.
const model = defineModel<string | number | null>({
  default: '',
  set(value) {
    if (props.type !== 'number') return value
    if (value === '' || value === null || value === undefined) return null
    const num = Number(value)
    return Number.isNaN(num) ? value : num
  },
})

const inputClass = APP_FIELD_ON_WHITE_CLASS
</script>
