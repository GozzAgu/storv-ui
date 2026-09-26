<template>
  <div
    :class="[
      'dash-bulk-select',
      `dash-bulk-select--${resolvedSize}`,
      selectedCount > 0 && 'dash-bulk-select--active',
      extraClass,
    ]"
    role="group"
    :aria-label="selectedCount > 0 ? `${selectedCount} selected` : 'Select all'"
  >
    <div
      class="dash-bulk-select__action"
      :class="{ 'dash-bulk-select__action--idle': selectedCount < 1 }"
      :inert="selectedCount < 1"
      :aria-hidden="selectedCount < 1"
    >
      <slot name="action" />
    </div>

    <span class="dash-bulk-select__rule" aria-hidden="true" />

    <span class="dash-bulk-select__count" aria-live="polite">
      <span class="dash-bulk-select__count-num">{{ selectedCount }}</span>
      <span class="dash-bulk-select__count-txt">selected</span>
    </span>

    <span class="dash-bulk-select__rule" aria-hidden="true" />

    <label class="dash-bulk-select__lead">
      <input
        type="checkbox"
        class="dash-bulk-select__input"
        :checked="modelValue"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <span class="dash-bulk-select__box" aria-hidden="true">
        <svg class="dash-bulk-select__mark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
      <span class="dash-bulk-select__label">Select all</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useIosLayoutSize } from '~/composables/useIosLayoutSize'

