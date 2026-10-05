<template>
  <SField :id="id" :label="label" :hint="hint" :error="error" :required="required">
    <template #default="{ id: controlId, describedBy, invalid }">
      <div
        class="s-control s-control--select"
        :class="{ 's-control--invalid': invalid, 's-control--disabled': disabled }"
      >
        <select
          :id="controlId"
          v-model="model"
          class="s-control__input"
          :disabled="disabled"
          :required="required"
          :aria-invalid="invalid ? 'true' : undefined"
          :aria-describedby="describedBy"
          v-bind="$attrs"
        >
          <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
          <option
            v-for="option in options"
            :key="String(option.value)"
            :value="option.value"
            :disabled="option.disabled"
          >
            {{ option.label }}
          </option>
          <slot />
        </select>
        <ChevronDown class="s-control__chevron" :size="16" :stroke-width="1.75" aria-hidden="true" />
      </div>
    </template>
  </SField>
</template>

<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import SField from '~/components/s/SField.vue'

defineOptions({ inheritAttrs: false })

type SSelectOption = {
  label: string
  value: string | number
  disabled?: boolean
}

defineProps<{
  /** Or pass `<option>` elements in the default slot. */
  options?: SSelectOption[]
  label?: string
  hint?: string
  error?: string
  id?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}>()

const model = defineModel<string | number | null>()
</script>
