<template>
  <label class="s-c s-check" :class="{ 's-check--disabled': disabled }">
    <input
      v-model="model"
      class="s-check__input"
      type="checkbox"
      :role="variant === 'switch' ? 'switch' : undefined"
      :disabled="disabled"
      :aria-describedby="description ? descriptionId : undefined"
      v-bind="$attrs"
    />
    <span v-if="variant === 'switch'" class="s-switch__track" aria-hidden="true" />
    <span v-else class="s-check__box" aria-hidden="true">
      <Check :size="14" :stroke-width="3" />
    </span>
    <span v-if="label || description" class="s-check__text">
      <span v-if="label" class="s-check__label">{{ label }}</span>
      <span v-if="description" :id="descriptionId" class="s-check__description">
        {{ description }}
      </span>
    </span>
  </label>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { Check } from '@lucide/vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    label?: string
    description?: string
    disabled?: boolean
    /** `switch` renders a toggle for settings that apply immediately. */
    variant?: 'checkbox' | 'switch'
  }>(),
  { variant: 'checkbox' }
)

const model = defineModel<boolean>({ default: false })
const descriptionId = `s-check-${useId()}`
</script>