/**
 * Compact segmented bulk-select bar with its own visible checkbox.
 * size="auto" promotes to comfortable on iPad (Capacitor / iPadOS).
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    selectedCount?: number
    /** compact = phone/web, comfortable = iPad, auto = pick from layout */
    size?: 'auto' | 'compact' | 'comfortable'
    extraClass?: string
  }>(),
  {
    selectedCount: 0,
    size: 'auto',
    extraClass: '',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { bulkSelectSize } = useIosLayoutSize()
const resolvedSize = computed(() =>
  props.size === 'auto' ? bulkSelectSize.value : props.size
)
</script>

<style scoped>
.dash-bulk-select {
  --bulk-gap: 0.5rem;
  display: inline-grid;
  grid-template-columns: auto 1px 4.75rem 1px max-content;
  align-items: center;
  column-gap: var(--bulk-gap);
  height: 2rem;
  min-height: 2rem;
  padding: 0 0.5rem 0 0.25rem;
  flex-shrink: 0;
  overflow: visible;
  border-radius: 1rem;
  border: 1px solid var(--dash-border, rgb(15 23 42 / 0.1));
  background: var(--dash-overlay-chrome, rgb(248 250 252 / 0.92));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
}

:global(html.dark) .dash-bulk-select {
  border-color: rgb(255 255 255 / 0.1);
  background: rgb(255 255 255 / 0.04);
}

.dash-bulk-select--active {
  border-color: rgb(15 23 42 / 0.14);
  background: var(--dash-surface, #ffffff);
}

:global(html.dark) .dash-bulk-select--active {
  border-color: rgb(255 255 255 / 0.16);
  background: rgb(255 255 255 / 0.07);
}

.dash-bulk-select__lead {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  height: 2rem;
  min-width: 0;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.dash-bulk-select__input {
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

.dash-bulk-select__box {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 0.25rem;
  border: 1.5px solid rgb(15 23 42 / 0.45);
  background: #ffffff;
  color: #ffffff;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

:global(html.dark) .dash-bulk-select__box {
  border-color: rgb(255 255 255 / 0.85);
  background: transparent;
  color: #1a1523;
}

.dash-bulk-select__input:checked + .dash-bulk-select__box {
  border-color: #1a1523;
  background: #1a1523;
  color: #ffffff;
}

:global(html.dark) .dash-bulk-select__input:checked + .dash-bulk-select__box {
  border-color: #ffffff;
  background: #ffffff;
  color: #1a1523;
}

.dash-bulk-select__input:focus-visible + .dash-bulk-select__box {
  outline: 2px solid rgb(26 21 35 / 0.35);
  outline-offset: 2px;
}

:global(html.dark) .dash-bulk-select__input:focus-visible + .dash-bulk-select__box {
  outline-color: rgb(255 255 255 / 0.45);
}

.dash-bulk-select__mark {
  display: block;
  width: 0.625rem;
  height: 0.625rem;
  opacity: 0;
  transform: scale(0.72);
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.dash-bulk-select__input:checked + .dash-bulk-select__box .dash-bulk-select__mark {
  opacity: 1;
  transform: scale(1);
}

.dash-bulk-select__label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1;
  white-space: nowrap;
  color: var(--dash-muted, #64748b);
}

:global(html.dark) .dash-bulk-select__label {
  color: rgb(161 161 170);
}

.dash-bulk-select__input:checked ~ .dash-bulk-select__label {
  color: var(--dash-ink, #0f172a);
}

:global(html.dark) .dash-bulk-select__input:checked ~ .dash-bulk-select__label {
  color: rgb(244 244 245);
}

.dash-bulk-select__rule {
  display: block;
  width: 1px;
  height: 0.875rem;
  background: var(--dash-border, rgb(15 23 42 / 0.12));
  justify-self: center;
}

:global(html.dark) .dash-bulk-select__rule {
  background: rgb(255 255 255 / 0.12);
}

.dash-bulk-select__count {
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-start;
  gap: 0.25rem;
  min-width: 0;
  font-size: 0.6875rem;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--dash-muted, #94a3b8);
}

.dash-bulk-select--active .dash-bulk-select__count {
  color: var(--dash-ink, #334155);
}

:global(html.dark) .dash-bulk-select--active .dash-bulk-select__count {
  color: rgb(228 228 231);
}

.dash-bulk-select__count-num {
  font-weight: 700;
  min-width: 0.75rem;
  text-align: right;
}

.dash-bulk-select__count-txt {
  font-weight: 500;
  opacity: 0.85;
}

.dash-bulk-select__action {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 4.75rem;
  min-height: 2rem;
  padding-left: 0.125rem;
}

.dash-bulk-select__action :deep(button) {
  height: 1.625rem !important;
  min-height: 1.625rem !important;
  padding-inline: 0.5rem !important;
  border-radius: 0.75rem !important;
  font-size: 0.6875rem !important;
  line-height: 1 !important;
  box-shadow: none !important;
}

.dash-bulk-select__action :deep(svg) {
  width: 0.875rem !important;
  height: 0.875rem !important;
}

.dash-bulk-select__action--idle {
  opacity: 0;
  pointer-events: none;
}

/* iPad / large-tablet density */
.dash-bulk-select--comfortable {
  --bulk-gap: 0.625rem;
  grid-template-columns: auto 1px 5.75rem 1px max-content;
  height: 2.5rem;
  min-height: 2.5rem;
  padding: 0 0.625rem 0 0.375rem;
  border-radius: 1.15rem;
}

.dash-bulk-select--comfortable .dash-bulk-select__lead {
  height: 2.5rem;
  gap: 0.5rem;
}

.dash-bulk-select--comfortable .dash-bulk-select__box {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.3rem;
}

.dash-bulk-select--comfortable .dash-bulk-select__mark {
  width: 0.75rem;
  height: 0.75rem;
}

.dash-bulk-select--comfortable .dash-bulk-select__label,
.dash-bulk-select--comfortable .dash-bulk-select__count {
  font-size: 0.8125rem;
}

.dash-bulk-select--comfortable .dash-bulk-select__rule {
  height: 1.125rem;
}

.dash-bulk-select--comfortable .dash-bulk-select__action {
  min-width: 5.5rem;
  min-height: 2.5rem;
}

.dash-bulk-select--comfortable .dash-bulk-select__action :deep(button) {
  height: 2rem !important;
  min-height: 2rem !important;
  padding-inline: 0.75rem !important;
  border-radius: 0.85rem !important;
  font-size: 0.8125rem !important;
}

.dash-bulk-select--comfortable .dash-bulk-select__action :deep(svg) {
  width: 1rem !important;
  height: 1rem !important;
}
</style>
