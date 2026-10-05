<template>
  <select
    :value="modelValue"
    :required="required"
    :disabled="disabled"
    :class="selectClass"
    @change="onChange"
  >
    <option value="">{{ placeholder }}</option>
    <option v-for="tender in paymentTenderOptions" :key="tender" :value="tender">
      {{ tender }}
    </option>
  </select>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    selectClass?: string
  }>(),
  {
    placeholder: 'Select payment method',
    required: false,
    disabled: false,
    selectClass: 's-control__input',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { paymentTenderOptions } = usePaymentTenders()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>
