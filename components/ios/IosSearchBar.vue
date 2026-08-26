<template>
  <label class="ios-search-bar" :class="{ 'ios-search-bar--compact': compact }">
    <MagnifyingGlassIcon class="ios-search-bar__icon" aria-hidden="true" />
    <input
      :id="inputId"
      v-model="model"
      type="search"
      class="ios-search-bar__input"
      :placeholder="placeholder"
      enterkeyhint="search"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
    />
    <button
      v-if="clearable && model"
      type="button"
      class="ios-search-bar__clear"
      :aria-label="clearLabel"
      @click="model = ''"
    >
      <XMarkIcon class="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  </label>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon, XMarkIcon } from '~/utils/app-icons'

const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    placeholder?: string
    clearable?: boolean
    clearLabel?: string
    compact?: boolean
    inputId?: string
  }>(),
  {
    placeholder: 'Search…',
    clearable: true,
    clearLabel: 'Clear search',
    compact: false,
    inputId: undefined,
  }
)
</script>
