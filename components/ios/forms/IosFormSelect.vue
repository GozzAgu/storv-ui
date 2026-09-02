<template>
  <select
    :id="id"
    v-model="model"
    :required="required"
    :disabled="disabled"
    :class="['ios-form__select', inputClass, extraClass]"
  >
    <slot />
  </select>
</template>

<script setup lang="ts">
import { APP_FIELD_ON_WHITE_CLASS } from '~/utils/app-chrome'

const model = defineModel<string | number | null>({ default: '' })

withDefaults(
  defineProps<{
    id?: string
    required?: boolean
    disabled?: boolean
    extraClass?: string
  }>(),
  {
    extraClass: '',
  }
)

const inputClass = APP_FIELD_ON_WHITE_CLASS
</script>
