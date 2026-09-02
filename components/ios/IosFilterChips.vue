<template>
  <section class="ios-filter-chips">
    <h2 v-if="title" class="ios-filter-chips__title">{{ title }}</h2>
    <div class="ios-filter-chips__scroll" role="group" :aria-label="ariaLabel">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="ios-filter-chips__chip"
        :class="{ 'ios-filter-chips__chip--active': option.value === selected }"
        :aria-pressed="option.value === selected"
        @click="onSelect(option)"
      >
        {{ option.label }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useIosHaptics } from '~/composables/useIosHaptics'

export type IosFilterChipOption = {
  value: string
  label: string
}

withDefaults(
  defineProps<{
    options: IosFilterChipOption[]
    ariaLabel: string
    /** Uppercase caption above the row, styled like a grouped-list header. */
    title?: string
    selected?: string | null
  }>(),
  {
    title: '',
    selected: null,
  }
)

const emit = defineEmits<{
  select: [value: string]
}>()

const { selection } = useIosHaptics()

function onSelect(option: IosFilterChipOption) {
  void selection()
  emit('select', option.value)
}
</script>
