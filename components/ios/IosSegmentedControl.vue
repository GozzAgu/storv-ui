<template>
  <div
    class="ios-segmented-control"
    :class="{ 'ios-segmented-control--compact': compact }"
    :role="role"
    :aria-label="ariaLabel"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :role="role === 'tablist' ? 'tab' : undefined"
      :aria-selected="role === 'tablist' ? modelValue === option.value : undefined"
      class="ios-segmented-control__segment"
      :class="{ 'ios-segmented-control__segment--active': modelValue === option.value }"
      @click="select(option.value)"
    >
      <span class="ios-segmented-control__label">{{ option.label }}</span>
      <span
        v-if="option.badge != null && option.badge > 0"
        class="ios-segmented-control__badge"
        aria-hidden="true"
      >
        {{ option.badge > 99 ? '99+' : option.badge }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useIosHaptics } from '~/composables/useIosHaptics'

export type IosSegmentOption = {
  value: string
  label: string
  badge?: number
}

const modelValue = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    options: IosSegmentOption[]
    ariaLabel: string
    role?: 'group' | 'tablist'
    compact?: boolean
  }>(),
  {
    role: 'group',
    compact: false,
  }
)

const emit = defineEmits<{
  change: [value: string]
}>()

const { selection } = useIosHaptics()

function select(value: string) {
  if (value === modelValue.value) return
  modelValue.value = value
  void selection()
  emit('change', value)
}
</script>
