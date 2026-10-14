<template>
  <div class="s-inv-stack">
    <div
      v-for="(serial, index) in serials"
      :key="index"
      :class="uniqueFields.length > 0 ? 's-inv-serial-row' : 's-inline-field'"
    >
      <div :class="uniqueFields.length > 0 ? 's-inv-serial-row__fields' : 's-inline-field__grow'">
        <SInput
          :model-value="serial"
          :placeholder="`Serial ${index + 1}`"
          :aria-label="`Serial number ${index + 1}`"
          @update:model-value="(v?: string | number | null) => setSerial(index, String(v ?? ''))"
        />
        <SInput
          v-for="field in uniqueFields"
          :key="field.name"
          :model-value="values[index]?.[field.name] ?? ''"
          :type="field.type === 'number' ? 'number' : 'text'"
          :placeholder="field.label || field.name"
          :aria-label="`${field.label || field.name} for serial ${index + 1}`"
          :required="field.required"
          @update:model-value="(v?: string | number | null) => setValue(index, field.name, String(v ?? ''))"
        />
      </div>
      <SIconButton :label="`Remove serial number ${index + 1}`" @click="emit('remove', index)">
        <Trash2 :size="16" :stroke-width="1.75" aria-hidden="true" />
      </SIconButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import SInput from '~/components/s/SInput.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import type { TemplateField } from '~/stores/inventory'

/** One row per serial; columns marked unique get their own input on every row. */
const props = defineProps<{
  serials: string[]
  values: Record<string, string>[]
  uniqueFields: TemplateField[]
}>()

const emit = defineEmits<{
  'update:serials': [serials: string[]]
  'update:values': [values: Record<string, string>[]]
  remove: [index: number]
}>()

function setSerial(index: number, value: string) {
  const next = [...props.serials]
  next[index] = value
  emit('update:serials', next)
}

function setValue(index: number, fieldName: string, value: string) {
  const next = props.serials.map((_, i) => ({ ...(props.values[i] ?? {}) }))
  next[index] = { ...next[index], [fieldName]: value }
  emit('update:values', next)
}
</script>
