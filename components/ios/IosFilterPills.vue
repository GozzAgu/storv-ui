<template>
  <div class="ios-filter-pills" :role="role" :aria-label="ariaLabel">
    <div class="ios-filter-pills__scroll">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :role="role === 'tablist' ? 'tab' : undefined"
        :aria-selected="role === 'tablist' ? modelValue === option.value : undefined"
        class="ios-filter-pills__pill"
        :class="{ 'ios-filter-pills__pill--active': modelValue === option.value }"
        @click="select(option.value)"
      >
        <span class="ios-filter-pills__label">{{ option.label }}</span>
        <span
          v-if="option.badge != null && option.badge > 0"
          class="ios-filter-pills__badge"
          aria-hidden="true"
        >
          {{ option.badge > 99 ? '99+' : option.badge }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIosHaptics } from '~/composables/useIosHaptics'
import type { IosSegmentOption } from '~/components/ios/IosSegmentedControl.vue'

const modelValue = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    options: IosSegmentOption[]
    ariaLabel: string
    role?: 'group' | 'tablist'
  }>(),
  {
    role: 'group',
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
