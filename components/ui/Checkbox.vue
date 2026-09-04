<template>
  <label
    v-bind="delegatedAttrs"
    :class="[
      'app-checkbox',
      `app-checkbox--${size}`,
      modelValue && 'app-checkbox--checked',
      disabled && 'app-checkbox--disabled',
      wrapperClass,
    ]"
  >
    <input
      type="checkbox"
      class="app-checkbox__input"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="app-checkbox__box" aria-hidden="true">
      <svg class="app-checkbox__mark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="3"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </span>
    <span v-if="$slots.default || label" :class="['app-checkbox__label', labelClass]">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

const delegatedAttrs = computed(() => {
  const raw = { ...(attrs as Record<string, unknown>) }
  delete raw.title
  return raw
})

withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    wrapperClass?: string
    labelClass?: string
  }>(),
  {
    modelValue: false,
    disabled: false,
    size: 'md',
  }
)

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.app-checkbox {
  position: relative;
  display: inline-flex;
  align-items: flex-start;
  gap: 0.625rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.app-checkbox--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.app-checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.app-checkbox__box {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-top: 0.125rem;
  border-radius: 0.25rem;
  background: var(--app-checkbox-box-bg, #f4f4f5);
  color: var(--app-checkbox-mark, #ffffff);
  transition:
    background-color 0.15s ease,
    transform 0.12s ease;
}

.app-checkbox--sm .app-checkbox__box {
  width: 1rem;
  height: 1rem;
  margin-top: 0.125rem;
}

.app-checkbox--md .app-checkbox__box {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.0625rem;
}

.app-checkbox--lg .app-checkbox__box {
  width: 1.5rem;
  height: 1.5rem;
  margin-top: 0;
}

.app-checkbox:not(.app-checkbox--disabled):hover .app-checkbox__box {
  background: var(--app-checkbox-box-bg-hover, #e4e4e7);
}

.app-checkbox--checked .app-checkbox__box {
  background: var(--app-checkbox-box-checked-bg, #1a1523);
  color: var(--app-checkbox-mark-checked, #ffffff);
}

.app-checkbox__mark {
  display: block;
  width: 0.625rem;
  height: 0.625rem;
  opacity: 0;
  transform: scale(0.72);
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.app-checkbox--sm .app-checkbox__mark {
  width: 0.5625rem;
  height: 0.5625rem;
}

.app-checkbox--lg .app-checkbox__mark {
  width: 0.875rem;
  height: 0.875rem;
}

.app-checkbox--checked .app-checkbox__mark {
  opacity: 1;
  transform: scale(1);
}

.app-checkbox__label {
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--app-checkbox-label, var(--dash-overlay-muted, rgb(55 65 81)));
  transition: color 0.15s ease;
}

.app-checkbox--sm .app-checkbox__label {
  font-size: 0.8125rem;
}

.app-checkbox--checked .app-checkbox__label {
  color: var(--app-checkbox-label-checked, var(--dash-overlay-ink, rgb(17 24 39)));
}

.app-checkbox__input:focus-visible + .app-checkbox__box {
  outline: 2px solid var(--app-checkbox-focus, rgb(26 21 35 / 0.35));
  outline-offset: 2px;
}
</style>
