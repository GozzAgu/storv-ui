<template>
  <div class="grid gap-3 sm:grid-cols-2" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="option in options"
      :key="option.mode"
      type="button"
      role="radio"
      :aria-checked="modelValue === option.mode"
      :disabled="disabled"
      class="rounded-lg border px-4 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 disabled:opacity-60"
      :class="
        modelValue === option.mode
          ? 'border-primary-500 bg-primary-50/80 dark:border-primary-400 dark:bg-primary-500/10'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-gray-800/40 dark:hover:border-white/20'
      "
      @click="emit('update:modelValue', option.mode)"
    >
      <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ option.title }}</p>
      <p class="mt-1.5 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
        {{ option.description }}
      </p>
      <ul
        v-if="showChanges && modelValue === option.mode"
        class="mt-2 space-y-1 border-t border-gray-200/70 pt-2 dark:border-white/10"
      >
        <li
          v-for="(line, index) in option.changesWhenSelected"
          :key="index"
          class="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400"
        >
          • {{ line }}
        </li>
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
