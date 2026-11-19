<template>
  <span class="s-c s-price-change">
    <span class="s-price-change__amount">{{ formatCurrency(sold) }}</span>
    <button
      ref="chipRef"
      type="button"
      class="s-price-change__chip"
      :class="up ? 's-price-change__chip--up' : 's-price-change__chip--down'"
      :aria-label="`${summary}. Show price change details`"
      :aria-expanded="open"
      :aria-controls="open ? panelId : undefined"
      @click.stop="toggle"
      @mouseenter="hoverOpen"
      @mouseleave="hoverClose"
      @focus="show"
      @blur="hoverClose"
    >
      <span aria-hidden="true">{{ up ? '↑' : '↓' }}</span>
      {{ percentLabel }}
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        :id="panelId"
        role="tooltip"
        class="s-c s-price-change__card"
        :style="cardStyle"
        @mouseenter="hoverOpen"
        @mouseleave="hoverClose"
        @click.stop
      >
        <p class="s-price-change__title">Price changed at checkout</p>
        <dl class="s-price-change__rows">
          <div>
            <dt>Initial</dt>
            <dd>{{ formatCurrency(initial) }}</dd>
          </div>
          <div>
            <dt>Sold for</dt>
            <dd>{{ formatCurrency(sold) }}</dd>
          </div>
          <div>
            <dt>Difference</dt>
            <dd :class="up ? 's-price-change__up' : 's-price-change__down'">
              {{ up ? '+' : '−' }}{{ formatCurrency(Math.abs(sold - initial)) }} ({{
                percentLabel
              }})
            </dd>
          </div>
          <div>
            <dt>Changed by</dt>
            <dd>{{ by }}</dd>
          </div>
          <div v-if="receiptNumber || soldOn">
            <dt>Sale</dt>
            <dd class="s-price-change__nowrap">
              <NuxtLink
                v-if="receiptTo && receiptNumber"
                :to="receiptTo"
                class="s-link"
                @click="open = false"
                >{{ receiptNumber }}</NuxtLink
              >
              <span v-else-if="receiptNumber">{{ receiptNumber }}</span>
              <template v-if="receiptNumber && soldOn"> · </template>
              <span v-if="soldOn">{{ soldOn }}</span>
            </dd>
          </div>
        </dl>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { usePreferences } from '~/composables/usePreferences'
import { receiptNumberFor } from '~/utils/receipt-number'

/**
 * A sold unit's price in the inventory table when it was changed at checkout: the sold price on
 * one line with a small up/down chip, and the full story (initial, sold, who, which sale) on
 * hover, focus or tap. The card is teleported so the table's scroll box can't clip it.
 */
const props = defineProps<{
  initial: number
  sold: number
  by: string
  receiptId?: string
  /** Already formatted, e.g. "19 Nov 2026". */
  soldOn?: string
  /** Where the receipt number links to. */
  receiptTo?: string
}>()

const { formatCurrency } = usePreferences()

const panelId = `price-change-${useId()}`
const chipRef = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const pinned = ref(false)
const cardStyle = ref<Record<string, string>>({})
let hoverTimer: ReturnType<typeof setTimeout> | null = null

const up = computed(() => props.sold > props.initial)
const percent = computed(() =>
  props.initial > 0 ? Math.abs(((props.sold - props.initial) / props.initial) * 100) : 0
)
const percentLabel = computed(() => {
  const p = percent.value
  return `${p > 0 && p < 1 ? '<1' : Math.round(p)}%`
})
const summary = computed(
  () =>
    `Sold for ${formatCurrency(props.sold)}, ${percentLabel.value} ${
      up.value ? 'above' : 'below'
    } the initial ${formatCurrency(props.initial)}`
)
const receiptNumber = computed(() => (props.receiptId ? receiptNumberFor(props.receiptId) : ''))

const CARD_WIDTH = 300

function place() {
  const rect = chipRef.value?.getBoundingClientRect()
  if (!rect) return
  const margin = 8
  const left = Math.min(
    Math.max(margin, rect.right - CARD_WIDTH),
    window.innerWidth - CARD_WIDTH - margin
  )
  const below = rect.bottom + 6
  const fitsBelow = below + 180 < window.innerHeight
  cardStyle.value = {
    left: `${left}px`,
    width: `${CARD_WIDTH}px`,
    ...(fitsBelow ? { top: `${below}px` } : { bottom: `${window.innerHeight - rect.top + 6}px` }),
  }
}

function show() {
  if (hoverTimer) clearTimeout(hoverTimer)
  place()
  open.value = true
}

function hoverOpen() {
  if (hoverTimer) clearTimeout(hoverTimer)
  hoverTimer = setTimeout(show, 120)
}

function hoverClose() {
  if (hoverTimer) clearTimeout(hoverTimer)
  if (pinned.value) return
  hoverTimer = setTimeout(() => (open.value = false), 150)
}

/** Tap or click pins the card open until the next tap, outside click, Escape or scroll. */
function toggle() {
  if (pinned.value && open.value) {
    pinned.value = false
    open.value = false
    return
  }
  pinned.value = true
  show()
}

function dismiss() {
  pinned.value = false
  open.value = false
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') dismiss()
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', dismiss)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
  } else {
    pinned.value = false
    document.removeEventListener('click', dismiss)
    document.removeEventListener('keydown', onKey)
    window.removeEventListener('scroll', dismiss, true)
    window.removeEventListener('resize', dismiss)
  }
})

onBeforeUnmount(() => {
  if (hoverTimer) clearTimeout(hoverTimer)
  open.value = false
})
</script>

<style scoped>
.s-price-change {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--s-space-1);
  white-space: nowrap;
}

.s-price-change__amount {
  font-variant-numeric: tabular-nums;
}

.s-price-change__chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  border: 0;
  border-radius: var(--s-radius-full);
  font: var(--s-text-caption);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.s-price-change__chip:focus-visible {
  outline: 2px solid var(--s-focus-ring, var(--s-text));
  outline-offset: 2px;
}

.s-price-change__chip--down {
  color: var(--s-warning);
  background: var(--s-warning-soft);
}

.s-price-change__chip--up {
  color: var(--s-success);
  background: var(--s-success-soft);
}

.s-price-change__card {
  position: fixed;
  z-index: 1000;
  padding: var(--s-space-1-5) var(--s-space-2);
  border: 1px solid var(--s-divider);
  border-radius: var(--s-radius-lg);
  background: var(--s-surface);
  box-shadow: var(--s-shadow-lg, 0 8px 24px rgb(0 0 0 / 0.25));
  color: var(--s-text);
  font: var(--s-text-small);
  text-align: left;
  white-space: normal;
}

.s-price-change__title {
  margin: 0 0 var(--s-space-1);
  font-weight: 600;
}

.s-price-change__rows {
  display: grid;
  gap: 4px;
  margin: 0;
}

.s-price-change__rows > div {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: var(--s-space-1);
}

.s-price-change__rows dt {
  color: var(--s-text-muted);
}

.s-price-change__rows dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.s-price-change__down {
  color: var(--s-warning);
}

.s-price-change__rows dd.s-price-change__nowrap {
  white-space: nowrap;
}

.s-price-change__up {
  color: var(--s-success);
}
</style>
