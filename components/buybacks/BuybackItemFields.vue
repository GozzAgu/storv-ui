<template>
  <div v-for="field in fields" :key="field.name" class="space-y-1">
    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">
      {{ fieldLabel(field) }}
      <span v-if="field.required" class="text-red-500">*</span>
    </label>

    <input
      v-if="field.type === 'text'"
      :value="String(modelValue[field.name] ?? '')"
      type="text"
      class="app-field w-full px-3 py-2 text-sm"
      :placeholder="fieldPlaceholder(field)"
      @input="updateField(field.name, ($event.target as HTMLInputElement).value)"
    />

    <input
      v-else-if="field.type === 'number'"
      :value="Number(modelValue[field.name] ?? 0)"
      type="number"
      class="app-field w-full px-3 py-2 text-sm"
      :placeholder="fieldPlaceholder(field)"
      @input="updateField(field.name, Number(($event.target as HTMLInputElement).value))"
    />

    <div v-else-if="field.type === 'currency'" class="relative">
      <span
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400"
        >{{ currencySymbol }}</span
      >
      <input
        :value="Number(modelValue[field.name] ?? 0)"
        type="number"
        min="0"
        step="0.01"
        class="app-field w-full py-2 pl-7 pr-3 text-sm"
        :placeholder="fieldPlaceholder(field)"
        @input="updateField(field.name, Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <input
      v-else-if="field.type === 'date'"
      :value="String(modelValue[field.name] ?? '')"
      type="date"
      class="app-field w-full px-3 py-2 text-sm"
      @input="updateField(field.name, ($event.target as HTMLInputElement).value)"
    />

    <select
      v-else-if="field.type === 'select'"
      :value="String(modelValue[field.name] ?? '')"
      class="app-field w-full px-3 py-2 text-sm"
      @change="updateField(field.name, ($event.target as HTMLSelectElement).value)"
    >
      <option value="">Select {{ fieldLabel(field) }}</option>
      <option v-for="opt in field.options || []" :key="opt" :value="opt">{{ opt }}</option>
    </select>

    <label
      v-else-if="field.type === 'boolean'"
      class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
    >
      <input
        type="checkbox"
        :checked="Boolean(modelValue[field.name])"
        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500/30 dark:border-gray-600"
        @change="updateField(field.name, ($event.target as HTMLInputElement).checked)"
      />
      {{ fieldLabel(field) }}
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
