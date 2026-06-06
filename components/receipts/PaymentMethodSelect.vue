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
    selectClass:
      'app-field w-full px-3 py-2 text-xs rounded-sm dark:!bg-dashboard-card text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-400/40',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { paymentTenderOptions } = usePaymentTenders()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>
