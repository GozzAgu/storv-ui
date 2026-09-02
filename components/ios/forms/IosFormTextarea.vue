<template>
  <textarea
    :id="id"
    v-model="model"
    :rows="rows"
    :required="required"
    :disabled="disabled"
    :placeholder="placeholder"
    :maxlength="maxlength"
    :class="['ios-form__textarea', textareaClass, extraClass]"
  />
</template>

<script setup lang="ts">
import { APP_FIELD_TEXTAREA_CLASS } from '~/utils/app-chrome'

const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    id?: string
    rows?: number
    required?: boolean
    disabled?: boolean
    placeholder?: string
    maxlength?: number | string
    extraClass?: string
  }>(),
  {
    rows: 3,
    extraClass: '',
  }
)

const textareaClass = APP_FIELD_TEXTAREA_CLASS
</script>
