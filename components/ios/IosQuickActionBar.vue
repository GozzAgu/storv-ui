<template>
  <div
    class="ios-quick-actions"
    :class="{
      'ios-quick-actions--card': card,
      'ios-quick-actions--with-actions': hasTrailingActions,
    }"
    :role="role"
    :aria-label="ariaLabel"
  >
    <div class="ios-quick-actions__scroll" role="presentation">
      <button
        v-for="option in tabOptions"
        :key="option.value"
        type="button"
        :role="role === 'tablist' ? 'tab' : undefined"
        :aria-selected="role === 'tablist' ? modelValue === option.value : undefined"
        class="ios-quick-actions__item"
        :class="{
          'ios-quick-actions__item--active': modelValue === option.value,
        }"
        @click="onClick(option)"
      >
        <span class="ios-quick-actions__label">{{ option.label }}</span>
        <span
          v-if="option.badge != null && option.badge > 0"
          class="ios-quick-actions__badge"
        >
          {{ option.badge > 99 ? '99+' : option.badge }}
        </span>
      </button>
    </div>

    <div v-if="hasTrailingActions" class="ios-quick-actions__actions">
      <button
        v-for="option in trailingOptions"
        :key="option.value"
        type="button"
        class="ios-quick-actions__action"
        :class="{
          'ios-quick-actions__action--add': option.trailing === 'add',
          'ios-quick-actions__action--more': option.trailing === 'more',
        }"
        :aria-label="option.label"
        @click="onClick(option)"
      >
        <component
          :is="option.icon ?? DefaultQuickActionIcon"
          class="ios-quick-actions__action-icon"
          aria-hidden="true"
        />
        <span class="ios-quick-actions__action-label">{{ option.label }}</span>
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
    /** Kept for API compatibility; rails are flat by default. */
    card?: boolean
  }>(),
  {
    role: 'group',
    card: false,
  }
)

const tabOptions = computed(() => props.options.filter((option) => !option.trailing && !option.action))

const trailingOptions = computed(() => [
  ...props.options.filter((option) => option.trailing === 'more' || (!option.trailing && option.action)),
  ...props.options.filter((option) => option.trailing === 'add'),
])

const hasTrailingActions = computed(() => trailingOptions.value.length > 0)

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
