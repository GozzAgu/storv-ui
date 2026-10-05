<template>
  <SField :id="id" :label="label" :hint="hint" :error="error" :required="required">
    <template #default="{ id: controlId, describedBy, invalid }">
      <div
        class="s-control s-control--multiline"
        :class="{ 's-control--invalid': invalid, 's-control--disabled': disabled }"
      >
        <textarea
          :id="controlId"
          v-model="model"
          class="s-control__input"
          :rows="rows"
          :placeholder="placeholder"
          :disabled="disabled"
          :required="required"
          :maxlength="maxlength"
          :aria-invalid="invalid ? 'true' : undefined"
          :aria-describedby="describedBy"
          v-bind="$attrs"
        />
      </div>
    </template>
  </SField>
</template>

<script setup lang="ts">
import SField from '~/components/s/SField.vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    id?: string
    placeholder?: string
    rows?: number
    maxlength?: number | string
    required?: boolean
    disabled?: boolean
  }>(),
  { rows: 3 }
)

const model = defineModel<string>()
</script>
