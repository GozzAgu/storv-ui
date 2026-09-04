<template>
  <IosQuickActionBar
    v-if="isCapacitorIos"
    v-model="modelValue"
    role="tablist"
    :ariaLabel="ariaLabel"
    :options="iosOptions"
  />
  <nav v-else :class="[segmentTabsClass, scroll ? 'dash-segment-tabs--scroll' : '']" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === option.value"
      :class="[segmentTabsBtnClass, modelValue === option.value ? segmentTabsBtnActiveClass : '']"
      @click="modelValue = option.value"
    >
      {{ option.label }}
      <span v-if="option.count != null" class="tabular-nums">({{ option.count }})</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import IosQuickActionBar, { type IosQuickActionOption } from '~/components/ios/IosQuickActionBar.vue'

export interface CategoryTabOption {
  value: string
  label: string
  count?: number
  icon?: Component
}

const props = defineProps<{
  options: CategoryTabOption[]
  ariaLabel: string
  /** Scroll horizontally instead of wrapping to multiple rows — use when there are many tabs. */
  scroll?: boolean
}>()

const modelValue = defineModel<string>({ required: true })

const { isCapacitorIos } = useIsCapacitorIos()

const { segmentTabsClass, segmentTabsBtnClass, segmentTabsBtnActiveClass } = useDashboardPageChrome()

const iosOptions = computed<IosQuickActionOption[]>(() =>
  props.options.map((option) => ({
    value: option.value,
    label: option.label,
    icon: option.icon,
    badge: option.count,
  }))
)
</script>
