<template>
  <IosSearchBar
    v-if="isCapacitorIos"
    :model-value="modelValue"
    :placeholder="placeholder"
    :aria-label="ariaLabel || placeholder"
    @update:model-value="emit('update:modelValue', $event)"
  />
  <div v-else class="ios-search-input-wrap relative shrink-0">
    <MagnifyingGlassIcon
      class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
      stroke-width="1.75"
    />
    <input
      :value="modelValue"
      type="search"
      :placeholder="placeholder"
      :class="searchInputClass"
      :aria-label="ariaLabel || placeholder"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon } from '~/utils/app-icons'

defineProps<{
  modelValue: string
  placeholder?: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { isCapacitorIos } = useIsCapacitorIos()
const { searchInputClass } = useDashboardDrawerChrome()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>
