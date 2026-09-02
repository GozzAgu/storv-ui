<template>
  <div class="ios-form__toggle">
    <Checkbox
      v-model="model"
      :disabled="disabled"
      :size="size"
      wrapper-class="ios-form__toggle-control"
      label-class="ios-form__toggle-copy"
    >
      <span class="ios-form__toggle-title">{{ label }}</span>
      <p v-if="hint" class="ios-form__hint dash-drawer-hint">{{ hint }}</p>
      <slot />
    </Checkbox>
  </div>
</template>

<script setup lang="ts">
import Checkbox from '~/components/ui/Checkbox.vue'

const model = defineModel<boolean>({ default: false })

withDefaults(
  defineProps<{
    label: string
    hint?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    size: 'sm',
  }
)
</script>
