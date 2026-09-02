<template>
  <IosFormField v-for="field in fields" :key="field.name" :label="fieldLabel(field)" :required="field.required">
    <IosFormInput
      v-if="field.type === 'text'"
      :model-value="String(modelValue[field.name] ?? '')"
      type="text"
      :placeholder="fieldPlaceholder(field)"
      @update:model-value="updateField(field.name, $event)"
    />

    <IosFormInput
      v-else-if="field.type === 'number'"
      :model-value="Number(modelValue[field.name] ?? 0)"
      type="number"
      :placeholder="fieldPlaceholder(field)"
      @update:model-value="updateField(field.name, Number($event))"
    />

    <div v-else-if="field.type === 'currency'" class="relative">
      <span
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
        >{{ currencySymbol }}</span
      >
      <IosFormInput
        :model-value="Number(modelValue[field.name] ?? 0)"
        type="number"
        min="0"
        step="0.01"
        extra-class="pl-7"
        :placeholder="fieldPlaceholder(field)"
        @update:model-value="updateField(field.name, Number($event))"
      />
    </div>

    <IosFormInput
      v-else-if="field.type === 'date'"
      :model-value="String(modelValue[field.name] ?? '')"
      type="date"
      @update:model-value="updateField(field.name, $event)"
    />

    <IosFormSelect
      v-else-if="field.type === 'select'"
      :model-value="String(modelValue[field.name] ?? '')"
      extra-class="cursor-pointer"
      @update:model-value="updateField(field.name, $event)"
    >
      <option value="">Select {{ fieldLabel(field) }}</option>
      <option v-for="opt in field.options || []" :key="opt" :value="opt">{{ opt }}</option>
    </IosFormSelect>

    <label
      v-else-if="field.type === 'boolean'"
      class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
    >
      <input
        type="checkbox"
        :checked="Boolean(modelValue[field.name])"
        class="rounded border-gray-300 text-gray-800 focus:ring-gray-400/40 dark:border-gray-600 dark:text-gray-200"
        @change="updateField(field.name, ($event.target as HTMLInputElement).checked)"
      />
      {{ fieldLabel(field) }}
    </label>
  </IosFormField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IosFormField, IosFormInput, IosFormSelect } from '~/components/ios/forms'

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
