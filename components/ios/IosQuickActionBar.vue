<template>
  <div
    class="ios-quick-actions"
    :class="{ 'ios-quick-actions--card': card }"
    :role="role"
    :aria-label="ariaLabel"
  >
    <div class="ios-quick-actions__scroll">
      <button
        v-for="option in orderedOptions"
        :key="option.value"
        type="button"
        :role="role === 'tablist' && !option.action ? 'tab' : undefined"
        :aria-selected="
          role === 'tablist' && !option.action ? modelValue === option.value : undefined
        "
        class="ios-quick-actions__item"
        :class="{
          'ios-quick-actions__item--active': !option.action && modelValue === option.value,
        }"
        @click="onClick(option)"
      >
        <span class="ios-quick-actions__icon-wrap" aria-hidden="true">
          <component :is="option.icon ?? DefaultQuickActionIcon" class="ios-quick-actions__icon" />
          <span
            v-if="option.badge != null && option.badge > 0"
            class="ios-quick-actions__badge"
          >
            {{ option.badge > 99 ? '99+' : option.badge }}
          </span>
        </span>
        <span class="ios-quick-actions__label">{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { FunnelIcon } from '~/utils/app-icons'
import { useIosHaptics } from '~/composables/useIosHaptics'

const DefaultQuickActionIcon = FunnelIcon

export type IosQuickActionOption = {
  value: string
  label: string
  icon?: Component
  badge?: number
  /** Runs instead of updating v-model (e.g. open modal, navigate). */
  action?: () => void
  /**
   * Pins the option to the end of the row no matter where it sits in `options`:
   * the create action is always the last button and the overflow menu the one
   * before it, so those two tap targets never move between screens.
   */
  trailing?: 'add' | 'more'
}

const modelValue = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    options: IosQuickActionOption[]
    ariaLabel: string
    role?: 'group' | 'tablist'
    card?: boolean
  }>(),
  {
    role: 'group',
    card: true,
  }
)

const orderedOptions = computed(() => [
  ...props.options.filter((option) => !option.trailing),
  ...props.options.filter((option) => option.trailing === 'more'),
  ...props.options.filter((option) => option.trailing === 'add'),
])

const emit = defineEmits<{
  change: [value: string]
  action: [value: string]
}>()

const { selection, impact } = useIosHaptics()

function onClick(option: IosQuickActionOption) {
  if (option.action) {
    void impact('light')
    option.action()
    emit('action', option.value)
    return
  }
  if (option.value === modelValue.value) return
  modelValue.value = option.value
  void selection()
  emit('change', option.value)
}
</script>
