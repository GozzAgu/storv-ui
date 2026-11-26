<template>
  <component :is="as" class="s-step" :class="{ 's-step--done': done }">
    <legend v-if="as === 'fieldset'" class="s-step__legend">{{ title }}</legend>
    <header class="s-step__head" :aria-hidden="as === 'fieldset' ? 'true' : undefined">
      <span class="s-step__num" aria-hidden="true">
        <Check v-if="done" :size="14" :stroke-width="2.5" />
        <template v-else>{{ number }}</template>
      </span>
      <component :is="as === 'fieldset' ? 'p' : 'h3'" class="s-step__title">
        {{ title }}
        <span v-if="optional" class="s-step__optional">Optional</span>
      </component>
      <p v-if="hint || $slots.hint" class="s-step__hint">
        <slot name="hint">{{ hint }}</slot>
      </p>
      <span v-if="$slots.aside" class="s-step__aside"><slot name="aside" /></span>
    </header>
    <div class="s-step__body">
      <slot />
    </div>
  </component>
</template>

<script setup lang="ts">
import { Check } from '@lucide/vue'

/**
 * One numbered step of a guided form. The number turns into a tick once `done`, so people can
 * see what's left. Use it for forms with several parts; a single field or a yes/no confirmation
 * doesn't need steps. Pair it with `SStepSummary` in the dialog footer.
 *
 *   <SStep :number="1" title="Choose a customer" hint="…" :done="!!customer">…</SStep>
 */
withDefaults(
  defineProps<{
    number: number
    title: string
    hint?: string
    /** Filled in; shows a tick instead of the number. Leave false for optional steps with defaults. */
    done?: boolean
    optional?: boolean
    /** `fieldset` for a step that is one group of choices (radios, checkboxes). */
    as?: 'section' | 'fieldset'
  }>(),
  { hint: undefined, done: false, optional: false, as: 'section' }
)
</script>
