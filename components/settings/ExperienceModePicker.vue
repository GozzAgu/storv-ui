<template>
  <div class="s-c s-choice-grid" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="option in options"
      :key="option.mode"
      type="button"
      role="radio"
      class="s-choice"
      :aria-checked="modelValue === option.mode"
      :disabled="disabled"
      @click="emit('update:modelValue', option.mode)"
    >
      <span class="s-choice__head">
        <span class="s-choice__title">{{ option.title }}</span>
        <span class="s-choice__radio" aria-hidden="true" />
      </span>
      <span class="s-choice__description">{{ option.description }}</span>
      <ul v-if="showChanges && modelValue === option.mode" class="s-choice__changes">
        <li v-for="(line, index) in option.changesWhenSelected" :key="index">{{ line }}</li>
      </ul>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ExperienceMode } from '~/types/business-experience'
import { EXPERIENCE_MODE_OPTIONS } from '~/utils/experience-mode-options'

withDefaults(
  defineProps<{
    modelValue: ExperienceMode
    disabled?: boolean
    showChanges?: boolean
    ariaLabel?: string
    options?: typeof EXPERIENCE_MODE_OPTIONS
  }>(),
  {
    disabled: false,
    showChanges: true,
    ariaLabel: 'Workspace style',
    options: () => EXPERIENCE_MODE_OPTIONS,
  }
)

const emit = defineEmits<{
  'update:modelValue': [ExperienceMode]
}>()
</script>
