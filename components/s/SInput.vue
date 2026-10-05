<template>
  <SField :id="id" :label="label" :hint="hint" :error="error" :required="required">
    <template #default="{ id: controlId, describedBy, invalid }">
      <div
        class="s-control"
        :class="{ 's-control--invalid': invalid, 's-control--disabled': disabled }"
      >
        <span v-if="$slots.prefix" class="s-control__affix"><slot name="prefix" /></span>
        <input
          :id="controlId"
          ref="inputRef"
          v-model="model"
          class="s-control__input"
          :type="type"
          :inputmode="inputmode"
          :placeholder="placeholder"
          :autocomplete="autocomplete"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :aria-invalid="invalid ? 'true' : undefined"
          :aria-describedby="describedBy"
          v-bind="$attrs"
        />
        <span v-if="$slots.suffix" class="s-control__affix"><slot name="suffix" /></span>
      </div>
    </template>
  </SField>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SField from '~/components/s/SField.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    id?: string
    type?:
      | 'text'
      | 'email'
      | 'password'
      | 'search'
      | 'tel'
      | 'url'
      | 'number'
      | 'date'
      | 'time'
      | 'datetime-local'
    inputmode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'email' | 'search' | 'url'
    placeholder?: string
    autocomplete?: string
    required?: boolean
    disabled?: boolean
    readonly?: boolean
  }>(),
  { type: 'text' }
)

/** `type="number"` emits numbers (or `null` when empty), not DOM strings. */
const model = defineModel<string | number | null>({
  set(value) {
    if (props.type !== 'number') return value
    if (value === '' || value === null || value === undefined) return null
    const num = Number(value)
    return Number.isNaN(num) ? value : num
  },
})
const inputRef = ref<HTMLInputElement | null>(null)

defineExpose({ focus: () => inputRef.value?.focus() })
</script>
