<template>
  <SField v-for="field in fields" :key="field.name" :label="fieldLabel(field)" :required="field.required">
    <SInput
      v-if="field.type === 'text'"
      :model-value="String(modelValue[field.name] ?? '')"
      type="text"
      :placeholder="fieldPlaceholder(field)"
      @update:model-value="updateField(field.name, $event)"
    />

    <SInput
      v-else-if="field.type === 'number'"
      :model-value="Number(modelValue[field.name] ?? 0)"
      type="number"
      :placeholder="fieldPlaceholder(field)"
      @update:model-value="updateField(field.name, Number($event))"
    />

    <SInput
      v-else-if="field.type === 'currency'"
      :model-value="Number(modelValue[field.name] ?? 0)"
      type="number"
      min="0"
      step="0.01"
      :placeholder="fieldPlaceholder(field)"
      @update:model-value="updateField(field.name, Number($event))"
    >
      <template #prefix>{{ currencySymbol }}</template>
    </SInput>

    <SInput
      v-else-if="field.type === 'date'"
      :model-value="String(modelValue[field.name] ?? '')"
      type="date"
      @update:model-value="updateField(field.name, $event)"
    />

    <SSelect
      v-else-if="field.type === 'select'"
      :model-value="String(modelValue[field.name] ?? '')"
      @update:model-value="updateField(field.name, $event)"
    >
      <option value="">Select {{ fieldLabel(field) }}</option>
      <option v-for="opt in field.options || []" :key="opt" :value="opt">{{ opt }}</option>
    </SSelect>

    <SCheckbox
      v-else-if="field.type === 'boolean'"
      :model-value="Boolean(modelValue[field.name])"
      :label="fieldLabel(field)"
      @update:model-value="updateField(field.name, $event)"
    />
  </SField>
</template>

<script setup lang="ts">
import SField from '~/components/s/SField.vue'
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import { computed } from 'vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
const props = defineProps<{
  fields: Array<{
    name: string
    label?: string
    type: string
    required?: boolean
    options?: string[]
    placeholder?: string
  }>
  modelValue: Record<string, unknown>
  fieldLabel: (field: { name: string; label?: string }) => string
  fieldPlaceholder: (field: {
    name: string
    label?: string
    placeholder?: string
    type?: string
  }) => string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

const { preferences } = usePreferences()
const currencySymbol = computed(() => preferences.value?.currencySymbol ?? '$')

function updateField(name: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [name]: value })
}
</script>
