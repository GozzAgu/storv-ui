<template>
  <div
    class="s-c s-control s-search"
    :class="[attrs.class, { 's-search--filled': !!model }]"
    :style="attrs.style as StyleValue"
  >
    <Search class="s-control__affix s-search__icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
    <input
      v-model="model"
      class="s-control__input"
      type="search"
      :placeholder="placeholder"
      :aria-label="label || placeholder"
      v-bind="inputAttrs"
    />
    <button
      v-if="model"
      type="button"
      class="s-search__clear"
      :aria-label="clearLabel"
      @click="model = ''"
    >
      <X :size="14" :stroke-width="2" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs, type StyleValue } from 'vue'
import { Search, X } from '@lucide/vue'

/** `class` / `style` size the field; every other attribute goes to the input. */
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    placeholder?: string
    /** Accessible name when the placeholder is not descriptive enough. */
    label?: string
    clearLabel?: string
  }>(),
  { placeholder: 'Search', clearLabel: 'Clear search' }
)

const model = defineModel<string>({ default: '' })

const attrs = useAttrs()
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})
</script>
